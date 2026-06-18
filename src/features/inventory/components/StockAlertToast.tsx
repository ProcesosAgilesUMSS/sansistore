import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

export default function StockAlertToast() {
  const [count, setCount] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.location.pathname !== '/inventory') {
      return;
    }

    const load = async () => {
      const snapshot = await getDocs(collection(db, 'inventory'));

      const lowStockCount = snapshot.docs.filter((doc) => {
        const item = doc.data();

        return item.stockAvailable <= item.minStock;
      }).length;

      if (lowStockCount > 0) {
        setCount(lowStockCount);
        setVisible(true);

        setTimeout(() => {
          setVisible(false);
        }, 6000);
      }
    };

    load();
  }, []);

  if (!visible || count === null) return null;

  return (
    <div className="fixed top-20 right-6 z-50 animate-[slideUp_0.25s_ease-out]">
      <div
        className="relative overflow-hidden rounded-xl border shadow-xl backdrop-blur-sm"
        style={{
          backgroundColor: 'var(--theme-warning-bg)',
          borderColor: 'var(--theme-warning-border)',
          color: 'var(--theme-warning)',
          minWidth: '360px',
          maxWidth: '420px',
        }}
      >
        {/* Barra lateral */}
        <div
          className="absolute left-0 top-0 h-full w-1"
          style={{
            backgroundColor: 'var(--theme-warning)',
          }}
        />

        <div className="flex items-start gap-3 p-4">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--theme-warning) 15%, transparent)',
            }}
          >
            <FiAlertTriangle size={20} />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-sm">Alerta de inventario</h3>

            <p className="mt-1 text-sm opacity-90">
              Existen{' '}
              <strong>
                {count} producto{count !== 1 ? 's' : ''}
              </strong>{' '}
              por debajo del stock mínimo.
            </p>
          </div>

          <button
            onClick={() => setVisible(false)}
            className="opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Cerrar alerta"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Barra de progreso */}
        <div
          className="absolute bottom-0 left-0 h-1"
          style={{
            backgroundColor: 'var(--theme-warning)',
            animation: 'toastProgress 6s linear forwards',
          }}
        />
      </div>
    </div>
  );
}
