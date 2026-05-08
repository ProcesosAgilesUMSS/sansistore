import { useState } from 'react';
import MessengerDashboard from './MessengerDashboard';

type DeliverySection = 'assigned' | 'delivered';

const sections: Array<{ id: DeliverySection; label: string }> = [
  { id: 'assigned', label: 'Pedidos asignados' },
  { id: 'delivered', label: 'Entregados hoy' },
];

export default function DeliveryActionsPanel() {
  const [activeSection, setActiveSection] = useState<DeliverySection>('assigned');

  return (
    <section className="flex min-h-[calc(100vh-3.5rem)] flex-col items-stretch gap-4 p-4 lg:flex-row">
      <aside className="w-full rounded-xl border border-border-light bg-card-bg-light p-3 lg:min-h-[calc(100vh-5.5rem)] lg:w-56 lg:shrink-0">
        <p className="mb-3 px-2 text-xs font-semibold uppercase text-primary">
          Delivery
        </p>

        <div className="space-y-2">
          {sections.map((section) => {
            const active = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`w-full rounded-xl p-2 text-left text-sm font-medium transition ${
                  active
                    ? 'border border-primary bg-secondary-bg-light text-primary'
                    : 'opacity-70 hover:bg-secondary-bg-light hover:text-primary hover:opacity-100'
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="min-h-[calc(100vh-5.5rem)] min-w-0 flex-1 rounded-xl border border-border-light bg-card-bg-light p-4">
        <MessengerDashboard clientSection={activeSection} embedded />
      </section>
    </section>
  );
}
