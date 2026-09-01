import { describe, expect, it } from "vitest";

import { build } from "@/graph/builder";
import { load } from "@/graph/loader";

import { expectCampusFeatures } from "../goldens";
import { tiny } from "../fixtures";

describe("build", () => {
  it("counts doors and pedway stubs", () => {
    const graph = build(...tiny());
    expect(graph.nodes).toHaveLength(5);
    expect(new Set(graph.nodes.map((node) => node.kind))).toEqual(
      new Set(["door", "pedway"]),
    );
    expect(graph.codes).toEqual(new Set(["A", "B"]));
    expect(graph.doors.A).toHaveLength(2);
    expect(graph.doors.B).toHaveLength(1);
  });

  it("fully connects rooms inside a building", () => {
    const graph = build(...tiny());
    const internal = graph.edges.filter((item) => item.kind === "internal");
    expect(internal).toHaveLength(4);
    for (const item of internal) {
      expect(graph.nodes[item.a]!.building).toBe(graph.nodes[item.b]!.building);
    }
  });

  it("only links doors in different buildings outdoors", () => {
    const graph = build(...tiny());
    const outdoor = graph.edges.filter((item) => item.kind === "outdoor");
    expect(outdoor).toHaveLength(2);
    for (const item of outdoor) {
      expect(graph.nodes[item.a]!.kind).toBe("door");
      expect(graph.nodes[item.b]!.kind).toBe("door");
      expect(graph.nodes[item.a]!.building).not.toBe(graph.nodes[item.b]!.building);
    }
  });

  it("makes one pedway edge per span", () => {
    const graph = build(...tiny());
    const pedways = graph.edges.filter((item) => item.kind === "pedway");
    expect(pedways).toHaveLength(1);
    expect(graph.nodes[pedways[0]!.a]!.kind).toBe("pedway");
    expect(graph.nodes[pedways[0]!.b]!.kind).toBe("pedway");
  });

  it("stores aliases", () => {
    const [doors, pedways, names] = tiny();
    expect(build(doors, pedways, names, { A: ["ALPHA"] }).aliases).toEqual({
      A: ["ALPHA"],
    });
  });

  it("defaults aliases to empty", () => {
    expect(build(...tiny()).aliases).toEqual({});
  });

  it("still connects doors when there are no pedways", () => {
    const graph = build(
      [
        { building: "A", lat: 53.53, lon: -113.53 },
        { building: "B", lat: 53.52, lon: -113.52 },
      ],
      [],
      { A: "Alpha", B: "Beta" },
    );
    expect(new Set(graph.nodes.map((node) => node.kind))).toEqual(new Set(["door"]));
    expect(graph.edges.map((item) => item.kind)).toEqual(["outdoor"]);
  });

  it("puts node positions on edge coordinates", () => {
    const graph = build(...tiny());
    for (const item of graph.edges) {
      const start = graph.nodes[item.a]!;
      const end = graph.nodes[item.b]!;
      expect(item.coords).toEqual([
        [start.lat, start.lon],
        [end.lat, end.lon],
      ]);
    }
  });

  it("does not treat a pedway-only building as routable", () => {
    const graph = build(
      [{ building: "A", lat: 53.53, lon: -113.53 }],
      [
        {
          start_building: "A",
          start_lat: 53.53,
          start_lon: -113.53,
          end_building: "ECHA",
          end_lat: 53.52,
          end_lon: -113.52,
        },
      ],
      { A: "Alpha" },
    );
    expect(graph.codes.has("A")).toBe(true);
    expect(graph.codes.has("ECHA")).toBe(false);
    expect(
      graph.nodes.some((node) => node.building === "ECHA" && node.kind === "pedway"),
    ).toBe(true);
  });

  it("includes the official campus catalog", () => {
    expectCampusFeatures(load());
  });
});
