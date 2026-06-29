import {
  ArrowLeftRight,
  LayoutDashboard,
  PackagePlus,
  PackageSearch,
  ArrowDownUp,
  History,
  PackageX,
} from 'lucide-react';
import type { NavGroup } from '../../../components/AppNavSidebar';

export const inventoryNavGroups: NavGroup[] = [
  {
    title: 'Inventario',
    items: [
      { label: 'Panel general', href: '/inventory', icon: LayoutDashboard },
      { label: 'Mis productos', href: '/inventory/products', icon: PackagePlus },
      { label: 'Mis empaques', href: '/inventory/packaging', icon: PackageSearch },
      { label: 'Entrada y salida stock', href: '/inventory/entrysExits', icon: ArrowDownUp },
      { label: 'Historial de movimientos', href: '/inventory/movements', icon: History },
      { label: 'Pedidos con fallos', href: '/inventory/incidents', icon: PackageX },
    ],
  },
];
