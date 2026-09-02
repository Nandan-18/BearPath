import type { Map } from "maplibre-gl";

import { ensureImage } from "./image";
import { GOLD, INK, PAPER } from "./theme";

export const FLAG = "bearpath-finish";

export const FLAG_SIZE = [
  "interpolate",
  ["linear"],
  ["zoom"],
  14,
  0.5,
  16.25,
  0.68,
  18,
  0.82,
] as const;

const POLE = 6;
const CELL = 3.5;
const COLS = 4;
const ROWS = 3;
const WIDTH = POLE + COLS * CELL + 1;
const HEIGHT = ROWS * CELL + 10;

function svg(): string {
  const cells: string[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const fill = (row + col) % 2 === 0 ? PAPER : INK;
      cells.push(
        `<rect x="${col * CELL}" y="${row * CELL}" width="${CELL}" height="${CELL}" fill="${fill}"/>`,
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" shape-rendering="crispEdges">
  <rect x="${POLE - 1}" y="1" width="1.5" height="${HEIGHT - 2}" fill="${INK}"/>
  <g transform="translate(${POLE}, 1)" stroke="${INK}" stroke-width="0.35">${cells.join("")}</g>
  <circle cx="${POLE - 0.25}" cy="${HEIGHT - 1}" r="1.4" fill="${GOLD}"/>
</svg>`;
}

export function ensureFlag(map: Map): void {
  ensureImage(map, FLAG, svg());
}
