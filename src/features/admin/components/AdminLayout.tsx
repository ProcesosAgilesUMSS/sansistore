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
} from 'lucide-react';
import UserManagement from '../users/components/UserManagement.tsx';
import CategoryList from '../categories/components/CategoryList.tsx';
import ConfigPanel from '../settings/components/ConfigPanel.tsx';

// Section define qué pantalla se muestra en el contenido principal
// null = ítem deshabilitado (aún no implementado)
type Section = 'dashboard' | 'usuarios' | 'categorias' | 'parametros' | null;

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
        { label: 'Ventas', icon: <BarChart2 size={15} />, section: null, disabled: true },
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
    parametros: { title: 'Parámetros del sistema', subtitle: 'Configura los parámetros globales del sistema' },
  };

  const currentPage = pageTitles[activeSection ?? 'dashboard'];

  const today = new Date().toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--theme-border)] bg-[var(--theme-card-bg)]">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1 text-[var(--theme-text)]/50 hover:text-[var(--theme-text)] transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <h1 className="text-[15px] font-semibold text-[var(--theme-text)]">
                {currentPage.title}
              </h1>
              <p className="text-[11px] text-[var(--theme-text)]/40">
                {currentPage.subtitle}
              </p>
            </div>
          </div>
          <span className="text-[11px] text-[var(--theme-text)]/35 hidden sm:block capitalize">
            {today}
          </span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">
          {activeSection === 'dashboard' && (
            <div className="flex items-center justify-center h-full text-[var(--theme-text)]/30 text-sm">
              Dashboard — próximamente
            </div>
          )}
          {activeSection === 'usuarios' && <UserManagement />}
          {activeSection === 'categorias' && <CategoryList />}
          {/* ── HU #152: renderiza ConfigPanel cuando se selecciona Parámetros ── */}
          {activeSection === 'parametros' && <ConfigPanel />}
        </main>

      </div>
    </div>
  );
}