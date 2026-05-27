export default function LoadingSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="grid gap-4 sm:gap-6 md:grid-cols-[1.05fr_0.95fr] md:gap-8">
        <div className="overflow-hidden rounded-[2rem] border border-border-light bg-card-bg-light">
          <div className="relative aspect-square animate-pulse bg-secondary-bg-light">
            <div className="absolute left-5 top-5 h-7 w-20 rounded-full bg-card-bg-light/80" />
          </div>
        </div>

        <div className="rounded-[2rem] border border-border-light bg-card-bg-light px-5 py-6 sm:px-8 sm:py-8">
          <div className="h-4 w-28 animate-pulse rounded bg-secondary-bg-light" />
          <div className="mt-4 h-10 w-4/5 animate-pulse rounded bg-secondary-bg-light" />
          <div className="mt-5 flex items-center gap-3">
            <div className="h-8 w-28 animate-pulse rounded bg-secondary-bg-light" />
            <div className="h-5 w-16 animate-pulse rounded bg-secondary-bg-light" />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-7 w-28 animate-pulse rounded-full bg-secondary-bg-light" />
            <div className="h-4 w-36 animate-pulse rounded bg-secondary-bg-light" />
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-secondary-bg-light" />
            <div className="h-4 w-full animate-pulse rounded bg-secondary-bg-light" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-secondary-bg-light" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-secondary-bg-light" />
          </div>
        </div>
      </div>

      <section className="rounded-[2rem] border border-border-light bg-card-bg-light px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-pulse rounded-full bg-secondary-bg-light" />
          <div className="h-6 w-52 animate-pulse rounded bg-secondary-bg-light" />
        </div>

        <div className="mt-6 grid gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border-light bg-secondary-bg-light/50 px-5 py-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="h-4 w-28 animate-pulse rounded bg-secondary-bg-light" />
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((__, starIndex) => (
                    <div key={starIndex} className="h-3.5 w-3.5 animate-pulse rounded-full bg-secondary-bg-light" />
                  ))}
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-secondary-bg-light" />
                <div className="h-4 w-11/12 animate-pulse rounded bg-secondary-bg-light" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
