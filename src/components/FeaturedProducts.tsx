import { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  active?: boolean;
  hasOffer?: boolean;
  offerPrice?: number;
  badge?: string;
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
    <section
      id="productos"
      className="py-20"
      style={{ backgroundColor: '#FFFBF4' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* HEADER */}
        <div className="flex items-end justify-between mb-10">
          <h2
            style={{
              color: '#1E1E1E',
              fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              letterSpacing: '-0.03em',
              fontWeight: 900,
            }}
          >
            Destacados
          </h2>

          <a
            href="#"
            className="inline-flex items-center gap-1 text-sm font-semibold transition-all duration-300 hover:gap-2"
            style={{ color: '#88B04B' }}
          >
            Ver todos <ArrowRight size={14} />
          </a>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden border animate-pulse"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: 'rgba(136,176,75,0.15)',
                }}
              >
                <div className="aspect-square" style={{ backgroundColor: '#E8E5D8' }} />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-3/4 rounded" style={{ backgroundColor: '#E8E5D8' }} />
                  <div className="h-3 w-1/3 rounded" style={{ backgroundColor: '#E8E5D8' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY */}
        {!loading && products.length === 0 && (
          <div className="text-center py-20">
            <Package size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm" style={{ color: '#1E1E1E', opacity: 0.5 }}>
              Aún no hay productos.
            </p>
          </div>
        )}

        {/* PRODUCTS */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

            {products.map((product) => (
              <div
                key={product.id}
                className="group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: 'rgba(136,176,75,0.15)',
                }}
              >

                {/* IMAGE */}
                <div
                  className="relative aspect-square flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: '#E8E5D8' }}
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <Package size={40} style={{ color: '#1E1E1E', opacity: 0.2 }} />
                  )}

                  {/* BADGE */}
                  {product.badge && (
                    <span
                      className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: '#1E1E1E',
                        color: '#FFFBF4',
                      }}
                    >
                      {product.badge}
                    </span>
                  )}

                  {/* QUICK ACTION */}
                  <button
                    className="absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                    style={{
                      backgroundColor: '#FFFBF4',
                      color: '#1E1E1E',
                    }}
                  >
                    <ShoppingBag size={14} />
                  </button>
                </div>

                {/* INFO */}
                <div className="p-4">
                  <h3
                    className="text-sm font-semibold group-hover:text-[#88B04B] transition-colors"
                    style={{ color: '#1E1E1E' }}
                  >
                    {product.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-1">

                    <span
                      className="text-sm font-bold"
                      style={{ color: '#1E1E1E' }}
                    >
                      $
                      {product.hasOffer && product.offerPrice
                        ? product.offerPrice
                        : product.price}
                    </span>

                    {product.hasOffer && product.offerPrice && (
                      <span
                        className="text-xs line-through"
                        style={{ color: '#1E1E1E', opacity: 0.4 }}
                      >
                        ${product.price}
                      </span>
                    )}

                  </div>
                </div>

              </div>
            ))}

          </div>
        )}
      </div>
    </section>
  );
}