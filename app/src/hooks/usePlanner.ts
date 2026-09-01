import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { Map } from "maplibre-gl";

import { RouteError, WEIGHT, type Result } from "@/graph/models";
import { BUILDINGS, byCode, getRoute } from "@/lib/campus";
import { hint, nearest, readUrl, writeUrl } from "@/lib/format";
import { clear, draw, enablePicks, flyTo, label, recenter } from "@/map";

function fail(error: unknown, fallback: string): string {
  return error instanceof RouteError ? error.message : fallback;
}

const boot = (() => {
  const url = readUrl();
  return {
    from: byCode(url.from)?.code,
    to: byCode(url.to)?.code,
    weight: url.weight ?? WEIGHT,
  };
})();

type PlannerState = {
  from?: string;
  to?: string;
  weight: number;
  note: string;
  locating: boolean;
};

type PlannerAction =
  | { type: "from"; code?: string }
  | { type: "to"; code?: string }
  | { type: "weight"; value: number }
  | { type: "swap" }
  | { type: "reset" }
  | { type: "note"; text: string }
  | { type: "locating"; on: boolean }
  | { type: "pick"; code: string };

function planner(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case "from":
      return { ...state, from: action.code, note: "" };
    case "to":
      return { ...state, to: action.code, note: "" };
    case "weight":
      return { ...state, weight: action.value, note: "" };
    case "swap":
      return { ...state, from: state.to, to: state.from, note: "" };
    case "reset":
      return { ...state, from: undefined, to: undefined, note: "" };
    case "note":
      return { ...state, note: action.text };
    case "locating":
      return { ...state, locating: action.on, note: action.on ? "" : state.note };
    case "pick":
      if (!state.from || state.from === action.code) {
        return { ...state, from: action.code, note: "" };
      }
      return { ...state, to: action.code, note: "" };
  }
}

export function usePlanner(map: Map | null, ready: boolean) {
  const [state, dispatch] = useReducer(planner, {
    from: boot.from,
    to: boot.to,
    weight: boot.weight,
    note: "",
    locating: false,
  });
  const { from, to, weight, note, locating } = state;

  const onPick = useCallback(
    (code: string) => dispatch({ type: "pick", code }),
    [],
  );

  const { route, routeError } = useMemo((): {
    route: Result | null;
    routeError: string;
  } => {
    if (!from || !to || from === to) {
      return { route: null, routeError: "" };
    }
    try {
      return { route: getRoute(from, to, weight), routeError: "" };
    } catch (error) {
      return { route: null, routeError: fail(error, "Could not find a route.") };
    }
  }, [from, to, weight]);

  const error = routeError || note;

  useEffect(() => {
    writeUrl(from, to, weight);
  }, [from, to, weight]);

  useEffect(() => {
    if (!map || !ready) {
      return;
    }
    label(map, from, to, route?.via);
    enablePicks(map, onPick);
    if (route) {
      draw(map, route.segments, route.via);
      return;
    }
    clear(map);
  }, [map, ready, from, to, route, onPick]);

  const withMap = useCallback(
    (run: (map: Map) => void) => {
      if (map) {
        run(map);
      }
    },
    [map],
  );

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      dispatch({ type: "note", text: "This browser cannot share a location." });
      return;
    }
    dispatch({ type: "locating", on: true });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        dispatch({ type: "locating", on: false });
        const found = nearest(
          position.coords.latitude,
          position.coords.longitude,
          BUILDINGS,
        );
        if (!found) {
          dispatch({ type: "note", text: "Could not snap to a campus building." });
          return;
        }
        dispatch({ type: "from", code: found.code });
        withMap((active) => flyTo(active, found));
      },
      () => {
        dispatch({ type: "locating", on: false });
        dispatch({ type: "note", text: "Location permission was denied." });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  }, [withMap]);

  const reset = useCallback(() => {
    dispatch({ type: "reset" });
    withMap((active) => {
      clear(active);
      recenter(active);
    });
  }, [withMap]);

  const flyToCode = useCallback(
    (code: string) => {
      const building = byCode(code);
      if (building) {
        withMap((active) => flyTo(active, building));
      }
    },
    [withMap],
  );

  const recenterMap = useCallback(() => withMap(recenter), [withMap]);

  return {
    from,
    to,
    weight,
    route,
    error,
    hint: error
      ? ""
      : hint({ from, to, locating, routed: Boolean(route) }),
    locating,
    setFrom: (code?: string) => dispatch({ type: "from", code }),
    setTo: (code?: string) => dispatch({ type: "to", code }),
    setWeight: (value: number) => dispatch({ type: "weight", value }),
    swap: () => dispatch({ type: "swap" }),
    clear: reset,
    locate,
    flyTo: flyToCode,
    recenter: recenterMap,
  };
}
