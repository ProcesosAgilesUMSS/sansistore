import { useEffect, useMemo, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { sections } from '../constants/sections';

export const SideBarSeller = () => {
  const [openMenu, setOpenMenu] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    const syncPath = () => {
      const pathname = window.location.pathname.replace(/\/$/, '');
      setCurrentPath(pathname || '/');
    };

    syncPath();
    document.addEventListener('astro:page-load', syncPath);
    document.addEventListener('astro:after-swap', syncPath);

    return () => {
      document.removeEventListener('astro:page-load', syncPath);
      document.removeEventListener('astro:after-swap', syncPath);
    };
  }, []);

  const activeSection = useMemo(
    () => sections.find((section) => currentPath === section.route || currentPath.startsWith(`${section.route}/`)),
    [currentPath]
  );

  const isCurrentRoute = (route: string) =>
    currentPath === route || currentPath.startsWith(`${route}/`);

  const firstLabel = activeSection?.label ?? sections[0]?.label ?? 'Opciones';

  const linkClass = (isActive: boolean) =>
    [
      'relative flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-all duration-150 overflow-hidden',
      isActive
        ? 'border-primary/40 bg-primary/10 text-primary font-700 shadow-[0_4px_16px_rgba(136,176,75,0.15)] pl-5'
        : 'border-(--theme-border) text-(--theme-text) font-500 hover:border-primary/40 hover:bg-(--theme-secondary-bg) hover:text-primary',
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
            {sections.map((section) => {
              const isActive = isCurrentRoute(section.route);
              return (
                <a
                  key={section.id}
                  href={section.route}
                  aria-current={isActive ? 'page' : undefined}
                  className={linkClass(isActive)}
                >
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-primary" />
                  )}
                  <span className="min-w-0 truncate">{section.label}</span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </a>
              );
            })}
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
          {sections.map((section) => {
            const isActive = isCurrentRoute(section.route);
            return (
              <a
                key={section.id}
                href={section.route}
                aria-current={isActive ? 'page' : undefined}
                className={linkClass(isActive)}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-primary" />
                )}
                <span className="min-w-0 truncate">{section.label}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
              </a>
            );
          })}
        </div>
      </aside>
    </section>
  );
};
