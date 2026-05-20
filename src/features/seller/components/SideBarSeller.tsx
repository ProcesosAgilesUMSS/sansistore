import { useEffect, useMemo, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { sections } from '../constants/sections';

export const SideBarSeller = () => {
  const [openMenu, setOpenMenu] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    const syncPath = () => setCurrentPath(window.location.pathname);

    syncPath();
    document.addEventListener('astro:page-load', syncPath);

    return () => {
      document.removeEventListener('astro:page-load', syncPath);
    };
  }, []);

  const activeSection = useMemo(
    () => sections.find((section) => currentPath === section.route),
    [currentPath]
  );

  const firstLabel = activeSection?.label ?? sections[0]?.label ?? 'Opciones';

  const linkClass = (isActive: boolean) =>
    [
      'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-600 transition',
      isActive
        ? 'border-primary bg-primary/10 text-primary shadow-[0_10px_24px_rgba(136,176,75,0.12)]'
        : 'border-(--theme-border) text-(--theme-text) hover:border-primary hover:bg-(--theme-secondary-bg) hover:text-primary',
    ].join(' ');

  return (
    <section className="flex w-full flex-col gap-4">
      <div className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) p-3 shadow-sm lg:hidden">
        <button
          type="button"
          onClick={() => setOpenMenu((open) => !open)}
          className="flex w-full items-center justify-between rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg) px-4 py-3 text-left text-sm font-700 text-(--theme-text) transition hover:border-primary hover:text-primary"
        >
          <span className="truncate">{firstLabel}</span>
          {openMenu ? <X size={18} /> : <Menu size={18} />}
        </button>

        {openMenu && (
          <div className="mt-3 space-y-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={section.route}
                aria-current={currentPath === section.route ? 'page' : undefined}
                className={linkClass(currentPath === section.route)}
              >
                <span className="min-w-0 truncate">{section.label}</span>
                <span
                  className={`text-xs font-700 uppercase tracking-[0.18em] ${currentPath === section.route ? 'opacity-100' : 'opacity-50'
                    }`}
                >
                  {currentPath === section.route ? 'Activo' : 'Ir'}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      <aside className="hidden rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) p-4 shadow-sm lg:block lg:min-h-[calc(100vh-5.5rem)] lg:w-72 lg:shrink-0">
        <p
          className="mb-3 px-2 text-xs font-800 uppercase tracking-[0.25em]"
          style={{ color: 'var(--color-primary)' }}
        >
          Panel del vendedor
        </p>

        <div className="space-y-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={section.route}
              aria-current={currentPath === section.route ? 'page' : undefined}
              className={linkClass(currentPath === section.route)}
            >
              <span className="min-w-0 truncate">{section.label}</span>
              <span
                className={`text-xs font-700 uppercase tracking-[0.18em] ${currentPath === section.route ? 'opacity-100' : 'opacity-50'
                  }`}
              >
              </span>
            </a>
          ))}
        </div>
      </aside>
    </section>
  );
};
