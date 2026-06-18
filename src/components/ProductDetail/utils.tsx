import { Timestamp } from 'firebase/firestore';
import { Star } from 'lucide-react';
import { layout, prepare } from '@chenglou/pretext';
import { getOfferBadgeData, hasValidOffer } from '../../lib/productOffers';
import { getSoldCount, isPopularProduct } from '../../lib/productPopularity';
import type { Product, Review, ReviewSortKey } from './types';

export function formatPrice(amount: number) {
  return `Bs ${amount.toFixed(2)}`;
}

export function getBadgeData(product: Product | null) {
  const badgeData = getOfferBadgeData(product);

  if (badgeData?.label.trim().toLowerCase() === 'popular') {
    return null;
  }

  if (badgeData?.isDiscount) {
    return {
      label: badgeData.label,
      className: 'product-detail-badge product-detail-badge--discount',
    };
  }

  if (!badgeData) return null;

  return {
    label: badgeData.label,
    className: 'product-detail-badge product-detail-badge--label',
  };
}

export function renderStars(rating: number, prefix: string = '') {
  return Array.from({ length: 5 }, (_, index) => {
    const starPosition = index + 1;
    const isFilled = rating >= starPosition;
    const isHalf = !isFilled && rating > index && rating < starPosition;
    const fillState = isFilled ? 'full' : isHalf ? 'half' : 'empty';
    const testId = prefix ? `${prefix}-star-${index}-${fillState}` : `star-${index}-${fillState}`;

    return (
      <div
        key={`${rating}-${index}`}
        className="relative inline-block"
        data-testid={testId}
      >
        <Star size={14} className="text-text-light opacity-20" />
        <div
          className={`absolute left-0 top-0 overflow-hidden ${
            isHalf ? 'w-1/2' : isFilled ? 'w-full' : 'w-0'
          }`}
        >
          <Star size={14} className="fill-primary text-primary" />
        </div>
      </div>
    );
  });
}

export function getReviewTimestamp(review: Review) {
  if (review.createdAt instanceof Timestamp) {
    return review.createdAt.toMillis();
  }

  if (typeof review.createdAt === 'string') {
    const parsed = Date.parse(review.createdAt);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

export function sortReviews(reviews: Review[], sortKey: ReviewSortKey) {
  const sorted = [...reviews];

  sorted.sort((left, right) => {
    switch (sortKey) {
      case 'oldest':
        return getReviewTimestamp(left) - getReviewTimestamp(right);
      case 'highest':
        return (
          right.rating - left.rating ||
          getReviewTimestamp(right) - getReviewTimestamp(left)
        );
      case 'lowest':
        return (
          left.rating - right.rating ||
          getReviewTimestamp(right) - getReviewTimestamp(left)
        );
      case 'recent':
      default:
        return getReviewTimestamp(right) - getReviewTimestamp(left);
    }
  });

  return sorted;
}

export function formatReviewDate(review: Review) {
  const timestamp = getReviewTimestamp(review);

  if (!timestamp) return null;

  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp));
}

export function getLineHeight(styles: CSSStyleDeclaration) {
  const lineHeight = Number.parseFloat(styles.lineHeight);

  if (!Number.isNaN(lineHeight)) return lineHeight;

  const fontSize = Number.parseFloat(styles.fontSize);
  return Number.isNaN(fontSize) ? 16 : fontSize * 1.2;
}

export function getPretextFont(styles: CSSStyleDeclaration) {
  if (styles.font) return styles.font;

  return `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
}

export function getLetterSpacing(styles: CSSStyleDeclaration) {
  const letterSpacing = Number.parseFloat(styles.letterSpacing);
  return Number.isNaN(letterSpacing) ? 0 : letterSpacing;
}

export function hasHiddenText(element: HTMLElement, maxLines: number) {
  const styles = window.getComputedStyle(element);
  const width = element.getBoundingClientRect().width;

  if (!width) return false;

  if (element.scrollHeight > element.clientHeight + 1) return true;

  const prepared = prepare(element.textContent ?? '', getPretextFont(styles), {
    letterSpacing: getLetterSpacing(styles),
    whiteSpace: 'normal',
    wordBreak: styles.wordBreak === 'keep-all' ? 'keep-all' : 'normal',
  });
  const result = layout(prepared, width, getLineHeight(styles));

  if (result.lineCount > maxLines) return true;

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.visibility = 'hidden';
  clone.style.pointerEvents = 'none';
  clone.style.width = `${width}px`;
  clone.style.height = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.display = 'block';
  clone.style.webkitBoxOrient = 'unset';
  clone.style.webkitLineClamp = 'unset';

  document.body.appendChild(clone);
  const fullHeight = clone.scrollHeight;
  document.body.removeChild(clone);

  return fullHeight > getLineHeight(styles) * maxLines + 1;
}

export function getAnimatedClampStyle(expanded: boolean, maxLines: number) {
  if (expanded) {
    return {
      display: 'block',
      overflow: 'hidden',
      maxHeight: '200rem',
      transition: 'max-height 320ms ease',
      willChange: 'max-height',
    } as const;
  }

  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: maxLines,
    overflow: 'hidden',
    transition: 'max-height 320ms ease',
    willChange: 'max-height',
  } as const;
}

export function getDescriptionWrapperStyle(expanded: boolean) {
  return {
    maxHeight: expanded ? '80rem' : 'none',
    overflow: 'hidden',
    opacity: expanded ? 1 : 0.94,
    transform: expanded ? 'translateY(0)' : 'translateY(-2px)',
    transition:
      'max-height 320ms ease, opacity 220ms ease, transform 220ms ease',
    willChange: 'max-height, opacity, transform',
  } as const;
}

export function areSetsEqual<T>(left: Set<T>, right: Set<T>) {
  if (left.size !== right.size) return false;

  for (const value of left) {
    if (!right.has(value)) return false;
  }

  return true;
}

export function getProductDerivedData(product: Product | null) {
  const showOffer = hasValidOffer(product);
  const currentPrice = showOffer ? (product?.offerPrice ?? 0) : (product?.price ?? 0);
  const effectiveStock = Math.max(
    0,
    (product?.stockTotal ?? 0) - (product?.stockReserved ?? 0)
  );
  const isAvailable =
    effectiveStock > 0 &&
    product?.enabled !== false &&
    (product?.active ?? true) !== false;
  const normalizedDescription = product?.description?.trim();
  const descriptionText = normalizedDescription ? normalizedDescription : 'Sin descripción';
  const showPopularBadge = isPopularProduct(product);
  const badgeData = getBadgeData(product);

  return {
    showOffer,
    currentPrice,
    effectiveStock,
    isAvailable,
    descriptionText,
    showPopularBadge,
    badgeData,
  };
}
