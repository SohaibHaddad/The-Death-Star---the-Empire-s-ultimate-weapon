export type PlanetConnection = {
  destination: PlanetNode;
  travelTime: number;
};

export class PlanetNode {
  readonly name: string;
  private readonly connectionsByDestination = new Map<string, PlanetConnection>();

  constructor(name: string) {
    this.name = name;
  }

  addConnection(destination: PlanetNode, travelTime: number): void {
    this.connectionsByDestination.set(destination.name, {
      destination,
      travelTime,
    });
  }

  getConnections(): PlanetConnection[] {
    return Array.from(this.connectionsByDestination.values());
  }
}
