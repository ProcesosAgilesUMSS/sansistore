import { useState, useEffect } from 'react';
import { ShoppingBag, Package } from 'lucide-react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
  active?: boolean;
  hasOffer?: boolean;
  offerPrice?: number;
  badge?: string;
  stockAvailable?: number;
  stockTotal?: number;
  enabled?: boolean;
}

interface Inventory {
  id: string;
  productId?: string;
  stockAvailable?: number;
  stockTotal?: number;
  enabled?: boolean;
}

const PRODUCT_PLACEHOLDER = '/product-placeholder.svg';

function formatPrice(amount: number) {
  return `Bs ${amount.toFixed(2)}`;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setError(null);

      try {
        const productsQuery = query(
          collection(db, 'products'),
          orderBy('createdAt', 'desc')
        );
        const [productsSnap, inventorySnap] = await Promise.all([
          getDocs(productsQuery),
          getDocs(collection(db, 'inventory')),
        ]);

        const inventoryByProductId = new Map(
          inventorySnap.docs.map((inventoryDoc) => {
            const inventory = { id: inventoryDoc.id, ...inventoryDoc.data() } as Inventory;
            return [inventory.productId ?? inventoryDoc.id, inventory];
          })
        );

        setProducts(
          productsSnap.docs
            .map((productDoc) => {
              const product = { id: productDoc.id, ...productDoc.data() } as Product;
              const inventory = inventoryByProductId.get(productDoc.id);

              return {
                ...product,
                stockAvailable: inventory?.stockAvailable ?? 0,
                stockTotal: inventory?.stockTotal ?? 0,
                enabled: inventory?.enabled ?? false,
              };
            })
            .filter((p) => p.active !== false)
        );
      } catch {
        setProducts([]);
        setError('No se pudo cargar el catálogo en este momento.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section id="productos" className="py-20 bg-bg-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-10">
          <h2 className="text-text-light" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', letterSpacing: '-0.03em', fontWeight: 900 }}>
            Productos disponibles
          </h2>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border animate-pulse bg-card-bg-light border-border-light">
                <div className="aspect-square bg-secondary-bg-light" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-secondary-bg-light" />
                  <div className="h-3 w-1/3 rounded bg-secondary-bg-light" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-20">
            <Package size={40} className="mx-auto mb-3 opacity-40 text-text-light" />
            <p className="text-sm text-text-light opacity-50">No hay productos disponibles en este momento.</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="rounded-3xl border border-border-light bg-card-bg-light px-6 py-12 text-center">
            <Package size={40} className="mx-auto mb-3 text-primary" />
            <p className="text-sm font-semibold text-text-light">{error}</p>
          </div>
        )}

        {/* PRODUCTS */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">

            {products.map((product) => (
              <article
                key={product.id}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border-light bg-card-bg-light transition-all duration-300 hover:-translate-y-1"
              >
                <a
                  href={`/productos/${product.slug}`}
                  aria-label={`Ver detalle de ${product.name}`}
                  className="absolute inset-0 z-10 rounded-2xl"
                />

                {/* IMAGE */}
                <div className="relative aspect-square flex items-center justify-center overflow-hidden bg-secondary-bg-light">
                  <img
                    src={product.imageUrl || PRODUCT_PLACEHOLDER}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = PRODUCT_PLACEHOLDER;
                    }}
                  />

                  {/* BADGE */}
                  {product.badge && (
                    <span className="absolute top-3 left-3 rounded-full bg-primary-action px-2 py-0.5 text-xs font-semibold text-white">
                      {product.badge}
                    </span>
                  )}
                </div>

                {/* INFO */}
                <div className="relative z-20 flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        product.stockAvailable && product.stockAvailable > 0
                          ? 'bg-primary/15 text-primary'
                          : 'bg-primary-action text-white'
                      }`}
                    >
                      {product.stockAvailable && product.stockAvailable > 0 ? 'Disponible' : 'Producto agotado'}
                    </span>
                    <ShoppingBag size={15} className="text-text-light opacity-35" />
                  </div>

                  <div className="mt-3 space-y-2">
                    <span className="line-clamp-2 block text-sm font-semibold leading-5 text-text-light transition-colors group-hover:text-primary">
                      {product.name}
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-text-light">
                        {formatPrice(product.hasOffer && product.offerPrice ? product.offerPrice : product.price)}
                      </span>

                      {product.hasOffer && product.offerPrice && (
                        <span className="text-xs line-through text-text-light opacity-40">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-text-light opacity-65">
                      {product.stockAvailable && product.stockAvailable > 0
                        ? `Stock: ${product.stockAvailable} disponibles`
                        : 'Stock: 0 disponibles'}
                    </p>
                  </div>

                  <div className="mt-auto pt-4">
                    <button
                      type="button"
                      disabled={!product.stockAvailable}
                      className={`inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                        product.stockAvailable && product.stockAvailable > 0
                          ? 'bg-primary text-primary-action hover:opacity-90'
                          : 'cursor-not-allowed bg-secondary-bg-light text-text-light opacity-45'
                      }`}
                    >
                      Agregar al carrito
                    </button>
                  </div>
                  </div>

              </article>
            ))}

          </div>
        )}
      </div>
    </section>
  );
}
