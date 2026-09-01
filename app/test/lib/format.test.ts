import { describe, expect, it } from "vitest";

import {
  bias,
  brief,
  distance,
  hint,
  nearest,
  readUrl,
  split,
  tokens,
  writeUrl,
} from "@/lib/format";

import { hall } from "../fixtures";

describe("bias", () => {
  it("labels indoor-first, balanced, and outdoor-first", () => {
    expect(bias(0.35)).toBe("Indoor-first");
    expect(bias(0.59)).toBe("Indoor-first");
    expect(bias(0.6)).toBe("Balanced");
    expect(bias(1.19)).toBe("Balanced");
    expect(bias(1.2)).toBe("Outdoor-first");
  });
});

describe("split", () => {
  it("describes indoor-only, outdoor-only, and mixed walks", () => {
    expect(split(0.4, 0)).toBe("All indoors");
    expect(split(0, 0.4)).toBe("All outdoors");
    expect(split(0.004, 0.4)).toBe("All outdoors");
    expect(split(0.271, 0.13)).toBe("271 m indoors · 130 m outdoors");
    expect(split(1.2, 0.5)).toBe("1.20 km indoors · 500 m outdoors");
  });
});

describe("brief", () => {
  it("strips a code suffix and generic building words", () => {
    expect(
      brief("Centennial Centre for Interdisciplinary Studies (CCIS)", "CCIS"),
    ).toBe("Centennial Centre for Interdisciplinary Studies");
    expect(brief("Students' Union Building", "SUB")).toBe("Students' Union");
    expect(brief("Physical Activity Complex", "PAC")).toBe("Physical Activity");
    expect(brief("Research Facility", "RF")).toBe("Research");
    expect(brief("Education Centre", "ED")).toBe("Education");
  });
});

describe("distance", () => {
  it("formats sub-kilometer walks in meters", () => {
    expect(distance(0.401)).toEqual({ amount: 401, unit: "m" });
  });

  it("formats longer walks in kilometers", () => {
    expect(distance(1.2)).toEqual({ amount: 1.2, unit: "km" });
  });
});

describe("nearest", () => {
  it("returns the closest building", () => {
    const buildings = [hall("A", 53.53, -113.53), hall("B", 53.52, -113.52)];
    expect(nearest(53.5301, -113.5301, buildings)?.code).toBe("A");
  });

  it("returns undefined when the list is empty", () => {
    expect(nearest(53.53, -113.53, [])).toBeUndefined();
  });

  it("returns undefined when the closest building is too far", () => {
    const buildings = [hall("A", 53.53, -113.53)];
    expect(nearest(53.52, -113.52, buildings, 0.01)).toBeUndefined();
  });
});

describe("tokens", () => {
  it("joins name, code, and aliases", () => {
    expect(tokens({ ...hall("ECHA"), aliases: ["KIPNES"] })).toBe(
      "ECHA Hall ECHA KIPNES",
    );
  });
});

describe("hint", () => {
  it("walks through planner states", () => {
    expect(hint({ locating: true, routed: false })).toBe(
      "Finding the nearest building…",
    );
    expect(hint({ locating: false, routed: false })).toBe(
      "Click a building to start, or search.",
    );
    expect(hint({ from: "A", locating: false, routed: false })).toBe(
      "Click where you're going.",
    );
    expect(hint({ from: "A", to: "A", locating: false, routed: false })).toBe(
      "Click where you're going.",
    );
    expect(hint({ from: "A", to: "B", locating: false, routed: true })).toBe(
      "Click another building to change where you're going.",
    );
    expect(hint({ from: "A", to: "B", locating: false, routed: false })).toBe("");
  });
});

describe("readUrl / writeUrl", () => {
  it("reads valid query params", () => {
    window.history.replaceState(null, "", "/?from=CCIS&to=SUB&w=0.5");
    expect(readUrl()).toEqual({ from: "CCIS", to: "SUB", weight: 0.5 });
  });

  it("treats empty from/to as missing", () => {
    window.history.replaceState(null, "", "/?from=&to=");
    expect(readUrl()).toEqual({
      from: undefined,
      to: undefined,
      weight: undefined,
    });
  });

  it("ignores out-of-range weights", () => {
    window.history.replaceState(null, "", "/?w=9");
    expect(readUrl()).toEqual({
      from: undefined,
      to: undefined,
      weight: undefined,
    });
  });

  it("writes a query string and clears it when idle", () => {
    writeUrl("CCIS", "SUB", 0.5);
    expect(window.location.search).toBe("?from=CCIS&to=SUB&w=0.5");
    writeUrl();
    expect(window.location.search).toBe("");
  });
});
