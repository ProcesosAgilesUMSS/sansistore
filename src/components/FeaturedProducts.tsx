import { useEffect, useState, useMemo, useRef } from 'react';
import {Package,Search,X,History,Trash2,ChevronLeft,ChevronRight,Heart,} from 'lucide-react';
import { FaFilter } from 'react-icons/fa';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import CategoryFilter from './CategoryFilter';
import { CartProvider } from '../features/cart';
import { useFavorites } from '../features/favorites';
import ProductCard from '../features/catalog/components/ProductCard';
import { fetchCatalogProducts } from '../features/catalog/services/catalogService';
import type { CatalogProduct, CatalogSort } from '../features/catalog/types';
import {
  filterCatalogProducts,
  isSortOption,
  removeAccents,
  sortCatalogProducts,
} from '../features/catalog/utils/catalogFilters';

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
    return;
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
    return;
  }
}

function highlightText(text: string, term: string, enabled = true) {
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
        className="rounded bg-primary/30 px-0.5 font-semibold text-primary"
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
}

interface FeaturedProductsProps {
  initialSearch?: string;
  initialCategory?: string | null;
  initialOffersOnly?: boolean;
  initialSort?: string | null;
  initialPage?: number;
  favoritesOnly?: boolean;
  title?: string;
}

const SORT_OPTIONS = [
  { value: 'best-sellers', label: 'Popular' },
  { value: 'recent', label: 'Recientes' },
  { value: 'name-asc', label: 'A-Z' },
  { value: 'name-desc', label: 'Z-A' },
] as const;

function readCatalogUrlState() {
  if (typeof window === 'undefined') {
    return {
      category: null as string | null,
      offersOnly: null as boolean | null,
      sort: null as CatalogSort | null,
      page: null as number | null,
    };
  }

  const url = new URL(window.location.href);
  const pageParamStr = url.searchParams.get('page');
  const sortParam = url.searchParams.get('sort');
  const pageNum = pageParamStr ? parseInt(pageParamStr, 10) : 1;
  const hasValidPage = !isNaN(pageNum) && pageNum > 0;

  if (pageParamStr && !hasValidPage) {
    url.searchParams.delete('page');
    window.history.replaceState({}, '', url.toString());
  }

  return {
    category: url.searchParams.get('category'),
    offersOnly: url.searchParams.has('offers')
      ? url.searchParams.get('offers') === 'true'
      : null,
    sort: isSortOption(sortParam) ? sortParam : null,
    page: hasValidPage ? Math.max(1, pageNum) : 1,
  };
}

