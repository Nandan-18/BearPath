export type NodeKind = "door" | "pedway";
export type EdgeKind = "internal" | "outdoor" | "pedway";
export type Coord = [number, number];

export const WEIGHT = 0.35;
export const WEIGHT_MIN = 0.15;
export const WEIGHT_MAX = 2.5;

export interface Door {
  building: string;
  lat: number;
  lon: number;
}

export interface Pedway {
  start_building: string;
  start_lat: number;
  start_lon: number;
  end_building: string;
  end_lat: number;
  end_lon: number;
}

export interface Node {
  id: number;
  building: string;
  lat: number;
  lon: number;
  kind: NodeKind;
}

export interface Edge {
  a: number;
  b: number;
  distance_km: number;
  kind: EdgeKind;
  coords: [Coord, Coord];
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  doors: Record<string, number[]>;
  codes: ReadonlySet<string>;
  names: Record<string, string>;
  aliases: Record<string, string[]>;
}

export interface Segment {
  kind: EdgeKind;
  coordinates: Coord[];
}

export interface Result {
  distance_km: number;
  walk_minutes: number;
  geometry: Coord[];
  segments: Segment[];
  indoor_km: number;
  outdoor_km: number;
  via: string[];
  viaLegs: EdgeKind[];
}

export interface Building {
  code: string;
  name: string;
  lat: number;
  lon: number;
  aliases: string[];
}

export class SameBuildingError extends Error {
  constructor(code: string) {
    super(code);
    this.name = "SameBuildingError";
  }
}

export class UnknownBuildingError extends Error {
  constructor(code: string) {
    super(code);
    this.name = "UnknownBuildingError";
  }
}

export class NoPathError extends Error {
  constructor(path: string) {
    super(path);
    this.name = "NoPathError";
  }
}

export class RouteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RouteError";
  }
}

export function centroid(graph: Graph, code: string): Coord {
  const points = graph.doors[code]!.map((id) => graph.nodes[id]!);
  const count = points.length;
  return [
    points.reduce((sum, point) => sum + point.lat, 0) / count,
    points.reduce((sum, point) => sum + point.lon, 0) / count,
  ];
}
