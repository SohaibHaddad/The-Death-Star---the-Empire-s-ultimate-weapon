import type { DataSource, Repository } from "typeorm";
import { RouteEntity } from "../database-entities/RouteEntity.js";

export class RouteRepository {
  constructor(private readonly dataSource: DataSource) {}

  private get repository(): Repository<RouteEntity> {
    return this.dataSource.getRepository(RouteEntity);
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
