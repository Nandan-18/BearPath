import { Crosshair, LocateFixed, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover";
import { Slider } from "@/components/Slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/Tooltip";
import { WEIGHT_MAX, WEIGHT_MIN } from "@/graph/models";
import { useMobile } from "@/hooks/useMobile";
import { cn } from "@/lib/cn";
import { bias } from "@/lib/format";

const tool =
  "chip grid size-11 place-items-center rounded-full text-foreground/80 transition hover:bg-background/80 hover:text-foreground disabled:pointer-events-none disabled:opacity-50 sm:size-10";

interface ToolsProps {
  weight: number;
  locating?: boolean;
  onWeight: (value: number) => void;
  onLocate: () => void;
  onRecenter: () => void;
}

export function Tools({
  weight,
  locating,
  onWeight,
  onLocate,
  onRecenter,
}: ToolsProps) {
  const mobile = useMobile();
  const preference = bias(weight);

  return (
    <TooltipProvider>
      <div className="pointer-events-auto flex flex-row gap-1.5 sm:flex-col sm:gap-2">
        <Tip label="Use my location" mobile={mobile}>
          <button
            type="button"
            aria-label="Use my location"
            disabled={locating}
            onClick={onLocate}
            className={tool}
          >
            <LocateFixed className={cn("size-4", locating && "animate-pulse")} />
          </button>
        </Tip>
        <Tip label="Recenter campus" mobile={mobile}>
          <button
            type="button"
            aria-label="Recenter campus"
            onClick={onRecenter}
            className={tool}
          >
            <Crosshair className="size-4" />
          </button>
        </Tip>
        <Popover>
          <Tip label={preference} mobile={mobile}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Indoor preference: ${preference}`}
                className={tool}
              >
                <SlidersHorizontal className="size-4" />
              </button>
            </PopoverTrigger>
          </Tip>
          <PopoverContent
            align="end"
            side={mobile ? "bottom" : "left"}
            sideOffset={mobile ? 8 : 4}
            className={cn(mobile && "w-[min(18rem,calc(100vw-1.5rem))]")}
          >
            <div className="mb-3 flex items-baseline justify-between text-[0.72rem] uppercase tracking-[0.14em] text-foreground/45">
              <span>Indoors</span>
              <span>Outdoors</span>
            </div>
            <Slider
              min={WEIGHT_MIN}
              max={WEIGHT_MAX}
              step={0.05}
              value={[weight]}
              onValueChange={(values) => {
                const next = values[0];
                if (next !== undefined) {
                  onWeight(next);
                }
              }}
              aria-label="Indoor versus outdoor preference"
            />
            <p className="mt-3 font-mono text-xs text-ice">{preference}</p>
          </PopoverContent>
        </Popover>
      </div>
    </TooltipProvider>
  );
}

function Tip({
  label,
  mobile,
  children,
}: {
  label: string;
  mobile: boolean;
  children: ReactNode;
}) {
  if (mobile) {
    return children;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}
