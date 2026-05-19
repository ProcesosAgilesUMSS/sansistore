export interface CartProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  active?: boolean;
  hasOffer?: boolean;
  offerPrice?: number | null;
}

export interface CartInventory {
  stockAvailable?: number;
  enabled?: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  stockAvailable: number;
  isAvailable: boolean;
  availabilityMessage: string;
  subtotal: number;
}
