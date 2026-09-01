import { describe, expect, it } from "vitest";

import {
  canon,
  invert,
  load,
  loadDoors,
  loadJson,
  loadPedways,
  parse,
} from "@/graph/loader";

describe("loader", () => {
  it("applies aliases", () => {
    expect(canon("NREF", { NREF: "NRE" })).toBe("NRE");
  });

  it("leaves unknown codes", () => {
    expect(canon("CCIS", { NREF: "NRE" })).toBe("CCIS");
  });

  it("groups inverted aliases", () => {
    expect(invert({ NREF: "NRE", NANO: "NINT", KIPNES: "ECHA" })).toEqual({
      NRE: ["NREF"],
      NINT: ["NANO"],
      ECHA: ["KIPNES"],
    });
  });

  it("keeps multiple aliases for one code", () => {
    expect(invert({ NREF: "NRE", NANO: "NRE" })).toEqual({
      NRE: ["NREF", "NANO"],
    });
  });

  it("reads json objects", () => {
    expect(loadJson('{"NREF": "NRE", "T": "TL"}')).toEqual({ NREF: "NRE", T: "TL" });
    expect(loadJson('{"CCIS": "Centennial Centre"}').CCIS).toBe("Centennial Centre");
  });

  it("strips building whitespace", () => {
    const csv =
      "Building,Door Name,Latitude,Longitude\n CCIS ,Left 1,53.5279,-113.5262\n";
    expect(loadDoors(csv, {})[0]!.building).toBe("CCIS");
  });

  it("builds a graph from string sources", () => {
    const graph = parse(
      '{"NREF": "NRE"}',
      '{"A": "Alpha", "NRE": "NRE"}',
      "Building,Door Name,Latitude,Longitude\nA,Main,53.53,-113.53\nNREF,East,53.52,-113.52\n",
      "Start,SLatitude,SLongitude,End,ELatitude,ELongitude\n",
    );
    expect(graph.codes).toEqual(new Set(["A", "NRE"]));
    expect(graph.names.A).toBe("Alpha");
    expect(graph.aliases.NRE).toEqual(["NREF"]);
  });

  it("reads doors and aliases from csv", () => {
    const csv =
      "Building,Door Name,Latitude,Longitude\n" +
      "CCIS,Left 1,53.5279,-113.5262\n" +
      "NREF,East,53.5268,-113.5290\n";
    const doors = loadDoors(csv, { NREF: "NRE" });
    expect(doors).toHaveLength(2);
    expect(doors[0]!.building).toBe("CCIS");
    expect(doors[0]!.lat).toBe(53.5279);
    expect(doors[1]!.building).toBe("NRE");
  });

  it("reads pedways and aliases from csv", () => {
    const csv =
      "Start,SLatitude,SLongitude,End,ELatitude,ELongitude\n" +
      "CAB,53.5267,-113.5244,CL,53.5267,-113.5242\n" +
      "GSB,53.5261,-113.5291,NREF,53.5263,-113.5291\n";
    const peds = loadPedways(csv, { NREF: "NRE" });
    expect(peds).toHaveLength(2);
    expect(peds[0]!.start_building).toBe("CAB");
    expect(peds[1]!.end_building).toBe("NRE");
    expect(peds[1]!.start_building).toBe("GSB");
  });

  it("loads the campus data files", () => {
    const campus = load();
    expect(campus.codes.size).toBe(67);
    expect(campus.nodes).toHaveLength(182);
    expect(campus.edges).toHaveLength(5590);
  });
});
