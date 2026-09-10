import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GameState, 
  ServerMessage, 
  ClientMessage, 
  PlayerActionPayload, 
  CustomRoomLobbyState,
  ShowdownStartPayload,
  ShowdownActionPayload
} from '@card-battler/shared';

export interface QueueState {
  inQueue: boolean;
  queuePosition?: number;
  timeInQueue: number;
}

const generateActionId = () => `act_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

export function useGameSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [queueState, setQueueState] = useState<QueueState>({ inQueue: false, timeInQueue: 0 });
  const [customLobbyState, setCustomLobbyState] = useState<CustomRoomLobbyState | null>(null);
  const [showdownMatch, setShowdownMatch] = useState<ShowdownStartPayload | null>(null);
  const [showdownAction, setShowdownAction] = useState<ShowdownActionPayload | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const queueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingTimeRef = useRef<number>(0);

  const pendingMessagesRef = useRef<ClientMessage[]>([]);

  // Send message helper with connecting queue
  const sendMessage = useCallback((msg: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else if (socketRef.current && socketRef.current.readyState === WebSocket.CONNECTING) {
      console.log('Buffering message while WebSocket is connecting:', msg.type);
      pendingMessagesRef.current.push(msg);
    } else {
      console.warn('Cannot send message, WebSocket not connected:', msg.type);
    }
  }, []);

  // Connect to WebSocket with resilient auto-reconnect
  useEffect(() => {
    let wsUrl = '';
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
    const envWsUrl = metaEnv.VITE_WS_URL;
    const envServerUrl = metaEnv.VITE_SERVER_URL;

    if (envWsUrl) {
      wsUrl = envWsUrl;
    } else if (envServerUrl) {
      const base = envServerUrl.replace(/^http/, 'ws');
      wsUrl = `${base.replace(/\/$/, '')}/ws`;
    } else if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      // Auto-connect to deployed Render WebSocket backend when hosted on Vercel
      wsUrl = 'wss://card-arena-pu68.onrender.com/ws';
    } else if (typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '5174')) {
      wsUrl = `ws://${window.location.hostname}:3001/ws`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/ws`;
    }

    let isUnmounted = false;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;

    const connect = () => {
      if (isUnmounted) return;
      console.log('Connecting to WebSocket at:', wsUrl);
      
      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) {
            ws.close();
            return;
          }
          console.log('WebSocket connected successfully');
          setIsConnected(true);
          setLastError(null);
          reconnectAttempts = 0;

          // Flush any messages buffered during connection establishment
          while (pendingMessagesRef.current.length > 0) {
            const queuedMsg = pendingMessagesRef.current.shift();
            if (queuedMsg && ws.readyState === WebSocket.OPEN) {
              console.log('Flushing buffered message:', queuedMsg.type);
              ws.send(JSON.stringify(queuedMsg));
            }
          }

          // Start ping interval with RTT measurement
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              lastPingTimeRef.current = Date.now();
              ws.send(JSON.stringify({ type: 'PING' }));
            }
          }, 10000);
        };

        ws.onmessage = (event) => {
          try {
            const msg: ServerMessage = JSON.parse(event.data);

            switch (msg.type) {
              case 'QUEUE_STATUS':
                setQueueState((prev) => ({
                  ...prev,
                  inQueue: msg.payload.inQueue,
                  queuePosition: msg.payload.queuePosition,
                }));
                break;

              case 'MATCH_FOUND':
                setQueueState({ inQueue: false, timeInQueue: 0 });
                setCustomLobbyState(null);
                if (msg.payload.yourPlayerId) {
                  setMyPlayerId(msg.payload.yourPlayerId);
                }
                break;

              case 'CUSTOM_ROOM_STATE':
                setCustomLobbyState(msg.payload);
                if (msg.payload.myPlayerId) {
                  setMyPlayerId(msg.payload.myPlayerId);
                }
                break;

              case 'SHOWDOWN_START':
                setShowdownMatch(msg.payload);
                setCustomLobbyState(null);
                break;

              case 'SHOWDOWN_ACTION':
                setShowdownAction(msg.payload);
                break;

              case 'GAME_STATE':
                setGameState(msg.payload);
                break;

              case 'ACTION_CONFIRMED':
                break;

              case 'ACTION_REJECTED':
                setLastError(msg.payload.reason);
                setTimeout(() => setLastError(null), 3500);

                if (msg.payload.currentState) {
                  setGameState(msg.payload.currentState);
                }
                break;

              case 'ERROR':
                setLastError(msg.payload.message);
                if (
                  msg.payload.message.includes('closed') ||
                  msg.payload.message.includes('left') ||
                  msg.payload.message.includes('not found')
                ) {
                  setCustomLobbyState(null);
                }
                setTimeout(() => setLastError(null), 4000);
                break;

              case 'PONG':
                if (lastPingTimeRef.current > 0) {
                  setLatency(Date.now() - lastPingTimeRef.current);
                }
                break;
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message', err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          if (!isUnmounted) {
            reconnectAttempts++;
            const delay = Math.min(1000 * reconnectAttempts, 4000);
            console.log(`WebSocket closed. Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);
            reconnectTimeout = setTimeout(connect, delay);
          }
        };

        ws.onerror = (err) => {
          console.error('WebSocket encountered an error', err);
          setIsConnected(false);
        };
      } catch (err) {
        console.error('Failed to create WebSocket instance', err);
        if (!isUnmounted) {
          reconnectAttempts++;
          reconnectTimeout = setTimeout(connect, 2000);
        }
      }
    };

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (queueTimerRef.current) clearInterval(queueTimerRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Queue timer ticker
  useEffect(() => {
    if (queueState.inQueue) {
      queueTimerRef.current = setInterval(() => {
        setQueueState((prev) => ({ ...prev, timeInQueue: prev.timeInQueue + 1 }));
      }, 1000);
    } else {
      if (queueTimerRef.current) clearInterval(queueTimerRef.current);
    }
    return () => {
      if (queueTimerRef.current) clearInterval(queueTimerRef.current);
    };
  }, [queueState.inQueue]);

  // Matchmaking actions
  const joinQueue = useCallback((playerName: string, avatar: string, deckId: string) => {
    sendMessage({
      type: 'JOIN_QUEUE',
      payload: { playerName, avatar, deckId },
    });
    setQueueState({ inQueue: true, timeInQueue: 0 });
  }, [sendMessage]);

  const leaveQueue = useCallback(() => {
    sendMessage({ type: 'LEAVE_QUEUE' });
    setQueueState({ inQueue: false, timeInQueue: 0 });
  }, [sendMessage]);

  // Play with Computer (AI Bot)
  const startAiMatch = useCallback((playerName: string, avatar: string, deckId: string, aiDeckId?: string) => {
    sendMessage({
      type: 'START_AI_MATCH',
      payload: { playerName, avatar, deckId, aiDeckId },
    });
  }, [sendMessage]);

  // Play with Friends (Custom Rooms)
  const createCustomRoom = useCallback((playerName: string, avatar: string, deckId: string) => {
    sendMessage({
      type: 'CREATE_CUSTOM_ROOM',
      payload: { playerName, avatar, deckId },
    });
  }, [sendMessage]);

  const joinCustomRoom = useCallback((roomCode: string, playerName: string, avatar: string, deckId: string) => {
    sendMessage({
      type: 'JOIN_CUSTOM_ROOM',
      payload: { roomCode, playerName, avatar, deckId },
    });
  }, [sendMessage]);

  const leaveCustomRoom = useCallback((roomCode: string) => {
    sendMessage({
      type: 'LEAVE_CUSTOM_ROOM',
      payload: { roomCode },
    });
    setCustomLobbyState(null);
  }, [sendMessage]);

  const startCustomMatch = useCallback((roomCode: string) => {
    sendMessage({
      type: 'START_CUSTOM_MATCH',
      payload: { roomCode },
    });
  }, [sendMessage]);

  // Game actions with Action Idempotency & Optimistic Concurrency Control (OCC)
  const sendGameAction = useCallback((action: PlayerActionPayload) => {
    const actionWithId: PlayerActionPayload = {
      ...action,
      actionId: action.actionId || generateActionId(),
      expectedVersion: gameState?.stateVersion,
    };
    sendMessage({
      type: 'GAME_ACTION',
      payload: actionWithId,
    });
  }, [sendMessage, gameState?.stateVersion]);

  const playCard = useCallback((cardInstanceId: string, targetInstanceId?: string) => {
    sendGameAction({
      type: 'PLAY_CARD',
      payload: { cardInstanceId, targetInstanceId },
    });
  }, [sendGameAction]);

  const attackMinion = useCallback((attackerInstanceId: string, targetInstanceId: string) => {
    sendGameAction({
      type: 'ATTACK_MINION',
      payload: { attackerInstanceId, targetInstanceId },
    });
  }, [sendGameAction]);

  const attackHero = useCallback((attackerInstanceId: string, targetPlayerId: string) => {
    sendGameAction({
      type: 'ATTACK_HERO',
      payload: { attackerInstanceId, targetPlayerId },
    });
  }, [sendGameAction]);

  const endTurn = useCallback(() => {
    sendGameAction({ type: 'END_TURN', payload: {} });
  }, [sendGameAction]);

  const surrender = useCallback(() => {
    sendGameAction({ type: 'SURRENDER', payload: {} });
  }, [sendGameAction]);

  const syncState = useCallback(() => {
    if (gameState?.roomId) {
      sendMessage({ type: 'SYNC_STATE', payload: { roomId: gameState.roomId } });
    }
  }, [sendMessage, gameState?.roomId]);

  const sendShowdownAction = useCallback((action: ShowdownActionPayload) => {
    sendMessage({
      type: 'SHOWDOWN_ACTION',
      payload: action,
    });
  }, [sendMessage]);

  const exitShowdownMatch = useCallback(() => {
    setShowdownMatch(null);
    setShowdownAction(null);
    setCustomLobbyState(null);
  }, []);

  const resetMatchState = useCallback(() => {
    setGameState(null);
    setCustomLobbyState(null);
    setShowdownMatch(null);
    setShowdownAction(null);
  }, []);

  return {
    isConnected,
    queueState,
    customLobbyState,
    gameState,
    lastError,
    myPlayerId,
    latency,
    setMyPlayerId,
    joinQueue,
    leaveQueue,
    startAiMatch,
    createCustomRoom,
    joinCustomRoom,
    leaveCustomRoom,
    startCustomMatch,
    playCard,
    attackMinion,
    attackHero,
    endTurn,
    surrender,
    syncState,
    resetMatchState,
    showdownMatch,
    showdownAction,
    sendShowdownAction,
    exitShowdownMatch,
  };
}
