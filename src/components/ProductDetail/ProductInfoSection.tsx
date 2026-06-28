import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FaCartPlus } from 'react-icons/fa';
import { useCartContext } from '../../features/cart';
import StockAlertButton from './StockAlertButton';
import type { Product } from './types';
import {
  formatPrice,
  getAnimatedClampStyle,
  getDescriptionWrapperStyle,
  hasHiddenText,
  getProductDerivedData,
} from './utils';
import {
  PRODUCT_NAME_MAX_LINES,
  PRODUCT_DESCRIPTION_MAX_LINES,
  PRODUCT_NAME_EXPAND_LENGTH,
  PRODUCT_DESCRIPTION_EXPAND_LENGTH,
} from './types';

interface ProductInfoSectionProps {
  product: Product;
  loading: boolean;
}

export default function ProductInfoSection({ product, loading }: ProductInfoSectionProps) {
  const [nameExpanded, setNameExpanded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [nameTruncated, setNameTruncated] = useState(false);
  const [descriptionTruncated, setDescriptionTruncated] = useState(false);

  const titleRef = useRef<HTMLElement | null>(null);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const fullDescriptionRef = useRef<HTMLParagraphElement | null>(null);
  const nameExpandedRef = useRef(nameExpanded);
  const descriptionExpandedRef = useRef(descriptionExpanded);

  const { addToCart } = useCartContext();

  const {
    showOffer,
    currentPrice,
    effectiveStock,
    isAvailable,
    descriptionText,
  } = getProductDerivedData(product);

  const isDisabled = product.enabled === false;
  const isOutOfStock = !isAvailable && !isDisabled;

  useEffect(() => {
    nameExpandedRef.current = nameExpanded;
  }, [nameExpanded]);

  useEffect(() => {
    descriptionExpandedRef.current = descriptionExpanded;
  }, [descriptionExpanded]);

  useEffect(() => {
    const checkTitleTruncation = () => {
      if (nameExpandedRef.current) {
        return;
      }

      const trimmedLength = product?.name.trim().length ?? 0;
      let nextNameTruncated = trimmedLength > PRODUCT_NAME_EXPAND_LENGTH;

      if (!nextNameTruncated && titleRef.current) {
        nextNameTruncated = hasHiddenText(titleRef.current, PRODUCT_NAME_MAX_LINES);
      }

      setNameTruncated((previous) =>
        previous === nextNameTruncated ? previous : nextNameTruncated
      );
    };

    const frameId = window.requestAnimationFrame(checkTitleTruncation);
    const resizeObserver = titleRef.current ? new ResizeObserver(checkTitleTruncation) : null;

    if (titleRef.current) {
      resizeObserver?.observe(titleRef.current);
    }

    document.fonts?.ready.then(checkTitleTruncation);
    window.addEventListener('resize', checkTitleTruncation);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', checkTitleTruncation);
    };
  }, [product?.name, loading]);

  useEffect(() => {
    const checkDescriptionTruncation = () => {
      if (descriptionExpandedRef.current) {
        return;
      }

      let nextDescriptionTruncated = descriptionText.length > PRODUCT_DESCRIPTION_EXPAND_LENGTH;

      if (!nextDescriptionTruncated && descriptionRef.current) {
        const measurementElement = fullDescriptionRef.current ?? descriptionRef.current;
        nextDescriptionTruncated = hasHiddenText(measurementElement, PRODUCT_DESCRIPTION_MAX_LINES);
      }

      setDescriptionTruncated((previous) =>
        previous === nextDescriptionTruncated ? previous : nextDescriptionTruncated
      );
    };

    const frameId = window.requestAnimationFrame(checkDescriptionTruncation);
    const resizeObserver = descriptionRef.current
      ? new ResizeObserver(checkDescriptionTruncation)
      : null;

    if (descriptionRef.current) {
      resizeObserver?.observe(descriptionRef.current);
    }

    document.fonts?.ready.then(checkDescriptionTruncation);
    window.addEventListener('resize', checkDescriptionTruncation);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', checkDescriptionTruncation);
    };
  }, [descriptionText, loading]);

  return (
    <div className="flex flex-col justify-center rounded-[2rem] border border-border-light bg-card-bg-light px-5 py-6 sm:px-8 sm:py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
        Detalle del producto
      </p>
      <h1 className="mt-3 text-2xl font-black tracking-tight text-text-light sm:text-2xl">
        <span
          ref={titleRef as React.RefObject<HTMLSpanElement>}
          title={product.name}
          className="leading-[1.12] pb-1"
          style={getAnimatedClampStyle(nameExpanded, PRODUCT_NAME_MAX_LINES)}
        >
          {product.name}
        </span>
      </h1>
      {(nameTruncated || nameExpanded) && (
        <button
          type="button"
          onClick={() => setNameExpanded(!nameExpanded)}
          className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
          aria-label={nameExpanded ? 'Mostrar menos nombre' : 'Mostrar más nombre'}
          title={nameExpanded ? 'Mostrar menos' : 'Mostrar más'}
        >
          {nameExpanded ? (
            <ChevronUp size={18} aria-hidden="true" />
          ) : (
            <ChevronDown size={18} aria-hidden="true" />
          )}
        </button>
      )}

      <div className="mt-5 flex items-center gap-3">
        <span className="text-2xl font-black text-text-light">
          {formatPrice(currentPrice)}
        </span>
        {showOffer && (
          <span className="text-sm text-text-light opacity-45 line-through">
            {formatPrice(product.price)}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {isAvailable && (
          <span className="inline-flex items-center rounded-full bg-green-600/15 px-3 py-1 text-xs font-semibold text-green-600 border border-green-600/20">
            Disponible
          </span>
        )}
        {isOutOfStock && (
          <span className="inline-flex items-center rounded-full bg-red-600/15 px-3 py-1 text-xs font-semibold text-red-500 border border-red-500/20">
            Producto agotado
          </span>
        )}
        {isDisabled && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-600/15 px-3 py-1 text-xs font-semibold text-gray-400 border border-gray-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
            No disponible
          </span>
        )}
        {isAvailable && (
          <span className="text-sm text-text-light opacity-70">
            Stock: {effectiveStock} disponibles
          </span>
        )}
      </div>

      {isAvailable && (
        <button
          type="button"
          onClick={() => addToCart(product.id, effectiveStock, currentPrice)}
          className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-text-light transition-all hover:opacity-90 active:scale-95"
        >
          <FaCartPlus size={16} />
          Agregar al carrito
        </button>
      )}
      {isOutOfStock && (
        <StockAlertButton productId={product.id} />
      )}

      <div className="relative mt-6">
        <div style={getDescriptionWrapperStyle(descriptionExpanded)}>
          <p
            ref={descriptionRef}
            className={`text-sm leading-7 text-text-light opacity-80 ${
              !descriptionExpanded ? 'line-clamp-7' : ''
            }`}
          >
            {descriptionText}
          </p>
        </div>
        <p
          ref={fullDescriptionRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 top-0 -z-10 text-sm leading-7 text-text-light opacity-0"
        >
          {descriptionText}
        </p>
        {(descriptionTruncated || descriptionExpanded) && (
          <button
            type="button"
            onClick={() => setDescriptionExpanded(!descriptionExpanded)}
            className="mt-1 text-sm font-semibold text-primary hover:underline"
          >
            {descriptionExpanded ? 'mostrar menos' : 'mostrar más'}
          </button>
        )}
      </div>
    </div>
  );
}