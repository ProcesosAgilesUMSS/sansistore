import { CartProvider } from '../../features/cart';
import type { ProductDetailProps } from './types';
import ProductDetailInner from './ProductDetailInner';

export default function ProductDetail(props: ProductDetailProps) {
  return (
    <CartProvider>
      <ProductDetailInner {...props} />
    </CartProvider>
  );
}
