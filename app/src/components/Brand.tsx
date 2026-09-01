export function Brand() {
  return (
    <div className="flex items-center gap-2">
      <img
        src="/favicon.svg"
        alt=""
        width={24}
        height={24}
        className="size-6 shrink-0 sm:size-7"
      />
      <p className="brand">BearPath</p>
    </div>
  );
}
