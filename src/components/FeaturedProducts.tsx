import { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
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
}

function hasValidOffer(product: Product) {
  return Boolean(
    product.hasOffer &&
      typeof product.offerPrice === 'number' &&
      product.offerPrice < product.price
  );
}

function getDiscountPercentage(product: Product) {
  if (!hasValidOffer(product)) return null;

  return Math.round(((product.price - product.offerPrice!) / product.price) * 100);
}

function getBadgeData(product: Product) {
  const discountPercentage = getDiscountPercentage(product);

  if (discountPercentage) {
    return {
      label: `-${discountPercentage}%`,
      className: 'bg-red-600 text-white',
    };
  }

  if (!product.badge) return null;

  return {
    label: product.badge,
    className: 'bg-primary-action text-bg-light',
  };
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(
          collection(db, 'products'),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const snap = await getDocs(q);

        setProducts(
          snap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }) as Product)
            .filter((p) => p.active !== false)
        );
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section id="productos" className="py-20 bg-bg-light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* HEADER */}
        <div className="flex items-end justify-between mb-10">
          <h2 className="text-text-light" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', letterSpacing: '-0.03em', fontWeight: 900 }}>
            Destacados
          </h2>

          <a href="#" className="inline-flex items-center gap-1 text-sm font-semibold transition-all duration-300 hover:gap-2 text-primary">
            Ver todos <ArrowRight size={14} />
          </a>
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
        {!loading && products.length === 0 && (
          <div className="text-center py-20">
            <Package size={40} className="mx-auto mb-3 opacity-40 text-text-light" />
            <p className="text-sm text-text-light opacity-50">Aún no hay productos.</p>
          </div>
        )}

        {/* PRODUCTS */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

            {products.map((product) => (
              (() => {
                const showOffer = hasValidOffer(product);
                const badgeData = getBadgeData(product);
                const currentPrice = showOffer ? product.offerPrice : product.price;

                return (
              <a
                key={product.id}
                href={`/productos/${product.slug}`}
                aria-label={`Ver detalle de ${product.name}`}
                className="group block rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 bg-card-bg-light border-border-light"
              >

                {/* IMAGE */}
                <div className="relative aspect-square flex items-center justify-center overflow-hidden bg-secondary-bg-light">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <Package size={40} className="text-text-light opacity-20" />
                  )}

                  {/* BADGE */}
                  {badgeData && (
                    <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-semibold ${badgeData.className}`}>{badgeData.label}</span>
                  )}

                  {/* QUICK ACTION */}
                  <span
                    aria-hidden="true"
                    className="absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 bg-bg-light text-text-light"
                  >
                    <ShoppingBag size={14} />
                  </span>
                </div>

                {/* INFO */}
                <div className="p-4">
                  <span className="text-sm font-semibold group-hover:text-primary transition-colors text-text-light">
                    {product.name}
                  </span>

                  <div className="flex items-center gap-2 mt-1">

                    <span className="text-sm font-bold text-text-light">$
                      {currentPrice}
                    </span>

                    {showOffer && (
                      <span className="text-xs line-through text-text-light opacity-40">${product.price}</span>
                    )}

                  </div>
                </div>

              </a>
                );
              })()
            ))}

          </div>
        )}
      </div>
    </section>
  );
}
