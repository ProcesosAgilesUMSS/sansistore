import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, MessageSquare, Package, Star } from 'lucide-react';
import { Timestamp, collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  badge?: string | null;
  hasOffer?: boolean;
  offerPrice?: number | null;
  active?: boolean;
  stockAvailable?: number;
  stockTotal?: number;
  enabled?: boolean;
}

interface Review {
  id: string;
  authorName?: string;
  comment: string;
  rating: number;
  active?: boolean;
  createdAt?: Timestamp | string | null;
}

interface ProductDetailProps {
  productSlug: string;
  initialProduct?: string;
}

interface InventoryRecord {
  productId: string;
  stockAvailable?: number;
  stockTotal?: number;
  enabled?: boolean;
}

type ReviewSortKey = 'recent' | 'oldest' | 'highest' | 'lowest';

const REVIEW_PAGE_SIZE = 10;

function formatPrice(amount: number) {
  return `Bs ${amount.toFixed(2)}`;
}

function hasValidOffer(product: Product | null) {
  return Boolean(
    product &&
      product.hasOffer &&
      typeof product.offerPrice === 'number' &&
      product.offerPrice < product.price
  );
}

function getDiscountPercentage(product: Product | null) {
  if (!hasValidOffer(product)) return null;

  const basePrice = product?.price ?? 0;
  const offerPrice = product?.offerPrice ?? 0;

  return Math.round(((basePrice - offerPrice) / basePrice) * 100);
}

function isOfferBadge(badge?: string | null) {
  return badge?.trim().toLowerCase() === 'oferta';
}

function getBadgeData(product: Product | null) {
  const discountPercentage = getDiscountPercentage(product);

  if (discountPercentage) {
    return {
      label: `-${discountPercentage}%`,
      className: 'product-detail-badge product-detail-badge--discount',
    };
  }

  if (!product?.badge || isOfferBadge(product.badge)) return null;

  return {
    label: product.badge,
    className: 'product-detail-badge product-detail-badge--label',
  };
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={`${rating}-${index}`}
      size={14}
      className={index < rating ? 'fill-primary text-primary' : 'text-text-light opacity-20'}
    />
  ));
}

function getReviewTimestamp(review: Review) {
  if (review.createdAt instanceof Timestamp) {
    return review.createdAt.toMillis();
  }

  if (typeof review.createdAt === 'string') {
    const parsed = Date.parse(review.createdAt);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function sortReviews(reviews: Review[], sortKey: ReviewSortKey) {
  const sorted = [...reviews];

  sorted.sort((left, right) => {
    switch (sortKey) {
      case 'oldest':
        return getReviewTimestamp(left) - getReviewTimestamp(right);
      case 'highest':
        return right.rating - left.rating || getReviewTimestamp(right) - getReviewTimestamp(left);
      case 'lowest':
        return left.rating - right.rating || getReviewTimestamp(right) - getReviewTimestamp(left);
      case 'recent':
      default:
        return getReviewTimestamp(right) - getReviewTimestamp(left);
    }
  });

  return sorted;
}

function formatReviewDate(review: Review) {
  const timestamp = getReviewTimestamp(review);

  if (!timestamp) return null;

  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp));
}

