import aliasesJson from "@data/aliases.json?raw";
import namesJson from "@data/building-names.json?raw";
import buildingsCsv from "@data/buildings.csv?raw";
import pedwaysCsv from "@data/pedways.csv?raw";

import { build } from "./builder";
import type { Door, Graph, Pedway } from "./models";

export function canon(code: string, aliases: Record<string, string>): string {
  return aliases[code] ?? code;
}

export function invert(aliases: Record<string, string>): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const [alias, code] of Object.entries(aliases)) {
    (grouped[code] ??= []).push(alias);
  }
  return grouped;
}

export function loadJson(text: string): Record<string, string> {
  return JSON.parse(text) as Record<string, string>;
}

function rows(csv: string): Record<string, string>[] {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/);
  const header = lines[0];
  if (!header) {
    return [];
  }
  const keys = header.split(",");
  const out: Record<string, string>[] = [];
  for (const line of lines.slice(1)) {
    if (!line) {
      continue;
    }
    const values = line.split(",");
    const row: Record<string, string> = {};
    for (let i = 0; i < keys.length; i++) {
      row[keys[i]!] = values[i] ?? "";
    }
    out.push(row);
  }
  return out;
}

function cell(row: Record<string, string>, key: string): string {
  return row[key]!.trim();
}

export function loadDoors(csv: string, aliases: Record<string, string>): Door[] {
  return rows(csv).map((row) => ({
    building: canon(cell(row, "Building"), aliases),
    lat: Number(row["Latitude"]),
    lon: Number(row["Longitude"]),
  }));
}

export function loadPedways(csv: string, aliases: Record<string, string>): Pedway[] {
  return rows(csv).map((row) => ({
    start_building: canon(cell(row, "Start"), aliases),
    start_lat: Number(row["SLatitude"]),
    start_lon: Number(row["SLongitude"]),
    end_building: canon(cell(row, "End"), aliases),
    end_lat: Number(row["ELatitude"]),
    end_lon: Number(row["ELongitude"]),
  }));
}

export function parse(
  aliasesText: string,
  namesText: string,
  buildingsText: string,
  pedwaysText: string,
): Graph {
  const aliases = loadJson(aliasesText);
  const names = loadJson(namesText);
  return build(
    loadDoors(buildingsText, aliases),
    loadPedways(pedwaysText, aliases),
    names,
    invert(aliases),
  );
}

let campus: Graph | undefined;

export function load(): Graph {
  campus ??= parse(aliasesJson, namesJson, buildingsCsv, pedwaysCsv);
  return campus;
}
