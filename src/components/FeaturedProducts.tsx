import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Package,
  Search,
  X,
  History,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { FaCartPlus, FaFilter } from 'react-icons/fa';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getOfferBadgeData, hasValidOffer } from '../lib/productOffers';
import {
  getCreatedAtTimestamp,
  getSoldCount,
  isPopularProduct,
} from '../lib/productPopularity';
import CategoryFilter from './CategoryFilter';
import { useCartContext, CartProvider } from '../features/cart';

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
  createdAt?: any;
  soldCount?: number;
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

  if (badgeData?.label.trim().toLowerCase() === 'popular') {
    return null;
  }

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
  initialCategory?: string | null;
  initialOffersOnly?: boolean;
  initialSort?: string | null;
  initialPage?: number;
}

function isSortOption(value: string | null | undefined): value is
  | 'best-sellers'
  | 'recent'
  | 'name-asc'
  | 'name-desc' {
  return (
    value === 'best-sellers' ||
    value === 'recent' ||
    value === 'name-asc' ||
    value === 'name-desc'
  );
}

const SORT_OPTIONS = [
  { value: 'best-sellers', label: 'Popular' },
  { value: 'recent', label: 'Recientes' },
  { value: 'name-asc', label: 'A-Z' },
  { value: 'name-desc', label: 'Z-A' },
] as const;

