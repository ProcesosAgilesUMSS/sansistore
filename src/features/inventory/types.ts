export type StockFilter = 'all' | 'low' | 'normal';

export type SortField =
  | 'name'
  | 'categoryId'
  | 'stockTotal'
  | 'stockReserved'
  | 'stockAvailable'
  | 'minStock';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface DashboardProduct {
  id: string;
  name: string;
  categoryId: string;
  stockAvailable: number;
  stockReserved: number;
  stockTotal: number;
  minStock: number;
}

export interface FilterOptions {
  stockFilter: StockFilter;
  category: string;
  sort: SortConfig;
}
