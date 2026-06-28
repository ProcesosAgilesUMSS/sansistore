import { useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Menu,
  PackageCheck,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import MessengerDashboard from './MessengerDashboard';

type DeliverySection = 'assigned' | 'accepted' | 'reprogrammed' | 'delivered' | 'not_delivered';

const sections: Array<{ id: DeliverySection; label: string; icon: React.ReactNode }> = [
  { id: 'assigned', label: 'Gestión Entregas', icon: <Truck size={15} /> },
  { id: 'accepted', label: 'Pedidos aceptados', icon: <PackageCheck size={15} /> },
  { id: 'reprogrammed', label: 'Reprogramados', icon: <CalendarClock size={15} /> },
  { id: 'not_delivered', label: 'No entregados', icon: <XCircle size={15} /> },
  { id: 'delivered', label: 'Entregados', icon: <CheckCircle2 size={15} /> },
];

const sidebarItemActive = 'bg-primary/15 text-primary';
const sidebarItemInactive =
  'text-(--theme-text)/55 hover:text-(--theme-text) hover:bg-(--theme-text)/5';

export default function DeliveryActionsPanel() {
  const [activeSection, setActiveSection] = useState<DeliverySection>('assigned');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selectSection = (section: DeliverySection) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 self-stretch overflow-hidden bg-(--theme-bg)">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menu lateral"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 h-screen w-[256px]
          bg-(--theme-card-bg) border-r border-(--theme-border)
          transition-transform duration-300
          md:sticky md:top-14 md:z-0 md:h-[calc(100vh-3.5rem)] md:translate-x-0
          md:bg-transparent md:border-(--theme-text)/8
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <nav className="h-full overflow-y-auto px-4 py-5">
          <p className="text-xs uppercase tracking-widest text-(--theme-text)/35 px-3 mb-2">
            Delivery
          </p>
          {sections.map((section) => {
            const active = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => selectSection(section.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors duration-150 text-left ${
                  active ? sidebarItemActive : `${sidebarItemInactive} cursor-pointer`
                }`}
              >
                <span className="shrink-0">{section.icon}</span>
                <span className="flex-1">{section.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-(--theme-bg)">
        <main className="admin-scrollbar flex-1 overflow-y-auto p-6 md:p-8">
          <button
            type="button"
            className="mb-4 flex items-center gap-2 rounded-lg border border-(--theme-border) px-3 py-2 text-sm text-(--theme-text)/70 md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            Menú
          </button>

          <MessengerDashboard clientSection={activeSection} embedded />
        </main>
      </div>
    </div>
  );
}
