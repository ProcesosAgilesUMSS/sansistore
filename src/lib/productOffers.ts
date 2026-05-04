export interface OfferableProduct {
  price: number;
  hasOffer?: boolean;
  offerPrice?: number | null;
  badge?: string | null;
}

export function hasValidOffer(product: OfferableProduct | null | undefined) {
  if (!product) return false;

  return Boolean(
    product.hasOffer &&
    typeof product.offerPrice === 'number' &&
    product.offerPrice > 0 &&
    product.offerPrice < product.price
  );
}

export function calculateDiscountPercentage(price: number, offerPrice: number) {
  if (price <= 0 || offerPrice <= 0 || offerPrice >= price) return null;

  return Math.round(((price - offerPrice) / price) * 100);
}

export function getDiscountPercentage(
  product: OfferableProduct | null | undefined
) {
  if (
    !product ||
    !hasValidOffer(product) ||
    typeof product.offerPrice !== 'number'
  ) {
    return null;
  }

  return calculateDiscountPercentage(product.price, product.offerPrice);
}

export function isOfferBadge(badge?: string | null) {
  return badge?.trim().toLowerCase() === 'oferta';
}

export function getOfferBadgeData(
  product: OfferableProduct | null | undefined
) {
  const discountPercentage = getDiscountPercentage(product);

  if (discountPercentage) {
    return {
      label: `-${discountPercentage}%`,
      isDiscount: true,
    };
  }

  if (!product?.badge || isOfferBadge(product.badge)) return null;

  return {
    label: product.badge,
    isDiscount: false,
  };
}
