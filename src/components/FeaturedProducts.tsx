import { useEffect, useState, useMemo, useRef } from 'react';
import { ShoppingBag, Package, Search, X } from 'lucide-react';
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
const MAX_SEARCH_LENGTH = 100;

function formatPrice(amount: number) {
  return `Bs ${amount.toFixed(2)}`;
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

function isOfferBadge(badge?: string) {
  return badge?.trim().toLowerCase() === 'oferta';
}

function getBadgeData(product: Product) {
  const discountPercentage = getDiscountPercentage(product);

  if (discountPercentage) {
    return {
      label: `-${discountPercentage}%`,
      className: 'bg-red-600 text-white',
    };
  }

  if (!product.badge || isOfferBadge(product.badge)) return null;

  return {
    label: product.badge,
    className: 'bg-primary-action text-white',
  };
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
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
    if (!appliedSearch) return products;
    const term = removeAccents(appliedSearch.toLowerCase());
    const byName = products.filter((p) => removeAccents(p.name.toLowerCase()).includes(term));
    const byDescription = products.filter(
      (p) => !removeAccents(p.name.toLowerCase()).includes(term) && p.description && removeAccents(p.description.toLowerCase()).includes(term)
    );
    return [...byName, ...byDescription];
  }, [products, appliedSearch]);

  const searchSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 1) return [];
    const normalizedTerm = removeAccents(searchTerm.toLowerCase());
    return products
      .filter((p) => removeAccents(p.name.toLowerCase()).includes(normalizedTerm))
      .slice(0, 5);
  }, [products, searchTerm]);

  const highlightText = (text: string, term: string, enabled: boolean = true) => {
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
        <mark key={match.index} className="bg-primary/30 text-primary font-semibold rounded px-0.5">
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
    const t = term.toLowerCase();
    if (product.name.toLowerCase().includes(t)) return 'name';
    if (product.description?.toLowerCase().includes(t)) return 'description';
    return null;
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    setAppliedSearch('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleSearchClear();
    } else if (e.key === 'Enter') {
      setAppliedSearch(searchTerm);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 1) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  return (
    <section id="productos" className="bg-bg-light py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2
            className="text-text-light"
            style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', letterSpacing: '-0.03em', fontWeight: 900 }}
          >
            Productos disponibles
          </h2>
        </div>

        <div ref={searchRef} className="relative mb-6 max-w-6xl">
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
            onFocus={() => searchTerm.length >= 1 && setShowSuggestions(true)}
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
              {searchSuggestions.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm(product.name);
                      setAppliedSearch(product.name);
                      setShowSuggestions(false);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-text-light hover:bg-secondary-bg-light"
                  >
                    <span className="line-clamp-1">{highlightText(product.name, searchTerm, true)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
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

        {!loading && !error && filteredProducts.length === 0 && appliedSearch && (
          <div className="py-20 text-center">
            <Package size={40} className="mx-auto mb-3 text-text-light opacity-40" />
            <p className="text-sm text-text-light opacity-50">No se encontraron productos</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-border-light bg-card-bg-light px-6 py-12 text-center">
            <Package size={40} className="mx-auto mb-3 text-primary" />
            <p className="text-sm font-semibold text-text-light">{error}</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {(appliedSearch ? filteredProducts : products).map((product) => {
              const showOffer = hasValidOffer(product);
              const badgeData = getBadgeData(product);
              const currentPrice = showOffer ? product.offerPrice! : product.price;
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
                          isAvailable ? 'bg-primary/15 text-primary' : 'bg-primary-action text-white'
                        }`}
                      >
                        {isAvailable ? 'Disponible' : 'Producto agotado'}
                      </span>
                      <ShoppingBag size={15} className="text-text-light opacity-35" />
                    </div>

                    <div className="mt-3 space-y-2">
                      <span className="block line-clamp-2 text-sm font-semibold leading-5 text-text-light transition-colors group-hover:text-primary">
                        {highlightText(product.name, appliedSearch, getMatchField(product, appliedSearch) === 'name')}
                      </span>

                      {product.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-text-light opacity-65">
                          {highlightText(product.description, appliedSearch, getMatchField(product, appliedSearch) === 'description')}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-text-light">{formatPrice(currentPrice)}</span>
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