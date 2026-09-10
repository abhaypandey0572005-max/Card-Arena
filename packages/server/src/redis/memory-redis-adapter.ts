import { EventEmitter } from 'events';

interface ValueWithTtl {
  value: string;
  expiresAt: number | null; // unix timestamp in ms
}

/**
 * High-performance in-memory Redis adapter with:
 * - Atomic key-value get/set with NX/PX/EX options
 * - TTL expiration timers
 * - List & Hash structures for queueing & state caching
 * - Pub/Sub event broadcasting
 */
export class MemoryRedisAdapter {
  private kv = new Map<string, ValueWithTtl>();
  private lists = new Map<string, string[]>();
  private hashes = new Map<string, Map<string, string>>();
  private emitter = new EventEmitter();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.emitter.setMaxListeners(200);
    // Periodically clean expired keys
    this.cleanupInterval = setInterval(() => this.purgeExpired(), 5000);
  }

  public destroy() {
    clearInterval(this.cleanupInterval);
    this.emitter.removeAllListeners();
    this.kv.clear();
    this.lists.clear();
    this.hashes.clear();
  }

  private purgeExpired() {
    const now = Date.now();
    for (const [key, item] of this.kv.entries()) {
      if (item.expiresAt !== null && item.expiresAt <= now) {
        this.kv.delete(key);
      }
    }
  }

  private isKeyValid(key: string): boolean {
    const item = this.kv.get(key);
    if (!item) return false;
    if (item.expiresAt !== null && item.expiresAt <= Date.now()) {
      this.kv.delete(key);
      return false;
    }
    return true;
  }

  // ================= KEY / VALUE & DISTRIBUTED LOCKS =================

  public async get(key: string): Promise<string | null> {
    if (!this.isKeyValid(key)) return null;
    return this.kv.get(key)!.value;
  }

  /**
   * Supports:
   * set(key, value)
   * set(key, value, 'NX')
   * set(key, value, 'EX', seconds)
   * set(key, value, 'PX', ms)
   * set(key, value, 'PX', ms, 'NX')
   * set(key, value, 'EX', seconds, 'NX')
   */
  public async set(
    key: string,
    value: string,
    opt1?: string,
    opt2?: number | string,
    opt3?: string
  ): Promise<'OK' | null> {
    const exists = this.isKeyValid(key);

    let isNx = false;
    let ttlMs: number | null = null;

    const args = [opt1, opt2, opt3].filter(Boolean);
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (typeof arg === 'string' && arg.toUpperCase() === 'NX') {
        isNx = true;
      } else if (typeof arg === 'string' && arg.toUpperCase() === 'EX') {
        const next = args[i + 1];
        if (typeof next === 'number') {
          ttlMs = next * 1000;
        } else if (typeof next === 'string' && !isNaN(Number(next))) {
          ttlMs = Number(next) * 1000;
        }
      } else if (typeof arg === 'string' && arg.toUpperCase() === 'PX') {
        const next = args[i + 1];
        if (typeof next === 'number') {
          ttlMs = next;
        } else if (typeof next === 'string' && !isNaN(Number(next))) {
          ttlMs = Number(next);
        }
      }
    }

    if (isNx && exists) {
      return null;
    }

    const expiresAt = ttlMs !== null ? Date.now() + ttlMs : null;
    this.kv.set(key, { value, expiresAt });
    return 'OK';
  }

  public async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.kv.delete(key)) deleted++;
      if (this.lists.delete(key)) deleted++;
      if (this.hashes.delete(key)) deleted++;
    }
    return deleted;
  }

  public async exists(key: string): Promise<number> {
    return this.isKeyValid(key) || this.lists.has(key) || this.hashes.has(key) ? 1 : 0;
  }

  public async expire(key: string, seconds: number): Promise<number> {
    const item = this.kv.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  public async ttl(key: string): Promise<number> {
    const item = this.kv.get(key);
    if (!item) return -2;
    if (item.expiresAt === null) return -1;
    const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  // ================= LIST OPERATIONS (MATCHMAKING QUEUE) =================

  public async rpush(key: string, ...values: string[]): Promise<number> {
    const list = this.lists.get(key) || [];
    list.push(...values);
    this.lists.set(key, list);
    return list.length;
  }

  public async lpop(key: string): Promise<string | null> {
    const list = this.lists.get(key);
    if (!list || list.length === 0) return null;
    return list.shift() || null;
  }

  public async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.lists.get(key) || [];
    const len = list.length;
    let s = start < 0 ? Math.max(0, len + start) : start;
    let e = stop < 0 ? len + stop + 1 : stop + 1;
    return list.slice(s, e);
  }

  public async lrem(key: string, count: number, value: string): Promise<number> {
    const list = this.lists.get(key);
    if (!list) return 0;
    let removed = 0;
    const remaining: string[] = [];

    if (count === 0) {
      for (const item of list) {
        if (item === value) removed++;
        else remaining.push(item);
      }
    } else if (count > 0) {
      let remCount = 0;
      for (const item of list) {
        if (item === value && remCount < count) {
          remCount++;
          removed++;
        } else {
          remaining.push(item);
        }
      }
    } else {
      // count < 0, remove from right to left
      let remCount = 0;
      const absCount = Math.abs(count);
      for (let i = list.length - 1; i >= 0; i--) {
        const item = list[i];
        if (item === value && remCount < absCount) {
          remCount++;
          removed++;
        } else {
          remaining.unshift(item);
        }
      }
    }

    this.lists.set(key, remaining);
    return removed;
  }

  public async llen(key: string): Promise<number> {
    return (this.lists.get(key) || []).length;
  }

  // ================= HASH OPERATIONS =================

  public async hset(key: string, field: string, value: string): Promise<number> {
    let map = this.hashes.get(key);
    if (!map) {
      map = new Map<string, string>();
      this.hashes.set(key, map);
    }
    const isNew = !map.has(field);
    map.set(field, value);
    return isNew ? 1 : 0;
  }

  public async hget(key: string, field: string): Promise<string | null> {
    const map = this.hashes.get(key);
    if (!map) return null;
    return map.get(field) ?? null;
  }

  public async hgetall(key: string): Promise<Record<string, string>> {
    const map = this.hashes.get(key);
    if (!map) return {};
    return Object.fromEntries(map.entries());
  }

  public async hdel(key: string, ...fields: string[]): Promise<number> {
    const map = this.hashes.get(key);
    if (!map) return 0;
    let removed = 0;
    for (const f of fields) {
      if (map.delete(f)) removed++;
    }
    return removed;
  }

  // ================= PUB / SUB =================

  public async publish(channel: string, message: string): Promise<number> {
    const count = this.emitter.listenerCount(channel);
    setImmediate(() => {
      this.emitter.emit(channel, message);
    });
    return count;
  }

  public subscribe(channel: string, callback: (message: string) => void): () => void {
    this.emitter.on(channel, callback);
    return () => {
      this.emitter.off(channel, callback);
    };
  }

  public async flushall(): Promise<void> {
    this.kv.clear();
    this.lists.clear();
    this.hashes.clear();
  }
}
