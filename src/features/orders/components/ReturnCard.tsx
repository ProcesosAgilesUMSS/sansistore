import React from 'react';
import { RotateCcw, Calendar, FileText, Package, CheckCircle, XCircle, Truck, Clock } from 'lucide-react';
import type { ReturnRequest } from '../types';
import { RETURN_REASON_LABELS } from '../types';

interface ReturnCardProps {
  returnReq: ReturnRequest;
}

const getReturnStatusStyles = (status: string) => {
  switch (status) {
    case 'approved':   return 'bg-[#88B04B]/10 text-[#88B04B] border-[#88B04B]/20';
    case 'completed':  return 'bg-[#88B04B]/15 text-[#5a8a2a] border-[#88B04B]/30';
    case 'rejected':   return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'in_transit': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'pending':
    default:           return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  }
};

const getReturnStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':   return <CheckCircle size={13} />;
    case 'completed':  return <CheckCircle size={13} />;
    case 'rejected':   return <XCircle size={13} />;
    case 'in_transit': return <Truck size={13} />;
    default:           return <Clock size={13} />;
  }
};

const getReturnStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending:    'Pendiente',
    approved:   'Aprobada',
    rejected:   'Rechazada',
    in_transit: 'En tránsito',
    completed:  'Completada',
    // legacy
    pending_review: 'En revisión',
  };
  return labels[status] || status;
};

export default function ReturnCard({ returnReq }: ReturnCardProps) {
  const formattedDate = returnReq.createdAt?.toDate
    ? returnReq.createdAt.toDate().toLocaleDateString('es-BO', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : 'Fecha no disponible';

  const reasonLabel = returnReq.reason
    ? (RETURN_REASON_LABELS[returnReq.reason] ?? returnReq.reason)
    : null;

  // Support both multi-product (items[]) and legacy single-product
  const productList = returnReq.items && returnReq.items.length > 0
    ? returnReq.items
    : returnReq.productName
      ? [{ productId: returnReq.productId ?? '', productName: returnReq.productName, quantity: 1 }]
      : [];

  return (
    <div className="bg-(--theme-card-bg) border border-(--theme-border) p-5 rounded-[1.25rem] shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all hover:shadow-md">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="p-3 rounded-xl bg-(--theme-secondary-bg) text-(--theme-text) opacity-80 shrink-0">
          <RotateCcw size={22} />
        </div>

        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {/* ID + Status */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-bold opacity-60">
              Ref: #{returnReq.orderId.substring(0, 8).toUpperCase()}
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getReturnStatusStyles(returnReq.status)}`}>
              {getReturnStatusIcon(returnReq.status)}
              {getReturnStatusLabel(returnReq.status)}
            </span>
          </div>

          {/* Products */}
          {productList.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-xs font-bold opacity-50 uppercase tracking-wider">
                <Package size={12} /> Productos
              </span>
              {productList.map((item, idx) => (
                <span key={idx} className="text-sm font-medium opacity-90">
                  {item.productName}
                  {item.quantity > 1 && (
                    <span className="text-xs opacity-60 ml-1">× {item.quantity}</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Reason + date */}
          <div className="flex flex-col gap-1 mt-1 text-xs opacity-70">
            {reasonLabel && (
              <span className="flex items-center gap-1.5">
                <FileText size={13} /> Motivo: {reasonLabel}
              </span>
            )}
            {returnReq.description && (
              <span className="opacity-70 italic">"{returnReq.description}"</span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar size={13} /> Solicitado el {formattedDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
