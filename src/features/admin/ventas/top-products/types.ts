export interface TopProduct {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  price: number;
  imageUrl: string;
  soldCount: number;
}

export interface TopProductsState {
  products: TopProduct[];
  categories: CategoryOption[];
  loading: boolean;
  error: string | null;
}

export interface CategoryOption {
  id: string;
  name: string;
}