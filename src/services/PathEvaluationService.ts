import type { AppConfig } from "../config/loadAppConfig.js";
import { RouteRepository } from "../repositories/RouteRepository.js";
import type { ComputeSuccessResponse } from "../handlers/computeTypes.js";
import { UniverseGraph } from "../domaine-entities/UniverseGraph.js";

type PathEvaluationConfig = Pick<AppConfig, "autonomy" | "departure">;

export class PathEvaluationService {
  constructor(
    private readonly config: PathEvaluationConfig,
    private readonly routeRepository: RouteRepository,
  ) {}

  async evaluate(arrival: string): Promise<ComputeSuccessResponse> {
    const routes = await this.routeRepository.findAll();
    const universeGraph = UniverseGraph.fromRoutes(routes);
    const departureNode = universeGraph.getNode(this.config.departure);
    const arrivalNode = universeGraph.getNode(arrival);

    if (arrival === this.config.departure) {
      return {
        duration: 0,
        route: [this.config.departure],
      };
    }

    if (!departureNode || !arrivalNode) {
      return {
        duration: 0,
        route: [this.config.departure, arrival],
      };
    }

    return {
      duration: 0,
      route: [departureNode.name, arrivalNode.name],
    };
  }
}
