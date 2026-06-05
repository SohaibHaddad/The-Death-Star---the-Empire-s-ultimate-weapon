import type { PathState } from "./PathState.js";

export class BestDurationByState {
  // The same planet can be revisited with different remaining autonomy, so
  // the best-known cost must be tracked per (planet, autonomy) state.
  private readonly durationsByStateKey = new Map<string, number>();

  hasBetterOrEqual(state: PathState): boolean {
    const bestKnownDuration = this.durationsByStateKey.get(this.getStateKey(state));

    // Dijkstra only needs to keep a state if it improves the best known cost.
    return bestKnownDuration !== undefined && bestKnownDuration <= state.duration;
  }

  remember(state: PathState): void {
    this.durationsByStateKey.set(this.getStateKey(state), state.duration);
  }

  private getStateKey(state: PathState): string {
    // Remaining autonomy is part of the search state, not just the planet name.
    // Reaching the same planet with different fuel levels can change the cost of
    // future jumps, because one state may need to refuel before traveling while
    // another can continue immediately. That is why "Hoth:0" and "Hoth:3" must
    // be tracked separately in the best-known-cost map.
    return `${state.planetName}:${state.remainingAutonomy}`;
  }
}
