import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  startAfter,
  getDoc,
  doc,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { ArrowDownRight, ArrowUpRight, PlusCircle, Clock, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';

interface Movement {
  id: string;
  productId: string;
  type: 'ENTRADA' | 'SALIDA' | 'INICIALIZACION' | 'VENTA';
  quantity: number;
  reason: string;
  operatorId?: string;
  createdAt: any;
  sequence?: number; // Agregado para que TypeScript reconozca el campo
}

export const MovementHistory: React.FC = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [operatorNames, setOperatorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Estados para Paginación
  const [page, setPage] = useState(1);
  const [isNextPageAvailable, setIsNextPageAvailable] = useState(false);
  
  // useRef para guardar los cursores de cada página sin re-renderizar
  const cursorsRef = useRef<Record<number, DocumentSnapshot>>({});

  const MOVEMENTS_PER_PAGE = 10;

  // Resuelve los nombres de operadores que aún no están en caché
  const resolveOperatorNames = async (movements: Movement[]) => {
    const idsToFetch = movements
      .map(m => m.operatorId)
      .filter((id): id is string => !!id && !operatorNames[id]);

    if (idsToFetch.length === 0) return;

    const uniqueIds = [...new Set(idsToFetch)];

    const fetched: Record<string, string> = {};
    await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const snap = await getDoc(doc(db, 'users', id));
          if (snap.exists()) {
            fetched[id] = snap.data().displayName ?? 'Sin nombre';
          } else {
            fetched[id] = 'Desconocido';
          }
        } catch {
          fetched[id] = 'Desconocido';
        }
      })
    );

    setOperatorNames(prev => ({ ...prev, ...fetched }));
  };

  useEffect(() => {
    setLoading(true);

    // Consulta base para la página 1 (QUITAMOS el orderBy sequence)
    let q = query(
      collection(db, 'inventoryMovements'),
      orderBy('createdAt', 'desc'),
      limit(MOVEMENTS_PER_PAGE + 1)
    );

    // Si estamos en la pag 2 o mayor, usamos el cursor guardado
    if (page > 1 && cursorsRef.current[page - 1]) {
      q = query(
        collection(db, 'inventoryMovements'),
        orderBy('createdAt', 'desc'),
        startAfter(cursorsRef.current[page - 1]),
        limit(MOVEMENTS_PER_PAGE + 1)
      );
    }

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        const docs = snapshot.docs;

        const hasNext = docs.length > MOVEMENTS_PER_PAGE;
        setIsNextPageAvailable(hasNext);

        const visibleDocs = hasNext ? docs.slice(0, -1) : docs;

        const data = visibleDocs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Movement[];

        //DESEMPATE EN EL CLIENT
        data.sort((a, b) => {
          //Extraemos los milisegundos de la fecha
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          
          //Si las fechas son diferentes, ordenamos normal
          if (timeB !== timeA) {
            return timeB - timeA; 
          }
          
          //Si es un EMPATE EXACTO (mismo milisegundo por el batch), usamos sequence
          const seqA = a.sequence || 0;
          const seqB = b.sequence || 0;
          return seqB - seqA;
        });
        // ----------------------------------------

        setMovements(data);
        
        cursorsRef.current[page] = visibleDocs[visibleDocs.length - 1];

        await resolveOperatorNames(data);
      } else {
        setMovements([]);
        setIsNextPageAvailable(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [page]);

  const handleNextPage = () => {
    if (isNextPageAvailable) setPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(prev => prev - 1);
  };

  const typeConfig = {
    ENTRADA: {
      icon: <ArrowDownRight className="w-4 h-4" />,
      style: 'bg-primary/10 text-primary',
      amountColor: 'text-primary',
      sign: '+',
    },
    SALIDA: {
      icon: <ArrowUpRight className="w-4 h-4" />,
      style: 'bg-(--theme-error-bg) text-(--theme-error)',
      amountColor: 'text-(--theme-error)',
      sign: '-',
    },
    INICIALIZACION: {
      icon: <PlusCircle className="w-4 h-4" />,
      style: 'bg-primary/10 text-primary',
      amountColor: 'text-primary',
      sign: '+',
    },
    VENTA: {
      icon: <ShoppingCart className="w-4 h-4" />,
      style: 'bg-(--theme-info-bg) text-(--theme-info)',
      amountColor: 'text-(--theme-info)',
      sign: '-',
    },
  };

  if (loading && movements.length === 0) {
    return <div className="p-4 text-center text-sm opacity-50 font-display">Cargando historial...</div>;
  }

  return (
    <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6 border-b border-(--theme-border) pb-4">
        <Clock className="w-5 h-5 opacity-60 text-(--theme-text)" />
        <h2 className="font-display font-bold text-lg text-(--theme-text)">
          Movimientos de Inventario
        </h2>
      </div>

      <div className="space-y-4 flex-grow overflow-y-auto pr-1 min-h-[400px]">
        {movements.length === 0 ? (
          <p className="text-sm opacity-40 text-center py-10 font-display">No hay movimientos registrados.</p>
        ) : (
          movements.map((mov) => {
            const config = typeConfig[mov.type] ?? typeConfig.SALIDA;
            const operatorName = mov.operatorId ? (operatorNames[mov.operatorId] ?? 'Cargando...') : null;

            return (
              <div key={mov.id} className="flex items-center justify-between p-3 rounded-2xl bg-(--theme-secondary-bg) border border-(--theme-border)/50 transition-all hover:border-primary/30">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${config.style}`}>
                    {config.icon}
                  </div>

                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-(--theme-text) line-clamp-1">
                      {mov.productId}
                    </p>
                    <p className="text-xs uppercase tracking-widest opacity-50 font-bold">
                      {mov.type} • {mov.reason}
                    </p>
                    {operatorName && (
                      <p className="text-xs uppercase tracking-widest opacity-50 font-bold">
                        {mov.type === 'VENTA' ? 'VENDEDOR' : 'OPERADOR'} • {operatorName}
                      </p>
                    )}
                  </div>
                </div>

                <div className={`font-mono font-bold text-base ${config.amountColor}`}>
                  {config.sign}{mov.quantity}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PAGINACIÓN */}
      <div className="mt-6 pt-4 border-t border-(--theme-border) flex items-center justify-between">
        <span className="text-xs font-display text-(--theme-text) opacity-50">
          Página <span className="font-bold text-primary">{page}</span>
        </span>

        <div className="flex gap-2">
          <button
            onClick={handlePrevPage}
            disabled={page === 1 || loading}
            className="p-2 rounded-xl border border-(--theme-border) bg-(--theme-secondary-bg) text-(--theme-text) disabled:opacity-20 hover:bg-primary/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextPage}
            disabled={!isNextPageAvailable || loading}
            className="p-2 rounded-xl border border-(--theme-border) bg-(--theme-secondary-bg) text-(--theme-text) disabled:opacity-20 hover:bg-primary/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};