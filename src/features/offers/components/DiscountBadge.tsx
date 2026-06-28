import React from 'react';

//  componente equipo "dmind"
interface DiscountBadgeProps {
  originalPrice: number;
  discountPercentage: number;
}

export default function DiscountBadge({ originalPrice, discountPercentage }: DiscountBadgeProps) {
  if (!discountPercentage || discountPercentage <= 0) return null;

  const discountAmount = originalPrice * (discountPercentage / 100);
  const finalPrice = originalPrice - discountAmount;

  return (
    <div className="flex items-center gap-3 p-3 bg-card-bg-light border border-border-light rounded-lg w-fit mt-2">
      <div className="flex flex-col">
        <span className="text-sm text-text-light/50 line-through">
          Bs. {originalPrice.toFixed(2)}
        </span>
        <span className="text-lg font-bold text-primary">
          Bs. {finalPrice.toFixed(2)}
        </span>
      </div>
      
      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider animate-pulse">
        -{discountPercentage}% Oferta
      </span>
    </div>
  );
}