import NumberFlow from "@number-flow/react";

import type { Result } from "@/graph/models";
import { byCode } from "@/lib/campus";
import { cn } from "@/lib/cn";
import { brief, distance, split } from "@/lib/format";

interface DockProps {
  route: Result;
  onVia: (code: string) => void;
}

export function Dock({ route, onVia }: DockProps) {
  const { amount, unit } = distance(route.distance_km);
  const total = route.indoor_km + route.outdoor_km;
  const share = total > 0 ? (route.indoor_km / total) * 100 : 100;

  return (
    <section
      className="chip pointer-events-auto w-full rounded-2xl px-4 py-3"
      aria-label="Walk summary"
    >
      <div className="flex items-end justify-between gap-3">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0 font-sans text-[1.65rem] font-medium tracking-tight sm:text-3xl">
          <NumberFlow value={amount} />
          <span className="text-lg text-foreground/50">{unit}</span>
          <span className="text-foreground/25">·</span>
          <NumberFlow value={route.walk_minutes} />
          <span className="text-lg text-foreground/50">min</span>
        </p>
        <p className="max-w-48 text-right text-[0.72rem] leading-snug text-foreground/45">
          {split(route.indoor_km, route.outdoor_km)}
        </p>
      </div>

      <div
        className="mt-3 h-1 overflow-hidden rounded-full bg-gold/70"
        aria-hidden="true"
      >
        <div className="h-full bg-ice" style={{ width: `${share}%` }} />
      </div>

      <ol className="scroll mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
        {route.via.map((code, index) => {
          const building = byCode(code);
          const name = building ? brief(building.name, building.code) : code;
          return (
            <li
              key={`${code}-${index}`}
              className="flex shrink-0 items-center gap-1.5"
            >
              {index > 0 ? <span className="text-foreground/20">→</span> : null}
              <button
                type="button"
                onClick={() => onVia(code)}
                title={name}
                className={cn(
                  "rounded-full border border-border px-2 py-0.5 font-mono text-[0.68rem] tracking-wide transition hover:border-ice/50 hover:text-ice",
                  index === 0 && "text-ice",
                  index === route.via.length - 1 && "text-gold",
                )}
              >
                {code}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
