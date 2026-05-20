import { Timestamp } from 'firebase/firestore';

export const POPULAR_SOLD_COUNT_THRESHOLD = 75;

interface ProductPopularityLike {
  soldCount?: number | null;
  createdAt?: Timestamp | string | Date | null;
}

export function getSoldCount(product: ProductPopularityLike | null | undefined) {
  return Number(product?.soldCount ?? 0);
}

export function isPopularProduct(product: ProductPopularityLike | null | undefined) {
  return getSoldCount(product) >= POPULAR_SOLD_COUNT_THRESHOLD;
}

export function getCreatedAtTimestamp(
  product: ProductPopularityLike | null | undefined
) {
  const createdAt = product?.createdAt;

  if (createdAt instanceof Timestamp) {
    return createdAt.toMillis();
  }

  if (createdAt instanceof Date) {
    return createdAt.getTime();
  }

  if (typeof createdAt === 'string') {
    const parsed = Date.parse(createdAt);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}
