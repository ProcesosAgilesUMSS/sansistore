export interface TopProduct {
  productId: string;
  name: string;
  categoryId: string;
  categoryName: string;
  price: number;
  imageUrl?: string;
  soldCount: number;
  hasOffer?: boolean;
  offerPrice?: number;
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