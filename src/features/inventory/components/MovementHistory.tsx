import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  startAfter, 
  limitToLast, 
  endBefore,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { ArrowDownRight, ArrowUpRight, PlusCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

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
  
  // Estados para Paginación
  const [page, setPage] = useState(1);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [firstVisible, setFirstVisible] = useState<DocumentSnapshot | null>(null);
  const [isNextPageAvailable, setIsNextPageAvailable] = useState(false);

  const MOVEMENTS_PER_PAGE = 10;

  useEffect(() => {
    setLoading(true);
    
    //Consulta base
    let q = query(
      collection(db, 'inventoryMovements'),
      orderBy('date', 'desc'),
      limit(MOVEMENTS_PER_PAGE + 1) // Pedimos uno más para saber si hay siguiente página
    );
    // El listener de Firebase sepa dónde empezar
    if (page > 1 && lastVisible) {
      q = query(
        collection(db, 'inventoryMovements'),
        orderBy('date', 'desc'),
        startAfter(lastVisible),
        limit(MOVEMENTS_PER_PAGE + 1)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docs = snapshot.docs;
        
        // Verificar si hay una página siguiente
        const hasNext = docs.length > MOVEMENTS_PER_PAGE;
        setIsNextPageAvailable(hasNext);

        // Los documentos a mostrar (máximo 10)
        const visibleDocs = hasNext ? docs.slice(0, -1) : docs;
        
        const data = visibleDocs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Movement[];

        setMovements(data);
        
        // Guardamos los bordes para navegar
        setFirstVisible(visibleDocs[0]);
        setLastVisible(visibleDocs[visibleDocs.length - 1]);
      } else {
        setMovements([]);
        setIsNextPageAvailable(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [page]); // Se vuelve a ejecutar cuando la página cambia

  const handleNextPage = () => {
    if (isNextPageAvailable) {
      setPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  };

  if (loading && movements.length === 0) {
    return <div className="p-4 text-center text-sm opacity-50 font-['Outfit']">Cargando historial...</div>;
  }

  return (
    <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6 border-b border-(--theme-border) pb-4">
        <Clock className="w-5 h-5 opacity-60 text-(--theme-text)" />
        <h2 className="font-['Outfit'] font-bold text-lg text-(--theme-text)">
          Movimientos de Inventario
        </h2>
      </div>

      {/* Contenedor de lista con scroll si es necesario */}
      <div className="space-y-4 flex-grow overflow-y-auto pr-1 min-h-[400px]">
        {movements.length === 0 ? (
          <p className="text-sm opacity-40 text-center py-10 font-['Outfit']">No hay movimientos registrados.</p>
        ) : (
          movements.map((mov) => (
            <div key={mov.id} className="flex items-center justify-between p-3 rounded-2xl bg-(--theme-secondary-bg) border border-(--theme-border)/50 transition-all hover:border-primary/30">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  mov.type === 'ENTRADA' ? 'bg-green-500/15 text-green-500' :
                  mov.type === 'SALIDA' ? 'bg-red-500/15 text-red-500' :
                  'bg-primary/15 text-primary'
                }`}>
                  {mov.type === 'ENTRADA' && <ArrowDownRight className="w-4 h-4" />}
                  {mov.type === 'SALIDA' && <ArrowUpRight className="w-4 h-4" />}
                  {mov.type === 'INICIALIZACION' && <PlusCircle className="w-4 h-4" />}
                </div>
                
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-(--theme-text) line-clamp-1">
                    {mov.productId}
                  </p>
                  <p className="text-[0.65rem] uppercase tracking-widest opacity-50 font-bold">
                    {mov.type} • {mov.reason}
                  </p>
                </div>
              </div>
              
              <div className={`font-mono font-bold text-base ${
                mov.type === 'SALIDA' ? 'text-red-400' : 'text-green-500'
              }`}>
                {mov.type === 'SALIDA' ? '-' : '+'}{mov.quantity}
              </div>
            </div>
          ))
        )}
      </div>

      {/* PPAGINACIÓN */}
      <div className="mt-6 pt-4 border-t border-(--theme-border) flex items-center justify-between">
        <span className="text-xs font-['Outfit'] text-(--theme-text) opacity-50">
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