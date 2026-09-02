import { Map } from "maplibre-gl";

import { EXTRUDE, INK, PAPER } from "./theme";
import { layer, layout, paint, tryPaint } from "./util";

const TILES = "openmaptiles";
const BUILDINGS = "building";

const RAIL = "#2c2620";
const RAIL_DASH = "#3a322c";
const PAINT: Record<string, "background-color" | "fill-color" | "line-color"> =
  {
    background: "background-color",
    fill: "fill-color",
    line: "line-color",
  };
const MUTE = [
  "road_oneway",
  "road_oneway_opposite",
  "place_other",
  "place_suburb",
  "place_village",
  "place_town",
  "place_city",
  "place_city_large",
  "place_state",
  "place_country_other",
  "place_country_minor",
  "place_country_major",
];

export function tint(map: Map): void {
  const fills: Record<string, string> = {
    background: "#1a120e",
    water: "#3d6d78",
    waterway: "#3d6d78",
    landcover_ice_shelf: "#1a120e",
    landcover_glacier: "#1a120e",
    landuse_residential: "#1a1410",
    landcover_wood: "#25341c",
    landuse_park: "#3a5228",
    highway_path: "#5c4c40",
    highway_minor: "#322a24",
    highway_major_casing: INK,
    highway_major_inner: "#3d342c",
    highway_major_subtle: "#2a221c",
    highway_motorway_casing: INK,
    highway_motorway_inner: "#4a3c30",
    highway_motorway_subtle: "#322a24",
    railway: RAIL,
    railway_transit: RAIL,
    railway_minor: RAIL,
    railway_dashline: RAIL_DASH,
    railway_transit_dashline: RAIL_DASH,
    railway_minor_dashline: RAIL_DASH,
  };
  for (const [id, color] of Object.entries(fills)) {
    const found = map.getLayer(id);
    if (!found) {
      continue;
    }
    const key = PAINT[found.type];
    if (key) {
      paint(map, id, key, color);
    }
  }
  for (const found of map.getStyle().layers ?? []) {
    if (found.type !== "symbol") {
      continue;
    }
    paint(map, found.id, "text-color", PAPER);
    paint(map, found.id, "text-halo-color", INK);
  }
}

export function mute(map: Map): void {
  for (const id of MUTE) {
    layout(map, id, "visibility", "none");
  }
}

export function sky(map: Map): void {
  tryPaint(() => {
    map.setSky({
      "sky-color": "#1a1014",
      "horizon-color": "#b85a42",
      "fog-color": "#241610",
      "fog-ground-blend": 0.2,
    });
  });
}

export function light(map: Map): void {
  tryPaint(() => {
    map.setLight({
      anchor: "viewport",
      color: "#ffd4a8",
      intensity: 0.58,
      position: [1.4, 205, 40],
    });
  });
}

function swatch(low: string, mid: string, high: string) {
  return [
    "interpolate",
    ["linear"],
    ["coalesce", ["get", "render_height"], 14],
    0,
    low,
    28,
    mid,
    72,
    high,
  ];
}

function brick() {
  return [
    "match",
    ["%", ["abs", ["to-number", ["coalesce", ["id"], 0]]], 4],
    0,
    swatch("#4a2a22", "#8a4a38", "#c47850"),
    1,
    swatch("#5c3228", "#a05640", "#d4a07a"),
    2,
    swatch("#534038", "#b8956a", "#e0c9a4"),
    swatch("#3d2a22", "#6e3d2e", "#a56b4a"),
  ];
}

function beneath(map: Map): string | undefined {
  return map
    .getStyle()
    .layers?.find(
      (found) =>
        found.id === "hits" ||
        found.id.startsWith("highway_name") ||
        found.id.startsWith("place_"),
    )?.id;
}

export function extrude(map: Map): void {
  const layers = map.getStyle().layers ?? [];
  for (const found of layers) {
    if (found.type === "fill" && found["source-layer"] === BUILDINGS) {
      layout(map, found.id, "visibility", "none");
    }
  }

  layer(
    map,
    {
      id: EXTRUDE,
      source: TILES,
      "source-layer": BUILDINGS,
      type: "fill-extrusion",
      minzoom: 14,
      filter: ["!=", ["get", "hide_3d"], true],
      paint: {
        "fill-extrusion-color": brick() as never,
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          14,
          0,
          15.2,
          ["*", ["coalesce", ["get", "render_height"], 24], 1.2],
        ],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
        "fill-extrusion-opacity": 0.96,
        "fill-extrusion-vertical-gradient": true,
      },
    },
    beneath(map),
  );
}

export function stage(map: Map, routing: boolean): void {
  paint(map, EXTRUDE, "fill-extrusion-opacity", routing ? 0.66 : 0.96);
}
