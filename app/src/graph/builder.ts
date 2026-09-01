import { haversine } from "./geo";
import type { Door, Edge, EdgeKind, Graph, Node, NodeKind, Pedway } from "./models";

function group(members: Map<string, number[]>, building: string, id: number): void {
  if (!members.has(building)) {
    members.set(building, []);
  }
  members.get(building)!.push(id);
}

function add(
  nodes: Node[],
  members: Map<string, number[]>,
  building: string,
  lat: number,
  lon: number,
  kind: NodeKind,
): number {
  const id = nodes.length;
  nodes.push({ id, building, lat, lon, kind });
  group(members, building, id);
  return id;
}

function edge(a: Node, b: Node, kind: EdgeKind): Edge {
  return {
    a: a.id,
    b: b.id,
    distance_km: haversine(a.lat, a.lon, b.lat, b.lon),
    kind,
    coords: [
      [a.lat, a.lon],
      [b.lat, b.lon],
    ],
  };
}

export function build(
  doors: Door[],
  pedways: Pedway[],
  names: Record<string, string>,
  aliases: Record<string, string[]> = {},
): Graph {
  const nodes: Node[] = [];
  const stops = new Map<string, number[]>();
  const members = new Map<string, number[]>();
  const spans: [number, number][] = [];

  for (const door of doors) {
    const id = add(nodes, members, door.building, door.lat, door.lon, "door");
    group(stops, door.building, id);
  }

  for (const pedway of pedways) {
    const startId = add(
      nodes,
      members,
      pedway.start_building,
      pedway.start_lat,
      pedway.start_lon,
      "pedway",
    );
    const endId = add(
      nodes,
      members,
      pedway.end_building,
      pedway.end_lat,
      pedway.end_lon,
      "pedway",
    );
    spans.push([startId, endId]);
  }

  const edges: Edge[] = [];

  for (const ids of members.values()) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        edges.push(edge(nodes[ids[i]!]!, nodes[ids[j]!]!, "internal"));
      }
    }
  }

  const doorIds = nodes.filter((node) => node.kind === "door").map((node) => node.id);
  for (let i = 0; i < doorIds.length; i++) {
    for (let j = i + 1; j < doorIds.length; j++) {
      const a = nodes[doorIds[i]!]!;
      const b = nodes[doorIds[j]!]!;
      if (a.building !== b.building) {
        edges.push(edge(a, b, "outdoor"));
      }
    }
  }

  for (const [a, b] of spans) {
    edges.push(edge(nodes[a]!, nodes[b]!, "pedway"));
  }

  return {
    nodes,
    edges,
    doors: Object.fromEntries(stops),
    codes: new Set(stops.keys()),
    names,
    aliases,
  };
}
