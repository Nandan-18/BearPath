import { Empty, Frame, Group, Input, Item, List } from "@/components/Command";
import type { Building } from "@/graph/models";
import { PALETTE } from "@/lib/campus";
import { cn } from "@/lib/cn";
import { brief, tokens } from "@/lib/format";

export type Slot = "from" | "to";

interface PaletteProps {
  open: boolean;
  slot: Slot;
  to?: string;
  onOpen: (open: boolean) => void;
  onPick: (building: Building) => void;
}

export function Palette({ open, slot, to, onOpen, onPick }: PaletteProps) {
  const title = slot === "from" ? "From" : "To";

  return (
    <Frame
      key={slot}
      open={open}
      onOpenChange={onOpen}
      title={title}
      description="Search a North Campus building by name, code, or alias."
    >
      <Input placeholder={`${title}…`} />
      <List className="sm:max-h-[min(24rem,60vh)] sm:flex-none">
        <Empty>No building matches that.</Empty>
        <Group heading="North Campus">
          {PALETTE.map((building) => (
            <Item
              key={building.code}
              value={tokens(building)}
              onSelect={() => onPick(building)}
            >
              <span
                className={cn(
                  "font-mono text-[0.72rem] tracking-wide",
                  building.code === to ? "text-gold" : "text-ice",
                )}
              >
                {building.code}
              </span>
              <span className="min-w-0 truncate">
                {brief(building.name, building.code)}
              </span>
            </Item>
          ))}
        </Group>
      </List>
    </Frame>
  );
}
