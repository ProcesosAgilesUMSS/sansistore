import {
  ClipboardList,
  FileText,
  PackageCheck,
  PackageX,
  ShoppingBag,
  ShoppingCart,
  Tag,
  TriangleAlert,
  Truck,
  Wallet,
} from 'lucide-react';
import type { NavGroup } from '../../../components/AppNavSidebar';

export const sellerNavGroups: NavGroup[] = [
  {
    title: 'Pedidos',
    items: [
      { label: 'Mis pedidos', href: '/seller/orders', icon: ShoppingBag },
      { label: 'Pedidos creados', href: '/seller/created-orders', icon: ClipboardList },
      { label: 'Pedidos listos', href: '/seller/ready-orders', icon: PackageCheck },
      { label: 'Pedidos rechazados', href: '/seller/rejected-orders', icon: PackageX },
      { label: 'Pedidos no entregados', href: '/seller/undelivered-orders', icon: Truck },
      { label: 'Historial de pedidos', href: '/seller/order-history', icon: FileText },
    ],
  },
  {
    title: 'Registrar',
    items: [
      { label: 'Registrar compra', href: '/seller/purchase', icon: ShoppingCart },
      { label: 'Registrar oferta', href: '/seller/offers', icon: Tag },
    ],
  },
  {
    title: 'Operación',
    items: [
      { label: 'Incidencias', href: '/seller/incidents', icon: TriangleAlert },
      { label: 'Pagos registrados', href: '/seller/daily-collections', icon: Wallet },
      { label: 'Motivos de fallo', href: '/seller/failure-reasons', icon: TriangleAlert },
    ],
  },
];
