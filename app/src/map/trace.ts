import { haversine } from "@/graph/geo";
import type { Coord, Segment } from "@/graph/models";

function dist(a: Coord, b: Coord): number {
  return haversine(a[0], a[1], b[0], b[1]);
}

function along(a: Coord, b: Coord, t: number): Coord {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function span(coords: Coord[]): number {
  let distance = 0;
  for (let i = 1; i < coords.length; i++) {
    const from = coords[i - 1];
    const to = coords[i];
    if (from && to) {
      distance += dist(from, to);
    }
  }
  return distance;
}

export function take(coords: Coord[], budget: number): Coord[] {
  const first = coords[0];
  if (!first) {
    return [];
  }
  if (budget <= 0) {
    return [first];
  }
  const out: Coord[] = [first];
  let used = 0;
  for (let i = 1; i < coords.length; i++) {
    const from = coords[i - 1];
    const to = coords[i];
    if (!from || !to) {
      continue;
    }
    const edge = dist(from, to);
    if (used + edge >= budget) {
      out.push(along(from, to, edge === 0 ? 1 : (budget - used) / edge));
      return out;
    }
    out.push(to);
    used += edge;
  }
  return out;
}

export function trim(segments: Segment[], reach: number): Segment[] {
  if (reach <= 0) {
    return [];
  }
  const out: Segment[] = [];
  let used = 0;
  for (const segment of segments) {
    const coords = segment.coordinates;
    if (coords.length < 2) {
      continue;
    }
    const length = span(coords);
    if (used + length <= reach) {
      out.push(segment);
      used += length;
      continue;
    }
    const stub = take(coords, reach - used);
    if (stub.length >= 2) {
      out.push({ kind: segment.kind, coordinates: stub });
    }
    break;
  }
  return out;
}
