import type { Building } from "@/graph/models";
import { Map, setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

import { ensureFlag } from "./flag";
import { ensurePin } from "./pin";
import { extrude, light, mute, sky, tint } from "./style";
import { VIEW } from "./theme";
import { buildingPoint } from "./util";

setWorkerUrl(workerUrl);

export function create(
  container: HTMLElement,
  options?: { onReady?: () => void },
): Map {
  const map = new Map({
    container,
    style: "https://tiles.openfreemap.org/styles/dark",
    ...VIEW,
    maxPitch: 75,
    canvasContextAttributes: { antialias: true },
    attributionControl: false,
  });
  map.setMissingStyleImageResolver((id) => {
    if (!map.hasImage(id)) {
      map.addImage(id, new ImageData(new Uint8ClampedArray(4), 1, 1));
    }
  });

  map.on("load", () => {
    tint(map);
    mute(map);
    sky(map);
    light(map);
    extrude(map);
    ensureFlag(map);
    ensurePin(map);
  });
  map.once("idle", () => options?.onReady?.());

  return map;
}

export function recenter(map: Map): void {
  map.easeTo({ ...VIEW, duration: 900 });
}

export function flyTo(map: Map, building: Building): void {
  map.easeTo({
    center: buildingPoint(building),
    zoom: Math.max(map.getZoom(), 16.8),
    pitch: 58,
    duration: 700,
  });
}

export { enablePicks, label } from "./labels";
export { clear, draw } from "./route";
