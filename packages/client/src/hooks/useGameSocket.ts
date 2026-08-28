import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GameState, 
  ServerMessage, 
  ClientMessage, 
  PlayerActionPayload, 
  CustomRoomLobbyState 
} from '@card-battler/shared';

export interface QueueState {
  inQueue: boolean;
  queuePosition?: number;
  timeInQueue: number;
}

export function useGameSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [queueState, setQueueState] = useState<QueueState>({ inQueue: false, timeInQueue: 0 });
  const [customLobbyState, setCustomLobbyState] = useState<CustomRoomLobbyState | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const queueTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Send message helper
  const sendMessage = useCallback((msg: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Connect to WebSocket
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
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/ws`;
    }

    console.log('Connecting to WebSocket at:', wsUrl);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setLastError(null);

      // Start ping interval
      pingIntervalRef.current = setInterval(() => {
        sendMessage({ type: 'PING' });
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
            break;

          case 'CUSTOM_ROOM_STATE':
            setCustomLobbyState(msg.payload);
            break;

          case 'GAME_STATE':
            setGameState(msg.payload);
            break;

          case 'ACTION_REJECTED':
            setLastError(msg.payload.reason);
            setTimeout(() => setLastError(null), 3500);
            break;

          case 'ERROR':
            setLastError(msg.payload.message);
            setTimeout(() => setLastError(null), 4000);
            break;

          case 'PONG':
            break;
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };

    ws.onerror = (err) => {
      console.error('WebSocket encountered an error', err);
      setIsConnected(false);
    };

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (queueTimerRef.current) clearInterval(queueTimerRef.current);
      ws.close();
    };
  }, [sendMessage]);

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

  // Game actions
  const sendGameAction = useCallback((action: PlayerActionPayload) => {
    sendMessage({
      type: 'GAME_ACTION',
      payload: action,
    });
  }, [sendMessage]);

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

  const resetMatchState = useCallback(() => {
    setGameState(null);
    setCustomLobbyState(null);
  }, []);

  return {
    isConnected,
    queueState,
    customLobbyState,
    gameState,
    lastError,
    myPlayerId,
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
    resetMatchState,
  };
}
