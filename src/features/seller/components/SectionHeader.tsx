interface Props {
  title: string
  count: number
}
export const SectionHeader = ({ title, count }: Props) => {
  return (
    <div className="sticky top-0 z-10 mb-6">
      <div className="overflow-hidden rounded-[1.5rem] border border-(--theme-border) bg-gradient-to-r from-(--theme-card-bg) via-(--theme-card-bg) to-(--theme-secondary-bg)/55 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_12px_30px_rgba(136,176,75,0.24)]">
            <span className="text-sm font-900">{count}</span>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-800 uppercase tracking-[0.26em] text-(--theme-text) opacity-45">
              Sección
            </p>
            <h2
              className="mt-1 text-base font-900 tracking-tight text-(--theme-text) md:text-lg"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {title}
            </h2>
          </div>

          <div className="ml-auto rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) px-4 py-1.5 text-xs font-800 text-(--theme-text)">
            {count} pedidos
          </div>
        </div>
      </div>
    </div>
  );
}
