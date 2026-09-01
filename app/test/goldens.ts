import { expect } from "vitest";

import type { Result } from "@/graph/models";
import { WEIGHT } from "@/graph/models";

export const CCIS = { start: "CCIS", end: "SUB", weight: WEIGHT } as const;

const CCIS_SUB = {
  distance_km: 0.40096564861306017,
  walk_minutes: 5,
  indoor_km: 0.2708925429469833,
  outdoor_km: 0.1300731056660769,
  via: ["CCIS", "C", "CAB", "SAB", "SUB"],
  geometryStart: [53.5279629213715, -113.525144693758] as [number, number],
  geometryEnd: [53.5254617484598, -113.526841563672] as [number, number],
  segmentKinds: [
    "internal",
    "pedway",
    "internal",
    "pedway",
    "internal",
    "pedway",
    "internal",
    "outdoor",
  ] as const,
};

const FEATURE_CODES = [
  "BS",
  "BUS",
  "ECHA",
  "GSB",
  "HMRC",
  "HSLRT",
  "KATZ",
  "KEC",
  "LIS",
  "MS",
  "NINT",
  "PAW",
  "T",
  "TL",
  "UC",
  "ULRT",
  "WMC",
] as const;

export function expectCcisSub(route: Result, deep = false): void {
  expect(route.distance_km).toBe(CCIS_SUB.distance_km);
  expect(route.walk_minutes).toBe(CCIS_SUB.walk_minutes);
  expect(route.indoor_km).toBe(CCIS_SUB.indoor_km);
  expect(route.outdoor_km).toBe(CCIS_SUB.outdoor_km);
  expect(route.via).toEqual(CCIS_SUB.via);
  expect(route.geometry[0]).toEqual(CCIS_SUB.geometryStart);
  if (deep) {
    expect(route.segments.map((segment) => segment.kind)).toEqual(
      CCIS_SUB.segmentKinds,
    );
    expect(route.geometry).toHaveLength(9);
    expect(route.geometry.at(-1)).toEqual(CCIS_SUB.geometryEnd);
  }
}

export function expectCampusFeatures(campus: {
  codes: ReadonlySet<string>;
  names: Record<string, string>;
  aliases: Record<string, string[]>;
}): void {
  for (const code of FEATURE_CODES) {
    expect(campus.codes.has(code)).toBe(true);
  }
  expect(campus.names.T).toBe("Henry Marshall Tory Building");
  expect(campus.names.TL).toBe("Tory Lecture Theatres");
  expect(campus.names.ECHA.startsWith("Kipnes")).toBe(true);
  expect(campus.aliases.ECHA).toContain("KIPNES");
  expect(campus.aliases.LIS).toContain("LISTER");
  expect(campus.codes.has("NREF")).toBe(false);
}
