import type { Repository } from "typeorm";
import { appDataSource } from "../data-source.js";
import { RouteEntity } from "../database-entities/RouteEntity.js";

export class RouteRepository {
  private get repository(): Repository<RouteEntity> {
    return appDataSource.getRepository(RouteEntity);
  }

  async findAll(): Promise<RouteEntity[]> {
    return this.repository.find({
      order: {
        origin: "ASC",
        destination: "ASC",
      },
    });
  }
}
