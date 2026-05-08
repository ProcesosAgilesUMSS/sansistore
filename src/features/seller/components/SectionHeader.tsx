interface Props {
  title: string
  count: number
}
export const SectionHeader = ({ title, count }: Props) => {
  return (
    <div className="sticky top-0 z-10 mb-5">
      <div className="flex items-center gap-3 rounded-2xl border border-(--theme-border) bg-(--theme-card-bg)/90 px-4 py-3 backdrop-blur-sm">
        <div className="min-w-0">
          <h2
            className="text-sm font-800 tracking-[0.22em] text-(--theme-text)"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {title}
          </h2>
        </div>

        <span className="ml-auto flex h-9 min-w-9 items-center justify-center rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) px-3 text-xs font-800 text-(--theme-text)">
          {count}
        </span>
      </div>
    </div>
  );
}
