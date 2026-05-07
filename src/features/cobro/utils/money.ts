import type { CobroProduct } from '../types';

export const formatMoney = (amount: number) =>
  new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(amount);

export const getProductPrice = (product: CobroProduct) =>
  product.hasOffer && product.offerPrice ? product.offerPrice : product.price;
