
export interface CartItem {
  cartItemId: string;
  userId: string;
  productId: string;
  quantity: number;
  updatedAt: Date;
}

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  offerPrice?: number;
  hasOffer: boolean;
  imageUrl: string;
  categoryId: string;
  badge?: string | null;
  active: boolean;
  slug?: string;
  stockAvailable?: number;
  stockTotal?: number;
}

export interface CartItemWithProduct extends CartItem {
  product: CartProduct | null;
  included: boolean;
  priceAtAdd?: number;
  unitPrice: number;
  isValid: boolean;
  availabilityMessage: string;
  priceChange: 'none' | 'increased' | 'decreased';
}

export interface LocalCartItem {
  productId: string;
  quantity: number;
  updatedAt: number;
  priceAtAdd?: number;
}

