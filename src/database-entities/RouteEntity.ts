import { BaseEntity, Check, Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "ROUTES" })
@Check(`"ORIGIN" <> ''`)
@Check(`"DESTINATION" <> ''`)
@Check(`"TRAVEL_TIME" > 0`)
export class RouteEntity extends BaseEntity {
  @PrimaryColumn({ name: "ORIGIN", type: "text" })
  origin!: string;

  @PrimaryColumn({ name: "DESTINATION", type: "text" })
  destination!: string;

  @Column({ name: "TRAVEL_TIME", type: "integer" })
  travelTime!: number;
}
