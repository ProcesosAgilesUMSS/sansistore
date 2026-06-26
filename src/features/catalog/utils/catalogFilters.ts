import { hasValidOffer } from '../../../lib/productOffers';
import {
  getCreatedAtTimestamp,
  getSoldCount,
} from '../../../lib/productPopularity';
import type { CatalogProduct, CatalogSort } from '../types';

export function removeAccents(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function isSortOption(
  value: string | null | undefined
): value is CatalogSort {
  return (
    value === 'best-sellers' ||
    value === 'recent' ||
    value === 'name-asc' ||
    value === 'name-desc'
  );
}

export function filterCatalogProducts(
  products: CatalogProduct[],
  options: {
    term?: string;
    categoryId?: string | null;
    offersOnly?: boolean;
    favoritesOnly?: boolean;
    favoriteIds?: Set<string>;
  }
) {
  let result = products;

  if (options.favoritesOnly) {
    result = result.filter((product) => options.favoriteIds?.has(product.id));
  }

  if (options.offersOnly) {
    result = result.filter((product) => hasValidOffer(product));
  }

  if (options.categoryId) {
    result = result.filter((product) => product.categoryId === options.categoryId);
  }

  if (options.term) {
    const term = removeAccents(options.term.toLowerCase());
    const byName = result.filter((product) =>
      removeAccents(product.name.toLowerCase()).includes(term)
    );
    const byDescription = result.filter(
      (product) =>
        !removeAccents(product.name.toLowerCase()).includes(term) &&
        product.description &&
        removeAccents(product.description.toLowerCase()).includes(term)
    );
    result = [...byName, ...byDescription];
  }

  return result;
}

export function sortCatalogProducts(
  products: CatalogProduct[],
  sortBy: CatalogSort
) {
  const allSoldCountsAreZero = products.every(
    (product) => getSoldCount(product) === 0
  );
  const effectiveSortBy =
    sortBy === 'best-sellers' && allSoldCountsAreZero ? 'recent' : sortBy;
  const sorted = [...products];

  switch (effectiveSortBy) {
    case 'best-sellers':
      sorted.sort(
        (a, b) =>
          getSoldCount(b) - getSoldCount(a) ||
          getCreatedAtTimestamp(b) - getCreatedAtTimestamp(a)
      );
      break;
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'recent':
    default:
      sorted.sort(
        (a, b) => getCreatedAtTimestamp(b) - getCreatedAtTimestamp(a)
      );
      break;
  }

  return sorted;
}

export function getCatalogUrl(options: {
  term?: string;
  offersOnly?: boolean;
  categoryId?: string | null;
  sortBy?: CatalogSort;
}) {
  const params = new URLSearchParams();

  if (options.term?.trim()) params.set('q', options.term.trim());
  if (options.offersOnly) params.set('offers', 'true');
  if (options.categoryId) params.set('category', options.categoryId);
  if (options.sortBy && options.sortBy !== 'best-sellers') {
    params.set('sort', options.sortBy);
  }

  const queryString = params.toString();
  return queryString ? `/productos?${queryString}` : '/productos';
}
