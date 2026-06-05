import { BestDurationByState } from "../domaine-entities/BestDurationByState.js";
import type { PlanetConnection } from "../domaine-entities/PlanetNode.js";
import type { PathState } from "../domaine-entities/PathState.js";
import { PathStatePriorityQueue } from "../domaine-entities/PathStatePriorityQueue.js";
import { UniverseGraph } from "../domaine-entities/UniverseGraph.js";
import type { AppConfig } from "../config/loadAppConfig.js";
import type { ComputeSuccessResponse } from "../handlers/computeTypes.js";

type PathFinderConfig = Pick<AppConfig, "autonomy" | "departure">;

// This path finder uses Dijkstra's algorithm because each move has a non-negative
// cost in days: the jump travel time, plus one extra day when refueling is needed.
// The search state includes both the current planet and remaining autonomy, since
// reaching the same planet with different fuel levels can lead to different futures.
export class DijkstraPathFinder {
  constructor(
    private readonly graph: UniverseGraph,
    private readonly config: PathFinderConfig,
  ) {}

  findShortestPath(arrival: string): ComputeSuccessResponse {
    // Resolve the start and end nodes once before running the search.
    const departureNode = this.graph.getNode(this.config.departure);
    const arrivalNode = this.graph.getNode(arrival);

    // A missing endpoint means the graph does not contain a valid path.
    if (!departureNode || !arrivalNode) {
      throw new Error(`No route found from ${this.config.departure} to ${arrival}.`);
    }

    // Start Dijkstra from the departure node with full autonomy and zero cost.
    const queue = new PathStatePriorityQueue({
      duration: 0,
      planetName: departureNode.name,
      remainingAutonomy: this.config.autonomy,
      route: [departureNode.name],
    });

    // The same planet can be revisited with different remaining autonomy, so
    // the best-known cost must be tracked per (planet, autonomy) state.
    const bestDurationByState = new BestDurationByState();

    while (!queue.isEmpty) {
      const currentState = queue.pop();

      if (!currentState) {
        break;
      }

      // If this current state is worse, we already explored the same planet/fuel
      // combination in fewer or equal days, so it can be discarded.
      if (bestDurationByState.hasBetterOrEqual(currentState)) {
        continue;
      }

      bestDurationByState.remember(currentState);

      // The priority queue is a min-heap ordered by accumulated duration, so it
      // always pops the currently cheapest state first. This is what lets
      // Dijkstra's algorithm guarantee that the first arrival we pop is the
      // optimal path.
      if (currentState.planetName === arrivalNode.name) {
        return {
          duration: currentState.duration,
          route: currentState.route,
        };
      }

      this.enqueueReachableNeighbors(currentState, queue, bestDurationByState);
    }

    throw new Error(`No route found from ${this.config.departure} to ${arrival}.`);
  }

  private enqueueReachableNeighbors(
    currentState: PathState,
    queue: PathStatePriorityQueue,
    bestDurationByState: BestDurationByState,
  ): void {
    // Expand the current state by simulating every reachable outgoing jump.
    const currentNode = this.graph.getNode(currentState.planetName);

    if (!currentNode) {
      return;
    }

    for (const connection of currentNode.getConnections()) {
      const nextState = this.createNextState(currentState, connection);

      if (!nextState) {
        continue;
      }

      // If this next state is worse, we already explored the same planet/fuel
      // combination in fewer or equal days, so this path cannot improve the result.
      if (bestDurationByState.hasBetterOrEqual(nextState)) {
        continue;
      }

      queue.push(nextState);
    }
  }

  private createNextState(currentState: PathState, connection: PlanetConnection): PathState | null {
    // A jump longer than total autonomy can never be taken, even after refueling.
    if (connection.travelTime > this.config.autonomy) {
      return null;
    }

    // If the Falcon does not have enough autonomy left for the next jump, it
    // must spend one extra day refueling before traveling.
    const needsRefuel = currentState.remainingAutonomy < connection.travelTime;
    const availableAutonomy = needsRefuel
      ? this.config.autonomy
      : currentState.remainingAutonomy;

    return {
      duration: currentState.duration + connection.travelTime + (needsRefuel ? 1 : 0),
      planetName: connection.destination.name,
      remainingAutonomy: availableAutonomy - connection.travelTime,
      route: [...currentState.route, connection.destination.name],
    };
  }
}
