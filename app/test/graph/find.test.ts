import { describe, expect, it } from "vitest";

import { find } from "@/graph/find";
import { load } from "@/graph/loader";
import {
  NoPathError,
  SameBuildingError,
  UnknownBuildingError,
} from "@/graph/models";

import {
  disconnected,
  doors,
  edge,
  makeGraph,
  node,
  weighted,
} from "../fixtures";
import { CCIS, expectCcisSub } from "../goldens";

describe("find", () => {
  it("prefers the pedway when indoor weight is low", () => {
    const route = find(weighted(), "A", "B", 0.3);
    const kinds = route.segments.map((segment) => segment.kind);
    expect(kinds).toContain("pedway");
    expect(kinds).not.toContain("outdoor");
    expect(route.via).toEqual(["A", "B"]);
    expect(route.indoor_km).toBe(1.1);
    expect(route.outdoor_km).toBe(0);
  });

  it("prefers outdoor when indoor weight is high", () => {
    const route = find(weighted(), "A", "B", 2.5);
    expect(route.segments.map((segment) => segment.kind)).toEqual(["outdoor"]);
    expect(route.via).toEqual(["A", "B"]);
  });

  it("includes buildings entered by pedway", () => {
    const campus = makeGraph(
      [
        node(0, "A", "door", 53.53, -113.53),
        node(1, "A", "pedway", 53.529, -113.53),
        node(2, "C", "pedway", 53.525, -113.525),
        node(3, "B", "pedway", 53.521, -113.52),
        node(4, "B", "door", 53.52, -113.52),
      ],
      [
        edge(0, 1, 0.1, "internal"),
        edge(1, 2, 0.2, "pedway"),
        edge(2, 3, 0.2, "pedway"),
        edge(3, 4, 0.1, "internal"),
      ],
      { A: [0], B: [4] },
    );
    expect(find(campus, "A", "B", 0.35).via).toEqual(["A", "C", "B"]);
  });

  it("merges consecutive outdoor segments that share a vertex", () => {
    const campus = makeGraph(
      [
        node(0, "A", "door", 53.53, -113.53),
        node(1, "C", "door", 53.525, -113.525),
        node(2, "B", "door", 53.52, -113.52),
      ],
      [
        edge(0, 1, 0.4, "outdoor", [
          [0, 0],
          [1, 1],
        ]),
        edge(1, 2, 0.4, "outdoor", [
          [1, 1],
          [2, 2],
        ]),
      ],
      { A: [0], C: [1], B: [2] },
    );
    const route = find(campus, "A", "B", 1);
    expect(route.segments.map((segment) => segment.kind)).toEqual(["outdoor"]);
    expect(route.segments[0]!.coordinates).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ]);
    expect(route.geometry).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ]);
  });

  it("skips buildings you only pass outside", () => {
    const campus = makeGraph(
      [
        node(0, "A", "door", 53.53, -113.53),
        node(1, "C", "door", 53.525, -113.525),
        node(2, "B", "door", 53.52, -113.52),
      ],
      [edge(0, 1, 0.4, "outdoor"), edge(1, 2, 0.4, "outdoor")],
      { A: [0], C: [1], B: [2] },
    );
    expect(find(campus, "A", "B", 1).via).toEqual(["A", "B"]);
  });

  it("uses the closer door, not the first", () => {
    const route = find(doors(), "A", "B", 1);
    expect(route.distance_km).toBe(1);
    expect(route.segments[0]!.kind).toBe("outdoor");
  });

  it("uses five km/h for walk minutes", () => {
    expect(find(doors(), "A", "B", 1).walk_minutes).toBe(12);
  });

  it("floors walk minutes at one", () => {
    const campus = makeGraph(
      [
        node(0, "A", "door", 53.53, -113.53),
        node(1, "B", "door", 53.53001, -113.53),
      ],
      [edge(0, 1, 0.01, "outdoor")],
      { A: [0], B: [1] },
    );
    const route = find(campus, "A", "B", 1);
    expect(route.distance_km).toBe(0.01);
    expect(route.walk_minutes).toBe(1);
  });

  it("reverses coordinates on the reverse route", () => {
    const forward = find(weighted(), "A", "B", 2.5);
    const backward = find(weighted(), "B", "A", 2.5);
    expect(backward.segments[0]!.coordinates).toEqual(
      [...forward.segments[0]!.coordinates].reverse(),
    );
  });

  it("rejects the same building", () => {
    expect(() => find(weighted(), "A", "A", 0.35)).toThrow(SameBuildingError);
  });

  it("rejects an unknown end", () => {
    expect(() => find(weighted(), "A", "Z", 0.35)).toThrow(
      UnknownBuildingError,
    );
    try {
      find(weighted(), "A", "Z", 0.35);
    } catch (error) {
      expect((error as Error).message).toBe("Z");
    }
  });

  it("rejects an unknown start", () => {
    try {
      find(weighted(), "Z", "A", 0.35);
    } catch (error) {
      expect(error).toBeInstanceOf(UnknownBuildingError);
      expect((error as Error).message).toBe("Z");
    }
  });

  it("rejects a disconnected graph", () => {
    expect(() => find(disconnected(), "A", "B", 0.35)).toThrow(NoPathError);
  });

  it("does not mutate edges", () => {
    const campus = weighted();
    const original = campus.edges.map((item) => [
      item.a,
      item.b,
      item.distance_km,
      item.kind,
    ]);
    find(campus, "A", "B", 0.3);
    find(campus, "B", "A", 2.5);
    expect(
      campus.edges.map((item) => [item.a, item.b, item.distance_km, item.kind]),
    ).toEqual(original);
  });

  it("keeps Tory and the lecture theatres distinct and connected", () => {
    const route = find(load(), "T", "TL", 0.35);
    expect(route.distance_km).toBeGreaterThan(0);
    expect(route.distance_km).toBeLessThan(0.4);
    expect(route.distance_km).toBe(0.054676777908046426);
  });

  it("matches the CCIS to SUB golden walk", () => {
    const campus = load();
    expect(campus.names.CCIS.startsWith("Centennial")).toBe(true);
    expectCcisSub(find(campus, CCIS.start, CCIS.end, CCIS.weight), true);
  });

  it("routes south campus health buildings through pedways", () => {
    const route = find(load(), "ED-S", "ECHA", 0.35);
    expect(route.distance_km).toBe(0.2704298865337776);
    expect(route.segments.some((segment) => segment.kind === "pedway")).toBe(
      true,
    );
  });

  it("omits buildings you only pass outside on a real campus walk", () => {
    const route = find(load(), "CCIS", "ECHA", 0.35);
    expect(route.via[0]).toBe("CCIS");
    expect(route.via.at(-1)).toBe("ECHA");
    expect(route.via).not.toContain("SJ");
    expect(route.via).toEqual([
      "CCIS",
      "C",
      "CAB",
      "SAB",
      "ED-S",
      "KATZ",
      "MS",
      "ECHA",
    ]);
  });

  it("uses the official HUB to University LRT pedway", () => {
    const route = find(load(), "HUB", "ULRT", 0.15);
    expect(route.distance_km).toBe(0.036940148773975535);
    expect(route.distance_km).toBeLessThan(0.25);
    expect(route.segments.some((segment) => segment.kind === "pedway")).toBe(
      true,
    );
  });
});
