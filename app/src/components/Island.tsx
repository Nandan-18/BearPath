import { ArrowLeftRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import type { Building } from "@/graph/models";
import { cn } from "@/lib/cn";
import { brief } from "@/lib/format";

interface IslandProps {
  from?: Building;
  to?: Building;
  hint: string;
  onFrom: () => void;
  onTo: () => void;
  onSwap: () => void;
  onClear: () => void;
}

export function Island({
  from,
  to,
  hint,
  onFrom,
  onTo,
  onSwap,
  onClear,
}: IslandProps) {
  const picked = Boolean(from || to);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-1.5 sm:max-w-none">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="chip pointer-events-auto flex h-12 w-full items-center rounded-full p-1 sm:h-11 sm:w-auto"
      >
        <Pick label="Start" building={from} tone="from" onClick={onFrom} />
        <Icon label="Swap start and end" onClick={onSwap}>
          <ArrowLeftRight className="size-4 sm:size-3.5" />
        </Icon>
        <Pick label="End" building={to} tone="to" onClick={onTo} />
        {picked ? (
          <Icon label="Clear route" onClick={onClear}>
            <X className="size-4 sm:size-3.5" />
          </Icon>
        ) : null}
      </motion.div>
      <AnimatePresence>
        {hint ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-none text-center text-[0.72rem] leading-snug text-foreground/50"
            role="status"
            aria-live="polite"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Pick({
  label,
  building,
  tone,
  onClick,
}: {
  label: string;
  building?: Building;
  tone: "from" | "to";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={building ? `${label}: ${building.code}` : label}
      className={cn(
        "flex min-h-10 min-w-0 flex-1 flex-col items-center justify-center rounded-full px-2 transition hover:bg-foreground/8 sm:grid sm:h-8 sm:min-w-16 sm:flex-none sm:place-items-center sm:px-3",
        building
          ? tone === "from"
            ? "text-ice"
            : "text-gold"
          : "text-foreground/35",
      )}
    >
      <span className="font-mono text-sm tracking-wide">
        {building?.code ?? label}
      </span>
      {building ? (
        <span className="max-w-full truncate text-[0.62rem] leading-tight text-foreground/45 sm:hidden">
          {brief(building.name, building.code)}
        </span>
      ) : null}
    </button>
  );
}

function Icon({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-10 shrink-0 place-items-center rounded-full text-foreground/50 transition hover:bg-foreground/8 hover:text-foreground sm:size-8"
    >
      {children}
    </button>
  );
}
