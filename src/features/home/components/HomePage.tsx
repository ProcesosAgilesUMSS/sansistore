import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from 'astro:transitions/client';
import { ChevronLeft, ChevronRight, Package, Search } from 'lucide-react';
import CategoryFilter from '../../../components/CategoryFilter';
import { CartProvider } from '../../cart';
import ProductCard from '../../catalog/components/ProductCard';
import { fetchCatalogCategories, type CatalogCategory } from '../../catalog/services/categoryService';
import { fetchCatalogProducts } from '../../catalog/services/catalogService';
import type { CatalogProduct } from '../../catalog/types';
import {
  filterCatalogProducts,
  getCatalogUrl,
  sortCatalogProducts,
} from '../../catalog/utils/catalogFilters';

const PRODUCTS_PER_VIEW = 4;
const MOBILE_PRODUCTS_PER_VIEW = 2;
const AUTOPLAY_INTERVAL_MS = 2600;

function HomeCatalogControls() {
  const navigatingToCatalogRef = useRef(false);

  const goToCatalogSearch = () => {
    if (navigatingToCatalogRef.current) return;
    navigatingToCatalogRef.current = true;
    void navigate('/productos?focusSearch=true');
  };

  return (
    <div className="mb-4 flex flex-col gap-4">
      <div className="flex w-full flex-row items-center gap-3">
        <div className="relative w-auto">
          <CategoryFilter
            selectedCategory={null}
            onCategoryChange={(categoryId) => {
              void navigate(getCatalogUrl({ categoryId }));
            }}
          />
        </div>
        <a
          href={getCatalogUrl({ offersOnly: true })}
          aria-label="Activar filtro Solo ofertas"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border-light px-5 py-2.5 text-sm font-semibold transition-all duration-200 text-text-light hover:border-primary hover:text-primary"
        >
          Ofertas
        </a>
      </div>
      <div className="flex w-full flex-row items-center gap-3">
        <div
          className="relative flex-1"
          aria-label="Buscar productos en el catálogo"
        >
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light opacity-40"
          />
          <input
            type="text"
            placeholder="¿Qué estás buscando hoy?"
            onClick={goToCatalogSearch}
            onFocus={goToCatalogSearch}
            onPointerDown={goToCatalogSearch}
            maxLength={100}
            className="w-full rounded-full border border-border-light bg-card-bg-light py-3 pl-11 pr-11 text-[15px] sm:text-sm text-text-light placeholder:text-text-light/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>
    </div>
  );
}

