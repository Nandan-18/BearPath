import { haversine } from "@/graph/geo";
import type { Building } from "@/graph/models";
import { WEIGHT, WEIGHT_MAX, WEIGHT_MIN } from "@/graph/models";

export function bias(weight: number): string {
  if (weight < 0.6) {
    return "Indoor-first";
  }
  if (weight < 1.2) {
    return "Balanced";
  }
  return "Outdoor-first";
}

export function distance(km: number): { amount: number; unit: "m" | "km" } {
  if (km < 1) {
    return { amount: Math.round(km * 1000), unit: "m" };
  }
  return { amount: Number(km.toFixed(2)), unit: "km" };
}

function meters(km: number): string {
  const { amount, unit } = distance(km);
  return unit === "m" ? `${amount} m` : `${amount.toFixed(2)} km`;
}

export function split(indoor: number, outdoor: number): string {
  if (outdoor < 0.005) {
    return "All indoors";
  }
  if (indoor < 0.005) {
    return "All outdoors";
  }
  return `${meters(indoor)} indoors · ${meters(outdoor)} outdoors`;
}

export function brief(name: string, code: string): string {
  return name
    .replace(` (${code})`, "")
    .replace(/ Building$/i, "")
    .replace(/ Centre$/i, "")
    .replace(/ Complex$/i, "")
    .replace(/ Facility$/i, "");
}

export function nearest(
  lat: number,
  lon: number,
  buildings: readonly Building[],
  within = Number.POSITIVE_INFINITY,
): Building | undefined {
  let best: Building | undefined;
  let near = within;
  for (const building of buildings) {
    const km = haversine(lat, lon, building.lat, building.lon);
    if (km < near) {
      best = building;
      near = km;
    }
  }
  return best;
}

export function tokens(building: Building): string {
  return [building.name, building.code, ...building.aliases].join(" ");
}

export function readUrl(): { from?: string; to?: string; weight?: number } {
  const params = new URLSearchParams(window.location.search);
  const weight = Number(params.get("w"));
  return {
    from: params.get("from") || undefined,
    to: params.get("to") || undefined,
    weight:
      Number.isFinite(weight) && weight >= WEIGHT_MIN && weight <= WEIGHT_MAX
        ? weight
        : undefined,
  };
}

export function writeUrl(from?: string, to?: string, weight = WEIGHT): void {
  const params = new URLSearchParams();
  if (from) {
    params.set("from", from);
  }
  if (to) {
    params.set("to", to);
  }
  if (from || to || weight !== WEIGHT) {
    params.set("w", String(weight));
  }
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    query ? `?${query}` : window.location.pathname,
  );
}

export function hint(input: {
  from?: string;
  to?: string;
  locating: boolean;
  routed: boolean;
}): string {
  if (input.locating) {
    return "Finding the nearest building…";
  }
  if (!input.from) {
    return "Click a building to start, or search.";
  }
  if (!input.to || input.from === input.to) {
    return "Click where you're going.";
  }
  if (input.routed) {
    return "Click another building to change where you're going.";
  }
  return "";
}
