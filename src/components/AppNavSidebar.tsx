import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { sellerNavGroups } from '../features/seller/constants/navGroups';
import { inventoryNavGroups } from '../features/inventory/constants/navGroups';

export interface NavLink {
  label: string;
  href: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavLink[];
}

/**
 * Las props que cruzan de Astro a la isla deben ser serializables, por eso NO
 * se pasan los grupos (contienen componentes de icono): se selecciona el set
 * por nombre y se resuelve aquí, en el lado JS.
 */
const NAV_REGISTRY: Record<string, NavGroup[]> = {
  seller: sellerNavGroups,
  inventory: inventoryNavGroups,
};

interface AppNavSidebarProps {
  nav: keyof typeof NAV_REGISTRY;
  pathname: string;
  /** Texto chico arriba del menú en móvil (botón). */
  title?: string;
}

const itemActive = 'bg-primary/15 text-primary';
const itemInactive =
  'text-(--theme-text)/55 hover:text-(--theme-text) hover:bg-(--theme-text)/5';

/**
 * Devuelve el href "más específico" que coincide con la ruta actual, para que
 * un item raíz (ej. /inventory) no se marque activo cuando estás en una subruta
 * (ej. /inventory/products) que tiene su propio item.
 */
function resolveActiveHref(pathname: string, hrefs: string[]) {
  const clean = pathname.replace(/\/$/, '') || '/';
  let best: string | null = null;
  for (const href of hrefs) {
    if (clean === href || clean.startsWith(`${href}/`)) {
      if (best === null || href.length > best.length) best = href;
    }
  }
  return best;
}

export default function AppNavSidebar({ nav, pathname, title = 'Menú' }: AppNavSidebarProps) {
  const [open, setOpen] = useState(false);
  const groups = NAV_REGISTRY[nav] ?? [];
  const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));
  const activeHref = resolveActiveHref(pathname, allHrefs);

  // Cierra el overlay al navegar entre páginas (Astro view transitions).
  useEffect(() => {
    const close = () => setOpen(false);
    document.addEventListener('astro:page-load', close);
    return () => document.removeEventListener('astro:page-load', close);
  }, []);

  return (
    <>
      {/* Botón móvil */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed left-4 top-18 z-30 flex items-center gap-2 rounded-lg border border-(--theme-border) bg-(--theme-card-bg) px-3 py-2 text-sm text-(--theme-text)/70 md:hidden"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
        {title}
      </button>

      {open && (
        <button
          type="button"
          aria-label="Cerrar menu lateral"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 h-screen w-[256px]
          bg-(--theme-card-bg) border-r border-(--theme-border)
          transition-transform duration-300
          md:sticky md:top-14 md:z-0 md:h-[calc(100vh-3.5rem)] md:translate-x-0
          md:bg-transparent md:border-(--theme-text)/8
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <nav className="h-full overflow-y-auto px-4 py-5">
          {groups.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="text-[10px] uppercase tracking-widest text-(--theme-text)/35 px-3 mb-2">
                {group.title}
              </p>
              {group.items.map((item) => {
                const active = item.href === activeHref;
                const Icon = item.icon;

                if (item.disabled) {
                  return (
                    <div
                      key={item.href}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] mb-0.5 text-(--theme-text)/20 cursor-not-allowed"
                    >
                      {Icon && (
                        <span className="shrink-0">
                          <Icon size={15} />
                        </span>
                      )}
                      <span className="flex-1">{item.label}</span>
                    </div>
                  );
                }

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] mb-0.5 no-underline transition-colors duration-150 text-left ${
                      active ? itemActive : `${itemInactive} cursor-pointer`
                    }`}
                  >
                    {Icon && (
                      <span className="shrink-0">
                        <Icon size={15} />
                      </span>
                    )}
                    <span className="flex-1">{item.label}</span>
                  </a>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
