import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import MessengerDashboard from './MessengerDashboard';

type DeliverySection = 'assigned' | 'accepted' | 'reprogrammed' | 'delivered' | 'not_delivered';

const sections: Array<{ id: DeliverySection; label: string }> = [
  { id: 'assigned', label: 'Gestión Entregas' },
  { id: 'accepted', label: 'Pedidos aceptados' },
  { id: 'reprogrammed', label: 'Reprogramados' },
  { id: 'not_delivered', label: 'No entregados' },
  { id: 'delivered', label: 'Entregados ' },
];

export default function DeliveryActionsPanel() {
  const [activeSection, setActiveSection] =
    useState<DeliverySection>('assigned');
  const [menuOpen, setMenuOpen] = useState(false);

  const selectSection = (section: DeliverySection) => {
    setActiveSection(section);
    setMenuOpen(false);
  };

  return (
    <section className="flex min-h-[calc(100vh-3.5rem)] flex-col items-stretch gap-4 p-4">
      <nav className="rounded-xl border border-border-light bg-card-bg-light p-3 shadow-sm">
        <p className="mb-3 px-2 text-xs font-semibold uppercase text-primary">
          Delivery
        </p>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex w-full items-center justify-between rounded-xl border border-primary bg-secondary-bg-light p-2 text-left text-sm font-semibold text-primary md:hidden"
        >
          <span>
            {sections.find((section) => section.id === activeSection)?.label}
          </span>
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {menuOpen && (
          <div className="mt-2 space-y-2">
            {sections.map((section) => {
              const active = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => selectSection(section.id)}
                  className={`w-full rounded-xl p-2 text-left text-sm font-medium transition ${
                    active
                      ? 'bg-secondary-bg-light text-primary'
                      : 'opacity-70 hover:bg-secondary-bg-light hover:text-primary hover:opacity-100'
                  }`}
                >
                  {section.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="hidden gap-2 md:grid md:grid-cols-4">
          {sections.map((section) => {
            const active = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => selectSection(section.id)}
                className={`w-full rounded-xl border p-3 text-center text-sm font-medium transition ${
                  active
                    ? 'border-primary bg-secondary-bg-light text-primary'
                    : 'border-transparent opacity-70 hover:bg-secondary-bg-light hover:text-primary hover:opacity-100'
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </nav>

      <section className="min-h-[calc(100vh-5.5rem)] min-w-0 flex-1">
        <MessengerDashboard clientSection={activeSection} embedded />
      </section>
    </section>
  );
}
