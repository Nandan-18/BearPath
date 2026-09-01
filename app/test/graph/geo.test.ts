import { describe, expect, it } from "vitest";

import { haversine } from "@/graph/geo";

describe("haversine", () => {
  it("is zero for the same point", () => {
    expect(haversine(53.5266, -113.5256, 53.5266, -113.5256)).toBe(0);
  });

  it("is symmetric", () => {
    const a = haversine(53.528, -113.5262, 53.5267, -113.5265);
    const b = haversine(53.5267, -113.5265, 53.528, -113.5262);
    expect(a).toBe(b);
  });

  it("is about 111 km for one degree of latitude", () => {
    expect(haversine(0, 0, 1, 0)).toBeCloseTo(111.19, 0);
  });

  it("is about 111 km for one degree of longitude at the equator", () => {
    expect(haversine(0, 0, 0, 1)).toBeCloseTo(111.19, 0);
  });
});
