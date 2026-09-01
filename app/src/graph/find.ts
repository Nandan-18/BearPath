import {
  NoPathError,
  SameBuildingError,
  UnknownBuildingError,
  type Coord,
  type Edge,
  type Graph,
  type Result,
  type Segment,
} from "./models";

const WALK = 5;
const INDOOR = new Set(["internal", "pedway"]);
const INF = 1e18;

type Link = [number, number, Edge | null];
type Step = [number, Edge | null];
type Hop = [number, Edge];

export function find(
  graph: Graph,
  start: string,
  end: string,
  indoorWeight: number,
): Result {
  if (start === end) {
    throw new SameBuildingError(start);
  }
  if (!graph.codes.has(start) || !graph.codes.has(end)) {
    throw new UnknownBuildingError(graph.codes.has(start) ? end : start);
  }

  const n = graph.nodes.length;
  const source = n;
  const sink = n + 1;
  const adj: Link[][] = Array.from({ length: n + 2 }, () => []);

  for (const item of graph.edges) {
    const weight = cost(item, indoorWeight);
    adj[item.a]!.push([weight, item.b, item]);
    adj[item.b]!.push([weight, item.a, item]);
  }

  for (const door of graph.doors[start] ?? []) {
    adj[source]!.push([0, door, null]);
  }
  for (const door of graph.doors[end] ?? []) {
    adj[door]!.push([0, sink, null]);
  }

  const [dist, prev] = dijkstra(adj, source);
  if (dist[sink]! >= INF) {
    throw new NoPathError(`${start} -> ${end}`);
  }

  const edges = walk(prev, sink);
  const raw = edges.map(([src, item]) => orientEdge(item, src));
  const segments = merge(raw);
  const geometry = stitch(segments);
  let indoor_km = 0;
  let outdoor_km = 0;
  for (const [, item] of edges) {
    if (INDOOR.has(item.kind)) {
      indoor_km += item.distance_km;
    } else {
      outdoor_km += item.distance_km;
    }
  }
  const distance_km = indoor_km + outdoor_km;
  return {
    distance_km,
    walk_minutes: Math.max(1, Math.round((distance_km / WALK) * 60)),
    geometry,
    segments,
    indoor_km,
    outdoor_km,
    via: via(graph, edges),
  };
}

function cost(item: Edge, indoorWeight: number): number {
  return INDOOR.has(item.kind)
    ? item.distance_km * indoorWeight
    : item.distance_km;
}

function dijkstra(
  adj: Link[][],
  source: number,
): [number[], Array<Step | null>] {
  const dist = Array.from({ length: adj.length }, () => INF);
  const prev: Array<Step | null> = Array.from(
    { length: adj.length },
    () => null,
  );
  dist[source] = 0;
  const heap: [number, number][] = [];
  push(heap, 0, source);
  const seen = new Set<number>();

  while (heap.length > 0) {
    const [costNow, node] = pop(heap);
    if (seen.has(node)) {
      continue;
    }
    seen.add(node);
    for (const [weight, nxt, item] of adj[node]!) {
      if (seen.has(nxt)) {
        continue;
      }
      const candidate = costNow + weight;
      if (candidate < dist[nxt]!) {
        dist[nxt] = candidate;
        prev[nxt] = [node, item];
        push(heap, candidate, nxt);
      }
    }
  }
  return [dist, prev];
}

function walk(prev: Array<Step | null>, sink: number): Hop[] {
  const path: Hop[] = [];
  let current = sink;
  while (prev[current] !== null) {
    const [prior, item] = prev[current]!;
    if (item !== null) {
      path.push([prior, item]);
    }
    current = prior;
  }
  path.reverse();
  return path;
}

function orientEdge(item: Edge, src: number): Segment {
  const coordinates: Coord[] = [item.coords[0], item.coords[1]];
  if (src === item.b) {
    coordinates.reverse();
  }
  return { kind: item.kind, coordinates };
}

function via(graph: Graph, edges: Hop[]): string[] {
  if (edges.length === 0) {
    return [];
  }

  const [head] = edges[0]!;
  const start = graph.nodes[head]!.building;
  const [tail, last] = edges[edges.length - 1]!;
  const dest = tail === last.a ? last.b : last.a;
  const end = graph.nodes[dest]!.building;

  const stops = [start];
  for (const [src, item] of edges) {
    if (item.kind !== "pedway") {
      continue;
    }
    const pair = src === item.a ? [item.a, item.b] : [item.b, item.a];
    for (const node of pair) {
      const code = graph.nodes[node]!.building;
      if (stops[stops.length - 1] !== code) {
        stops.push(code);
      }
    }
  }
  if (stops[stops.length - 1] !== end) {
    stops.push(end);
  }
  return stops;
}

function samePoint(a?: Coord, b?: Coord): boolean {
  return Boolean(a && b && a[0] === b[0] && a[1] === b[1]);
}

function appendPoints(chain: Coord[], points: Coord[]): Coord[] {
  if (samePoint(chain[chain.length - 1], points[0])) {
    return [...chain, ...points.slice(1)];
  }
  return [...chain, ...points];
}

function merge(segments: Segment[]): Segment[] {
  const merged: Segment[] = [];
  for (const item of segments) {
    const previous = merged[merged.length - 1];
    if (previous && previous.kind === item.kind) {
      merged[merged.length - 1] = {
        kind: previous.kind,
        coordinates: appendPoints(previous.coordinates, item.coordinates),
      };
    } else {
      merged.push(item);
    }
  }
  return merged;
}

function stitch(segments: Segment[]): Coord[] {
  let geometry: Coord[] = [];
  for (const item of segments) {
    geometry = appendPoints(geometry, item.coordinates);
  }
  return geometry;
}

function less(a: [number, number], b: [number, number]): boolean {
  return a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
}

function push(heap: [number, number][], value: number, node: number): void {
  heap.push([value, node]);
  let i = heap.length - 1;
  while (i > 0) {
    const parent = (i - 1) >> 1;
    if (less(heap[parent]!, heap[i]!)) {
      break;
    }
    [heap[parent], heap[i]] = [heap[i]!, heap[parent]!];
    i = parent;
  }
}

function pop(heap: [number, number][]): [number, number] {
  const top = heap[0]!;
  const last = heap.pop()!;
  if (heap.length === 0) {
    return top;
  }
  heap[0] = last;
  let i = 0;
  for (;;) {
    const left = i * 2 + 1;
    const right = left + 1;
    let best = i;
    if (left < heap.length && less(heap[left]!, heap[best]!)) {
      best = left;
    }
    if (right < heap.length && less(heap[right]!, heap[best]!)) {
      best = right;
    }
    if (best === i) {
      break;
    }
    [heap[i], heap[best]] = [heap[best]!, heap[i]!];
    i = best;
  }
  return top;
}
