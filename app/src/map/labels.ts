import { BUILDINGS } from "@/lib/campus";
import { nearest } from "@/lib/format";
import type * as GeoJSON from "geojson";
import { Map, MapLayerMouseEvent, Popup } from "maplibre-gl";

import {
  EXTRUDE,
  GOLD,
  ICE,
  INK,
  ROLE_COLOR,
  VIA_GLOW,
  roleSize,
} from "./theme";
import {
  buildingPoint,
  collection,
  data,
  esc,
  geo,
  layer,
  point,
  source,
  whenLoaded,
} from "./util";

type Role = "from" | "to" | "via" | "";

const REACH = 0.18;
const LABELS = "bearpath-labels";
const HIT = "hits";
const GLOW = "via-glow";
const PICKS = "picks";
const CODES = "codes";
const HITS = [HIT, GLOW, PICKS, CODES];
const bound = new WeakSet<Map>();

function showPopup(
  popup: Popup,
  map: Map,
  at: [number, number],
  code: string,
  name: string,
): void {
  popup
    .setLngLat(at)
    .setHTML(`<strong>${esc(code)}</strong><span>${esc(name)}</span>`);
  if (!popup.isOpen()) {
    popup.addTo(map);
  }
}

function snap(lat: number, lon: number) {
  return nearest(lat, lon, BUILDINGS, REACH);
}

function live(map: Map): string[] {
  return HITS.filter((id) => Boolean(map.getLayer(id)));
}

function over(map: Map, event: MapLayerMouseEvent): boolean {
  return (
    map.queryRenderedFeatures(event.point, { layers: live(map) }).length > 0
  );
}

function roleOf(
  code: string,
  from?: string,
  to?: string,
  via?: string[],
): Role {
  if (code === from) {
    return "from";
  }
  if (code === to) {
    return "to";
  }
  if (via?.includes(code)) {
    return "via";
  }
  return "";
}

function dots(
  from?: string,
  to?: string,
  via?: string[],
): GeoJSON.FeatureCollection {
  return collection(
    BUILDINGS.map((building) => {
      const role = roleOf(building.code, from, to, via);
      return point(buildingPoint(building), {
        code: building.code,
        name: building.name,
        role,
        quiet: Boolean(via && via.length > 0 && !role),
      });
    }),
  );
}

function refresh(map: Map, from?: string, to?: string, via?: string[]): void {
  data(map, LABELS, dots(from, to, via));
}

export function label(
  map: Map,
  from?: string,
  to?: string,
  via?: string[],
): void {
  const render = () => {
    if (geo(map, LABELS)) {
      refresh(map, from, to, via);
      return;
    }

    source(map, LABELS, dots(from, to, via));
    layer(map, {
      id: HIT,
      type: "circle",
      source: LABELS,
      paint: { "circle-radius": 16, "circle-opacity": 0 },
    });
    layer(map, {
      id: GLOW,
      type: "circle",
      source: LABELS,
      filter: ["==", ["get", "role"], "via"],
      paint: {
        "circle-radius": 22,
        "circle-color": VIA_GLOW,
        "circle-opacity": 0.32,
        "circle-blur": 0.85,
      },
    });
    layer(map, {
      id: PICKS,
      type: "circle",
      source: LABELS,
      filter: [
        "any",
        ["==", ["get", "role"], "from"],
        ["==", ["get", "role"], "to"],
      ],
      paint: {
        "circle-radius": 11,
        "circle-color": ["match", ["get", "role"], "from", ICE, GOLD],
        "circle-stroke-width": 2,
        "circle-stroke-color": INK,
        "circle-opacity": 0.92,
      },
    });
    layer(map, {
      id: CODES,
      type: "symbol",
      source: LABELS,
      minzoom: 14.6,
      layout: {
        "text-field": ["get", "code"],
        "text-font": ["Noto Sans Regular"],
        "text-size": roleSize(
          { from: 13, to: 13, via: 11, default: 10 },
          { from: 16, to: 16, via: 14, default: 13 },
        ) as never,
        "text-anchor": "top",
        "text-offset": [0, 0.7],
        "text-padding": 4,
        "text-optional": true,
      },
      paint: {
        "text-color": ROLE_COLOR as never,
        "text-halo-color": INK,
        "text-halo-width": 1.5,
        "text-opacity": [
          "case",
          ["boolean", ["get", "quiet"], false],
          0.22,
          0.92,
        ],
      },
    });
  };

  whenLoaded(map, render);
}

export function enablePicks(map: Map, onPick: (code: string) => void): void {
  if (bound.has(map)) {
    return;
  }
  bound.add(map);

  const popup = new Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 12,
    maxWidth: "16rem",
  });

  let attached = false;
  const bind = () => {
    if (attached || !map.getLayer(HIT)) {
      return;
    }
    attached = true;
    map.off("styledata", bind);
    const canvas = map.getCanvas();
    const hover = (
      event: MapLayerMouseEvent,
      building?: { code: string; name: string; lon: number; lat: number },
    ) => {
      canvas.style.cursor = "pointer";
      if (building) {
        showPopup(
          popup,
          map,
          buildingPoint(building),
          building.code,
          building.name,
        );
        return;
      }
      const feature = event.features?.[0];
      if (!feature || feature.geometry.type !== "Point") {
        return;
      }
      showPopup(
        popup,
        map,
        feature.geometry.coordinates as [number, number],
        String(feature.properties?.code ?? ""),
        String(feature.properties?.name ?? ""),
      );
    };
    const leave = () => {
      canvas.style.cursor = "";
      popup.remove();
    };
    const click = (event: MapLayerMouseEvent) => {
      const code = event.features?.[0]?.properties?.code;
      if (code) {
        onPick(String(code));
      }
    };
    for (const layer of HITS) {
      map.on("mousemove", layer, (event) => hover(event));
      map.on("mouseleave", layer, leave);
      map.on("click", layer, click);
    }

    if (map.getLayer(EXTRUDE)) {
      map.on("mousemove", EXTRUDE, (event) => {
        if (over(map, event)) {
          return;
        }
        const found = snap(event.lngLat.lat, event.lngLat.lng);
        if (!found) {
          leave();
          return;
        }
        hover(event, found);
      });
      map.on("mouseleave", EXTRUDE, leave);
    }

    map.on("click", (event) => {
      if (over(map, event) || !map.getLayer(EXTRUDE)) {
        return;
      }
      if (
        map.queryRenderedFeatures(event.point, { layers: [EXTRUDE] }).length ===
        0
      ) {
        return;
      }
      const found = snap(event.lngLat.lat, event.lngLat.lng);
      if (found) {
        onPick(found.code);
      }
    });
  };

  bind();
  if (!attached) {
    map.on("styledata", bind);
  }
}
