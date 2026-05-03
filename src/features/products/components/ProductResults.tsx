import type { Product } from '../services/productService';
import ProductCard from './ProductCard';
import { Loader2 } from 'lucide-react';

interface ProductResultsProps {
  products: Product[];
  isLoading: boolean;
  searchQuery: string;
  matchCount?: number;
}

export default function ProductResults({
  products,
  isLoading,
  searchQuery,
  matchCount,
}: ProductResultsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
        <p className="text-text-light/60">Cargando productos...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-text-light mb-2">
          No se encontraron productos
        </h3>
        <p className="text-text-light/60 text-center">
          {searchQuery
            ? `No encontramos productos con "${searchQuery}". Intenta con otros términos.`
            : 'Ajusta tus filtros e intenta de nuevo.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Results Header */}
      <div className="mb-6">
        <p className="text-sm text-text-light/60">
          Mostrando <span className="font-semibold text-text-light">{products.length}</span>{' '}
          {matchCount !== undefined && matchCount !== products.length
            ? `de ${matchCount} coincidencias`
            : 'productos'}
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
