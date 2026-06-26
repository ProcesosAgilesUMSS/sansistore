import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from 'astro:transitions/client';
import { ChevronRight, Package, Search } from 'lucide-react';
import { FaFilter } from 'react-icons/fa';
import CategoryFilter from '../../../components/CategoryFilter';
import { CartProvider } from '../../cart';
import ProductCard from '../../catalog/components/ProductCard';
import { fetchCatalogCategories, type CatalogCategory } from '../../catalog/services/categoryService';
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

const PRODUCTS_PER_VIEW = 4;
const AUTOPLAY_INTERVAL_MS = 2600;

function buildProductWindows(products: CatalogProduct[]) {
  if (products.length <= PRODUCTS_PER_VIEW) return [products];

  const windows: CatalogProduct[][] = [];
  for (let startIndex = 0; startIndex < products.length; startIndex += 1) {
    windows.push(
      Array.from({ length: PRODUCTS_PER_VIEW }, (_, offset) => {
        return products[(startIndex + offset) % products.length];
      })
    );
  }
  return windows;
}

function HomeCatalogControls() {
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const selectedSortLabel = 'Popular';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="mb-8 flex flex-col gap-4">
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
        <a
          href="/productos"
          aria-label="Buscar productos en el catálogo"
          className="relative flex-1"
        >
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light opacity-40"
          />
          <span className="block w-full rounded-full border border-border-light bg-card-bg-light py-3 pl-11 pr-11 text-[15px] sm:text-sm text-text-light/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all">
            ¿Qué estás buscando hoy?
          </span>
        </a>
        <div ref={sortRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 rounded-full border border-border-light bg-card-bg-light px-4 py-2.5 text-sm font-semibold text-text-light transition-all hover:border-primary hover:text-primary"
            title="Ordenar productos"
            aria-label="Ordenar productos"
          >
            <FaFilter size={16} />
            <span className="hidden sm:inline">{selectedSortLabel}</span>
          </button>
          {showSortDropdown && (
            <div className="absolute right-0 top-full mt-1 min-w-56 rounded-lg border border-border-light bg-card-bg-light py-1 shadow-lg z-20">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setShowSortDropdown(false);
                    void navigate(getCatalogUrl({ sortBy: option.value }));
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                    option.value === 'best-sellers'
                      ? 'bg-primary/15 text-primary'
                      : 'text-text-light hover:bg-secondary-bg-light'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
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
  const slides = useMemo(() => buildProductWindows(products.slice(0, 12)), [products]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

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
    if (!hasStarted || slides.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, AUTOPLAY_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [hasStarted, slides.length]);

  if (slides.length === 0) return null;

  const visibleSlide = activeSlide % slides.length;

  return (
    <section ref={carouselRef} className="py-7">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-black tracking-tight text-text-light sm:text-2xl">
          {title}
        </h2>
        <a
          href={href}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border-light px-4 py-2 text-sm font-bold text-text-light transition-all hover:border-primary hover:text-primary"
        >
          Ver más
          <ChevronRight size={16} />
        </a>
      </div>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${visibleSlide * 100}%)` }}
        >
          {slides.map((slide, slideIndex) => (
            <div
              key={`${title}-${slideIndex}`}
              className="grid min-w-full grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4"
            >
              {slide.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="mt-4 flex justify-center gap-2" aria-label={`Paginación de ${title}`}>
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ver producto ${index + 1}`}
              onClick={() => setActiveSlide(index)}
              className={`h-2 rounded-full transition-all ${
                visibleSlide === index ? 'w-6 bg-primary' : 'w-2 bg-border-light'
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
    <main className="min-h-screen bg-bg-light pt-14 text-text-light">
      <section id="productos" className="bg-bg-light pb-14 pt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-primary">
              Descubre Sansistore
            </p>
            <h1
              className="text-text-light"
              style={{
                fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                letterSpacing: '-0.03em',
                fontWeight: 900,
              }}
            >
              Lo mejor para hoy
            </h1>
          </div>

          <HomeCatalogControls />

          {loading && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse overflow-hidden rounded-2xl border border-border-light bg-card-bg-light"
                >
                  <div className="aspect-square bg-secondary-bg-light" />
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-3/4 rounded bg-secondary-bg-light" />
                    <div className="h-3 w-1/3 rounded bg-secondary-bg-light" />
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
            <div className="space-y-2">
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
