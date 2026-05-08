export const SkeletonRow = () => {
  return (
    <div className="animate-pulse rounded-xl border border-(--theme-border) p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="h-4 w-32 rounded bg-(--theme-secondary-bg)" />

          <div className="mt-2 h-3 w-20 rounded bg-(--theme-secondary-bg)" />
        </div>

        <div className="h-4 w-16 rounded bg-(--theme-secondary-bg)" />
      </div>
    </div>
  );
};
