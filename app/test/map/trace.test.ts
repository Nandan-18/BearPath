import { describe, expect, it } from "vitest";

import { span, take, trim } from "@/map/trace";

import { seg } from "../fixtures";

describe("span", () => {
  it("is zero for one point", () => {
    expect(span([[53.53, -113.53]])).toBe(0);
  });

  it("adds successive edges", () => {
    expect(span([[0, 0], [0, 1]])).toBeGreaterThan(100);
  });
});

describe("take", () => {
  it("returns the start when the budget is empty", () => {
    expect(take([[53.53, -113.53], [53.52, -113.52]], 0)).toEqual([
      [53.53, -113.53],
    ]);
  });

  it("returns the whole line when the budget covers it", () => {
    const coords: [number, number][] = [
      [53.53, -113.53],
      [53.52, -113.52],
    ];
    expect(take(coords, span(coords) + 1)).toEqual(coords);
  });

  it("interpolates a point along the first edge", () => {
    const coords: [number, number][] = [
      [0, 0],
      [0, 1],
    ];
    const half = take(coords, span(coords) / 2);
    expect(half).toHaveLength(2);
    expect(half[1]?.[0]).toBeCloseTo(0);
    expect(half[1]?.[1]).toBeCloseTo(0.5, 1);
  });
});

describe("trim", () => {
  it("keeps whole segments that fit, then a stub of the next", () => {
    const segments = [
      seg("pedway", [
        [0, 0],
        [0, 1],
      ]),
      seg("outdoor", [
        [0, 1],
        [1, 1],
      ]),
    ];
    const first = span(segments[0]!.coordinates);
    const cut = trim(segments, first + span(segments[1]!.coordinates) / 2);
    expect(cut).toHaveLength(2);
    expect(cut[0]?.kind).toBe("pedway");
    expect(cut[0]?.coordinates).toEqual(segments[0]?.coordinates);
    expect(cut[1]?.kind).toBe("outdoor");
    expect(cut[1]?.coordinates).toHaveLength(2);
    expect(cut[1]?.coordinates[1]?.[0]).toBeCloseTo(0.5, 1);
  });

  it("is empty when nothing has been drawn", () => {
    expect(
      trim(
        [
          seg("outdoor", [
            [53.53, -113.53],
            [53.52, -113.52],
          ]),
        ],
        0,
      ),
    ).toEqual([]);
  });
});
