import { Redis } from 'ioredis';
import { nanoid } from 'nanoid';
import { GameState } from '@card-battler/shared';
import { MemoryRedisAdapter } from './memory-redis-adapter.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RedisClientCtor: any = (Redis as any).default || Redis;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IORedisClient = any;

export interface QueueEntry {
  socketId: string;
  playerId: string;
  playerName: string;
  avatar: string;
  deckId: string;
  rating: number;
  joinedAt: number;
}

export interface RedisLockResult {
  acquired: boolean;
  token: string;
}

export interface IRedisService {
  isClusterReady: boolean;
  mode: 'ioredis' | 'in-memory-adapter';
  
  // Distributed Mutex Locking
  acquireLock(lockKey: string, ttlMs?: number): Promise<RedisLockResult>;
  releaseLock(lockKey: string, token: string): Promise<boolean>;

  // Concurrency & Action Idempotency
  checkAndSetIdempotency(actionId: string, ttlSeconds?: number): Promise<boolean>;

  // Game State Persistence
  setRoomState(roomId: string, state: GameState, ttlSeconds?: number): Promise<void>;
  getRoomState(roomId: string): Promise<GameState | null>;
  deleteRoomState(roomId: string): Promise<void>;

  // Pub/Sub Channels
  publish(channel: string, data: unknown): Promise<number>;
  subscribe(channel: string, callback: (data: unknown) => void): () => void;

  // Matchmaking Queue Operations
  enqueuePlayer(entry: QueueEntry): Promise<void>;
  dequeuePlayer(socketId: string): Promise<void>;
  getQueueEntries(): Promise<QueueEntry[]>;
  getQueueLength(): Promise<number>;

  // Shutdown
  close(): Promise<void>;
}

export class RedisService implements IRedisService {
  public mode: 'ioredis' | 'in-memory-adapter' = 'in-memory-adapter';
  public isClusterReady: boolean = false;

  private ioRedisClient: IORedisClient | null = null;
  private ioRedisSub: IORedisClient | null = null;
  private memoryAdapter: MemoryRedisAdapter | null = null;
  private subCallbacks = new Map<string, Set<(data: unknown) => void>>();

  private static QUEUE_KEY = 'arena:matchmaking:queue';
  private static ROOM_PREFIX = 'arena:room:';
  private static LOCK_PREFIX = 'arena:lock:';
  private static ACTION_PREFIX = 'arena:action:';

  constructor() {
    this.init();
  }

  private init() {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST;

    if (redisUrl || redisHost) {
      try {
        const options = {
          lazyConnect: true,
          retryStrategy: (times: number) => {
            if (times > 3) {
              console.warn('[Redis] Connection retries exceeded. Falling back to In-Memory Redis Adapter.');
              this.fallbackToMemory();
              return null;
            }
            return Math.min(times * 100, 2000);
          },
          maxRetriesPerRequest: 1,
        };

        const client = redisUrl ? new RedisClientCtor(redisUrl, options) : new RedisClientCtor({ host: redisHost, port: Number(process.env.REDIS_PORT || 6379), ...options });
        const subClient = redisUrl ? new RedisClientCtor(redisUrl, options) : new RedisClientCtor({ host: redisHost, port: Number(process.env.REDIS_PORT || 6379), ...options });

        client.connect().then(() => {
          this.ioRedisClient = client;
          this.mode = 'ioredis';
          this.isClusterReady = true;
          console.log(`[Redis] Connected to Remote Redis Server via ioredis (${redisUrl ? 'REDIS_URL' : redisHost})`);
        }).catch((err: unknown) => {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn('[Redis] Remote connection failed. Activating In-Memory Redis Adapter fallback:', errMsg);
          this.fallbackToMemory();
        });

        subClient.connect().then(() => {
          this.ioRedisSub = subClient;
          if (this.ioRedisSub) {
            this.ioRedisSub.on('message', (channel: string, rawMessage: string) => {
              const handlers = this.subCallbacks.get(channel);
              if (handlers) {
                try {
                  const parsed = JSON.parse(rawMessage);
                  handlers.forEach((h) => h(parsed));
                } catch {
                  handlers.forEach((h) => h(rawMessage));
                }
              }
            });
          }
        }).catch(() => {
          // Handled by client fallback
        });
      } catch (err: unknown) {
        console.warn('[Redis] Error initializing ioredis client, using in-memory adapter:', err);
        this.fallbackToMemory();
      }
    } else {
      this.fallbackToMemory();
    }
  }

