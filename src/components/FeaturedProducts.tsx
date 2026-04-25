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
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(6));
        const snap = await getDocs(q);
        setProducts(
          snap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Product))
            .filter(product => product.active !== false)
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
    <section id="productos" className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-slate-900">Destacados</h2>
          <a href="#" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
            Ver todos <ArrowRight size={14} />
          </a>
        </div>

        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
                <div className="aspect-square bg-slate-100" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <Package size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aún no hay productos. Agrega desde Firestore la colección <code className="bg-slate-100 px-1 rounded">products</code>.</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="relative bg-slate-100 aspect-square flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Package size={40} className="text-slate-300" />
                  )}
                  {product.badge && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white">
                      {product.badge}
                    </span>
                  )}
                  <button className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 hover:bg-indigo-600 hover:text-white text-slate-700">
                    <ShoppingBag size={14} />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-slate-900 text-sm">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-900 font-bold text-sm">
                      ${product.hasOffer && product.offerPrice ? product.offerPrice : product.price}
                    </span>
                    {product.hasOffer && product.offerPrice && (
                      <span className="text-slate-400 text-xs line-through">${product.price}</span>
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
