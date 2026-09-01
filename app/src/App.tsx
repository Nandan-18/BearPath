import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Brand } from "@/components/Brand";
import { Dock } from "@/components/Dock";
import { Fade } from "@/components/Fade";
import { Island } from "@/components/Island";
import { Palette, type Slot } from "@/components/Palette";
import { Tools } from "@/components/Tools";
import { Veil } from "@/components/Veil";
import { useMap } from "@/hooks/useMap";
import { usePlanner } from "@/hooks/usePlanner";
import type { Building } from "@/graph/models";
import { byCode } from "@/lib/campus";

function searchKey(event: KeyboardEvent): boolean {
  const field =
    event.target instanceof HTMLElement &&
    event.target.closest("input, textarea, [contenteditable=true]");
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    return true;
  }
  return event.key === "/" && !field && !event.metaKey && !event.ctrlKey;
}

export default function App() {
  const node = useRef<HTMLDivElement>(null);
  const { map, ready } = useMap(node);
  const {
    from,
    to,
    setFrom,
    setTo,
    hint,
    error,
    route,
    weight,
    locating,
    setWeight,
    locate,
    recenter,
    flyTo,
    swap,
    clear,
  } = usePlanner(map, ready);
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState<Slot>("from");

  const show = useCallback((next: Slot) => {
    setSlot(next);
    setOpen(true);
  }, []);

  const choose = useCallback(
    (building: Building) => {
      if (slot === "from") {
        setFrom(building.code);
        setOpen(false);
        if (!to) {
          window.setTimeout(() => show("to"), 160);
        }
        return;
      }
      setTo(building.code);
      setOpen(false);
    },
    [setFrom, setTo, show, slot, to],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!searchKey(event)) {
        return;
      }
      event.preventDefault();
      show(from ? "to" : "from");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [from, show]);

  const island = (
    <Island
      from={byCode(from)}
      to={byCode(to)}
      hint={open ? "" : hint}
      onFrom={() => show("from")}
      onTo={() => show("to")}
      onSwap={swap}
      onClear={clear}
    />
  );

  const errorBanner = error ? (
    <p
      role="alert"
      className="w-full max-w-xl rounded-full border border-destructive/30 bg-background/80 px-3 py-1.5 text-center text-xs text-destructive"
    >
      {error}
    </p>
  ) : null;

  const routePanel =
    route && from && to ? (
      <motion.div
        key="dock"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-xl"
      >
        <Dock route={route} onVia={flyTo} />
      </motion.div>
    ) : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-background text-foreground">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ice focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
        href="#planner"
      >
        Skip to route planner
      </a>

      <div
        ref={node}
        id="map"
        role="application"
        aria-label="Campus map"
        className="absolute inset-0"
      />

      <Fade className="z-10" />
      <Fade
        side="bottom"
        amount={48}
        height="160px"
        className="z-10 sm:hidden"
      />
      <Fade
        side="bottom"
        amount={40}
        height="72px"
        className="z-10 hidden sm:block"
      />

      <Veil ready={ready} />

      <header className="pointer-events-none absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 sm:left-5 sm:top-5">
        <Brand />
      </header>

      <div
        id="planner"
        className="pointer-events-none absolute inset-x-3 z-30 flex justify-center bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:inset-x-24 sm:top-4 sm:bottom-auto"
      >
        {island}
      </div>

      <div className="pointer-events-none absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 sm:right-5 sm:top-4">
        <Tools
          weight={weight}
          locating={locating}
          onWeight={setWeight}
          onLocate={locate}
          onRecenter={recenter}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 z-30 flex flex-col items-center gap-2 px-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.5rem)] sm:bottom-10">
        {errorBanner}
        <AnimatePresence>{routePanel}</AnimatePresence>
      </div>

      <Palette
        open={open}
        slot={slot}
        to={to}
        onOpen={setOpen}
        onPick={choose}
      />
    </div>
  );
}
