
export interface CartInventory {
  enabled: boolean;
  stockTotal: number;
  stockAvailable: number;
  stockReserved: number;
  minStock: number;
  productId: string;
  updatedAt?: Date;
}

export interface CartItem {
  cartItemId: string;
  userId: string;
  productId: string;
  quantity: number;
  updatedAt: Date;
}

export interface CartDisplayItem {
  id: string;
  productId: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  stockAvailable: number;
  stockReserved: number;
  isAvailable: boolean;
  availabilityMessage: string;
  subtotal: number;
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
  stockReserved?: number;
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

