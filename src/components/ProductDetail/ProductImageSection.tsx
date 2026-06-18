import { useState } from 'react';
import { Package, Heart } from 'lucide-react';
import type { Product } from './types';
import { isPopularProduct } from '../../lib/productPopularity';
import { useFavorites } from '../../features/favorites';
import { getBadgeData } from './utils';

interface ProductImageSectionProps {
  product: Product;
}

export default function ProductImageSection({ product }: ProductImageSectionProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const badgeData = getBadgeData(product);
  const showPopularBadge = isPopularProduct(product);

  const { isFavorite, toggleFavorite } = useFavorites();
  const productIsFavorite = isFavorite(product.id);

  const effectiveStock = Math.max(
    0,
    (product.stockAvailable ?? 0) - (product.stockReserved ?? 0)
  );
  const isOutOfStock = effectiveStock <= 0;
  const isDisabled = product.enabled === false;
  const isProductAvailable = !isOutOfStock && !isDisabled;

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
          {isOutOfStock && !isDisabled && (
            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
              Agotado
            </span>
          )}
          {isDisabled && (
            <span className="rounded-full bg-gray-600 px-3 py-1 text-xs font-semibold text-white">
              No disponible
            </span>
          )}
          {isProductAvailable && badgeData && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeData.className}`}
            >
              {badgeData.label}
            </span>
          )}
          {isProductAvailable && showPopularBadge && (
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-amber-950">
              Popular
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label={
            productIsFavorite
              ? `Quitar ${product.name} de favoritos`
              : `Agregar ${product.name} a favoritos`
          }
          aria-pressed={productIsFavorite}
          title={productIsFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          data-testid={`favorite-button-${product.slug}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className={`absolute right-5 top-5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-all active:scale-95 ${
            productIsFavorite
              ? 'border-primary bg-primary text-text-light shadow-md shadow-primary/25'
              : 'border-border-light bg-card-bg-light/90 text-text-light hover:border-primary hover:text-primary'
          }`}
        >
          <Heart size={18} fill={productIsFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  );
}
