import type { AppConfig } from "../config/loadAppConfig.js";
import { RouteRepository } from "../repositories/RouteRepository.js";
import type { ComputeSuccessResponse } from "../handlers/computeTypes.js";

type PathEvaluationConfig = Pick<AppConfig, "autonomy" | "departure">;

export class PathEvaluationService {
  constructor(
    private readonly config: PathEvaluationConfig,
    private readonly routeRepository: RouteRepository,
  ) {}

  async evaluate(arrival: string): Promise<ComputeSuccessResponse> {
    await this.routeRepository.findAll();

    if (arrival === this.config.departure) {
      return {
        duration: 0,
        route: [this.config.departure],
      };
    }

    return {
      duration: 0,
      route: [this.config.departure, arrival],
    };
  }
}
