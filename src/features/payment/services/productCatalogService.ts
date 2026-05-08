import type { CobroProduct } from '../types';

const MOCK_PRODUCTS: CobroProduct[] = [
  {
    id: 'prod-001',
    name: 'Leche PIL Entera 1L',
    price: 8.5,
    imageUrl:
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop',
    active: true,
    hasOffer: true,
    offerPrice: 7.5,
    quantity: 2,
  },
  {
    id: 'prod-002',
    name: 'Coca-Cola 2L',
    price: 14.0,
    imageUrl:
      'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&h=200&fit=crop',
    active: true,
    hasOffer: false,
    quantity: 3,
  },

  {
    id: 'prod-003',
    name: 'Queso Fresco',
    price: 25.0,
    imageUrl:
      'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200&h=200&fit=crop',
    active: true,
    hasOffer: false,
    quantity: 2,
  },
  {
    id: 'prod-004',
    name: 'Pan de Molde Integral',
    price: 16.0,
    imageUrl:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop',
    active: true,
    hasOffer: true,
    offerPrice: 13.9,
    quantity: 1,
  },
  {
    id: 'prod-005',
    name: 'Huevos Docena',
    price: 24.0,
    imageUrl:
      'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=200&h=200&fit=crop',
    active: true,
    hasOffer: false,
    quantity: 2,
  },
];

export const getCheckoutProducts = async (): Promise<CobroProduct[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  return MOCK_PRODUCTS.filter(
    (product) => product.active !== false && Number(product.quantity ?? 0) > 0
  );
};