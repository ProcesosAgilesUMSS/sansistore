import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import type { Order, Messenger } from '../types';
import { StatusPill } from './StatusPill';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/formatDate';

interface Props {
  order: Order;
  messengers: Messenger[];
  messengersLoading: boolean;
  selectedCourierId: string | undefined;
  onSelectCourier: (orderId: string, courierId: string) => void;
  onAssign: (orderId: string, deliveryId: string) => void;
  onUnassign?: (orderId: string, deliveryId: string) => void;
  onReassign?: (orderId: string, deliveryId: string, newCourierId: string) => void;
  isAssigning: boolean;
  isSuccess: boolean;
}

export function AssignOrderCard({
  order,
  messengers,
  messengersLoading,
  selectedCourierId,
  onSelectCourier,
  onAssign,
  onUnassign,
  onReassign,
  isAssigning,
  isSuccess,
}: Props) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const selectedMessenger = messengers.find((m) => m.uid === selectedCourierId);

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`overflow-hidden rounded-[1.25rem] bg-(--theme-card-bg) transition-all duration-200 hover:-translate-y-px hover:shadow-lg ${isSuccess
        ? 'shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_25%,transparent)]'
        : 'border-(--theme-border)'
        }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="pb-2 font-display text-xs font-800 tracking-tight text-(--theme-text)">
              # {order.orderId?.toUpperCase()}
            </p>
            <p className="font-display text-lg font-800 tracking-tight text-(--theme-text)">
              {order.buyerName?.toUpperCase()}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-xs text-(--theme-text) opacity-50">
                {formatDate(order.confirmedAt ?? order.createdAt)}
              </p>
              <StatusPill status={order.status} />
            </div>

            {order.locationLabel && (
              <p className="mt-2 text-xs text-(--theme-text) opacity-50">
                {order.locationLabel}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-(--theme-text) opacity-40">
              Total
            </p>
            <p className="font-800 text-lg tracking-tight text-primary">
              {formatCurrency(order.total)}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-(--theme-border) px-4 py-4">
        {isSuccess ? (
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-sm font-600 text-primary">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Asignado a {selectedMessenger?.displayName ?? 'mensajero'}
            </span>
            {onUnassign && (
              <button
                onClick={() => onUnassign(order.orderId, order.deliveryId ?? '')}
                disabled={isAssigning}
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-700 text-primary-action transition hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                {isAssigning ? 'Cancelando…' : 'Cancelar'}
              </button>
            )}
            <div className="ml-4 flex items-center gap-2">
              <div className="relative">
                <button
                  ref={buttonRef}
                  type="button"
                  onClick={() => setOpen((prev) => !prev)}
                  disabled={messengersLoading || isAssigning}
                  className="flex items-center gap-2 rounded-xl border border-(--theme-border) bg-(--theme-card-bg) px-3 py-2.5 text-sm text-(--theme-text) transition hover:border-primary disabled:opacity-50"
                >
                  <span className={selectedMessenger ? '' : 'opacity-40'}>
                    {messengersLoading
                      ? 'Cargando mensajeros…'
                      : (selectedMessenger?.displayName ?? 'Seleccionar mensajero')}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`shrink-0 opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                  />
                </button>

                {open && typeof document !== 'undefined' && createPortal(
                  <ul
                    ref={dropdownRef}
                    style={dropdownStyle}
                    className="overflow-hidden rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) shadow-xl"
                  >
                    {messengers.length === 0 ? (
                      <li className="px-4 py-3 text-xs text-(--theme-text) opacity-50">
                        No hay mensajeros disponibles.
                      </li>
                    ) : (
                      messengers.map((m) => (
                        <li key={m.uid}>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCourier(order.orderId, m.uid);
                              setOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm font-600 transition-colors hover:text-primary ${selectedCourierId === m.uid
                              ? 'bg-primary/10 text-primary'
                              : 'text-(--theme-text)'
                              }`}
                          >
                            {m.displayName}
                            {m.institutionalId && (
                              <span className="ml-1 opacity-40">— {m.institutionalId}</span>
                            )}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>,
                  document.body,
                )}
              </div>

              {onReassign && (
                <button
                  onClick={() => onReassign(order.orderId, order.deliveryId ?? '', selectedCourierId ?? '')}
                  disabled={!selectedCourierId || isAssigning || !order.deliveryId}
                  className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-700 text-primary-action transition hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {isAssigning ? 'Reasignando…' : 'Reasignar'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                disabled={messengersLoading || isAssigning}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-(--theme-border) bg-(--theme-card-bg) px-3 py-2.5 text-sm text-(--theme-text) transition hover:border-primary disabled:opacity-50"
              >
                <span className={selectedMessenger ? '' : 'opacity-40'}>
                  {messengersLoading
                    ? 'Cargando mensajeros…'
                    : (selectedMessenger?.displayName ?? 'Seleccionar mensajero')}
                </span>
                <ChevronDown
                  size={15}
                  className={`shrink-0 opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
              </button>

              {open && typeof document !== 'undefined' && createPortal(
                <ul
                  ref={dropdownRef}
                  style={dropdownStyle}
                  className="overflow-hidden rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) shadow-xl"
                >
                  {messengers.length === 0 ? (
                    <li className="px-4 py-3 text-xs text-(--theme-text) opacity-50">
                      No hay mensajeros disponibles.
                    </li>
                  ) : (
                    messengers.map((m) => (
                      <li key={m.uid}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCourier(order.orderId, m.uid);
                            setOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm font-600 transition-colors hover:text-primary ${selectedCourierId === m.uid
                            ? 'bg-primary/10 text-primary'
                            : 'text-(--theme-text)'
                            }`}
                        >
                          {m.displayName}
                          {m.institutionalId && (
                            <span className="ml-1 opacity-40">— {m.institutionalId}</span>
                          )}
                        </button>
                      </li>
                    ))
                  )}
                </ul>,
                document.body,
              )}
            </div>

            <button
              onClick={() => onAssign(order.orderId, order.deliveryId ?? '')}
              disabled={!selectedCourierId || isAssigning || !order.deliveryId}
              className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-700 text-primary-action transition hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              {isAssigning ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Asignando…
                </>
              ) : (
                'Asignar'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