  private fallbackToMemory() {
    if (!this.memoryAdapter) {
      this.memoryAdapter = new MemoryRedisAdapter();
      this.mode = 'in-memory-adapter';
      this.isClusterReady = true;
      console.log('[Redis] Activated Zero-Config In-Memory Redis & Pub/Sub Adapter (Offline/Local Development Ready)');
    }
  }

  // ================= DISTRIBUTED LOCKS (MUTEX) =================

  /**
   * Acquire a distributed lock for a match room or critical section.
   * Uses SET NX PX 3000
   */
  public async acquireLock(lockKey: string, ttlMs: number = 3000): Promise<RedisLockResult> {
    const fullKey = `${RedisService.LOCK_PREFIX}${lockKey}`;
    const token = `lock_${nanoid(10)}_${Date.now()}`;

    if (this.mode === 'ioredis' && this.ioRedisClient) {
      try {
        const result = await this.ioRedisClient.set(fullKey, token, 'PX', ttlMs, 'NX');
        return { acquired: result === 'OK', token };
      } catch (err) {
        console.error('[Redis Lock Error]', err);
        // Fallback to local memory lock if ioredis fails
      }
    }

    if (this.memoryAdapter) {
      const res = await this.memoryAdapter.set(fullKey, token, 'PX', ttlMs, 'NX');
      return { acquired: res === 'OK', token };
    }

    return { acquired: true, token };
  }

  /**
   * Safely release distributed lock only if caller owns the matching token
   */
  public async releaseLock(lockKey: string, token: string): Promise<boolean> {
    const fullKey = `${RedisService.LOCK_PREFIX}${lockKey}`;

    if (this.mode === 'ioredis' && this.ioRedisClient) {
      try {
        // Lua atomic check-and-delete
        const luaScript = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
        const result = await this.ioRedisClient.eval(luaScript, 1, fullKey, token);
        return result === 1;
      } catch (err) {
        console.error('[Redis Release Lock Error]', err);
      }
    }

    if (this.memoryAdapter) {
      const current = await this.memoryAdapter.get(fullKey);
      if (current === token) {
        await this.memoryAdapter.del(fullKey);
        return true;
      }
      return false;
    }

    return true;
  }

  // ================= ACTION IDEMPOTENCY & DEDUPLICATION =================

  /**
   * Checks if actionId was already executed. If new, records it with TTL.
   * Returns `true` if FRESH action (allowed to execute).
   * Returns `false` if DUPLICATE action (already processed or currently running).
   */
  public async checkAndSetIdempotency(actionId: string, ttlSeconds: number = 15): Promise<boolean> {
    const fullKey = `${RedisService.ACTION_PREFIX}${actionId}`;

    if (this.mode === 'ioredis' && this.ioRedisClient) {
      try {
        const result = await this.ioRedisClient.set(fullKey, 'PROCESSED', 'EX', ttlSeconds, 'NX');
        return result === 'OK';
      } catch (err) {
        console.error('[Redis Idempotency Error]', err);
      }
    }

    if (this.memoryAdapter) {
      const result = await this.memoryAdapter.set(fullKey, 'PROCESSED', 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    }

    return true;
  }

  // ================= GAME STATE PERSISTENCE =================

  public async setRoomState(roomId: string, state: GameState, ttlSeconds: number = 3600): Promise<void> {
    const fullKey = `${RedisService.ROOM_PREFIX}${roomId}`;
    const payload = JSON.stringify(state);

    if (this.mode === 'ioredis' && this.ioRedisClient) {
      try {
        await this.ioRedisClient.set(fullKey, payload, 'EX', ttlSeconds);
        return;
      } catch (err) {
        console.error('[Redis setRoomState Error]', err);
      }
    }

    if (this.memoryAdapter) {
      await this.memoryAdapter.set(fullKey, payload, 'EX', ttlSeconds);
    }
  }

  public async getRoomState(roomId: string): Promise<GameState | null> {
    const fullKey = `${RedisService.ROOM_PREFIX}${roomId}`;

    if (this.mode === 'ioredis' && this.ioRedisClient) {
      try {
        const raw = await this.ioRedisClient.get(fullKey);
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        console.error('[Redis getRoomState Error]', err);
      }
    }

    if (this.memoryAdapter) {
      const raw = await this.memoryAdapter.get(fullKey);
      return raw ? JSON.parse(raw) : null;
    }

    return null;
  }

  public async deleteRoomState(roomId: string): Promise<void> {
    const fullKey = `${RedisService.ROOM_PREFIX}${roomId}`;
    if (this.mode === 'ioredis' && this.ioRedisClient) {
      await this.ioRedisClient.del(fullKey);
    }
    if (this.memoryAdapter) {
      await this.memoryAdapter.del(fullKey);
    }
  }

  // ================= PUB / SUB BROADCASTING =================

  public async publish(channel: string, data: unknown): Promise<number> {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);

    if (this.mode === 'ioredis' && this.ioRedisClient) {
      try {
        return await this.ioRedisClient.publish(channel, serialized);
      } catch (err) {
        console.error('[Redis publish Error]', err);
      }
    }

    if (this.memoryAdapter) {
      return await this.memoryAdapter.publish(channel, serialized);
    }

    return 0;
  }

