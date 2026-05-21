import React from 'react';
import { RotateCcw, Calendar, FileText } from 'lucide-react';
import type { ReturnRequest } from '../types';

interface ReturnCardProps {
  returnReq: ReturnRequest;
}

const getReturnStatusStyles = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-[#88B04B]/10 text-[#88B04B]';
    case 'rejected': return 'bg-red-500/10 text-red-500';
    case 'pending_review': return 'bg-amber-500/10 text-amber-500';
    default: return 'bg-gray-500/10 text-gray-500';
  }
};

const getReturnStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending_review: "En revisión",
    approved: "Aprobada",
    rejected: "Rechazada"
  };
  return labels[status] || status;
};

export default function ReturnCard({ returnReq }: ReturnCardProps) {
  const formattedDate = returnReq.createdAt?.toDate 
    ? returnReq.createdAt.toDate().toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Fecha no disponible';

  return (
    <div className="bg-(--theme-card-bg) border border-(--theme-border) p-5 rounded-[1.25rem] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-(--theme-secondary-bg) text-(--theme-text) opacity-80">
          <RotateCcw size={22} />
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-bold opacity-60">
              Ref: #{returnReq.orderId.substring(0, 8).toUpperCase()}
            </span>
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${getReturnStatusStyles(returnReq.status)}`}>
              {getReturnStatusLabel(returnReq.status)}
            </span>
          </div>

          <div className="flex flex-col gap-1 mt-1 text-sm opacity-80">
            <span className="font-medium text-(--theme-text)">
              {returnReq.productName}
            </span>
            <span className="flex items-center gap-1.5 text-xs opacity-80 mt-1">
              <FileText size={14} /> Motivo: {returnReq.reason}
            </span>
            <span className="flex items-center gap-1.5 text-xs mt-1">
              <Calendar size={14} /> Solicitado el {formattedDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