function FeaturedProductsInner({
  initialSearch = '',
  initialCategory = null,
  initialOffersOnly = false,
  initialSort = 'best-sellers',
  initialPage = 1,
  favoritesOnly = false,
  title = 'Productos disponibles',
}: FeaturedProductsProps) {
  const initialUrlState = readCatalogUrlState();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [appliedSearch, setAppliedSearch] = useState(initialSearch);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const {
    favoriteIds,
    loading: favoritesLoading,
    error: favoritesError,
  } = useFavorites();
  const [searchHistory, setSearchHistory] = useState<string[]>(() =>
    getSearchHistory()
  );
  const [inputFocused, setInputFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialUrlState.category ?? initialCategory
  );
  const [showOffersOnly, setShowOffersOnly] = useState(
    initialUrlState.offersOnly ?? initialOffersOnly
  );
  const [currentPage, setCurrentPage] = useState(
    initialUrlState.page ?? (Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1)
  );
  const [invalidPage, setInvalidPage] = useState(false);
  const [sortBy, setSortBy] = useState<CatalogSort>(
    initialUrlState.sort ?? (isSortOption(initialSort) ? initialSort : 'best-sellers')
  );
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const ITEMS_PER_PAGE = 12;
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pendingSearchFocusRef = useRef(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const categoryParam = url.searchParams.get('category');

      const validateAndSetCategory = async () => {
        if (!categoryParam) {
          setSelectedCategory(null);
          return;
        }
        try {
          const categoryDoc = await getDoc(doc(db, 'categories', categoryParam));
          if (categoryDoc.exists() && categoryDoc.data().active !== false) {
            setSelectedCategory(categoryParam);
          } else {
            setSelectedCategory(null);
            url.searchParams.delete('category');
            window.history.replaceState({}, '', url.toString());
          }
        } catch {
          setSelectedCategory(null);
          url.searchParams.delete('category');
          window.history.replaceState({}, '', url.toString());
        }
      };

      validateAndSetCategory();
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    if (url.searchParams.get('focusSearch') !== 'true') return;

    pendingSearchFocusRef.current = true;
    url.searchParams.delete('focusSearch');
    window.history.replaceState({}, '', url.toString());
  }, []);

  useEffect(() => {
    if (loading || favoritesLoading || !pendingSearchFocusRef.current) return;

    let attempts = 0;
    const focusTimer = window.setInterval(() => {
      const input = searchInputRef.current;
      if (!input) return;

      input.focus({ preventScroll: true });
      attempts += 1;

      if (document.activeElement === input || attempts >= 40) {
        pendingSearchFocusRef.current = false;
        window.clearInterval(focusTimer);
      }
    }, 50);

    return () => window.clearInterval(focusTimer);
  }, [loading, favoritesLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && products.length > 0) {
      const url = new URL(window.location.href);
      const pageParamStr = url.searchParams.get('page');
      const pageNum = pageParamStr ? parseInt(pageParamStr, 10) : 1;
      const isValidPageNumber = !isNaN(pageNum) && pageNum > 0;
      const pageParam = isValidPageNumber ? Math.max(1, pageNum) : 1;

      const filtered = filterCatalogProducts(products, {
        offersOnly: showOffersOnly,
        categoryId: selectedCategory,
      });

      const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
      const validPage = Math.max(1, Math.min(pageParam, totalPages || 1));
      const isOutOfRange = pageParam > validPage;

      if (pageParamStr && !isValidPageNumber) {
        url.searchParams.delete('page');
        window.history.replaceState({}, '', url.toString());
      }

      if (validPage !== currentPage || isOutOfRange) {
        const syncPageTimer = window.setTimeout(() => {
          setCurrentPage(validPage);
          setInvalidPage(isOutOfRange);
        }, 0);

        if (isOutOfRange) {
          url.searchParams.delete('page');
          window.history.replaceState({}, '', url.toString());
        }

        return () => window.clearTimeout(syncPageTimer);
      }
    }
  }, [currentPage, products, selectedCategory, showOffersOnly]);

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
        setProducts(await fetchCatalogProducts());
      } catch (error) {
        console.error('Error loading products:', error);
        setError('No se pudo cargar el catálogo en este momento.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return sortCatalogProducts(
      filterCatalogProducts(products, {
        term: appliedSearch,
        categoryId: selectedCategory,
        offersOnly: showOffersOnly,
        favoritesOnly,
        favoriteIds,
      }),
      sortBy
    );
  }, [
    products,
    appliedSearch,
    selectedCategory,
    showOffersOnly,
    sortBy,
    favoritesOnly,
    favoriteIds,
  ]);

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
    const suggestionProducts = favoritesOnly
      ? products.filter((product) => favoriteIds.has(product.id))
      : products;
    const productSuggestions = suggestionProducts
      .filter((p) =>
        removeAccents(p.name.toLowerCase()).includes(normalizedTerm)
      )
      .slice(0, 5)
      .map((p) => ({ type: 'product' as const, product: p }));
    return [...historySuggestions, ...productSuggestions];
  }, [
    products,
    searchTerm,
    searchHistory,
    inputFocused,
    favoritesOnly,
    favoriteIds,
  ]);

  const isLoading = loading || favoritesLoading;

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
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className="text-text-light"
              style={{
                fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                letterSpacing: '-0.03em',
                fontWeight: 900,
              }}
            >
              {title}
            </h2>
          </div>

          <a
            href={favoritesOnly ? '/productos' : '/favoritos'}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-all sm:w-auto ${
              favoritesOnly
                ? 'border border-border-light text-text-light hover:border-primary hover:text-primary'
                : 'bg-primary text-text-light shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:brightness-105'
            }`}
          >
            {favoritesOnly ? <ChevronLeft size={18} /> : <Heart size={18} />}
            {favoritesOnly ? 'Ver productos' : 'Ver favoritos'}
            {!favoritesOnly && favoriteIds.size > 0 && (
              <span className="rounded-full bg-bg-light/20 px-2 py-0.5 text-xs">
                {favoriteIds.size}
              </span>
            )}
          </a>
        </div>

        <div className="mb-8 flex flex-col gap-4">
          <div className="flex w-full flex-row items-center gap-3">
            <div className="relative w-auto">
              <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={(newCategory) => {
                  setSelectedCategory(newCategory);
                  setCurrentPage(1);
                  updateUrl(appliedSearch, showOffersOnly, newCategory, 1, sortBy);
                }}
              />
            </div>
              <button
                type="button"
                onClick={() => {
                  const newOffersState = !showOffersOnly;
                setShowOffersOnly(newOffersState);
                setCurrentPage(1);
                updateUrl(appliedSearch, newOffersState, selectedCategory, 1, sortBy);
              }}
              aria-pressed={showOffersOnly}
                aria-label={
                  showOffersOnly
                    ? 'Quitar filtro Solo ofertas'
                    : 'Activar filtro Solo ofertas'
                }
                className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  showOffersOnly
                    ? 'border-primary bg-primary text-text-light shadow-md shadow-primary/20 hover:-translate-y-0.5 hover:brightness-105'
                    : 'border-border-light text-text-light hover:-translate-y-0.5 hover:border-primary hover:text-primary'
                }`}
              >
                Ofertas
              </button>
          </div>
          <div className="flex w-full flex-row items-center gap-3">
            <div
              ref={searchRef}
              className={`relative flex-1 ${showSuggestions ? 'z-30' : ''}`}
            >
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light opacity-40"
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="¿Qué estás buscando hoy?"
                value={searchTerm}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={MAX_SEARCH_LENGTH}
                disabled={isLoading}
                onFocus={() => {
                  setInputFocused(true);
                  setShowSuggestions(true);
                }}
                onBlur={() => setInputFocused(false)}
                className="w-full rounded-full border border-border-light bg-card-bg-light py-3 pl-11 pr-11 text-sm sm:text-sm text-text-light placeholder:text-text-light/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-50"
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
                <ul className="absolute top-full left-0 right-0 z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border-light bg-card-bg-light py-1 shadow-lg">
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
                            updateUrl(term, showOffersOnly, selectedCategory, 1, sortBy);
                            setShowSuggestions(false);
                          }}
                          className="flex flex-1 items-center gap-2 hover:bg-secondary-bg-light rounded py-1 -my-1 cursor-pointer"
                        >
                          {suggestion.type === 'history' && (
                            <History size={14} className="text-primary shrink-0" />
                          )}
                          <span className="line-clamp-1">
                            {suggestion.type === 'history'
                              ? highlightText(suggestion.term, searchTerm, true)
                              : highlightText(suggestion.product.name, searchTerm, true)}
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
              {showSuggestions && searchSuggestions.length === 0 && searchTerm && (
                <ul className="absolute top-full left-0 right-0 z-30 mt-1 rounded-lg border border-border-light bg-card-bg-light py-1 shadow-lg">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        saveSearchTerm(searchTerm);
                        setSearchHistory(getSearchHistory());
                        setAppliedSearch(searchTerm);
                        updateUrl(searchTerm, showOffersOnly, selectedCategory, 1, sortBy);
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
            <div
              ref={sortRef}
              className={`relative shrink-0 ${showSortDropdown ? 'z-40' : 'z-20'}`}
            >
              <button
                type="button"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  showSortDropdown
                    ? 'border-primary/45 bg-primary/8 text-primary shadow-md shadow-primary/10'
                    : 'border-border-light bg-card-bg-light text-text-light hover:-translate-y-0.5 hover:border-primary hover:text-primary'
                }`}
                title="Ordenar productos"
                aria-label="Ordenar productos"
              >
                <FaFilter
                  size={16}
                  className={`transition-transform duration-300 ${showSortDropdown ? 'rotate-12' : ''}`}
                />
                <span className="hidden sm:inline">{selectedSortLabel}</span>
              </button>
              {showSortDropdown && (
                <div className="filter-popover-reveal absolute right-0 top-full z-40 mt-1 min-w-56 rounded-2xl border border-border-light bg-card-bg-light py-1 shadow-xl shadow-black/10">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSortBy(option.value);
                        setCurrentPage(1);
                        updateUrl(appliedSearch, showOffersOnly, selectedCategory, 1, option.value);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                        sortBy === option.value
                          ? 'bg-primary/12 text-primary'
                          : 'text-text-light hover:bg-secondary-bg-light hover:text-primary'
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

        {isLoading && (
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

        {!isLoading && (error || favoritesError) && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error || favoritesError}
          </div>
        )}

        {!isLoading &&
          filteredProducts.length === 0 &&
          (appliedSearch || selectedCategory || showOffersOnly) && (
            <div className="py-20 text-center">
              <Package size={40} className="mx-auto mb-3 text-text-light opacity-40" />
              <p className="text-sm text-text-light opacity-50">
                {showOffersOnly
                  ? 'No hay ofertas disponibles en este momento'
                  : selectedCategory && !appliedSearch
                    ? 'No hay productos disponibles en esta categoría'
                    : 'No se encontraron productos'}
              </p>
            </div>
          )}

        {!isLoading &&
          favoritesOnly &&
          filteredProducts.length === 0 &&
          !appliedSearch &&
          !selectedCategory &&
          !showOffersOnly && (
            <div className="rounded-3xl border border-border-light bg-card-bg-light px-6 py-12 text-center">
              <Heart size={40} className="mx-auto mb-3 text-primary" />
              <p className="text-sm font-semibold text-text-light">
                Aún no tienes productos favoritos.
              </p>
              <p className="mt-2 text-sm text-text-light opacity-70">
                Guarda productos desde el catálogo para revisarlos después.
              </p>
              <a
                href="/productos"
                className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-text-light transition-all hover:brightness-105"
              >
                Ver catálogo
              </a>
            </div>
          )}

        {!isLoading && error && products.length === 0 && (
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

        {!isLoading && filteredProducts.length > 0 && !invalidPage && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts
                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                .map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    appliedSearch={appliedSearch}
                  />
                ))}
            </div>

            {Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => {
                    const newPage = currentPage - 1;
                    setCurrentPage(newPage);
                    updateUrl(appliedSearch, showOffersOnly, selectedCategory, newPage, sortBy);
                    setInvalidPage(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="rounded-full border border-border-light p-2 text-text-light transition-all hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex gap-1 flex-wrap justify-center items-center">
                  {(() => {
                    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
                    const pages: (number | string)[] = [];
                    const showRange = 1;
                    let ellipsisCount = 0;

                    pages.push(1);

                    const rangeStart = Math.max(2, currentPage - showRange);
                    if (rangeStart > 2) {
                      pages.push(`...left-${ellipsisCount++}`);
                    }

                    for (let i = rangeStart; i < currentPage; i++) {
                      pages.push(i);
                    }

                    if (currentPage !== 1) {
                      pages.push(currentPage);
                    }

                    const rangeEnd = Math.min(totalPages - 1, currentPage + showRange);
                    for (let i = currentPage + 1; i <= rangeEnd; i++) {
                      pages.push(i);
                    }

                    if (rangeEnd < totalPages - 1) {
                      pages.push(`...right-${ellipsisCount++}`);
                    }
                    if (totalPages > 1 && currentPage !== totalPages) {
                      pages.push(totalPages);
                    }

                    return pages.map((page, index) => {
                      const isEllipsis = typeof page === 'string' && page.startsWith('...');
                      const pageNum = typeof page === 'number' ? page : null;

                      return isEllipsis ? (
                        <span key={`${page}-${index}`} className="px-2 py-2 text-text-light opacity-50">
                          ...
                        </span>
                      ) : (
                        <button
                          key={`page-${pageNum}`}
                          type="button"
                          onClick={() => {
                            setCurrentPage(pageNum as number);
                            updateUrl(appliedSearch, showOffersOnly, selectedCategory, pageNum as number, sortBy);
                            setInvalidPage(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`rounded-full px-3 py-2 text-sm font-semibold transition-all ${
                            currentPage === pageNum
                              ? 'bg-primary text-text-light'
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
                  disabled={currentPage === Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)}
                  onClick={() => {
                    const newPage = currentPage + 1;
                    setCurrentPage(newPage);
                    updateUrl(appliedSearch, showOffersOnly, selectedCategory, newPage, sortBy);
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

        {!isLoading && invalidPage && (
          <div className="flex h-96 items-center justify-center rounded-2xl border border-border-light bg-card-bg-light">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-text-light opacity-50 mb-4" />
              <p className="text-lg font-semibold text-text-light">No hay más productos</p>
              <p className="text-sm text-text-light opacity-70">La página que buscas no existe</p>
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
