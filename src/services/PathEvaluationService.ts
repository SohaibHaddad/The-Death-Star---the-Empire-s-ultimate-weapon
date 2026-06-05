import type { AppConfig } from "../config/loadAppConfig.js";
import { RouteRepository } from "../repositories/RouteRepository.js";
import type { ComputeSuccessResponse } from "../handlers/computeTypes.js";
import { UniverseGraph } from "../domaine-entities/UniverseGraph.js";
import { DijkstraPathFinder } from "./DijkstraPathFinder.js";

type PathEvaluationConfig = Pick<AppConfig, "autonomy" | "departure">;

export class PathEvaluationService {
  constructor(
    private readonly config: PathEvaluationConfig,
    private readonly routeRepository: RouteRepository,
  ) {}

  async evaluate(arrival: string): Promise<ComputeSuccessResponse> {
    const routes = await this.routeRepository.findAll();
    const universeGraph = UniverseGraph.fromRoutes(routes);
    const pathFinder = new DijkstraPathFinder(universeGraph, this.config);

    return pathFinder.findShortestPath(arrival);
  }
}
