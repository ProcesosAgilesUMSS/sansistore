import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { FaCartPlus } from 'react-icons/fa';
import { getOfferBadgeData, hasValidOffer } from '../../../lib/productOffers';
import { isPopularProduct } from '../../../lib/productPopularity';
import { useCartContext } from '../../cart';
import { useFavorites } from '../../favorites';
import type { CatalogProduct } from '../types';
import { removeAccents } from '../utils/catalogFilters';

const PRODUCT_PLACEHOLDER = '/product-placeholder.svg';

function formatPrice(amount: number) {
  return `Bs ${amount.toFixed(2)}`;
}

function getBadgeData(product: CatalogProduct) {
  const badgeData = getOfferBadgeData(product);

  if (badgeData?.label.trim().toLowerCase() === 'popular') {
    return null;
  }

  if (badgeData?.isDiscount) {
    return {
      label: badgeData.label,
      className: 'bg-red-600 text-white',
    };
  }

  if (!badgeData) return null;

  return {
    label: badgeData.label,
    className: 'bg-primary-action text-white',
  };
}

function highlightText(text: string, term: string, enabled = true) {
  if (!enabled || !term || !text) return text;
  const normalizedText = removeAccents(text);
  const normalizedTerm = removeAccents(term);
  const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(normalizedText)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }
    result.push(
      <mark
        key={match.index}
        className="rounded bg-primary/30 px-0.5 font-semibold text-primary"
      >
        {text.slice(match.index, match.index + match[0].length)}
      </mark>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result.length > 0 ? result : text;
}

function getMatchField(product: CatalogProduct, term: string) {
  if (!term) return null;
  const normalizedTerm = removeAccents(term.toLowerCase());
  if (removeAccents(product.name.toLowerCase()).includes(normalizedTerm)) {
    return 'name';
  }
  if (
    product.description &&
    removeAccents(product.description.toLowerCase()).includes(normalizedTerm)
  ) {
    return 'description';
  }
  return null;
}

interface ProductCardProps {
  product: CatalogProduct;
  appliedSearch?: string;
}

export default function ProductCard({
  product,
  appliedSearch = '',
}: ProductCardProps) {
  const { addToCart } = useCartContext();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [bumping, setBumping] = useState(false);
  const bumpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showOffer = hasValidOffer(product);
  const badgeData = getBadgeData(product);
  const showPopularBadge = isPopularProduct(product);
  const productIsFavorite = isFavorite(product.id);
  const currentPrice = showOffer ? product.offerPrice! : product.price;
  const effectiveStock = Math.max(
    0,
    (product.stockAvailable ?? 0) - (product.stockReserved ?? 0)
  );
  const isOutOfStock = effectiveStock <= 0;
  const isDisabled = product.enabled === false;
  const isProductAvailable = !isOutOfStock && !isDisabled;

  useEffect(() => {
    return () => {
      if (bumpTimeoutRef.current) clearTimeout(bumpTimeoutRef.current);
    };
  }, []);

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border-light bg-card-bg-light transition-all duration-300 hover:-translate-y-1 ${
        !isProductAvailable ? 'opacity-75' : ''
      }`}
    >
      <a
        href={`/productos/${product.slug}`}
        aria-label={`Ver detalle de ${product.name}`}
        className="absolute inset-0 z-10 rounded-2xl"
      />

      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-secondary-bg-light">
        <img
          src={product.imageUrl || PRODUCT_PLACEHOLDER}
          alt={product.name}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            !isProductAvailable ? 'grayscale' : ''
          }`}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = PRODUCT_PLACEHOLDER;
          }}
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {isOutOfStock && !isDisabled && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
              Agotado
            </span>
          )}
          {isDisabled && (
            <span
              style={{ backgroundColor: '#4b5563' }}
              className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
            >
              No disponible
            </span>
          )}
          {isProductAvailable && badgeData && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeData.className}`}
            >
              {badgeData.label}
            </span>
          )}
          {isProductAvailable && showPopularBadge && (
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-amber-950">
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
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFavorite(product.id);
          }}
          className={`absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-all active:scale-95 ${
            productIsFavorite
              ? 'border-primary bg-primary text-text-light shadow-md shadow-primary/25'
              : 'border-border-light bg-card-bg-light/90 text-text-light hover:border-primary hover:text-primary'
          }`}
        >
          <Heart size={18} fill={productIsFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="relative z-20 flex flex-1 flex-col p-3 sm:p-4">
        <span
          className="block w-full text-sm font-semibold text-text-light transition-colors group-hover:text-primary sm:text-base"
          style={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
          title={product.name}
        >
          {highlightText(
            product.name,
            appliedSearch,
            getMatchField(product, appliedSearch) === 'name'
          )}
        </span>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2 sm:pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-text-light sm:text-base">
              {formatPrice(currentPrice)}
            </span>
            {showOffer && (
              <span className="text-xs text-text-light opacity-40 line-through sm:text-sm">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          <span className="relative shrink-0">
            {bumping && (
              <span
                key={Date.now()}
                aria-hidden="true"
                className="cart-bump pointer-events-none absolute -top-2 left-1/2 z-30 rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-extrabold leading-none text-white shadow-md shadow-primary/40"
              >
                +1
              </span>
            )}
            <button
              type="button"
              title={isProductAvailable ? 'Agregar al carrito' : 'Sin stock disponible'}
              disabled={!isProductAvailable}
              onClick={(event) => {
                event.preventDefault();
                addToCart(product.id, effectiveStock, currentPrice);
                if (bumpTimeoutRef.current) clearTimeout(bumpTimeoutRef.current);
                setBumping(true);
                bumpTimeoutRef.current = setTimeout(() => setBumping(false), 700);
              }}
              className={`relative z-20 flex shrink-0 items-center justify-center rounded-full p-2.5 transition-all active:scale-95 sm:p-3 ${
                isProductAvailable
                  ? 'text-primary hover:scale-110 hover:drop-shadow-lg'
                  : 'cursor-not-allowed text-text-light opacity-30'
              } ${bumping ? 'cart-icon-pop' : ''}`}
            >
              <FaCartPlus className="text-lg sm:text-xl" />
            </button>
          </span>
        </div>
      </div>
    </article>
  );
}
