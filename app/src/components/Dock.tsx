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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0 font-sans text-[1.45rem] font-medium tracking-tight sm:text-3xl">
          <NumberFlow value={amount} />
          <span className="text-base text-foreground/50 sm:text-lg">{unit}</span>
          <span className="text-foreground/25">·</span>
          <NumberFlow value={route.walk_minutes} />
          <span className="text-base text-foreground/50 sm:text-lg">min</span>
        </p>
        <p className="text-[0.72rem] leading-snug text-foreground/45 sm:max-w-48 sm:text-right">
          {split(route.indoor_km, route.outdoor_km)}
        </p>
      </div>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-gold/70 sm:h-1"
        aria-hidden="true"
      >
        <div className="h-full bg-ice" style={{ width: `${share}%` }} />
      </div>

      <ol className="scroll mt-3 flex gap-2 overflow-x-auto pb-1 sm:gap-1.5 sm:pb-0.5">
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
                  "min-h-9 rounded-full border border-border px-2.5 py-1 font-mono text-[0.72rem] tracking-wide transition hover:border-ice/50 hover:text-ice sm:min-h-0 sm:px-2 sm:py-0.5 sm:text-[0.68rem]",
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
