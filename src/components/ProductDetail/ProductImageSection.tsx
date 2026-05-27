import { useState } from 'react';
import { Package } from 'lucide-react';
import type { Product } from './types';
import { isPopularProduct } from '../../lib/productPopularity';
import { getBadgeData } from './utils';

interface ProductImageSectionProps {
  product: Product;
}

export default function ProductImageSection({ product }: ProductImageSectionProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const badgeData = getBadgeData(product);
  const showPopularBadge = isPopularProduct(product);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border-light bg-card-bg-light">
      <div className="relative aspect-square bg-secondary-bg-light">
        {product.imageUrl && !imageFailed ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-text-light opacity-50">
              <Package size={56} className="opacity-70" />
              <span className="text-sm font-medium">Imagen no disponible</span>
            </div>
          </div>
        )}

        <div className="absolute left-5 top-5 flex flex-wrap gap-2">
          {badgeData && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeData.className}`}
            >
              {badgeData.label}
            </span>
          )}
          {showPopularBadge && (
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-amber-950">
              Popular
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