function FeaturedProductsInner({
  initialSearch = '',
  initialCategory = null,
  initialOffersOnly = false,
  initialSort = 'best-sellers',
  initialPage = 1,
}: FeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [appliedSearch, setAppliedSearch] = useState(initialSearch);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { addToCart } = useCartContext();
  const [searchHistory, setSearchHistory] = useState<string[]>(() =>
    getSearchHistory()
  );
  const [inputFocused, setInputFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialCategory
  );
  const [showOffersOnly, setShowOffersOnly] = useState(initialOffersOnly);
  const [currentPage, setCurrentPage] = useState(
    Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1
  );
  const [invalidPage, setInvalidPage] = useState(false);
  const [sortBy, setSortBy] = useState<
    'best-sellers' | 'recent' | 'name-asc' | 'name-desc'
  >(isSortOption(initialSort) ? initialSort : 'best-sellers');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const ITEMS_PER_PAGE = 12;
  const searchRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync category, offers, sort, and page with URL on mount (after hydration)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const pageParamStr = url.searchParams.get('page');
      const categoryParam = url.searchParams.get('category');
      const offersParam = url.searchParams.get('offers') === 'true';
      const sortParam = url.searchParams.get('sort') as
        | 'best-sellers'
        | 'recent'
        | 'name-asc'
        | 'name-desc'
        | null;

      // Validate page is numeric
      const pageNum = pageParamStr ? parseInt(pageParamStr, 10) : 1;
      const isValidPageNumber = !isNaN(pageNum) && pageNum > 0;

      // Remove invalid page param from URL
      if (pageParamStr && !isValidPageNumber) {
        url.searchParams.delete('page');
        window.history.replaceState({}, '', url.toString());
      }

      if (categoryParam !== selectedCategory) {
        setSelectedCategory(categoryParam);
      }
      if (offersParam !== showOffersOnly) {
        setShowOffersOnly(offersParam);
      }
      if (sortParam && sortParam !== sortBy) {
        setSortBy(sortParam);
      }
      if (isValidPageNumber && pageNum !== currentPage) {
        setCurrentPage(pageNum);
      }
    }
  }, []);

  // Validate page number when filters change
  useEffect(() => {
    if (typeof window !== 'undefined' && products.length > 0) {
      const url = new URL(window.location.href);
      const pageParamStr = url.searchParams.get('page');
      const pageNum = pageParamStr ? parseInt(pageParamStr, 10) : 1;
      const isValidPageNumber = !isNaN(pageNum) && pageNum > 0;
      const pageParam = isValidPageNumber ? Math.max(1, pageNum) : 1;

      // Calculate totalPages - estimate based on products and filters
      const filtered = products.filter((p) => {
        if (showOffersOnly && !hasValidOffer(p)) return false;
        if (selectedCategory && p.categoryId !== selectedCategory) return false;
        return true;
      });

      const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
      const validPage = Math.max(1, Math.min(pageParam, totalPages || 1));
      const isOutOfRange = pageParam > validPage;

      // Remove invalid page param and update URL if needed
      if (pageParamStr && !isValidPageNumber) {
        url.searchParams.delete('page');
        window.history.replaceState({}, '', url.toString());
      }

      if (validPage !== currentPage || isOutOfRange) {
        setCurrentPage(validPage);
        setInvalidPage(isOutOfRange);

        // Remove page param if out of range
        if (isOutOfRange) {
          url.searchParams.delete('page');
          window.history.replaceState({}, '', url.toString());
        }
      }
    }
  }, [products.length, selectedCategory, showOffersOnly]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
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
          where('active', '==', true),
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
          productsSnap.docs.map((productDoc) => {
            const product = {
              id: productDoc.id,
              ...productDoc.data(),
            } as Product;
            const inventory = inventoryByProductId.get(productDoc.id);

            return {
              ...product,
              soldCount: getSoldCount(product),
              stockAvailable: inventory?.stockAvailable ?? 0,
              stockTotal: inventory?.stockTotal ?? 0,
              enabled: inventory?.enabled ?? false,
            };
          })
        );
      } catch (error) {
        console.error('Error loading products:', error);
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

    // Hide products without stock
    result = result.filter((product) => (product.stockAvailable ?? 0) > 0);

    if (showOffersOnly) {
      result = result.filter((product) => hasValidOffer(product));
    }

    if (selectedCategory) {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }

    if (appliedSearch) {
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
      result = [...byName, ...byDescription];
    }

    const allSoldCountsAreZero = result.every(
      (product) => getSoldCount(product) === 0
    );
    const effectiveSortBy =
      sortBy === 'best-sellers' && allSoldCountsAreZero ? 'recent' : sortBy;

    // Apply sorting
    const sorted = [...result];
    switch (effectiveSortBy) {
      case 'best-sellers':
        sorted.sort(
          (a, b) =>
            getSoldCount(b) - getSoldCount(a) ||
            getCreatedAtTimestamp(b) - getCreatedAtTimestamp(a)
        );
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'recent':
      default:
        sorted.sort(
          (a, b) => getCreatedAtTimestamp(b) - getCreatedAtTimestamp(a)
        );
        break;
    }

    return sorted;
  }, [products, appliedSearch, selectedCategory, showOffersOnly, sortBy]);

  const selectedSortLabel =
    SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? 'Popular';

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

  const updateUrl = (
    term: string = '',
    offers: boolean = showOffersOnly,
    category: string | null = selectedCategory,
    page: number = currentPage,
    sort: typeof sortBy = sortBy
  ) => {
    const url = new URL(window.location.href);
    if (term.trim()) {
      url.searchParams.set('q', term.trim());
    } else {
      url.searchParams.delete('q');
    }
    if (offers) {
      url.searchParams.set('offers', 'true');
    } else {
      url.searchParams.delete('offers');
    }
    if (category) {
      url.searchParams.set('category', category);
    } else {
      url.searchParams.delete('category');
    }
    if (sort !== 'best-sellers') {
      url.searchParams.set('sort', sort);
    } else {
      url.searchParams.delete('sort');
    }
    if (page > 1) {
      url.searchParams.set('page', page.toString());
    } else {
      url.searchParams.delete('page');
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

        <div className="mb-8 flex flex-col gap-4">
          <div className="flex w-full flex-row items-center gap-3">
            <div className="relative w-auto">
              <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={(newCategory) => {
                  setSelectedCategory(newCategory);
                  setCurrentPage(1);
                  updateUrl(
                    appliedSearch,
                    showOffersOnly,
                    newCategory,
                    1,
                    sortBy
                  );
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const newOffersState = !showOffersOnly;
                setShowOffersOnly(newOffersState);
                setCurrentPage(1);
                updateUrl(
                  appliedSearch,
                  newOffersState,
                  selectedCategory,
                  1,
                  sortBy
                );
              }}
              aria-pressed={showOffersOnly}
              aria-label={
                showOffersOnly
                  ? 'Quitar filtro Solo ofertas'
                  : 'Activar filtro Solo ofertas'
              }
              className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                showOffersOnly
                  ? 'border-primary bg-primary text-bg-light shadow-md shadow-primary/20 hover:brightness-105'
                  : 'border-border-light text-text-light hover:border-primary hover:text-primary'
              }`}
            >
              Ofertas
            </button>
          </div>
          <div className="flex w-full flex-row items-center gap-3">
            <div ref={searchRef} className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light opacity-40"
              />
              <input
                type="text"
                placeholder="¿Qué estás buscando hoy?"
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
                className="w-full rounded-full border border-border-light bg-card-bg-light py-3 pl-11 pr-11 text-[15px] sm:text-sm text-text-light placeholder:text-text-light/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-50"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-text-light opacity-40 hover:bg-secondary-bg-light hover:opacity-100 transition-colors"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={16} />
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
                            updateUrl(
                              term,
                              showOffersOnly,
                              selectedCategory,
                              1,
                              sortBy
                            );
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
                          updateUrl(
                            searchTerm,
                            showOffersOnly,
                            selectedCategory,
                            1,
                            sortBy
                          );
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
                        setSortBy(option.value);
                        setCurrentPage(1);
                        updateUrl(
                          appliedSearch,
                          showOffersOnly,
                          selectedCategory,
                          1,
                          option.value
                        );
                        setShowSortDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                        sortBy === option.value
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

        {!loading && filteredProducts.length > 0 && !invalidPage && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts
                .slice(
                  (currentPage - 1) * ITEMS_PER_PAGE,
                  currentPage * ITEMS_PER_PAGE
                )
                .map((product) => {
                  const showOffer = hasValidOffer(product);
                  const badgeData = getBadgeData(product);
                  const showPopularBadge = isPopularProduct(product);
                  const currentPrice = showOffer
                    ? product.offerPrice!
                    : product.price;

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

                        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                          {badgeData && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeData.className}`}
                            >
                              {badgeData.label}
                            </span>
                          )}
                          {showPopularBadge && (
                            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-amber-950">
                              Popular
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="relative z-20 flex flex-1 flex-col p-3 sm:p-4">
                        <span
                          className="block w-full text-sm sm:text-base font-semibold text-text-light transition-colors group-hover:text-primary"
                          style={{
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 2,
                            overflow: 'hidden',
                          }}
                          title={product.name}
                        >
                          {highlightText(
                            product.name,
                            appliedSearch,
                            getMatchField(product, appliedSearch) === 'name'
                          )}
                        </span>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-2 sm:pt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-text-light">
                          {formatPrice(currentPrice)}
                        </span>
                        {showOffer && (
                          <span className="text-xs sm:text-sm text-text-light opacity-40 line-through">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>
                      <button
                          type="button"
                          title="Agregar al carrito"
                          onClick={(e) => {
                            e.preventDefault();
                            addToCart(product.id, product.stockAvailable ?? 0);
                          }}
                          className="flex items-center justify-center rounded-full p-2.5 sm:p-3 transition-all active:scale-95 text-primary hover:scale-110 hover:drop-shadow-lg shrink-0 relative z-20"
                        >
                          <FaCartPlus className="text-lg sm:text-xl" />
                        </button>
                    </div>


                  </div>
                </article>
              );
            })}
            </div>

            {Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => {
                    const newPage = currentPage - 1;
                    setCurrentPage(newPage);
                    updateUrl(
                      appliedSearch,
                      showOffersOnly,
                      selectedCategory,
                      newPage,
                      sortBy
                    );
                    setInvalidPage(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="rounded-full border border-border-light p-2 text-text-light transition-all hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex gap-1 flex-wrap justify-center items-center">
                  {(() => {
                    const totalPages = Math.ceil(
                      filteredProducts.length / ITEMS_PER_PAGE
                    );
                    const pages: (number | string)[] = [];
                    const showRange = 1;
                    let ellipsisCount = 0;

                    // Always show first page
                    pages.push(1);

                    // Add ellipsis and pages before current
                    const rangeStart = Math.max(2, currentPage - showRange);
                    if (rangeStart > 2) {
                      pages.push(`...left-${ellipsisCount++}`);
                    }

                    for (let i = rangeStart; i < currentPage; i++) {
                      pages.push(i);
                    }

                    // Add current page
                    if (currentPage !== 1) {
                      pages.push(currentPage);
                    }

                    // Add pages after current
                    const rangeEnd = Math.min(
                      totalPages - 1,
                      currentPage + showRange
                    );
                    for (let i = currentPage + 1; i <= rangeEnd; i++) {
                      pages.push(i);
                    }

                    // Add ellipsis and last page
                    if (rangeEnd < totalPages - 1) {
                      pages.push(`...right-${ellipsisCount++}`);
                    }
                    if (totalPages > 1 && currentPage !== totalPages) {
                      pages.push(totalPages);
                    }

                    return pages.map((page, index) => {
                      const isEllipsis =
                        typeof page === 'string' && page.startsWith('...');
                      const pageNum = typeof page === 'number' ? page : null;

                      return isEllipsis ? (
                        <span
                          key={`${page}-${index}`}
                          className="px-2 py-2 text-text-light opacity-50"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={`page-${pageNum}`}
                          type="button"
                          onClick={() => {
                            setCurrentPage(pageNum as number);
                            updateUrl(
                              appliedSearch,
                              showOffersOnly,
                              selectedCategory,
                              pageNum as number,
                              sortBy
                            );
                            setInvalidPage(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`rounded-full px-3 py-2 text-sm font-semibold transition-all ${
                            currentPage === pageNum
                              ? 'bg-primary text-bg-light'
                              : 'border border-border-light text-text-light hover:border-primary hover:text-primary'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    });
                  })()}
                </div>

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
                  }
                  onClick={() => {
                    const newPage = currentPage + 1;
                    setCurrentPage(newPage);
                    updateUrl(
                      appliedSearch,
                      showOffersOnly,
                      selectedCategory,
                      newPage,
                      sortBy
                    );
                    setInvalidPage(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="rounded-full border border-border-light p-2 text-text-light transition-all hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}

        {!loading && invalidPage && (
          <div className="flex h-96 items-center justify-center rounded-2xl border border-border-light bg-card-bg-light">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-text-light opacity-50 mb-4" />
              <p className="text-lg font-semibold text-text-light">
                No hay más productos
              </p>
              <p className="text-sm text-text-light opacity-70">
                La página que buscas no existe
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
export default function FeaturedProducts(props: FeaturedProductsProps) {
  return (
    <CartProvider>
      <FeaturedProductsInner {...props} />
    </CartProvider>
  );
}
