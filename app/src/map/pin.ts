import type { Map } from "maplibre-gl";

import { ensureImage } from "./image";
import { ICE, INK } from "./theme";

export const PIN = "bearpath-start";

export const PIN_SIZE = [
  "interpolate",
  ["linear"],
  ["zoom"],
  14,
  0.55,
  16.25,
  0.72,
  18,
  0.86,
] as const;

function svg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32">
  <path d="M12 1.5C7.86 1.5 4.5 4.86 4.5 9c0 6.75 7.5 20.5 7.5 20.5S19.5 15.75 19.5 9c0-4.14-3.36-7.5-7.5-7.5z" fill="${ICE}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
  <circle cx="12" cy="9" r="2.6" fill="${INK}"/>
</svg>`;
}

export function ensurePin(map: Map): void {
  ensureImage(map, PIN, svg());
}
