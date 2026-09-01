import { useEffect, useState, type RefObject } from "react";
import type { Map } from "maplibre-gl";

import { create } from "@/map";

export function useMap(node: RefObject<HTMLDivElement | null>): {
  map: Map | null;
  ready: boolean;
} {
  const [map, setMap] = useState<Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = node.current;
    if (!el) {
      return;
    }

    let settled = false;
    let fallback = 0;
    const readyUp = () => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(fallback);
      setMap(instance);
      setReady(true);
    };
    const instance = create(el, {
      onReady: readyUp,
    });
    const onResize = () => instance.resize();
    window.addEventListener("resize", onResize);
    fallback = window.setTimeout(() => {
      instance.resize();
      readyUp();
    }, 4000);

    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(fallback);
      instance.remove();
      setMap(null);
      setReady(false);
    };
  }, [node]);

  return { map, ready };
}
