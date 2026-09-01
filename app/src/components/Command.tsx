import { Command as Primitive } from "cmdk";
import { Search, X } from "lucide-react";
import { Dialog } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const overlay =
  "fixed inset-0 z-50 bg-background/60 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0";
const sheet =
  "fixed inset-0 z-50 flex w-full flex-col overflow-hidden rounded-none border-0 bg-popover pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] shadow-lg duration-200 outline-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:h-auto sm:max-h-[min(32rem,80vh)] sm:w-full sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-xl sm:border sm:border-border sm:pt-0 sm:pb-0";

export function Frame({
  title,
  description,
  children,
  ...props
}: ComponentProps<typeof Dialog.Root> & {
  title: string;
  description: string;
}) {
  return (
    <Dialog.Root {...props}>
      <Dialog.Portal>
        <Dialog.Overlay className={overlay} />
        <Dialog.Content className={sheet}>
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <Dialog.Description className="sr-only">{description}</Dialog.Description>
          <Dialog.Close className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-10 grid size-10 place-items-center rounded-full text-foreground/60 transition hover:bg-foreground/8 hover:text-foreground sm:hidden">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
          <Primitive className="flex min-h-0 flex-1 flex-col overflow-hidden bg-popover text-popover-foreground">
            {children}
          </Primitive>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Input({
  className,
  ...props
}: ComponentProps<typeof Primitive.Input>) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:h-12">
      <Search className="size-4 shrink-0 opacity-50" />
      <Primitive.Input
        className={cn(
          "flex h-14 w-full rounded-md bg-transparent py-3 text-base outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:text-sm",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function List({
  className,
  ...props
}: ComponentProps<typeof Primitive.List>) {
  return (
    <Primitive.List
      className={cn("min-h-0 flex-1 overflow-x-hidden overflow-y-auto scroll-py-1", className)}
      {...props}
    />
  );
}

export function Empty(props: ComponentProps<typeof Primitive.Empty>) {
  return <Primitive.Empty className="py-6 text-center text-sm" {...props} />;
}

export function Group({
  className,
  ...props
}: ComponentProps<typeof Primitive.Group>) {
  return (
    <Primitive.Group
      className={cn(
        "overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Item({
  className,
  ...props
}: ComponentProps<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      className={cn(
        "relative flex min-h-12 cursor-default items-center gap-2 rounded-sm px-2 py-3.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-ice/15 data-[selected=true]:text-foreground sm:min-h-0 sm:py-3",
        className,
      )}
      {...props}
    />
  );
}
