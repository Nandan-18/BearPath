import { AnimatePresence, motion } from "motion/react";

export function Veil({ ready }: { ready: boolean }) {
  return (
    <AnimatePresence>
      {ready ? null : (
        <motion.div
          key="veil"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-40 grid place-items-center bg-[radial-gradient(circle_at_40%_45%,#2a1c16,var(--background)_62%)]"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-3">
            <p className="brand">BearPath</p>
            <motion.p
              className="font-sans text-sm tracking-tight text-foreground/70"
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              Drawing North Campus…
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
