/** Skeleton for the request sheet while the bridge request is being fetched. */
export default function ModalLoading() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy
      aria-label="Loading request"
    >
      <div className="flex items-start justify-between">
        <span className="size-16 rounded-full shimmer" />
        <span className="size-9 rounded-full bg-surface-tertiary" />
      </div>
      <div className="flex flex-col gap-4">
        <span className="h-6 w-3/5 rounded-8 shimmer" />
        <span className="h-4 w-4/5 rounded-8 shimmer" />
        <span className="h-14 w-full rounded-8 shimmer" />
      </div>
    </div>
  );
}
