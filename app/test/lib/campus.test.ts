import { describe, expect, it } from "vitest";

import { RouteError } from "@/graph/models";
import { BUILDINGS, byCode, getRoute } from "@/lib/campus";

import { CCIS, expectCcisSub } from "../goldens";

describe("BUILDINGS", () => {
  it("returns a sorted campus catalog", () => {
    expect(BUILDINGS.length).toBeGreaterThan(60);
    const names = BUILDINGS.map((item) => item.name.toLowerCase());
    const byName = (left: string, right: string) =>
      left.localeCompare(right, undefined, { sensitivity: "base" });
    expect([...names].sort(byName)).toEqual(names);
    const ccis = byCode("CCIS");
    expect(ccis?.name.startsWith("Centennial")).toBe(true);
    expect(ccis?.lat).toBeCloseTo(53.528235299936696, 10);
    expect(ccis?.lon).toBeCloseTo(-113.52543253686675, 10);
    expect(byCode("ECHA")?.aliases).toContain("KIPNES");
    expect(BUILDINGS.some((item) => item.code === "NREF")).toBe(false);
  });
});

describe("getRoute", () => {
  it("returns the CCIS to SUB walk", () => {
    const route = getRoute(CCIS.start, CCIS.end, CCIS.weight);
    expectCcisSub(route);
    expect(route.segments[0]?.kind).toBe("internal");
    expect(route.segments[0]?.coordinates.length).toBeGreaterThan(1);
  });

  it("rejects the same building", () => {
    expect(() => getRoute(CCIS.start, CCIS.start, CCIS.weight)).toThrow(RouteError);
    expect(() => getRoute(CCIS.start, CCIS.start, CCIS.weight)).toThrow(
      "Start and end must be different buildings.",
    );
  });

  it("rejects an unknown building", () => {
    expect(() => getRoute(CCIS.start, "ZZZ", CCIS.weight)).toThrow(
      "Unknown building: ZZZ",
    );
  });

  it("rejects an out-of-range indoor weight", () => {
    expect(() => getRoute(CCIS.start, CCIS.end, 9)).toThrow("indoor_weight is out of range");
    expect(() => getRoute(CCIS.start, CCIS.end, 0.1)).toThrow("indoor_weight is out of range");
  });
});
