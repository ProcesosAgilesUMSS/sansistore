import React, { useState, useEffect } from 'react';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { getAvailableRoutes, takeRoute, type CampusRoute } from '../services/routesService';
import { MapPin, Navigation, Clock, CheckCircle } from 'lucide-react';

export default function RoutesDashboard() {
  const { user, authReady } = useAuthUser();
  const [routes, setRoutes] = useState<CampusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string>('Todas');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (authReady) {
      if (user) {
        fetchRoutes();
      } else {
        setLoading(false);
      }
    }
  }, [user, authReady]);

  const fetchRoutes = async () => {
    try {
      const data = await getAvailableRoutes();
      setRoutes(data);
    } catch (error) {
      console.error("Error fetching routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeRoute = async (routeId: string) => {
    if (!user) return;
    setActionLoadingId(routeId);
    try {
      await takeRoute(routeId, user.uid);
      setRoutes(prev => prev.filter(r => r.id !== routeId));
    } catch (error) {
      console.error("Error taking route:", error);
      alert("Hubo un error al asignar la ruta.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const availableZones = ['Todas', ...Array.from(new Set(routes.map(r => r.zone)))];
  
  const filteredRoutes = selectedZone === 'Todas' 
    ? routes 
    : routes.filter(r => r.zone === selectedZone);

  if (!authReady || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-(--theme-text)">
        <span className="animate-pulse font-medium text-sm">Cargando rutas disponibles...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 text-center mt-20 text-(--theme-text)">
        <h2 className="text-2xl font-display font-bold mb-2">Acceso Denegado</h2>
        <p className="opacity-70">
          Debes iniciar sesión para ver rutas. <a href="/login" className="text-primary hover:underline">Iniciar sesión</a>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans text-(--theme-text)">
      <h1 className="text-3xl font-display font-extrabold mb-6 tracking-tight flex items-center gap-3">
        <Navigation className="text-primary" size={28} /> Rutas del Campus
      </h1>

      {/* Filtro por Zona */}
      {routes.length > 0 && (
        <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-2">
          <span className="text-sm font-bold opacity-70 shrink-0">Filtrar por zona:</span>
          {availableZones.map(zone => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                selectedZone === zone 
                  ? 'bg-primary text-white border-primary' 
                  : 'bg-(--theme-secondary-bg) border border-(--theme-border) opacity-70 hover:opacity-100'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      )}

      {/* Lista de Rutas */}
      {filteredRoutes.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-(--theme-border) rounded-[1.5rem] opacity-60 bg-(--theme-card-bg)">
          <Navigation size={40} className="mx-auto mb-4 opacity-40" />
          <h3 className="font-bold text-lg">No hay rutas disponibles en este momento.</h3>
          <p className="text-sm mt-1">Vuelve a revisar más tarde.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredRoutes.map(route => (
            <div key={route.id} className="bg-(--theme-card-bg) border border-(--theme-border) p-5 rounded-[1.25rem] shadow-sm flex flex-col justify-between transition-all hover:border-primary/30 hover:shadow-md">
              
              <div className="mb-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                    Zona {route.zone}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium opacity-70">
                    <Clock size={14} /> {route.estimatedTime} min est.
                  </span>
                </div>

                {/* Origen y Destino */}
                <div className="relative pl-6 flex flex-col gap-4">
                  <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-(--theme-border)"></div>
                  
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full border-2 border-primary bg-(--theme-bg)"></div>
                    <span className="block text-[10px] uppercase tracking-wider opacity-50 font-bold mb-0.5">Punto de partida</span>
                    <span className="text-sm font-medium">{route.startPoint.label}</span>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[25px] top-0.5 w-4 h-4 text-primary bg-(--theme-bg)"><MapPin size={16} /></div>
                    <span className="block text-[10px] uppercase tracking-wider opacity-50 font-bold mb-0.5">Punto de entrega</span>
                    <span className="text-sm font-medium">{route.endPoint.label}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleTakeRoute(route.id!)}
                disabled={actionLoadingId === route.id}
                className="w-full py-2.5 mt-2 rounded-full font-bold text-sm bg-primary text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                {actionLoadingId === route.id ? (
                  <span className="animate-pulse">Asignando...</span>
                ) : (
                  <> <CheckCircle size={16} /> Tomar ruta </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
