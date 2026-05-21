import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Tag,
  Settings,
  BarChart2,
  Package,
  Bike,
  FileText,
  ShoppingBag,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ArrowLeft, // <- Agregado para el botón de retroceso
} from 'lucide-react';
import UserManagement from '../users/components/UserManagement.tsx';
import CategoryList from '../categories/components/CategoryList.tsx';
import DailySales from '../ventas/components/DailySales.tsx';
import TopSellingProducts from '../ventas/top-products/components/TopSellingProducts.tsx';

type Section =
  | 'dashboard'
  | 'usuarios'
  | 'categorias'
  | 'ventas-diarias'
  | 'mas-vendidos'
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

  const navSections: NavSection[] = [
    {
      title: 'Principal',
      items: [
        {
          label: 'Dashboard',
          icon: <LayoutDashboard size={15} />,
          section: 'dashboard',
        },
        {
          label: 'Pedidos',
          icon: <ShoppingBag size={15} />,
          section: null,
          badge: 8,
          disabled: true,
        },
      ],
    },
    {
      title: 'Configuración',
      items: [
        {
          label: 'Usuarios',
          icon: <Users size={15} />,
          section: 'usuarios',
        },
        {
          label: 'Categorías',
          icon: <Tag size={15} />,
          section: 'categorias',
        },
        {
          // ── HU #152: Parámetros del sistema ──
          // Antes estaba disabled:true, ahora está habilitado
          label: 'Parámetros',
          icon: <Settings size={15} />,
          section: 'parametros',
        },
      ],
    },
    {
      title: 'Analítica',
      items: [
        { label: 'Ventas', icon: <BarChart2 size={15} />, section: 'ventas-diarias' },
        { label: 'Inventario', icon: <Package size={15} />, section: null, disabled: true },
        { label: 'Mensajeros', icon: <Bike size={15} />, section: null, disabled: true },
        { label: 'Reportes', icon: <FileText size={15} />, section: null, disabled: true },
      ],
    },
  ];

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Panel de administración' },
    usuarios: { title: 'Gestión de usuarios', subtitle: 'Registra y administra usuarios' },
    categorias: { title: 'Categorías', subtitle: 'Gestiona las categorías de productos' },
    'ventas-diarias': { title: 'Ventas diarias', subtitle: 'Monitorea el rendimiento diario de ventas' },
    'mas-vendidos': { title: 'Más vendidos', subtitle: 'Productos con más unidades vendidas' },
  };

  const currentPage = pageTitles[activeSection ?? 'dashboard'];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--theme-bg)]">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static z-30 h-full flex flex-col
          w-[220px] bg-[#1a2318] border-r border-white/5
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-[#88b04b] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            S
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold text-white/90">SansiStore</span>
            <span className="text-[10px] text-[#88b04b]/70 tracking-wide uppercase">Admin · Área 7</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="text-[10px] uppercase tracking-widest text-white/25 px-3 mb-1">
                {section.title}
              </p>
              {section.items.map((item) => {
                if (item.label === 'Ventas') {
                  return (
                    <div key={item.label} className="mb-1">
                      <button
                        onClick={() => setVentasOpen(!ventasOpen)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]
                        text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
                      >
                        <span>{item.icon}</span>
                        <span className="flex-1 text-left">Ventas</span>
                        <ChevronRight
                          size={12}
                          className={`transition-transform ${ventasOpen ? 'rotate-90' : ''}`}
                        />
                      </button>

                      {ventasOpen && (
                        <div className="ml-7 mt-1 space-y-1">
                          <button
                            onClick={() => {
                              setActiveSection('ventas-diarias');
                              setSidebarOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-[12px]
                            transition-colors ${
                              activeSection === 'ventas-diarias'
                                ? 'bg-[#88b04b]/15 text-[#88b04b]'
                                : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                            }`}
                          >
                            Ventas diarias
                          </button>

                          <button
                            onClick={() => {
                              setActiveSection('mas-vendidos');
                              setSidebarOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-[12px]
                            transition-colors ${
                              activeSection === 'mas-vendidos'
                                ? 'bg-[#88b04b]/15 text-[#88b04b]'
                                : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                            }`}
                          >
                            Más vendidos
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
                        ? 'bg-[#88b04b]/15 text-[#88b04b]'
                        : item.disabled
                        ? 'text-white/20 cursor-not-allowed'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5 cursor-pointer'
                      }
                    `}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] bg-[#88b04b] text-white px-1.5 py-0.5 rounded-full font-medium">
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

        {/* Footer */}
        <div className="px-3 py-3 border-t border-white/5">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer group">
            <div className="w-7 h-7 rounded-full bg-[#88b04b]/20 flex items-center justify-center text-[11px] font-semibold text-[#88b04b] flex-shrink-0">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-white/80 font-medium truncate">Admin Demo</p>
              <p className="text-[10px] text-white/30 truncate">Administrador</p>
            </div>
            <LogOut size={13} className="text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#fafafa]">

        {/* Topbar: Modificado para replicar el Mockup */}
        <header className="flex items-center justify-between px-6 py-5 md:px-10 md:py-6 bg-[#0a0a0a]">
          <div className="flex items-center gap-4 md:gap-8">
            {/* Menú Hamburguesa Mobile */}
            <button
              className="md:hidden p-1 text-white/50 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Grupo de Título y Botón Volver */}
            <div className="flex items-center gap-4 md:gap-8">
              {activeSection !== 'dashboard' && (
                <button
                  onClick={() => setActiveSection('dashboard')}
                  className="hidden md:flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium"
                >
                  <ArrowLeft size={16} /> Dashboard
                </button>
              )}
              
              <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">
                {currentPage.title}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Badge Área 7 */}
             <div className="px-5 py-1.5 border border-[#88b04b] text-[#88b04b] rounded-full text-xs md:text-sm font-medium tracking-wide">
               Área 7
             </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          {activeSection === 'dashboard' && (
            <div className="flex items-center justify-center h-full text-black/30 text-sm font-medium">
              Dashboard principal — Próximamente
            </div>
          )}
          {activeSection === 'usuarios' && (
            <UserManagement />
          )}
          {activeSection === 'categorias' && (
            <CategoryList />
          )}
          {activeSection === 'ventas-diarias' && (
            <DailySales />
          )}
          {activeSection === 'mas-vendidos' && (
            <TopSellingProducts />
          )}
        </main>

      </div>
    </div>
  );
}