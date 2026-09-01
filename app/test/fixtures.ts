import type {
  Building,
  Door,
  Edge,
  EdgeKind,
  Graph,
  Node,
  NodeKind,
  Pedway,
  Segment,
} from "@/graph/models";

export function hall(code: string, lat = 53.53, lon = -113.53): Building {
  return {
    code,
    name: `${code} Hall`,
    lat,
    lon,
    aliases: [],
  };
}

export function seg(
  kind: Segment["kind"],
  coordinates: [number, number][],
): Segment {
  return { kind, coordinates };
}

export function node(
  id: number,
  building: string,
  kind: NodeKind = "door",
  lat = 53.53,
  lon = -113.53,
): Node {
  return { id, building, lat, lon, kind };
}

export function edge(
  a: number,
  b: number,
  distance_km: number,
  kind: EdgeKind,
  coords: [[number, number], [number, number]] = [
    [0, 0],
    [1, 1],
  ],
): Edge {
  return { a, b, distance_km, kind, coords };
}

export function makeGraph(
  nodes: Node[],
  edges: Edge[],
  doors: Record<string, number[]>,
  names: Record<string, string> = {},
  aliases: Record<string, string[]> = {},
): Graph {
  return {
    nodes,
    edges,
    doors,
    codes: new Set(Object.keys(doors)),
    names,
    aliases,
  };
}

export function disconnected(names: Record<string, string> = {}): Graph {
  return makeGraph([node(0, "A"), node(1, "B")], [], { A: [0], B: [1] }, names);
}

export function tiny(): [Door[], Pedway[], Record<string, string>] {
  const doors: Door[] = [
    { building: "A", lat: 53.53, lon: -113.53 },
    { building: "A", lat: 53.529, lon: -113.53 },
    { building: "B", lat: 53.528, lon: -113.52 },
  ];
  const pedways: Pedway[] = [
    {
      start_building: "A",
      start_lat: 53.5295,
      start_lon: -113.53,
      end_building: "B",
      end_lat: 53.5285,
      end_lon: -113.52,
    },
  ];
  return [doors, pedways, { A: "Alpha Hall", B: "Beta Hall" }];
}

export function weighted(): Graph {
  return makeGraph(
    [
      node(0, "A", "door", 53.53, -113.53),
      node(1, "B", "door", 53.52, -113.52),
      node(2, "A", "pedway", 53.529, -113.53),
      node(3, "B", "pedway", 53.521, -113.52),
    ],
    [
      edge(0, 1, 1, "outdoor"),
      edge(0, 2, 0.4, "internal"),
      edge(2, 3, 0.3, "pedway"),
      edge(3, 1, 0.4, "internal"),
    ],
    { A: [0], B: [1] },
  );
}

export function doors(): Graph {
  return makeGraph(
    [
      node(0, "A", "door", 53.54, -113.54),
      node(1, "A", "door", 53.521, -113.521),
      node(2, "B", "door", 53.52, -113.52),
    ],
    [
      edge(0, 2, 10, "outdoor"),
      edge(1, 2, 1, "outdoor"),
      edge(0, 1, 0.2, "internal"),
    ],
    { A: [0, 1], B: [2] },
  );
}