function ProductCarousel({
  title,
  products,
  href,
}: {
  title: string;
  products: CatalogProduct[];
  href: string;
}) {
  const carouselRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const carouselProducts = useMemo(() => products.slice(0, 12), [products]);
  const [productsPerView, setProductsPerView] = useState(() => {
    if (typeof window === 'undefined') return PRODUCTS_PER_VIEW;

    return window.matchMedia('(min-width: 768px)').matches
      ? PRODUCTS_PER_VIEW
      : MOBILE_PRODUCTS_PER_VIEW;
  });
  const [activePosition, setActivePosition] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [stepWidth, setStepWidth] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setProductsPerView(event.matches ? PRODUCTS_PER_VIEW : MOBILE_PRODUCTS_PER_VIEW);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const maxPosition = Math.max(0, carouselProducts.length - productsPerView);
  const visiblePosition = Math.min(activePosition, maxPosition);
  const positionCount = maxPosition + 1;

  useEffect(() => {
    const measure = () => {
      const firstItem = trackRef.current?.firstElementChild as HTMLElement | null;
      if (!firstItem) return;

      const styles = window.getComputedStyle(trackRef.current!);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || '0');
      setStepWidth(firstItem.offsetWidth + gap);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [carouselProducts.length, productsPerView]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || hasStarted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(carousel);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted || maxPosition <= 0) return;

    const interval = window.setInterval(() => {
      setActivePosition((current) => (current >= maxPosition ? 0 : current + 1));
    }, AUTOPLAY_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [hasStarted, maxPosition]);

  if (carouselProducts.length === 0) return null;

  const canGoBack = visiblePosition > 0;
  const canGoForward = visiblePosition < maxPosition;
  const useCompactCardWidth = carouselProducts.length <= productsPerView;

  return (
    <section ref={carouselRef} className="py-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-text-light sm:text-xl">
          <span className="inline-block h-4 w-1 rounded-full bg-primary" />
          {title}
        </h2>
        <a
          href={href}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 px-4 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-white sm:text-sm"
        >
          Ver más
          <ChevronRight size={14} />
        </a>
      </div>

      <div className="relative overflow-hidden">
        <button
          type="button"
          aria-label={`Anterior en ${title}`}
          onClick={() => setActivePosition((current) => Math.max(0, current - 1))}
          className={`absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border-light bg-card-bg-light/95 text-text-light shadow-md backdrop-blur-sm transition-all duration-200 hover:border-primary hover:text-primary ${
            canGoBack ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          aria-label={`Siguiente en ${title}`}
          onClick={() =>
            setActivePosition((current) => Math.min(maxPosition, current + 1))
          }
          className={`absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border-light bg-card-bg-light/95 text-text-light shadow-md backdrop-blur-sm transition-all duration-200 hover:border-primary hover:text-primary ${
            canGoForward ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <ChevronRight size={18} />
        </button>
        <div
          ref={trackRef}
          className="flex gap-3 transition-transform duration-700 ease-out sm:gap-4"
          style={{
            transform: `translateX(-${visiblePosition * stepWidth}px)`,
          }}
        >
          {carouselProducts.map((product) => (
            <div
              key={`${title}-${product.id}`}
              className={useCompactCardWidth
                ? 'min-w-[calc((100%_-_0.75rem)/2)] max-w-[240px] sm:min-w-[calc((100%_-_1rem)/2)] md:min-w-[calc((100%_-_3rem)/4)] md:max-w-[270px]'
                : 'min-w-[calc((100%_-_0.75rem)/2)] sm:min-w-[calc((100%_-_1rem)/2)] md:min-w-[calc((100%_-_3rem)/4)]'}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {positionCount > 1 && (
        <div className="mt-4 flex justify-center gap-2" aria-label={`Paginación de ${title}`}>
          {Array.from({ length: positionCount }).map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ver producto ${index + 1}`}
              onClick={() => setActivePosition(index)}
              className={`h-2 rounded-full transition-all ${
                visiblePosition === index ? 'w-6 bg-primary' : 'w-2 bg-border-light'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function HomePageInner() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHomeData = async () => {
      setError(null);
      try {
        const [loadedProducts, loadedCategories] = await Promise.all([
          fetchCatalogProducts(),
          fetchCatalogCategories(),
        ]);
        setProducts(loadedProducts);
        setCategories(loadedCategories);
      } catch (error) {
        console.error('Error loading home products:', error);
        setError('No se pudieron cargar los productos destacados.');
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const offers = useMemo(
    () =>
      sortCatalogProducts(
        filterCatalogProducts(products, { offersOnly: true }),
        'best-sellers'
      ),
    [products]
  );
  const popular = useMemo(
    () => sortCatalogProducts(products, 'best-sellers'),
    [products]
  );
  const recent = useMemo(() => sortCatalogProducts(products, 'recent'), [products]);
  const categoryCarousels = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          products: sortCatalogProducts(
            filterCatalogProducts(products, { categoryId: category.id }),
            'best-sellers'
          ),
        }))
        .filter((carousel) => carousel.products.length > 0),
    [categories, products]
  );

  return (
    <main className="min-h-screen bg-bg-light text-text-light">
      <section id="productos" className="bg-bg-light py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-center justify-center">
            <h2
              className="text-center text-text-light"
              style={{
                fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                letterSpacing: '-0.03em',
                fontWeight: 900,
              }}
            >
              Bienvenido a Sansi<span className="text-primary">Store</span>
            </h2>
          </div>

          <HomeCatalogControls />

          {loading && (
            <div className="space-y-6 pt-4">
              {Array.from({ length: 3 }).map((_, sectionIndex) => (
                <div key={sectionIndex}>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-4 w-1 animate-pulse rounded-full bg-primary/30" />
                    <div className="h-5 w-24 animate-pulse rounded bg-secondary-bg-light" />
                  </div>
                  <div className="flex gap-3 overflow-hidden sm:gap-4">
                    {Array.from({ length: 4 }).map((_, cardIndex) => (
                      <div
                        key={cardIndex}
                        className="min-w-[calc((100%-0.75rem)/2)] animate-pulse overflow-hidden rounded-2xl border border-border-light bg-card-bg-light md:min-w-[calc((100%-3rem)/4)]"
                      >
                        <div className="aspect-square bg-secondary-bg-light" />
                        <div className="space-y-2 p-3">
                          <div className="h-3 w-3/4 rounded bg-secondary-bg-light" />
                          <div className="h-3 w-1/3 rounded bg-secondary-bg-light" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-3xl border border-border-light bg-card-bg-light px-6 py-12 text-center">
              <Package size={40} className="mx-auto mb-3 text-primary" />
              <p className="text-sm font-semibold text-text-light">
                {error}
              </p>
              <a
                href="/productos"
                className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-text-light transition-all hover:brightness-105"
              >
                Ver catálogo
              </a>
            </div>
          )}

          {!loading && !error && (
            <div>
              <ProductCarousel
                title="Ofertas"
                products={offers}
                href={getCatalogUrl({ offersOnly: true })}
              />
              <ProductCarousel
                title="Populares"
                products={popular}
                href={getCatalogUrl({ sortBy: 'best-sellers' })}
              />
              <ProductCarousel
                title="Novedades"
                products={recent}
                href={getCatalogUrl({ sortBy: 'recent' })}
              />
              {categoryCarousels.map(({ category, products }) => (
                <ProductCarousel
                  key={category.id}
                  title={category.name}
                  products={products}
                  href={getCatalogUrl({ categoryId: category.id })}
                />
              ))}
            </div>
          )}
        </div>
      </section>
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
