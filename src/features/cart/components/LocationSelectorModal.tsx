import { useEffect, useState } from 'react';
import { Loader2, MapPin, X } from 'lucide-react';
import { type User } from 'firebase/auth';
import { subscribeToUserLocations } from '../../location/services/locationService';
import type { Location } from '../../location/types';

interface Props {
  user: User;
  onClose: () => void;
  onConfirm: (location: Location) => void;
}

export function LocationSelectorModal({ user, onClose, onConfirm }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToUserLocations(user.uid, (locs) => {
      setLocations(locs);
      setLoading(false);
      const defaultLoc = locs.find((l) => l.isDefault);
      if (defaultLoc?.id) {
        setSelectedId(defaultLoc.id);
      }
    });
    return () => unsub();
  }, [user.uid]);

  function handleConfirm() {
    const selected = locations.find((l) => l.id === selectedId);
    if (selected) {
      onConfirm(selected);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border-light bg-card-bg-light p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin size={18} />
          </div>
          <h2 id="location-title" className="text-lg font-bold text-text-light">
            Seleccionar ubicación
          </h2>
        </div>

        <div className="mt-4 flex max-h-60 flex-col gap-3 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-12 text-text-light/40">
              <Loader2 size={28} className="animate-spin text-primary/60" />
              <p className="text-sm font-bold">Cargando ubicaciones...</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-text-light/40">
              <MapPin size={32} className="text-primary/40" />
              <p className="text-sm font-bold">No hay ubicaciones guardadas</p>
              <a
                href="/location"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Agregar ubicación
              </a>
            </div>
          ) : (
            locations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setSelectedId(loc.id ?? null)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selectedId === loc.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border-light hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-semibold text-text-light">
                  {loc.label}
                </p>
                <p className="mt-1 text-xs text-text-light opacity-60 capitalize">
                  {loc.type}
                  {loc.isDefault && ' (Predeterminada)'}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedId}
            className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirmar ubicación
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-light text-text-light opacity-70 transition hover:opacity-100"
          aria-label="Cerrar modal"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
