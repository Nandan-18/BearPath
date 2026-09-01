import { cn } from "@/lib/cn";

export function Fade({
  className,
  side = "top",
  height = "88px",
  blur = "4px",
  amount = 45,
}: {
  className?: string;
  side?: "top" | "bottom";
  height?: string;
  blur?: string;
  amount?: number;
}) {
  const top = side === "top";
  const fill = `color-mix(in srgb, var(--background) ${amount}%, transparent)`;
  const fade = top ? "to top" : "to bottom";
  const clip = top ? "to bottom" : "to top";
  return (
    <div
      className={cn("pointer-events-none absolute left-0 w-full select-none", className)}
      style={{
        [side]: 0,
        height,
        background: `linear-gradient(${fade}, transparent, ${fill})`,
        maskImage: `linear-gradient(${clip}, ${fill} 50%, transparent)`,
        WebkitMaskImage: `linear-gradient(${clip}, ${fill} 50%, transparent)`,
        WebkitBackdropFilter: `blur(${blur})`,
        backdropFilter: `blur(${blur})`,
      }}
    />
  );
}
