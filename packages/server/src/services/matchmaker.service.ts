import { nanoid } from 'nanoid';
import { IRedisService, QueueEntry, redisService } from '../redis/redis-service.js';

export interface MatchCreatedPayload {
  roomId: string;
  p1: QueueEntry;
  p2: QueueEntry;
  matchedAt: number;
}

export class MatchmakerService {
  private redis: IRedisService;
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;

  public static MATCH_CREATED_CHANNEL = 'arena:events:match_created';

  constructor(redis: IRedisService = redisService) {
    this.redis = redis;
  }

  public start(intervalMs: number = 1000) {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), intervalMs);
    console.log('⚡ [Matchmaking Service] Started Redis-backed MMR Worker loop');
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public async addPlayer(entry: QueueEntry): Promise<{ queuePosition: number }> {
    await this.redis.enqueuePlayer(entry);
    const queueLength = await this.redis.getQueueLength();
    return { queuePosition: queueLength };
  }

  public async removePlayer(socketId: string): Promise<void> {
    await this.redis.dequeuePlayer(socketId);
  }

  public async getQueueLength(): Promise<number> {
    return await this.redis.getQueueLength();
  }

  /**
   * Main matchmaking evaluation tick with Dynamic MMR Expansion
   */
  private async tick() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const queue = await this.redis.getQueueEntries();
      if (queue.length < 2) {
        this.isProcessing = false;
        return;
      }

      const now = Date.now();
      const matchedSocketIds = new Set<string>();

      for (let i = 0; i < queue.length; i++) {
        const p1 = queue[i];
        if (matchedSocketIds.has(p1.socketId)) continue;

        const waitSecondsP1 = Math.max(0, (now - p1.joinedAt) / 1000);
        // Base window ±100, expands by +50 every 3s in queue (capped at ±800)
        const rangeP1 = Math.min(800, 100 + Math.floor(waitSecondsP1 / 3) * 50);

        let bestMatchIndex = -1;
        let lowestRatingDiff = Infinity;

        for (let j = i + 1; j < queue.length; j++) {
          const p2 = queue[j];
          if (matchedSocketIds.has(p2.socketId)) continue;

          const waitSecondsP2 = Math.max(0, (now - p2.joinedAt) / 1000);
          const rangeP2 = Math.min(800, 100 + Math.floor(waitSecondsP2 / 3) * 50);

          const maxAllowedDiff = Math.max(rangeP1, rangeP2);
          const diff = Math.abs(p1.rating - p2.rating);

          if (diff <= maxAllowedDiff && diff < lowestRatingDiff) {
            lowestRatingDiff = diff;
            bestMatchIndex = j;
          }
        }

        if (bestMatchIndex !== -1) {
          const p2 = queue[bestMatchIndex];
          matchedSocketIds.add(p1.socketId);
          matchedSocketIds.add(p2.socketId);

          // Atomically remove from queue
          await this.redis.dequeuePlayer(p1.socketId);
          await this.redis.dequeuePlayer(p2.socketId);

          const roomId = `room_pvp_${nanoid(8)}`;
          const payload: MatchCreatedPayload = {
            roomId,
            p1,
            p2,
            matchedAt: Date.now(),
          };

          console.log(`🎯 [Matchmaking Service] Match Found! ${p1.playerName} (${p1.rating}) vs ${p2.playerName} (${p2.rating}) -> Room: ${roomId}`);

          // Publish match creation event to Redis bus
          await this.redis.publish(MatchmakerService.MATCH_CREATED_CHANNEL, payload);
        }
      }
    } catch (err) {
      console.error('[Matchmaking Service Error]', err);
    } finally {
      this.isProcessing = false;
    }
  }
}
