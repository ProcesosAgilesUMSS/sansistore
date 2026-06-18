import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BarChart2,
  Bike,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Scale,
  Settings,
  ShoppingBag,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import AccessLogPanel from '../audit/components/AccessLogPanel.tsx';
import CategoryList from '../categories/components/CategoryList.tsx';
import DemandPanel from '../demand/components/DemandPanel.tsx';
import MessengerPerformancePage from '../messengers/performance/MessengerPerformancePage.tsx';
import SellerActivityPanel from '../monitoring/components/SellerActivityPanel.tsx';
import OrderReceptionPanel from '../orders/components/OrderReceptionPanel.tsx';
import OrderHistory from '../pedidos/components/OrderHistory.tsx';
import PaymentAuditPanel from '../pedidos/payment-audit/components/PaymentAuditPanel.tsx';
import PaymentReconciliationPanel from '../reconciliation/components/PaymentReconciliationPanel.tsx';
import CancelledOrdersReport from '../reports/components/CancelledOrdersReport.tsx';
import SalesReport from '../analytics/components/SalesReport.tsx';
import ConfigPanel from '../settings/components/ConfigPanel.tsx';
import UserManagement from '../users/components/UserManagement.tsx';
import DailySales from '../ventas/components/DailySales.tsx';
import TopSellingProducts from '../ventas/top-products/components/TopSellingProducts.tsx';

