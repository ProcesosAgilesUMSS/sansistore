import { useState } from 'react';
import { LayoutDashboard, PackagePlus, ArrowLeftRight } from 'lucide-react';
import { NavItem } from './NavItem';
import type { NavItemProps } from './NavItem';

interface NavSection {
  label: string;
  items: Omit<NavItemProps, 'disabled'>[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Inventario',
    items: [
      {
        icon: LayoutDashboard,
        label: 'Panel general',
        href: '/inventory',
        sprint: true,
      },
      {
        icon: PackagePlus,
        label: 'Registrar Nuevos Productos',
        href: '/inventory/register',
        sprint: true,
      },
      {
        icon: ArrowLeftRight,
        label: 'Registrar movimiento de stock',
        href: '/inventory/movements',
        sprint: true,
      },
    ],
  },
];

const BACKLOG_HREFS = new Set([
  '/inventario/alertas',
  '/inventario/historial',
  '/inventario/reservado',
  '/inventario/sin-stock',
]);

export default function SideBarInventory() {
  const [pathname] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : ''
  );

  return (
    <aside
      className="
      hidden md:flex
      w-58 shrink-0 flex-col
      bg-(--theme-card-bg) border-r border-(--theme-border)
      px-3 pt-4 pb-4 sticky top-0 h-screen overflow-y-auto overflow-x-hidden
    "
    >
      <div className="flex items-center gap-2.5 px-2 pb-5 mb-5 border-b border-(--theme-border)">
        <span className="font-['Outfit'] font-black text-[1.05rem] text-(--theme-text) tracking-tight leading-none">
          sansi<span className="text-primary">store</span>
        </span>
      </div>

      {NAV_SECTIONS.map((section, si) => (
        <div key={si} className="mb-6">
          <span
            className="
            block text-[0.58rem] font-bold tracking-[0.14em] uppercase
            text-(--theme-text) opacity-35 px-2.5 mb-1.5
          "
          >
            {section.label}
          </span>

          {section.items.map((item, ii) => (
            <NavItem
              key={ii}
              {...item}
              disabled={BACKLOG_HREFS.has(item.href)}
              isActive={pathname === item.href}
            />
          ))}
        </div>
      ))}
    </aside>
  );
}
