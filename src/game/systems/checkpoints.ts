import type { Checkpoint } from '../entities/pickups';
import type { Point } from '../levels/types';

/** Tracks where the player returns after a fall. Session-only, per the concept brief. */
export class CheckpointTracker {
  private point: Point;
  private current: Checkpoint | null = null;

  constructor(private readonly spawn: Point) {
    this.point = { ...spawn };
  }

  get respawnPoint(): Point {
    return this.point;
  }

  /** Returns true if this is a newly reached checkpoint. */
  reach(checkpoint: Checkpoint): boolean {
    if (checkpoint.active || checkpoint === this.current) return false;
    checkpoint.activate();
    this.current = checkpoint;
    this.point = { ...checkpoint.respawnPoint };
    return true;
  }

  reset(): void {
    this.current = null;
    this.point = { ...this.spawn };
  }
}
