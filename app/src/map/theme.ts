import type { Segment } from "@/graph/models";

export const ICE = "#7dcc9a";
export const GOLD = "#f26a45";
const LAMP = "#ffe8b0";
export const INK = "#140f0c";
export const PAPER = "#f3e6d4";
export const VIA_GLOW = "#e8a070";
export const VIEW = {
  center: [-113.52556, 53.52657] as [number, number],
  zoom: 16.25,
  pitch: 62,
  bearing: -28,
};
export const EXTRUDE = "3d-buildings";

export const SEGMENT_COLOR: Record<Segment["kind"], string> = {
  outdoor: GOLD,
  pedway: ICE,
  internal: LAMP,
};

export const ROUTE_STROKE: Record<
  Segment["kind"],
  {
    glow: { width: number; opacity: number };
    line: { width: number; dash?: [number, number] };
  }
> = {
  outdoor: {
    glow: { width: 16, opacity: 0.32 },
    line: { width: 5.5, dash: [1.5, 1.15] },
  },
  pedway: {
    glow: { width: 18, opacity: 0.38 },
    line: { width: 6 },
  },
  internal: {
    glow: { width: 16, opacity: 0.3 },
    line: { width: 5.5 },
  },
};

export const ROLE_COLOR = [
  "match",
  ["get", "role"],
  "from",
  ICE,
  "to",
  GOLD,
  "via",
  PAPER,
  PAPER,
];

export function roleSize(
  low: { from: number; to: number; via: number; default: number },
  high: { from: number; to: number; via: number; default: number },
): unknown {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    15,
    [
      "match",
      ["get", "role"],
      "from",
      low.from,
      "to",
      low.to,
      "via",
      low.via,
      low.default,
    ],
    17.5,
    [
      "match",
      ["get", "role"],
      "from",
      high.from,
      "to",
      high.to,
      "via",
      high.via,
      high.default,
    ],
  ];
}