type Section =
  | 'dashboard'
  | 'pedidos'
  | 'historial'
  | 'auditoria-cobros'
  | 'conciliacion-pagos'
  | 'usuarios'
  | 'categorias'
  | 'ventas-diarias'
  | 'mas-vendidos'
  | 'mensajeros-desempeno'
  | 'parametros'
  | 'reportes'
  | 'reportes-cancelados'
  | 'bitacora'
  | 'monitoreo'
  | 'demanda-horarios'
  | null;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  section: Section;
  badge?: number;
  disabled?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function AdminLayout() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ventasOpen, setVentasOpen] = useState(true);
  const [reportesOpen, setReportesOpen] = useState(false);
  const [pedidosOpen, setPedidosOpen] = useState(true);
  const [mensajerosOpen, setMensajerosOpen] = useState(true);
  const [userName, setUserName] = useState('Administrador');
  const [userInitials, setUserInitials] = useState('AD');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const displayName = snap.exists()
          ? (snap.data().displayName ?? user.displayName ?? 'Administrador')
          : (user.displayName ?? 'Administrador');
        setUserName(displayName);
        const parts = displayName.trim().split(' ');
        const initials = parts.length >= 2
          ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
          : displayName.slice(0, 2).toUpperCase();
        setUserInitials(initials);
      } catch {
        setUserName(user.displayName ?? 'Administrador');
        setUserInitials((user.displayName ?? 'AD').slice(0, 2).toUpperCase());
      }
    });
    return unsub;
  }, []);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        window.location.href = '/login';
      })
      .catch(console.error);
  };

  const navSections: NavSection[] = [
    {
      title: 'Principal',
      items: [
        { label: 'Dashboard', icon: <LayoutDashboard size={15} />, section: 'dashboard' },
        { label: 'Pedidos', icon: <ShoppingBag size={15} />, section: 'pedidos' },
      ],
    },
    {
      title: 'Configuración',
      items: [
        { label: 'Usuarios', icon: <Users size={15} />, section: 'usuarios' },
        { label: 'Categorías', icon: <Tag size={15} />, section: 'categorias' },
        { label: 'Parámetros', icon: <Settings size={15} />, section: 'parametros' },
        { label: 'Bitácora', icon: <ClipboardList size={15} />, section: 'bitacora' },
        { label: 'Monitoreo', icon: <Activity size={15} />, section: 'monitoreo' },
      ],
    },
    {
      title: 'Analítica',
      items: [
        { label: 'Ventas', icon: <BarChart2 size={15} />, section: 'ventas-diarias' },
        { label: 'Inventario', icon: <Package size={15} />, section: null, disabled: true },
        { label: 'Mensajeros', icon: <Bike size={15} />, section: null, disabled: true },
        { label: 'Reportes', icon: <FileText size={15} />, section: 'reportes' },
      ],
    },
  ];

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Panel de administración' },
    pedidos: { title: 'Pedidos', subtitle: 'Validación de recepción por comprador' },
    historial: { title: 'Historial de pedido', subtitle: 'Auditoría completa del pedido' },
    'auditoria-cobros': {
      title: 'Auditoría de cobros',
      subtitle: 'Registro detallado de cobros confirmados por pedido',
    },
    'conciliacion-pagos': {
      title: 'Conciliacion de pagos',
      subtitle: 'Diferencias entre pedidos entregados y pagos registrados',
    },
    usuarios: { title: 'Gestión de usuarios', subtitle: 'Registra y administra usuarios' },
    categorias: { title: 'Categorías', subtitle: 'Gestiona las categorías de productos' },
    'ventas-diarias': { title: 'Ventas diarias', subtitle: 'Monitorea el rendimiento diario de ventas' },
    'mensajeros-desempeno': { title: 'Desempeño de mensajeros', subtitle: 'Métricas de eficiencia por mensajero' },
    'mas-vendidos': { title: 'Más vendidos', subtitle: 'Productos con más unidades vendidas' },
    parametros: { title: 'Parámetros del sistema', subtitle: 'Configura los parámetros globales del sistema' },
    reportes: { title: 'Reportes de ventas', subtitle: 'Genera reportes de ventas por rango de fechas' },
    bitacora: { title: 'Bitácora', subtitle: 'Registra actividad de inicio y cierre de sesión' },
    'reportes-cancelados': { title: 'Pedidos cancelados', subtitle: 'Reporte de órdenes canceladas por período' },
    monitoreo: { title: 'Monitoreo de vendedores', subtitle: 'Bitácora de actividad y cambios de estado en pedidos' },
    'demanda-horarios': { title: 'Demanda por horarios', subtitle: 'Análisis de pedidos agrupados por franja horaria' },
  };

  const currentPage = pageTitles[activeSection ?? 'dashboard'];
  const sidebarItemActive = 'bg-primary/15 text-primary';
  const sidebarItemInactive = 'text-(--theme-text)/40 hover:text-(--theme-text)/80 hover:bg-(--theme-text)/5';
  const sidebarSubItemClass = (active: boolean) =>
    `w-full text-left px-3 py-2 rounded-lg text-[12px] transition-colors ${active ? sidebarItemActive : sidebarItemInactive}`;

  return (
    <div className="flex h-screen overflow-hidden bg-(--theme-bg)">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:static z-30 h-full flex flex-col
          w-[220px] bg-(--theme-card-bg) border-r border-(--theme-border)
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-(--theme-border)">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            S
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold text-(--theme-text)">SansiStore</span>
            <span className="text-[10px] text-primary/70 tracking-wide uppercase">Admin · Área 7</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="text-[10px] uppercase tracking-widest text-(--theme-text)/25 px-3 mb-1">
                {section.title}
              </p>
              {section.items.map((item) => {
                if (item.label === 'Pedidos') {
                  return (
                    <div key={item.label} className="mb-1">
                      <button
                        onClick={() => setPedidosOpen(!pedidosOpen)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${sidebarItemInactive}`}
                      >
                        <span>{item.icon}</span>
                        <span className="flex-1 text-left">Pedidos</span>
                        <ChevronRight size={12} className={`transition-transform ${pedidosOpen ? 'rotate-90' : ''}`} />
                      </button>
                      {pedidosOpen && (
                        <div className="ml-7 mt-1 space-y-1">
                          <button onClick={() => { setActiveSection('pedidos'); setSidebarOpen(false); }}
                            className={sidebarSubItemClass(activeSection === 'pedidos')}>
                            Recepción
                          </button>
                          <button onClick={() => { setActiveSection('historial'); setSidebarOpen(false); }}
                            className={`${sidebarSubItemClass(activeSection === 'historial')} flex items-center gap-1.5`}>
                            <ClipboardList size={11} /> Historial
                          </button>
                          <button onClick={() => { setActiveSection('auditoria-cobros'); setSidebarOpen(false); }}
                            className={sidebarSubItemClass(activeSection === 'auditoria-cobros')}>
                            Auditoría de cobros
                          </button>
                          <button onClick={() => { setActiveSection('conciliacion-pagos'); setSidebarOpen(false); }}
                            className={`${sidebarSubItemClass(activeSection === 'conciliacion-pagos')} flex items-center gap-1.5`}>
                            <Scale size={11} /> Conciliacion
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                if (item.label === 'Ventas') {
                  return (
                    <div key={item.label} className="mb-1">
                      <button
                        onClick={() => setVentasOpen(!ventasOpen)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${sidebarItemInactive}`}
                      >
                        <span>{item.icon}</span>
                        <span className="flex-1 text-left">Ventas</span>
                        <ChevronRight size={12} className={`transition-transform ${ventasOpen ? 'rotate-90' : ''}`} />
                      </button>
                      {ventasOpen && (
                        <div className="ml-7 mt-1 space-y-1">
                          <button onClick={() => { setActiveSection('ventas-diarias'); setSidebarOpen(false); }}
                            className={sidebarSubItemClass(activeSection === 'ventas-diarias')}>
                            Ventas diarias
                          </button>
                          <button onClick={() => { setActiveSection('mas-vendidos'); setSidebarOpen(false); }}
                            className={sidebarSubItemClass(activeSection === 'mas-vendidos')}>
                            Más vendidos
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                if (item.label === 'Reportes') {
                  return (
                    <div key={item.label} className="mb-1">
                      <button
                        onClick={() => setReportesOpen(!reportesOpen)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${sidebarItemInactive}`}
                      >
                        <span>{item.icon}</span>
                        <span className="flex-1 text-left">Reportes</span>
                        <ChevronRight size={12} className={`transition-transform ${reportesOpen ? 'rotate-90' : ''}`} />
                      </button>
                      {reportesOpen && (
                        <div className="ml-7 mt-1 space-y-1">
                          <button onClick={() => { setActiveSection('reportes'); setSidebarOpen(false); }}
                            className={sidebarSubItemClass(activeSection === 'reportes')}>
                            Ventas por fecha
                          </button>
                          <button onClick={() => { setActiveSection('reportes-cancelados'); setSidebarOpen(false); }}
                            className={sidebarSubItemClass(activeSection === 'reportes-cancelados')}>
                            Pedidos cancelados
                          </button>
                          <button onClick={() => { setActiveSection('demanda-horarios'); setSidebarOpen(false); }}
                            className={sidebarSubItemClass(activeSection === 'demanda-horarios')}>
                            Demanda por horarios
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                if (item.label === 'Mensajeros') {
                  return (
                    <div key={item.label} className="mb-1">
                      <button
                        onClick={() => setMensajerosOpen(!mensajerosOpen)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${sidebarItemInactive}`}
                      >
                        <span>{item.icon}</span>
                        <span className="flex-1 text-left">Mensajeros</span>
                        <ChevronRight size={12} className={`transition-transform ${mensajerosOpen ? 'rotate-90' : ''}`} />
                      </button>
                      {mensajerosOpen && (
                        <div className="ml-7 mt-1 space-y-1">
                          <button onClick={() => { setActiveSection('mensajeros-desempeno'); setSidebarOpen(false); }}
                            className={sidebarSubItemClass(activeSection === 'mensajeros-desempeno')}>
                            Desempeño
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                const isActive = activeSection === item.section;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (!item.disabled && item.section) {
                        setActiveSection(item.section);
                        setSidebarOpen(false);
                      }
                    }}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] mb-0.5
                      transition-colors duration-150 text-left
                      ${isActive
                        ? sidebarItemActive
                        : item.disabled
                          ? 'text-(--theme-text)/20 cursor-not-allowed'
                          : `${sidebarItemInactive} cursor-pointer`
                      }
                    `}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-medium">
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight size={12} className="opacity-50" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-(--theme-border)">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[11px] font-semibold text-primary flex-shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-(--theme-text) font-medium truncate">{userName}</p>
              <p className="text-[10px] text-(--theme-text)/30 truncate">Administrador</p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-(--theme-text)/30 hover:text-(--theme-error) hover:bg-(--theme-error-bg) transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-(--theme-bg)">
        <header className="flex items-center justify-between px-6 py-3 md:px-8 md:py-3 bg-(--theme-card-bg) border-b border-(--theme-border)">
          <div className="flex items-center gap-3 md:gap-6">
            <button
              className="md:hidden p-1 text-(--theme-text)/50 hover:text-(--theme-text) transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {activeSection !== 'dashboard' && (
              <button
                onClick={() => setActiveSection('dashboard')}
                className="hidden md:flex items-center gap-1.5 text-(--theme-text)/40 hover:text-(--theme-text) transition-colors text-[13px] font-medium"
              >
                <ArrowLeft size={14} /> Dashboard
              </button>
            )}

            <div>
              <h1 className="text-[16px] md:text-[18px] font-bold text-(--theme-text) tracking-tight">
                {currentPage?.title}
              </h1>
              {currentPage?.subtitle && (
                <p className="hidden md:block text-[11px] text-(--theme-text)/40 mt-0.5">
                  {currentPage.subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-1 border border-primary text-primary rounded-full text-[11px] font-medium tracking-wide">
              Área 7
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeSection === 'dashboard' && (
            <div className="flex items-center justify-center h-full text-(--theme-text)/30 text-sm font-medium">
              Dashboard principal — Próximamente
            </div>
          )}
          {activeSection === 'usuarios' && <UserManagement />}
          {activeSection === 'pedidos' && <OrderReceptionPanel />}
          {activeSection === 'categorias' && <CategoryList />}
          {activeSection === 'ventas-diarias' && <DailySales />}
          {activeSection === 'mas-vendidos' && <TopSellingProducts />}
          {activeSection === 'mensajeros-desempeno' && <MessengerPerformancePage />}
          {activeSection === 'parametros' && <ConfigPanel />}
          {activeSection === 'reportes' && <SalesReport />}
          {activeSection === 'bitacora' && <AccessLogPanel />}
          {activeSection === 'monitoreo' && <SellerActivityPanel />}
          {activeSection === 'reportes-cancelados' && <CancelledOrdersReport />}
          {activeSection === 'historial' && <OrderHistory />}
          {activeSection === 'demanda-horarios' && <DemandPanel />}
          {activeSection === 'auditoria-cobros' && <PaymentAuditPanel />}
          {activeSection === 'conciliacion-pagos' && <PaymentReconciliationPanel />}
        </main>
      </div>
    </div>
  );
}
