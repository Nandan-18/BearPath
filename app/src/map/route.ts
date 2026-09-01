import type { Coord, Segment } from "@/graph/models";
import type * as GeoJSON from "geojson";
import { Map } from "maplibre-gl";

import { FLAG, FLAG_SIZE, ensureFlag } from "./flag";
import { stage } from "./style";
import { ICE, INK, ROUTE_STROKE, SEGMENT_COLOR } from "./theme";
import { span, trim } from "./trace";
import {
  alive,
  bounds,
  bump,
  data,
  layer,
  line,
  lngLat,
  play,
  point,
  source,
  tryPaint,
  whenLoaded,
} from "./util";

const ROUTE = "bearpath-route";
const MARKERS = "bearpath-markers";
const START = "route-start";
const FINISH = "route-finish";
const FLY = 1100;
const DRAW_MIN = 1200;
const DRAW_MAX = 2600;
const DRAW_BASE = 800;
const DRAW_PER_KM = 2800;

type Stroke = {
  id: string;
  color: string;
  width: number;
  opacity: number;
  filter?: ["==", ["get", "kind"], Segment["kind"]];
  dash?: [number, number];
  blur?: number;
};

function spec(
  kind: Segment["kind"],
  width: number,
  opacity: number,
  extra?: { dash?: [number, number]; blur?: number; glow?: boolean },
): Stroke {
  return {
    id: extra?.glow ? `route-glow-${kind}` : `route-${kind}`,
    color: SEGMENT_COLOR[kind],
    width,
    opacity,
    filter: ["==", ["get", "kind"], kind],
    ...(extra?.dash ? { dash: extra.dash } : {}),
    ...(extra?.blur !== undefined ? { blur: extra.blur } : {}),
  };
}

const LINES: Stroke[] = (Object.keys(ROUTE_STROKE) as Segment["kind"][]).flatMap(
  (kind) => {
    const style = ROUTE_STROKE[kind];
    return [
      spec(kind, style.glow.width, style.glow.opacity, { blur: 8, glow: true }),
      spec(
        kind,
        style.line.width,
        0.97,
        style.line.dash ? { dash: style.line.dash } : undefined,
      ),
    ];
  },
);

function stroke(map: Map, item: Stroke): void {
  layer(
    map,
    {
      id: item.id,
      type: "line",
      source: ROUTE,
      ...(item.filter ? { filter: item.filter } : {}),
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": item.color,
        "line-width": item.width,
        "line-opacity": item.opacity,
        ...(item.dash ? { "line-dasharray": item.dash } : {}),
        ...(item.blur !== undefined ? { "line-blur": item.blur } : {}),
      },
    },
    "hits",
  );
}

function markerLayers(map: Map): void {
  source(map, MARKERS);
  ensureFlag(map);
  layer(map, {
    id: START,
    type: "circle",
    source: MARKERS,
    filter: ["==", ["get", "role"], "start"],
    paint: {
      "circle-radius": 8,
      "circle-color": ["get", "color"],
      "circle-stroke-width": 2,
      "circle-stroke-color": INK,
    },
  });
  layer(map, {
    id: FINISH,
    type: "symbol",
    source: MARKERS,
    filter: ["==", ["get", "role"], "finish"],
    layout: {
      "icon-image": FLAG,
      "icon-size": FLAG_SIZE as never,
      "icon-anchor": "bottom-left",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });
}

function layers(map: Map): void {
  source(map, ROUTE);
  for (const item of LINES) {
    stroke(map, item);
  }
  markerLayers(map);
}

function lines(segments: Segment[]) {
  return segments.map((segment) =>
    line(segment.coordinates.map(lngLat), { kind: segment.kind }),
  );
}

function pins(first?: Coord, last?: Coord, done = false): GeoJSON.Feature[] {
  const markers: GeoJSON.Feature[] = [];
  if (first) {
    markers.push(point(lngLat(first), { role: "start", color: ICE }));
  }
  if (done && last) {
    markers.push(point(lngLat(last), { role: "finish" }));
  }
  return markers;
}

function usable(segments: Segment[]) {
  const path = segments.filter((segment) => segment.coordinates.length >= 2);
  const first = path[0]?.coordinates[0];
  const last = path.at(-1)?.coordinates.at(-1);
  const total = path.reduce((sum, segment) => sum + span(segment.coordinates), 0);
  return { path, first, last, total };
}

function drawMs(km: number): number {
  if (
    km <= 0 ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return 0;
  }
  return Math.min(DRAW_MAX, Math.max(DRAW_MIN, DRAW_BASE + km * DRAW_PER_KM));
}

function fit(
  map: Map,
  token: number,
  segments: Segment[],
  via: string[],
  ms: number,
): void {
  const box = bounds(segments.flatMap((segment) => segment.coordinates));
  const settle = () => {
    if (alive(map, token)) {
      stage(map, via.length > 0);
    }
  };
  if (box.isEmpty()) {
    settle();
    return;
  }
  const mobile = window.innerWidth < 820;
  tryPaint(() => {
    map.fitBounds(box, {
      padding: mobile
        ? { top: 128, bottom: 196, left: 28, right: 28 }
        : { top: 124, bottom: 156, left: 48, right: 88 },
      pitch: 58,
      bearing: map.getBearing(),
      maxZoom: 17.6,
      duration: ms === 0 ? 0 : FLY,
    });
  });
  map.once("idle", settle);
}

export function clear(map: Map): void {
  bump(map);
  data(map, ROUTE);
  data(map, MARKERS);
  stage(map, false);
}

export function draw(map: Map, segments: Segment[], via: string[] = []): void {
  const token = bump(map);
  whenLoaded(map, () => {
    if (!alive(map, token)) {
      return;
    }
    layers(map);

    const { path, first, last, total } = usable(segments);
    const plot = (reach: number, done: boolean) => {
      if (!alive(map, token)) {
        return;
      }
      data(map, ROUTE, lines(done ? path : trim(path, reach)));
      data(map, MARKERS, pins(first, last, done));
    };

    const ms = drawMs(total);
    play(map, token, ms, (t, done) => plot(total * t, done));
    fit(map, token, path, via, ms);
  });
}
