import type { Coord } from "@/graph/models";
import type * as GeoJSON from "geojson";
import { GeoJSONSource, LngLatBounds, Map } from "maplibre-gl";

const stamp = new WeakMap<Map, number>();
const ticks = new WeakMap<Map, number>();

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function tryPaint(run: () => void): void {
  try {
    run();
  } catch {
    return;
  }
}

export function paint(
  map: Map,
  ...args: Parameters<Map["setPaintProperty"]>
): void {
  tryPaint(() => map.setPaintProperty(...args));
}

export function layout(
  map: Map,
  ...args: Parameters<Map["setLayoutProperty"]>
): void {
  tryPaint(() => map.setLayoutProperty(...args));
}

export function lngLat([lat, lon]: Coord): [number, number] {
  return [lon, lat];
}

export function bounds(coords: Coord[]): LngLatBounds {
  const box = new LngLatBounds();
  for (const coord of coords) {
    box.extend(lngLat(coord));
  }
  return box;
}

export function collection(
  features: GeoJSON.Feature[] = [],
): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features };
}

export function buildingPoint(building: {
  lat: number;
  lon: number;
}): [number, number] {
  return lngLat([building.lat, building.lon]);
}

export function point(
  coordinates: [number, number],
  properties: GeoJSON.GeoJsonProperties,
): GeoJSON.Feature {
  return {
    type: "Feature",
    properties,
    geometry: { type: "Point", coordinates },
  };
}

export function line(
  coordinates: [number, number][],
  properties: GeoJSON.GeoJsonProperties,
): GeoJSON.Feature {
  return {
    type: "Feature",
    properties,
    geometry: { type: "LineString", coordinates },
  };
}

export function geo(map: Map, id: string): GeoJSONSource | undefined {
  return map.getSource(id) as GeoJSONSource | undefined;
}

export function whenLoaded(map: Map, run: () => void): void {
  if (map.isStyleLoaded()) {
    run();
    return;
  }
  map.once("idle", run);
}

export function source(
  map: Map,
  id: string,
  data: GeoJSON.FeatureCollection = collection(),
): void {
  if (map.getSource(id)) {
    return;
  }
  map.addSource(id, { type: "geojson", data });
}

export function data(
  map: Map,
  id: string,
  payload: GeoJSON.Feature[] | GeoJSON.FeatureCollection = [],
): void {
  void geo(map, id)?.setData(
    Array.isArray(payload) ? collection(payload) : payload,
  );
}

export function layer(
  map: Map,
  spec: Parameters<Map["addLayer"]>[0],
  before?: string,
): void {
  if (map.getLayer(spec.id)) {
    if (before && map.getLayer(before)) {
      map.moveLayer(spec.id, before);
    }
    return;
  }
  if (before && map.getLayer(before)) {
    map.addLayer(spec, before);
    return;
  }
  map.addLayer(spec);
}

export function bump(map: Map): number {
  const tick = ticks.get(map);
  if (tick !== undefined) {
    cancelAnimationFrame(tick);
    ticks.delete(map);
  }
  const next = (stamp.get(map) ?? 0) + 1;
  stamp.set(map, next);
  return next;
}

export function alive(map: Map, token: number): boolean {
  return stamp.get(map) === token;
}

export function play(
  map: Map,
  token: number,
  ms: number,
  frame: (t: number, done: boolean) => void,
): void {
  if (ms <= 0) {
    if (alive(map, token)) {
      frame(1, true);
    }
    return;
  }
  const origin = performance.now();
  const tick = (now: number) => {
    if (!alive(map, token)) {
      return;
    }
    const linear = Math.min(1, (now - origin) / ms);
    frame(1 - (1 - linear) ** 3, linear >= 1);
    if (linear < 1) {
      ticks.set(map, requestAnimationFrame(tick));
      return;
    }
    ticks.delete(map);
  };
  frame(0, false);
  ticks.set(map, requestAnimationFrame(tick));
}

export function esc(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) => ENTITIES[character] ?? character,
  );
}
