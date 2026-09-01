import { ArrowLeftRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import type { Building } from "@/graph/models";
import { cn } from "@/lib/cn";

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
    <div className="flex flex-col items-center gap-1.5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="chip pointer-events-auto flex h-11 items-center rounded-full p-1"
      >
        <Pick label="Start" building={from} tone="from" onClick={onFrom} />
        <Icon label="Swap start and end" onClick={onSwap}>
          <ArrowLeftRight className="size-3.5" />
        </Icon>
        <Pick label="End" building={to} tone="to" onClick={onTo} />
        {picked ? (
          <Icon label="Clear route" onClick={onClear}>
            <X className="size-3.5" />
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
        "grid h-8 min-w-16 place-items-center rounded-full px-3 font-mono text-sm tracking-wide transition hover:bg-foreground/8",
        building
          ? tone === "from"
            ? "text-ice"
            : "text-gold"
          : "text-foreground/35",
      )}
    >
      {building?.code ?? "-"}
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
      className="grid size-8 shrink-0 place-items-center rounded-full text-foreground/50 transition hover:bg-foreground/8 hover:text-foreground"
    >
      {children}
    </button>
  );
}
