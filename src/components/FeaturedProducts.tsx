import { useEffect, useState, useMemo, useRef } from 'react';
import {
  ShoppingBag,
  Package,
  Search,
  X,
  History,
  Trash2,
  Percent,
} from 'lucide-react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getOfferBadgeData, hasValidOffer } from '../lib/productOffers';
import CategoryFilter from './CategoryFilter';

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
  active?: boolean;
  hasOffer?: boolean;
  offerPrice?: number;
  description?: string;
  badge?: string;
  stockAvailable?: number;
  stockTotal?: number;
  enabled?: boolean;
  categoryId?: string;
}

interface Inventory {
  id: string;
  productId?: string;
  stockAvailable?: number;
  stockTotal?: number;
  enabled?: boolean;
}

const PRODUCT_PLACEHOLDER = '/product-placeholder.svg';
const MAX_SEARCH_LENGTH = 100;
const SEARCH_HISTORY_KEY = 'sansistore-search-history';
const MAX_HISTORY_ITEMS = 5;

function getSearchHistory(): string[] {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSearchTerm(term: string) {
  if (!term.trim()) return;
  try {
    const current = getSearchHistory();
    const filtered = current.filter(
      (t) => t.toLowerCase() !== term.toLowerCase()
    );
    const updated = [term, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

function deleteSearchTerm(term: string) {
  try {
    const current = getSearchHistory();
    const updated = current.filter(
      (t) => t.toLowerCase() !== term.toLowerCase()
    );
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

function formatPrice(amount: number) {
  return `Bs ${amount.toFixed(2)}`;
}

function getBadgeData(product: Product) {
  const badgeData = getOfferBadgeData(product);

  if (badgeData?.isDiscount) {
    return {
      label: badgeData.label,
      className: 'bg-red-600 text-white',
    };
  }

  if (!badgeData) return null;

  return {
    label: badgeData.label,
    className: 'bg-primary-action text-white',
  };
}

interface FeaturedProductsProps {
  initialSearch?: string;
}

export default function FeaturedProducts({
  initialSearch = '',
}: FeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [appliedSearch, setAppliedSearch] = useState(initialSearch);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() =>
    getSearchHistory()
  );
  const [inputFocused, setInputFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOffersOnly, setShowOffersOnly] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            const inventory = {
              id: inventoryDoc.id,
              ...inventoryDoc.data(),
            } as Inventory;
            return [inventory.productId ?? inventoryDoc.id, inventory];
          })
        );

        setProducts(
          productsSnap.docs
            .map((productDoc) => {
              const product = {
                id: productDoc.id,
                ...productDoc.data(),
              } as Product;
              const inventory = inventoryByProductId.get(productDoc.id);

              return {
                ...product,
                stockAvailable: inventory?.stockAvailable ?? 0,
                stockTotal: inventory?.stockTotal ?? 0,
                enabled: inventory?.enabled ?? false,
              };
            })
            .filter((product) => product.active !== false)
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

  const removeAccents = (text: string) => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const filteredProducts = useMemo(() => {
    let result = products;

    if (showOffersOnly) {
      result = result.filter((product) => hasValidOffer(product));
    }

    if (selectedCategory) {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }

    if (!appliedSearch) return result;

    const term = removeAccents(appliedSearch.toLowerCase());
    const byName = result.filter((p) =>
      removeAccents(p.name.toLowerCase()).includes(term)
    );
    const byDescription = result.filter(
      (p) =>
        !removeAccents(p.name.toLowerCase()).includes(term) &&
        p.description &&
        removeAccents(p.description.toLowerCase()).includes(term)
    );
    return [...byName, ...byDescription];
  }, [products, appliedSearch, selectedCategory, showOffersOnly]);

  const searchSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 1) {
      if (inputFocused && searchHistory.length > 0) {
        return searchHistory.map((term) => ({
          type: 'history' as const,
          term,
        }));
      }
      return [];
    }
    const normalizedTerm = removeAccents(searchTerm.toLowerCase());
    const historySuggestions = searchHistory
      .filter((term) =>
        removeAccents(term.toLowerCase()).includes(normalizedTerm)
      )
      .map((term) => ({ type: 'history' as const, term }));
    const productSuggestions = products
      .filter((p) =>
        removeAccents(p.name.toLowerCase()).includes(normalizedTerm)
      )
      .slice(0, 5)
      .map((p) => ({ type: 'product' as const, product: p }));
    return [...historySuggestions, ...productSuggestions];
  }, [products, searchTerm, searchHistory, inputFocused]);

  const highlightText = (
    text: string,
    term: string,
    enabled: boolean = true
  ) => {
    if (!enabled || !term || !text) return text;
    const normalizedText = removeAccents(text);
    const normalizedTerm = removeAccents(term);
    const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    const result: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(normalizedText)) !== null) {
      if (match.index > lastIndex) {
        result.push(text.slice(lastIndex, match.index));
      }
      result.push(
        <mark
          key={match.index}
          className="bg-primary/30 text-primary font-semibold rounded px-0.5"
        >
          {text.slice(match.index, match.index + match[0].length)}
        </mark>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex));
    }
    return result.length > 0 ? result : text;
  };

  const getMatchField = (product: Product, term: string) => {
    if (!term) return null;
    const t = removeAccents(term.toLowerCase());
    if (removeAccents(product.name.toLowerCase()).includes(t)) return 'name';
    if (
      product.description &&
      removeAccents(product.description.toLowerCase()).includes(t)
    )
      return 'description';
    return null;
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    setAppliedSearch('');
    setShowSuggestions(false);
    updateUrl('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleSearchClear();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Enter') {
      saveSearchTerm(searchTerm);
      setSearchHistory(getSearchHistory());
      setAppliedSearch(searchTerm);
      updateUrl(searchTerm);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 1) {
      setShowSuggestions(true);
    } else if (inputFocused) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const updateUrl = (term: string) => {
    const url = new URL(window.location.href);
    if (term.trim()) {
      url.searchParams.set('q', term.trim());
    } else {
      url.searchParams.delete('q');
    }
    window.history.pushState({}, '', url);
  };

  return (
    <section id="productos" className="bg-bg-light py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2
            className="text-text-light"
            style={{
              fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              letterSpacing: '-0.03em',
              fontWeight: 900,
            }}
          >
            Productos disponibles
          </h2>
        </div>

        <div className="mb-6 flex max-w-6xl flex-wrap items-center gap-3">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
          <button
            type="button"
            onClick={() => setShowOffersOnly((current) => !current)}
            aria-pressed={showOffersOnly}
            aria-label={
              showOffersOnly
                ? 'Quitar filtro Solo ofertas'
                : 'Activar filtro Solo ofertas'
            }
            className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              showOffersOnly
                ? 'border-primary bg-primary text-bg-light hover:brightness-110'
                : 'border-border-light text-text-light hover:border-primary hover:text-primary'
            }`}
          >
            <Percent size={14} className="mr-2" aria-hidden="true" />
            Solo ofertas
            {showOffersOnly && (
              <X size={14} className="ml-2" aria-hidden="true" />
            )}
          </button>
          <div ref={searchRef} className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light opacity-40"
            />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_SEARCH_LENGTH}
              disabled={loading}
              onFocus={() => {
                setInputFocused(true);
                setShowSuggestions(true);
              }}
              onBlur={() => setInputFocused(false)}
              className="w-full rounded-full border border-border-light bg-card-bg-light py-2.5 pl-10 pr-10 text-sm text-text-light placeholder:text-text-light/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleSearchClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-light opacity-40 hover:bg-secondary-bg-light hover:opacity-100"
                aria-label="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}

            {showSuggestions && searchSuggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border-light bg-card-bg-light py-1 shadow-lg">
                {searchSuggestions.map((suggestion) => (
                  <li
                    key={
                      suggestion.type === 'history'
                        ? `history-${suggestion.term}`
                        : suggestion.product.id
                    }
                  >
                    <div className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-light">
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const term =
                            suggestion.type === 'history'
                              ? suggestion.term
                              : suggestion.product.name;
                          if (suggestion.type === 'history') {
                            saveSearchTerm(term);
                            setSearchHistory(getSearchHistory());
                          } else {
                            saveSearchTerm(term);
                            setSearchHistory(getSearchHistory());
                          }
                          setSearchTerm(term);
                          setAppliedSearch(term);
                          updateUrl(term);
                          setShowSuggestions(false);
                        }}
                        className="flex flex-1 items-center gap-2 hover:bg-secondary-bg-light rounded py-1 -my-1 cursor-pointer"
                      >
                        {suggestion.type === 'history' && (
                          <History
                            size={14}
                            className="text-primary shrink-0"
                          />
                        )}
                        <span className="line-clamp-1">
                          {suggestion.type === 'history'
                            ? highlightText(suggestion.term, searchTerm, true)
                            : highlightText(
                                suggestion.product.name,
                                searchTerm,
                                true
                              )}
                        </span>
                      </button>
                      {suggestion.type === 'history' && (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            deleteSearchTerm(suggestion.term);
                            setSearchHistory(getSearchHistory());
                          }}
                          className="shrink-0 p-1 text-text-light opacity-40 hover:text-red-500 hover:opacity-100 cursor-pointer rounded"
                          aria-label="Eliminar de historial"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {showSuggestions &&
              searchSuggestions.length === 0 &&
              searchTerm && (
                <ul className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border border-border-light bg-card-bg-light py-1 shadow-lg">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        saveSearchTerm(searchTerm);
                        setSearchHistory(getSearchHistory());
                        setAppliedSearch(searchTerm);
                        setShowSuggestions(false);
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-text-light hover:bg-secondary-bg-light"
                    >
                      Buscar &quot;{searchTerm}&quot;
                    </button>
                  </li>
                </ul>
              )}
          </div>
        </div>

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
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading &&
          filteredProducts.length === 0 &&
          (appliedSearch || selectedCategory || showOffersOnly) && (
            <div className="py-20 text-center">
              <Package
                size={40}
                className="mx-auto mb-3 text-text-light opacity-40"
              />
              <p className="text-sm text-text-light opacity-50">
                {showOffersOnly
                  ? 'No hay ofertas disponibles en este momento'
                  : selectedCategory && !appliedSearch
                    ? 'No hay productos disponibles en esta categoría'
                    : 'No se encontraron productos'}
              </p>
            </div>
          )}

        {!loading && error && products.length === 0 && (
          <div className="rounded-3xl border border-border-light bg-card-bg-light px-6 py-12 text-center">
            <Package size={40} className="mx-auto mb-3 text-primary" />
            <p className="text-sm font-semibold text-text-light">
              No se pudo cargar el catálogo.
            </p>
            <p className="mt-2 text-sm text-text-light opacity-70">
              Intenta nuevamente más tarde.
            </p>
          </div>
        )}

        {!loading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const showOffer = hasValidOffer(product);
              const badgeData = getBadgeData(product);
              const currentPrice = showOffer
                ? product.offerPrice!
                : product.price;
              const isAvailable = (product.stockAvailable ?? 0) > 0;

              return (
                <article
                  key={product.id}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border-light bg-card-bg-light transition-all duration-300 hover:-translate-y-1"
                >
                  <a
                    href={`/productos/${product.slug}`}
                    aria-label={`Ver detalle de ${product.name}`}
                    className="absolute inset-0 z-10 rounded-2xl"
                  />

                  <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-secondary-bg-light">
                    <img
                      src={product.imageUrl || PRODUCT_PLACEHOLDER}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = PRODUCT_PLACEHOLDER;
                      }}
                    />

                    {badgeData && (
                      <span
                        className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-xs font-semibold ${badgeData.className}`}
                      >
                        {badgeData.label}
                      </span>
                    )}
                  </div>

                  <div className="relative z-20 flex flex-1 flex-col p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          isAvailable
                            ? 'bg-primary/15 text-primary'
                            : 'bg-primary-action text-white'
                        }`}
                      >
                        {isAvailable ? 'Disponible' : 'Producto agotado'}
                      </span>
                      <ShoppingBag
                        size={15}
                        className="text-text-light opacity-35"
                      />
                    </div>

                    <div className="mt-3 space-y-2">
                      <span className="block line-clamp-2 text-sm font-semibold leading-5 text-text-light transition-colors group-hover:text-primary">
                        {highlightText(
                          product.name,
                          appliedSearch,
                          getMatchField(product, appliedSearch) === 'name'
                        )}
                      </span>

                      {product.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-text-light opacity-65">
                          {highlightText(
                            product.description,
                            appliedSearch,
                            getMatchField(product, appliedSearch) ===
                              'description'
                          )}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-text-light">
                          {formatPrice(currentPrice)}
                        </span>
                        {showOffer && (
                          <span className="text-xs text-text-light opacity-40 line-through">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-text-light opacity-65">
                        {isAvailable
                          ? `Stock: ${product.stockAvailable} disponibles`
                          : 'Stock: 0 disponibles'}
                      </p>
                    </div>

                    <div className="mt-auto pt-4">
                      <button
                        type="button"
                        disabled={!isAvailable}
                        className={`inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                          isAvailable
                            ? 'bg-primary text-primary-action hover:opacity-90'
                            : 'cursor-not-allowed bg-secondary-bg-light text-text-light opacity-45'
                        }`}
                      >
                        Agregar al carrito
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
