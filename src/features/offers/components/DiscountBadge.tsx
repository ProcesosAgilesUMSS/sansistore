import React from 'react';

// Definimos qué datos necesita recibir este componente del equipo "dmind"
interface DiscountBadgeProps {
  originalPrice: number;
  discountPercentage: number;
}

export default function DiscountBadge({ originalPrice, discountPercentage }: DiscountBadgeProps) {
  // Evitamos errores si el descuento es 0 o inválido
  if (!discountPercentage || discountPercentage <= 0) return null;

  // Hacemos la matemática para calcular el precio final
  const discountAmount = originalPrice * (discountPercentage / 100);
  const finalPrice = originalPrice - discountAmount;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 w-fit mt-2">
      <div className="flex flex-col">
        {/* Precio original tachado (Criterio 6) */}
        <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
          Bs. {originalPrice.toFixed(2)}
        </span>
        {/* Precio nuevo con descuento (Criterio 6) */}
        <span className="text-xl font-bold text-[#88B04B]">
          Bs. {finalPrice.toFixed(2)}
        </span>
      </div>
      
      {/* Etiqueta visual de Oferta (Criterio 6) */}
      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider animate-pulse">
        -{discountPercentage}% Oferta
      </span>
    </div>
  );
}