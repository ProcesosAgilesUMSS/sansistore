import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronRight, Package, Search, Sparkles } from 'lucide-react';
import CategoryFilter from '../../../components/CategoryFilter';
import { CartProvider } from '../../cart';
import ProductCard from '../../catalog/components/ProductCard';
import { fetchCatalogProducts } from '../../catalog/services/catalogService';
import type { CatalogProduct, CatalogSort } from '../../catalog/types';
import {
  filterCatalogProducts,
  getCatalogUrl,
  sortCatalogProducts,
} from '../../catalog/utils/catalogFilters';

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: 'best-sellers', label: 'Popular' },
  { value: 'recent', label: 'Recientes' },
  { value: 'name-asc', label: 'A-Z' },
  { value: 'name-desc', label: 'Z-A' },
];

function goToCatalog(url = '/productos') {
  window.location.href = url;
}

function HomeCatalogControls() {
  return (
    <div className="mx-auto mt-8 w-full max-w-4xl rounded-[2rem] border border-border-light bg-card-bg-light/90 p-3 shadow-2xl shadow-primary/10 backdrop-blur-md sm:p-4">
      <div className="mb-3 flex w-full flex-row items-center gap-3">
        <div className="relative w-auto">
          <CategoryFilter
            selectedCategory={null}
            onCategoryChange={(categoryId) => {
              goToCatalog(getCatalogUrl({ categoryId }));
            }}
          />
        </div>
        <a
          href={getCatalogUrl({ offersOnly: true })}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border-light px-5 py-2.5 text-sm font-semibold text-text-light transition-all hover:border-primary hover:text-primary"
        >
          Ofertas
        </a>
      </div>

      <div className="flex w-full flex-row items-center gap-3">
        <button
          type="button"
          onClick={() => goToCatalog('/productos')}
          className="relative flex-1 text-left"
          aria-label="Buscar productos en el catálogo"
        >
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light opacity-40"
          />
          <span className="block w-full rounded-full border border-border-light bg-card-bg-light py-3 pl-11 pr-11 text-[15px] text-text-light/30 transition-all hover:border-primary hover:ring-4 hover:ring-primary/10 sm:text-sm">
            ¿Qué estás buscando hoy?
          </span>
        </button>

        <select
          aria-label="Ordenar productos"
          defaultValue="best-sellers"
          onChange={(event) => {
            goToCatalog(getCatalogUrl({ sortBy: event.target.value as CatalogSort }));
          }}
          className="hidden rounded-full border border-border-light bg-card-bg-light px-4 py-2.5 text-sm font-semibold text-text-light transition-all hover:border-primary hover:text-primary sm:block"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ProductCarousel({
  title,
  eyebrow,
  products,
  href,
}: {
  title: string;
  eyebrow: string;
  products: CatalogProduct[];
  href: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="py-6 sm:py-8">
      <div className="mb-4 flex items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-text-light sm:text-3xl">
            {title}
          </h2>
        </div>
        <a
          href={href}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border-light px-4 py-2 text-sm font-bold text-text-light transition-all hover:border-primary hover:text-primary"
        >
          Ver más
          <ChevronRight size={16} />
        </a>
      </div>

      <div className="overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8">
        <div className="flex gap-3 sm:gap-4">
          {products.map((product) => (
            <div
              key={`${title}-${product.id}`}
              className="w-[68vw] max-w-[250px] shrink-0 sm:w-[230px] lg:w-[240px]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomePageInner() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      setError(null);
      try {
        setProducts(await fetchCatalogProducts());
      } catch (error) {
        console.error('Error loading home products:', error);
        setError('No se pudieron cargar los productos destacados.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const offers = useMemo(
    () =>
      sortCatalogProducts(
        filterCatalogProducts(products, { offersOnly: true }),
        'best-sellers'
      ).slice(0, 10),
    [products]
  );
  const popular = useMemo(
    () => sortCatalogProducts(products, 'best-sellers').slice(0, 10),
    [products]
  );
  const recent = useMemo(
    () => sortCatalogProducts(products, 'recent').slice(0, 10),
    [products]
  );

  return (
    <main className="min-h-screen bg-bg-light pt-14 text-text-light">
      <section className="relative overflow-hidden border-b border-border-light px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(136,176,75,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(136,176,75,0.12),transparent_30%)]" />
        <div className="relative mx-auto max-w-6xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-primary">
            <Sparkles size={14} />
            Sansistore UMSS
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.05em] text-text-light sm:text-6xl lg:text-7xl">
            Descubre productos para tu día en la universidad
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-text-light opacity-65 sm:text-lg">
            Explora ofertas, favoritos de la comunidad y novedades. Cuando quieras buscar o filtrar, te llevamos al catálogo completo.
          </p>

          <HomeCatalogControls />

          <a
            href="/productos"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary transition-all hover:gap-3"
          >
            Ir al catálogo completo
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {loading && (
        <section className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-12 sm:grid-cols-3 sm:gap-4 sm:px-6 lg:grid-cols-5 lg:px-8">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-2xl border border-border-light bg-card-bg-light"
            />
          ))}
        </section>
      )}

      {!loading && error && (
        <section className="mx-auto max-w-xl px-4 py-16 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-text-light opacity-40" />
          <h2 className="text-xl font-black text-text-light">No pudimos cargar la home</h2>
          <p className="mt-2 text-sm font-semibold text-text-light opacity-65">{error}</p>
          <a
            href="/productos"
            className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-white"
          >
            Ver productos
          </a>
        </section>
      )}

      {!loading && !error && (
        <div className="mx-auto max-w-[1500px] py-6">
          <ProductCarousel
            eyebrow="Descuentos activos"
            title="Ofertas para aprovechar"
            products={offers}
            href={getCatalogUrl({ offersOnly: true })}
          />
          <ProductCarousel
            eyebrow="Lo más elegido"
            title="Populares en Sansistore"
            products={popular}
            href={getCatalogUrl({ sortBy: 'best-sellers' })}
          />
          <ProductCarousel
            eyebrow="Recién agregados"
            title="Novedades del catálogo"
            products={recent}
            href={getCatalogUrl({ sortBy: 'recent' })}
          />
        </div>
      )}
    </main>
  );
}

export default function HomePage() {
  return (
    <CartProvider>
      <HomePageInner />
    </CartProvider>
  );
}
