import { useState, useEffect } from 'react';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { getMyReturns } from '../services/ordersService';
import ReturnCard from './ReturnCard';
import type { ReturnRequest } from '../types';
import { RotateCcw, ArrowLeft, Package } from 'lucide-react';

const STATUS_ORDER = ['pending', 'approved', 'in_transit', 'completed', 'rejected', 'pending_review'];

const FILTER_LABELS: Record<string, string> = {
  all: 'Todas',
  pending: 'Pendientes',
  approved: 'Aprobadas',
  in_transit: 'En tránsito',
  completed: 'Completadas',
  rejected: 'Rechazadas',
};

export default function MyReturnsView() {
  const { user, authReady } = useAuthUser();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    if (!authReady) return;
    if (!user) { setLoading(false); return; }

    getMyReturns(user.uid)
      .then((data) => {
        // Sort by most recent first, then by status priority
        const sorted = [...data].sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() ?? 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() ?? 0;
          return bTime - aTime;
        });
        setReturns(sorted);
      })
      .catch((err) => console.error('Error cargando devoluciones:', err))
      .finally(() => setLoading(false));
  }, [user, authReady]);

  const filtered = activeFilter === 'all'
    ? returns
    : returns.filter((r) => r.status === activeFilter);

  const counts: Record<string, number> = { all: returns.length };
  returns.forEach((r) => {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
  });

  if (!authReady || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-(--theme-text)">
        <span className="animate-pulse font-medium text-sm">Cargando devoluciones...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 text-center opacity-60">
        <p className="text-sm">Debes iniciar sesión para ver tus devoluciones.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans text-(--theme-text)">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <a
          href="/mis-pedidos"
          className="p-2 hover:bg-(--theme-secondary-bg) rounded-full transition-colors opacity-70 hover:opacity-100"
          title="Volver a mis pedidos"
        >
          <ArrowLeft size={20} />
        </a>
        <div>
          <h1 className="text-2xl font-display font-extrabold tracking-tight flex items-center gap-3">
            <RotateCcw className="text-primary" size={28} />
            Mis Devoluciones
          </h1>
          <p className="text-sm opacity-60 mt-1">
            Seguimiento de todas tus solicitudes de devolución
          </p>
        </div>
      </div>

      {/* Status filters */}
      {returns.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {Object.entries(FILTER_LABELS).map(([key, label]) => {
            const count = counts[key] ?? 0;
            if (key !== 'all' && count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  activeFilter === key
                    ? 'bg-primary text-(--theme-bg) border-primary'
                    : 'border-(--theme-border) opacity-60 hover:opacity-100'
                }`}
              >
                {label} {count > 0 && <span className="ml-1 opacity-80">({count})</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {returns.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-(--theme-border) rounded-2xl flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-(--theme-secondary-bg) opacity-60">
            <Package size={32} />
          </div>
          <div className="opacity-60">
            <p className="font-semibold text-sm">No tienes solicitudes de devolución</p>
            <p className="text-xs mt-1">
              Puedes solicitar una devolución desde el detalle de un pedido entregado.
            </p>
          </div>
          <a
            href="/mis-pedidos"
            className="mt-2 text-xs font-bold text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Ver mis pedidos →
          </a>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-(--theme-border) rounded-2xl opacity-60">
          <p className="text-sm">No hay devoluciones con este estado.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((ret) => (
            <ReturnCard key={ret.id} returnReq={ret} />
          ))}
        </div>
      )}
    </div>
  );
}
