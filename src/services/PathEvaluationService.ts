import type { AppConfig } from "../config/loadAppConfig.js";
import { RouteRepository } from "../repositories/RouteRepository.js";
import type { ComputeSuccessResponse } from "../handlers/computeTypes.js";
import { UniverseGraph } from "../domaine-entities/UniverseGraph.js";
import { DijkstraPathFinder } from "./DijkstraPathFinder.js";

type PathEvaluationConfig = Pick<AppConfig, "autonomy" | "departure">;

export class RouteNotFoundError extends Error {}

export class PathEvaluationService {
  private constructor(
    private readonly config: PathEvaluationConfig,
    private readonly universeGraph: UniverseGraph,
  ) {}

  // This factory loads routes once up front so callers can reuse the service
  // without reloading the route set on every evaluation.
  static async create(
    config: PathEvaluationConfig,
    routeRepository: RouteRepository,
  ): Promise<PathEvaluationService> {
    const routes = await routeRepository.findAll();
    const universeGraph = UniverseGraph.fromRoutes(routes);

    return new PathEvaluationService(config, universeGraph);
  }

  async evaluate(arrival: string): Promise<ComputeSuccessResponse> {
    const pathFinder = new DijkstraPathFinder(this.universeGraph, this.config);

    try {
      return pathFinder.findShortestPath(arrival);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.startsWith("No route found")) {
        throw new RouteNotFoundError(error.message);
      }

      throw error;
    }
  }
}