  public subscribe(channel: string, callback: (data: unknown) => void): () => void {
    if (!this.subCallbacks.has(channel)) {
      this.subCallbacks.set(channel, new Set());
      if (this.mode === 'ioredis' && this.ioRedisSub) {
        this.ioRedisSub.subscribe(channel).catch((e: unknown) => console.error('[Redis subscribe Error]', e));
      }
    }

    this.subCallbacks.get(channel)!.add(callback);

    let memUnsub: (() => void) | null = null;
    if (this.memoryAdapter) {
      memUnsub = this.memoryAdapter.subscribe(channel, (raw) => {
        try {
          const parsed = JSON.parse(raw);
          callback(parsed);
        } catch {
          callback(raw);
        }
      });
    }

    return () => {
      const set = this.subCallbacks.get(channel);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.subCallbacks.delete(channel);
          if (this.mode === 'ioredis' && this.ioRedisSub) {
            this.ioRedisSub.unsubscribe(channel).catch(() => {});
          }
        }
      }
      if (memUnsub) memUnsub();
    };
  }

  // ================= MATCHMAKING QUEUE =================

  public async enqueuePlayer(entry: QueueEntry): Promise<void> {
    const serialized = JSON.stringify(entry);

    if (this.mode === 'ioredis' && this.ioRedisClient) {
      try {
        await this.ioRedisClient.rpush(RedisService.QUEUE_KEY, serialized);
        return;
      } catch (err) {
        console.error('[Redis enqueuePlayer Error]', err);
      }
    }

    if (this.memoryAdapter) {
      await this.memoryAdapter.rpush(RedisService.QUEUE_KEY, serialized);
    }
  }

  public async dequeuePlayer(socketId: string): Promise<void> {
    const entries = await this.getQueueEntries();
    const target = entries.find((e) => e.socketId === socketId);
    if (!target) return;

    const serialized = JSON.stringify(target);

    if (this.mode === 'ioredis' && this.ioRedisClient) {
      try {
        await this.ioRedisClient.lrem(RedisService.QUEUE_KEY, 0, serialized);
        return;
      } catch (err) {
        console.error('[Redis dequeuePlayer Error]', err);
      }
    }

    if (this.memoryAdapter) {
      await this.memoryAdapter.lrem(RedisService.QUEUE_KEY, 0, serialized);
    }
  }

  public async getQueueEntries(): Promise<QueueEntry[]> {
    let rawList: string[] = [];

    if (this.mode === 'ioredis' && this.ioRedisClient) {
      try {
        rawList = await this.ioRedisClient.lrange(RedisService.QUEUE_KEY, 0, -1);
      } catch (err) {
        console.error('[Redis getQueueEntries Error]', err);
      }
    } else if (this.memoryAdapter) {
      rawList = await this.memoryAdapter.lrange(RedisService.QUEUE_KEY, 0, -1);
    }

    const result: QueueEntry[] = [];
    for (const item of rawList) {
      try {
        result.push(JSON.parse(item));
      } catch {
        // ignore corrupted
      }
    }
    return result;
  }

  public async getQueueLength(): Promise<number> {
    if (this.mode === 'ioredis' && this.ioRedisClient) {
      try {
        return await this.ioRedisClient.llen(RedisService.QUEUE_KEY);
      } catch (err) {
        console.error('[Redis getQueueLength Error]', err);
      }
    }
    if (this.memoryAdapter) {
      return await this.memoryAdapter.llen(RedisService.QUEUE_KEY);
    }
    return 0;
  }

  public async close(): Promise<void> {
    if (this.ioRedisClient) await this.ioRedisClient.quit();
    if (this.ioRedisSub) await this.ioRedisSub.quit();
    if (this.memoryAdapter) this.memoryAdapter.destroy();
  }
}

// Export singleton instance
export const redisService = new RedisService();