export default function ProductDetail({ productSlug, initialProduct }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [reviewSort, setReviewSort] = useState<ReviewSortKey>('recent');
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(REVIEW_PAGE_SIZE);

  useEffect(() => {
    let ignore = false;

    const fetchProductData = async () => {
      setLoading(true);
      setError(null);
      setImageFailed(false);
      setReviewSort('recent');
      setVisibleReviewsCount(REVIEW_PAGE_SIZE);

      try {
        if (initialProduct) {
          const parsed = JSON.parse(initialProduct) as Product;
          setProduct(parsed);

          const inventoryQuery = query(
            collection(db, 'inventory'),
            where('productId', '==', parsed.id),
            limit(1)
          );
          const reviewsQuery = query(
            collection(db, 'reviews'),
            where('productId', '==', parsed.id),
            where('active', '==', true)
          );
          const [inventorySnap, reviewsSnap] = await Promise.all([
            getDocs(inventoryQuery),
            getDocs(reviewsQuery),
          ]);
          const inventoryData = inventorySnap.empty
            ? null
            : (inventorySnap.docs[0].data() as InventoryRecord);
          const productReviews = reviewsSnap.docs
            .map((reviewDoc) => ({ id: reviewDoc.id, ...reviewDoc.data() }) as Review)
            .filter((review) => review.active !== false);

          if (!ignore) {
            setProduct({
              ...parsed,
              enabled: inventoryData?.enabled ?? true,
              stockAvailable: inventoryData?.stockAvailable ?? 0,
              stockTotal: inventoryData?.stockTotal ?? inventoryData?.stockAvailable ?? 0,
            });
            setReviews(productReviews);
          }
        } else {
          const productQuery = query(
            collection(db, 'products'),
            where('slug', '==', productSlug),
            limit(1)
          );
          const productSnap = await getDocs(productQuery);

          if (productSnap.empty) {
            if (!ignore) {
              setProduct(null);
              setReviews([]);
              setError('No se encontró el producto solicitado.');
            }
            return;
          }

          const productDoc = productSnap.docs[0];
          const productData = {
            id: productDoc.id,
            ...productDoc.data(),
          } as Product;
          const inventoryQuery = query(
            collection(db, 'inventory'),
            where('productId', '==', productDoc.id),
            limit(1)
          );

          const reviewsQuery = query(
            collection(db, 'reviews'),
            where('productId', '==', productDoc.id),
            where('active', '==', true)
          );
          const [inventorySnap, reviewsSnap] = await Promise.all([
            getDocs(inventoryQuery),
            getDocs(reviewsQuery),
          ]);
          const inventoryData = inventorySnap.empty
            ? null
            : (inventorySnap.docs[0].data() as InventoryRecord);
          const productReviews = reviewsSnap.docs
            .map((reviewDoc) => ({ id: reviewDoc.id, ...reviewDoc.data() }) as Review)
            .filter((review) => review.active !== false);

          if (!ignore) {
            setProduct({
              ...productData,
              enabled: inventoryData?.enabled ?? true,
              stockAvailable: inventoryData?.stockAvailable ?? 0,
              stockTotal: inventoryData?.stockTotal ?? inventoryData?.stockAvailable ?? 0,
            });
            setReviews(productReviews);
          }
        }
      } catch {
        if (!ignore) {
          setProduct(null);
          setReviews([]);
          setError('No se pudo cargar el detalle del producto.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchProductData();

    return () => {
      ignore = true;
    };
  }, [productSlug, initialProduct]);

  const showOffer = hasValidOffer(product);
  const currentPrice = showOffer ? product?.offerPrice ?? 0 : product?.price ?? 0;
  const stockAvailable = product?.stockAvailable ?? 0;
  const isAvailable = stockAvailable > 0 && product?.enabled !== false && (product?.active ?? true) !== false;
  const normalizedDescription = product?.description?.trim();
  const descriptionText = normalizedDescription ? normalizedDescription : 'Sin descripción';
  const badgeData = getBadgeData(product);
  const sortedReviews = sortReviews(reviews, reviewSort);
  const visibleReviews = sortedReviews.slice(0, visibleReviewsCount);
  const hasMoreReviews = sortedReviews.length > visibleReviews.length;
  const reviewsCount = reviews.length;
  const averageRating = reviewsCount
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewsCount
    : 0;
  const roundedAverage = reviewsCount ? Math.round(averageRating) : 0;
  const averageLabel = reviewsCount ? `${averageRating.toFixed(1)}/5` : 'Sin calificaciones';
  const reviewSortOptions: Array<{ value: ReviewSortKey; label: string }> = [
    { value: 'recent', label: 'Más recientes' },
    { value: 'oldest', label: 'Más antiguos' },
    { value: 'highest', label: 'Mayor puntuación' },
    { value: 'lowest', label: 'Menor puntuación' },
  ];

  return (
    <section className="min-h-screen bg-bg-light pb-10 pt-20 sm:pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Ruta de navegación" className="flex items-center gap-2 text-sm text-text-light">
            <a href="/" className="font-semibold opacity-70 transition-opacity hover:opacity-100">
              Inicio
            </a>
            <ChevronRight size={14} className="opacity-35" aria-hidden="true" />
            <a href="/#productos" className="font-semibold opacity-70 transition-opacity hover:opacity-100">
              Productos
            </a>
            <ChevronRight size={14} className="opacity-35" aria-hidden="true" />
            <span className="font-bold text-primary" aria-current="page">
              Detalle
            </span>
          </nav>

          <a
            href="/#productos"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-border-light bg-card-bg-light px-4 py-2 text-sm font-semibold text-text-light transition-colors hover:border-primary hover:text-primary"
          >
            <ArrowLeft size={16} />
            Volver al catálogo
          </a>
        </div>

        {loading && (
          <div className="space-y-6 sm:space-y-10">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-[1.05fr_0.95fr] md:gap-8">
              <div className="overflow-hidden rounded-[2rem] border border-border-light bg-card-bg-light">
                <div className="relative aspect-square animate-pulse bg-secondary-bg-light">
                  <div className="absolute left-5 top-5 h-7 w-20 rounded-full bg-card-bg-light/80" />
                </div>
              </div>

              <div className="rounded-[2rem] border border-border-light bg-card-bg-light px-5 py-6 sm:px-8 sm:py-8">
                <div className="h-4 w-28 animate-pulse rounded bg-secondary-bg-light" />
                <div className="mt-4 h-10 w-4/5 animate-pulse rounded bg-secondary-bg-light" />
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-8 w-28 animate-pulse rounded bg-secondary-bg-light" />
                  <div className="h-5 w-16 animate-pulse rounded bg-secondary-bg-light" />
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-7 w-28 animate-pulse rounded-full bg-secondary-bg-light" />
                  <div className="h-4 w-36 animate-pulse rounded bg-secondary-bg-light" />
                </div>
                <div className="mt-6 space-y-3">
                  <div className="h-4 w-full animate-pulse rounded bg-secondary-bg-light" />
                  <div className="h-4 w-full animate-pulse rounded bg-secondary-bg-light" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-secondary-bg-light" />
                  <div className="h-4 w-4/6 animate-pulse rounded bg-secondary-bg-light" />
                </div>
              </div>
            </div>

            <section className="rounded-[2rem] border border-border-light bg-card-bg-light px-5 py-6 sm:px-8 sm:py-8">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-pulse rounded-full bg-secondary-bg-light" />
                <div className="h-6 w-52 animate-pulse rounded bg-secondary-bg-light" />
              </div>

              <div className="mt-6 grid gap-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-border-light bg-secondary-bg-light/50 px-5 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="h-4 w-28 animate-pulse rounded bg-secondary-bg-light" />
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((__, starIndex) => (
                          <div
                            key={starIndex}
                            className="h-3.5 w-3.5 animate-pulse rounded-full bg-secondary-bg-light"
                          />
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="h-4 w-full animate-pulse rounded bg-secondary-bg-light" />
                      <div className="h-4 w-11/12 animate-pulse rounded bg-secondary-bg-light" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-border-light bg-card-bg-light px-6 py-10 text-center">
            <MessageSquare size={36} className="mx-auto mb-4 text-primary" />
            <h1 className="text-xl font-black text-text-light">Error al cargar el detalle</h1>
            <p className="mt-2 text-sm text-text-light opacity-70">{error}</p>
          </div>
        )}

        {!loading && !error && product && (
          <div className="space-y-6 sm:space-y-10">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-[1.05fr_0.95fr] md:gap-8">
              <div className="overflow-hidden rounded-[2rem] border border-border-light bg-card-bg-light">
                <div className="relative aspect-square bg-secondary-bg-light">
                  {product.imageUrl && !imageFailed ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      onError={() => setImageFailed(true)}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="flex flex-col items-center gap-3 text-text-light opacity-50">
                        <Package size={56} className="opacity-70" />
                        <span className="text-sm font-medium">Imagen no disponible</span>
                      </div>
                    </div>
                  )}

                  {badgeData && (
                    <span className={`absolute left-5 top-5 rounded-full px-3 py-1 text-xs font-semibold ${badgeData.className}`}>
                      {badgeData.label}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-center rounded-[2rem] border border-border-light bg-card-bg-light px-5 py-6 sm:px-8 sm:py-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Detalle del producto
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-text-light sm:text-4xl">
                  {product.name}
                </h1>

                <div className="mt-5 flex items-center gap-3">
                  <span className="text-2xl font-black text-text-light">{formatPrice(currentPrice)}</span>
                  {showOffer && (
                    <span className="text-sm text-text-light opacity-45 line-through">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span
                    className={`product-detail-status-badge ${
                      isAvailable
                        ? 'product-detail-status-badge--available'
                        : 'product-detail-status-badge--unavailable'
                    }`}
                  >
                    {isAvailable ? 'Disponible' : 'Producto agotado'}
                  </span>
                  {isAvailable && (
                    <span className="text-sm text-text-light opacity-70">
                      Stock: {stockAvailable} disponibles
                    </span>
                  )}
                </div>

                <p className="mt-6 text-sm leading-7 text-text-light opacity-80">
                  {descriptionText}
                </p>
              </div>
            </div>

            <section className="rounded-[2rem] border border-border-light bg-card-bg-light px-5 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} className="text-primary" />
                  <h2 className="text-xl font-black text-text-light">Comentarios del producto</h2>
                </div>

                <label className="flex items-center gap-2 text-sm font-medium text-text-light">
                  <span className="opacity-70">Ordenar por</span>
                  <select
                    value={reviewSort}
                    onChange={(event) => {
                      setReviewSort(event.target.value as ReviewSortKey);
                      setVisibleReviewsCount(REVIEW_PAGE_SIZE);
                    }}
                    className="rounded-full border border-border-light bg-secondary-bg-light px-4 py-2 text-sm text-text-light outline-none transition-colors hover:border-primary focus:border-primary"
                  >
                    {reviewSortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-6 grid gap-4 rounded-3xl border border-border-light bg-secondary-bg-light/45 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="flex items-center gap-2">
                  {reviewsCount ? (
                    renderStars(roundedAverage)
                  ) : (
                    Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={14} className="text-text-light opacity-20" />
                    ))
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-text-light">{averageLabel}</p>
                  <p className="text-sm text-text-light opacity-65">
                    {reviewsCount
                      ? `${reviewsCount} calificación${reviewsCount === 1 ? '' : 'es'} registradas`
                      : 'Este producto aún no tiene reviews registradas.'}
                  </p>
                </div>
              </div>

              {reviewsCount === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-border-light px-5 py-8 text-center">
                  <p className="text-base font-semibold text-text-light">Sin calificaciones</p>
                  <p className="mt-2 text-sm text-text-light opacity-60">
                    Este producto aún no tiene comentarios registrados.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {visibleReviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-2xl border border-border-light bg-secondary-bg-light/50 px-5 py-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-bold text-text-light">
                            {review.authorName?.trim() || 'Comprador anónimo'}
                          </p>
                          {formatReviewDate(review) ? (
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-text-light opacity-45">
                              {formatReviewDate(review)}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                          <span className="text-sm font-semibold text-text-light opacity-70">
                            {review.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-text-light opacity-80">
                        {review.comment}
                      </p>
                    </article>
                  ))}

                  {hasMoreReviews && (
                    <button
                      type="button"
                      onClick={() => setVisibleReviewsCount((count) => count + REVIEW_PAGE_SIZE)}
                      className="mt-2 inline-flex justify-center rounded-full border border-border-light bg-card-bg-light px-5 py-3 text-sm font-semibold text-text-light transition-colors hover:border-primary hover:text-primary"
                    >
                      Cargar más comentarios
                    </button>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
