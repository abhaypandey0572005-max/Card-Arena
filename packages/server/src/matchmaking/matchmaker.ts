import { nanoid } from 'nanoid';

export interface QueueEntry {
  socketId: string;
  playerId: string;
  playerName: string;
  avatar: string;
  deckId: string;
  rating: number;
  joinedAt: number;
}

export type MatchFoundCallback = (
  roomId: string,
  p1: QueueEntry,
  p2: QueueEntry
) => void;

export class Matchmaker {
  private queue: QueueEntry[] = [];
  private matchInterval: NodeJS.Timeout | null = null;

  constructor(private onMatchFound: MatchFoundCallback) {
    this.startMatchingLoop();
  }

  public addToQueue(entry: QueueEntry): { success: boolean; queuePosition: number } {
    // Prevent duplicate queue entries
    this.removeFromQueue(entry.socketId);
    this.queue.push(entry);
    return { success: true, queuePosition: this.queue.length };
  }

  public removeFromQueue(socketId: string) {
    this.queue = this.queue.filter((e) => e.socketId !== socketId);
  }

  public getQueueEntry(socketId: string): QueueEntry | undefined {
    return this.queue.find((e) => e.socketId === socketId);
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  private startMatchingLoop() {
    this.matchInterval = setInterval(() => {
      this.processQueue();
    }, 500);
  }

  /**
   * Evaluates queued players and pairs them based on MMR rating and queue wait time
   */
  private processQueue() {
    if (this.queue.length < 2) return;

    const matchedIndices = new Set<number>();
    const now = Date.now();

    for (let i = 0; i < this.queue.length; i++) {
      if (matchedIndices.has(i)) continue;
      const p1 = this.queue[i];
      const p1WaitSeconds = (now - p1.joinedAt) / 1000;
      // Search window expands by 100 MMR every 3 seconds waited
      const maxEloDiff = 100 + Math.floor(p1WaitSeconds / 3) * 100;

      for (let j = i + 1; j < this.queue.length; j++) {
        if (matchedIndices.has(j)) continue;
        const p2 = this.queue[j];
        const eloDiff = Math.abs(p1.rating - p2.rating);

        if (eloDiff <= maxEloDiff) {
          matchedIndices.add(i);
          matchedIndices.add(j);

          const roomId = `room_${nanoid(8)}`;
          this.onMatchFound(roomId, p1, p2);
          break;
        }
      }
    }

    // Remove matched players from queue
    if (matchedIndices.size > 0) {
      this.queue = this.queue.filter((_, idx) => !matchedIndices.has(idx));
    }
  }

  public destroy() {
    if (this.matchInterval) clearInterval(this.matchInterval);
  }
}
