import { find } from "@/graph/find";
import { load } from "@/graph/loader";
import {
  NoPathError,
  RouteError,
  SameBuildingError,
  UnknownBuildingError,
  WEIGHT_MAX,
  WEIGHT_MIN,
  centroid,
  type Building,
  type Result,
} from "@/graph/models";

const graph = load();

function compareBuildings(left: Building, right: Building): number {
  const a = left.name.toLowerCase();
  const b = right.name.toLowerCase();
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return left.code.localeCompare(right.code);
}

export const BUILDINGS: readonly Building[] = [...graph.codes]
  .map((code) => {
    const [lat, lon] = centroid(graph, code);
    return {
      code,
      name: graph.names[code] ?? code,
      lat,
      lon,
      aliases: graph.aliases[code] ?? [],
    };
  })
  .sort(compareBuildings);

export const PALETTE: readonly Building[] = [...BUILDINGS].sort((left, right) =>
  left.code.localeCompare(right.code),
);

export function byCode(code?: string): Building | undefined {
  return code ? BUILDINGS.find((item) => item.code === code) : undefined;
}

function asRouteError(error: unknown): RouteError | null {
  if (error instanceof SameBuildingError) {
    return new RouteError("Start and end must be different buildings.");
  }
  if (error instanceof UnknownBuildingError) {
    return new RouteError(`Unknown building: ${error.message}`);
  }
  if (error instanceof NoPathError) {
    return new RouteError("No route found between those buildings.");
  }
  return null;
}

export function getRoute(start: string, end: string, weight: number): Result {
  if (!Number.isFinite(weight) || weight < WEIGHT_MIN || weight > WEIGHT_MAX) {
    throw new RouteError("indoor_weight is out of range");
  }
  try {
    return find(graph, start, end, weight);
  } catch (error) {
    const mapped = asRouteError(error);
    if (mapped) {
      throw mapped;
    }
    throw error;
  }
}
