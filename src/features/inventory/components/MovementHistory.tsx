import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { ArrowDownRight, ArrowUpRight, PlusCircle, Clock } from 'lucide-react';

interface Movement {
  id: string;
  productId: string;
  type: 'ENTRADA' | 'SALIDA' | 'INICIALIZACION';
  quantity: number;
  reason: string;
  date: any;
}

export const MovementHistory: React.FC = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ultimos 10 movimientos ordenados por fecha
    const q = query(
      collection(db, 'inventoryMovements'),
      orderBy('date', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Movement[];
      setMovements(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-sm opacity-50">Cargando historial...</div>;
  }

  return (
    <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl p-6 shadow-sm h-full max-h-[600px] overflow-y-auto">
      <div className="flex items-center gap-2 mb-6 border-b border-(--theme-border) pb-4">
        <Clock className="w-5 h-5 opacity-60 text-(--theme-text)" />
        <h2 className="font-['Outfit'] font-bold text-lg text-(--theme-text)">
          Últimos Movimientos
        </h2>
      </div>

      <div className="space-y-4">
        {movements.length === 0 ? (
          <p className="text-sm opacity-40 text-center py-4">No hay movimientos registrados.</p>
        ) : (
          movements.map((mov) => (
            <div key={mov.id} className="flex items-center justify-between p-3 rounded-2xl bg-(--theme-secondary-bg) border border-(--theme-border)/50">
              <div className="flex items-center gap-3">
                {/* Icono dinámico según el tipo */}
                <div className={`p-2 rounded-xl ${
                  mov.type === 'ENTRADA' ? 'bg-green-500/15 text-green-500' :
                  mov.type === 'SALIDA' ? 'bg-red-500/15 text-red-500' :
                  'bg-primary/15 text-primary'
                }`}>
                  {mov.type === 'ENTRADA' && <ArrowDownRight className="w-4 h-4" />}
                  {mov.type === 'SALIDA' && <ArrowUpRight className="w-4 h-4" />}
                  {mov.type === 'INICIALIZACION' && <PlusCircle className="w-4 h-4" />}
                </div>
                
                <div>
                  <p className="text-sm font-bold text-(--theme-text) line-clamp-1">
                    {mov.productId}
                  </p>
                  <p className="text-[0.65rem] uppercase tracking-widest opacity-50">
                    {mov.type} • {mov.reason}
                  </p>
                </div>
              </div>
              
              <div className={`font-mono font-bold ${
                mov.type === 'SALIDA' ? 'text-red-400' : 'text-green-500'
              }`}>
                {mov.type === 'SALIDA' ? '-' : '+'}{mov.quantity}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};