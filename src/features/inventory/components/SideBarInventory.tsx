import {
  LayoutDashboard,
  PackagePlus,
  ArrowLeftRight,
  PackageSearch,
  ArrowDownUp,
  History,
  PackageX,
} from 'lucide-react';
import { NavItem } from './NavItem';
import type { NavItemProps } from './NavItem';

interface NavSection {
  label: string;
  items: Omit<NavItemProps, 'disabled' | 'isActive'>[];
}

interface SideBarInventoryProps {
  pathname: string;
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
        label: 'Mis Productos',
        href: '/inventory/products',
        sprint: true,
      },
      {
        icon: PackageSearch,
        label: 'Mis Empaques',
        href: '/inventory/packaging',
        sprint: true,
      },
      {
        icon: ArrowDownUp,
        label: 'Entrada y Salida Stock',
        href: '/inventory/entrysExits',
        sprint: true,
      },
      {
        icon: History,
        label: 'Historial de Movimientos',
        href: '/inventory/movements',
        sprint: true,
      },
      {
        icon: PackageX,
        label: 'Pedidos con fallos',
        href: '/inventory/incidents',
        sprint: true,
      },
    ],
  },
];

const BACKLOG_HREFS = new Set([
  '/inventory/alerts',
  '/inventory/history',
  '/inventory/reserved',
  '/inventory/out-of-stock',
]);

export default function SideBarInventory({ pathname }: SideBarInventoryProps) {
  return (
    <aside
      className="
        hidden md:flex
        w-58 shrink-0 flex-col
        bg-(--theme-card-bg)
        border-r border-(--theme-border)
        px-3 pt-4 pb-4
        sticky top-0 h-screen
        overflow-y-auto overflow-x-hidden
      "
    >
      {/* logo repetido??? 
      <div className="flex items-center gap-2.5 px-2 pb-5 mb-5 border-b border-(--theme-border)">
        <span className="font-display font-black text-base text-(--theme-text) tracking-tight leading-none">
          sansi<span className="text-primary">store</span>
        </span>
      </div>
      */}


      {NAV_SECTIONS.map((section, si) => (
        <div key={si} className="mb-6">
          <span
            className="
              block text-xs
              font-bold tracking-[0.14em]
              uppercase text-(--theme-text)
              opacity-35 px-2.5 mb-1.5
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
