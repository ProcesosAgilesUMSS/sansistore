import type { DashboardProduct, FilterOptions } from '../types';

export function applyInventoryFilters(
  items: DashboardProduct[],
  { stockFilter, category, sort }: FilterOptions
): DashboardProduct[] {
  let result = [...items];

  if (stockFilter === 'low') {
    result = result.filter((i) => i.stockAvailable <= i.minStock);
  } else if (stockFilter === 'normal') {
    result = result.filter((i) => i.stockAvailable > i.minStock);
  }

  if (category !== 'all') {
    result = result.filter((i) => i.categoryId === category);
  }

  result.sort((a, b) => {
    const valA = a[sort.field];
    const valB = b[sort.field];

    let cmp = 0;
    if (typeof valA === 'string' && typeof valB === 'string') {
      cmp = valA.localeCompare(valB, 'es');
    } else {
      cmp = (valA as number) - (valB as number);
    }

    return sort.direction === 'asc' ? cmp : -cmp;
  });

  return result;
}
