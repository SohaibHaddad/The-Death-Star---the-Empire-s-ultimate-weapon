import type { RouteEntity } from "../database-entities/RouteEntity.js";
import { PlanetNode } from "./PlanetNode.js";

export class UniverseGraph {
  private readonly nodesByName = new Map<string, PlanetNode>();

  static fromRoutes(routes: RouteEntity[]): UniverseGraph {
    const graph = new UniverseGraph();

    for (const route of routes) {
      graph.addRoute(route.origin, route.destination, route.travelTime);
      graph.addRoute(route.destination, route.origin, route.travelTime);
    }

    return graph;
  }

  addRoute(originName: string, destinationName: string, travelTime: number): void {
    const origin = this.getOrCreateNode(originName);
    const destination = this.getOrCreateNode(destinationName);

    origin.addConnection(destination, travelTime);
  }

  getNode(name: string): PlanetNode | null {
    return this.nodesByName.get(name) ?? null;
  }

  getNodes(): PlanetNode[] {
    return Array.from(this.nodesByName.values());
  }

  private getOrCreateNode(name: string): PlanetNode {
    const existingNode = this.nodesByName.get(name);

    if (existingNode) {
      return existingNode;
    }

    const node = new PlanetNode(name);
    this.nodesByName.set(name, node);
    return node;
  }
}
