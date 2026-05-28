export const SkeletonRows = ({ count }: { count: number }) => {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse rounded-[1.25rem] border border-(--theme-border) bg-(--theme-card-bg) p-4">
          <div className="mb-3 h-5 w-1/3 rounded bg-(--theme-secondary-bg)" />
          <div className="mb-2 h-4 w-1/4 rounded bg-(--theme-secondary-bg)" />
          <div className="h-10 rounded-xl bg-(--theme-secondary-bg)" />
        </div>
      ))}
    </div>
  )
}
