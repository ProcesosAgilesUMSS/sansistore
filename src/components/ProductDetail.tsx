import { useEffect, useMemo, useRef, useState } from 'react';
import { layout, prepare } from '@chenglou/pretext';
import { useCartContext, CartProvider } from '../features/cart';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  MessageSquare,
  Package,
  Star,
} from 'lucide-react';
import { FaCartPlus } from 'react-icons/fa';
import {
  Timestamp,
  collection,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getOfferBadgeData, hasValidOffer } from '../lib/productOffers';
import { getSoldCount, isPopularProduct } from '../lib/productPopularity';

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
  soldCount?: number;
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
const PRODUCT_NAME_MAX_LINES = 3;
const PRODUCT_DESCRIPTION_MAX_LINES = 7;
const PRODUCT_NAME_EXPAND_LENGTH = 45;
const PRODUCT_DESCRIPTION_EXPAND_LENGTH = 320;

function formatPrice(amount: number) {
  return `Bs ${amount.toFixed(2)}`;
}

function getBadgeData(product: Product | null) {
  const badgeData = getOfferBadgeData(product);

  if (badgeData?.label.trim().toLowerCase() === 'popular') {
    return null;
  }

  if (badgeData?.isDiscount) {
    return {
      label: badgeData.label,
      className: 'product-detail-badge product-detail-badge--discount',
    };
  }

  if (!badgeData) return null;

  return {
    label: badgeData.label,
    className: 'product-detail-badge product-detail-badge--label',
  };
}

function renderStars(rating: number, prefix: string = '') {
  return Array.from({ length: 5 }, (_, index) => {
    const starPosition = index + 1;
    const isFilled = rating >= starPosition;
    const isHalf = !isFilled && rating > index && rating < starPosition;
    const fillState = isFilled ? 'full' : isHalf ? 'half' : 'empty';
    const testId = prefix ? `${prefix}-star-${index}-${fillState}` : `star-${index}-${fillState}`;

    return (
      <div
        key={`${rating}-${index}`}
        className="relative inline-block"
        data-testid={testId}
      >
        <Star size={14} className="text-text-light opacity-20" />
        <div
          className={`absolute left-0 top-0 overflow-hidden ${
            isHalf ? 'w-1/2' : isFilled ? 'w-full' : 'w-0'
          }`}
        >
          <Star size={14} className="fill-primary text-primary" />
        </div>
      </div>
    );
  });
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
        return (
          right.rating - left.rating ||
          getReviewTimestamp(right) - getReviewTimestamp(left)
        );
      case 'lowest':
        return (
          left.rating - right.rating ||
          getReviewTimestamp(right) - getReviewTimestamp(left)
        );
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

function getLineHeight(styles: CSSStyleDeclaration) {
  const lineHeight = Number.parseFloat(styles.lineHeight);

  if (!Number.isNaN(lineHeight)) return lineHeight;

  const fontSize = Number.parseFloat(styles.fontSize);
  return Number.isNaN(fontSize) ? 16 : fontSize * 1.2;
}

function getPretextFont(styles: CSSStyleDeclaration) {
  if (styles.font) return styles.font;

  return `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
}

function getLetterSpacing(styles: CSSStyleDeclaration) {
  const letterSpacing = Number.parseFloat(styles.letterSpacing);
  return Number.isNaN(letterSpacing) ? 0 : letterSpacing;
}

function hasHiddenText(element: HTMLElement, maxLines: number) {
  const styles = window.getComputedStyle(element);
  const width = element.getBoundingClientRect().width;

  if (!width) return false;

  if (element.scrollHeight > element.clientHeight + 1) return true;

  const prepared = prepare(element.textContent ?? '', getPretextFont(styles), {
    letterSpacing: getLetterSpacing(styles),
    whiteSpace: 'normal',
    wordBreak: styles.wordBreak === 'keep-all' ? 'keep-all' : 'normal',
  });
  const result = layout(prepared, width, getLineHeight(styles));

  if (result.lineCount > maxLines) return true;

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.visibility = 'hidden';
  clone.style.pointerEvents = 'none';
  clone.style.width = `${width}px`;
  clone.style.height = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.display = 'block';
  clone.style.webkitBoxOrient = 'unset';
  clone.style.webkitLineClamp = 'unset';

  document.body.appendChild(clone);
  const fullHeight = clone.scrollHeight;
  document.body.removeChild(clone);

  return fullHeight > getLineHeight(styles) * maxLines + 1;
}

function getAnimatedClampStyle(expanded: boolean, maxLines: number) {
  if (expanded) {
    return {
      display: 'block',
      overflow: 'hidden',
      maxHeight: '200rem',
      transition: 'max-height 320ms ease',
      willChange: 'max-height',
    } as const;
  }

  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: maxLines,
    overflow: 'hidden',
    transition: 'max-height 320ms ease',
    willChange: 'max-height',
  } as const;
}

function getDescriptionWrapperStyle(expanded: boolean) {
  return {
    maxHeight: expanded ? '80rem' : 'none',
    overflow: 'hidden',
    opacity: expanded ? 1 : 0.94,
    transform: expanded ? 'translateY(0)' : 'translateY(-2px)',
    transition:
      'max-height 320ms ease, opacity 220ms ease, transform 220ms ease',
    willChange: 'max-height, opacity, transform',
  } as const;
}

function areSetsEqual<T>(left: Set<T>, right: Set<T>) {
  if (left.size !== right.size) return false;

  for (const value of left) {
    if (!right.has(value)) return false;
  }

  return true;
}

function ProductDetailInner({
  productSlug,
  initialProduct,
}: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [reviewSort, setReviewSort] = useState<ReviewSortKey>('recent');
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(REVIEW_PAGE_SIZE);
  const [nameExpanded, setNameExpanded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [nameTruncated, setNameTruncated] = useState(false);
  const [descriptionTruncated, setDescriptionTruncated] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [truncatedReviews, setTruncatedReviews] = useState<Set<string>>(new Set());
  const titleRef = useRef<HTMLElement | null>(null);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const fullDescriptionRef = useRef<HTMLParagraphElement | null>(null);
  const reviewRefs = useRef<Map<string, HTMLParagraphElement>>(new Map());
  const nameExpandedRef = useRef(nameExpanded);
  const descriptionExpandedRef = useRef(descriptionExpanded);
  const { addToCart } = useCartContext();

  useEffect(() => {
    nameExpandedRef.current = nameExpanded;
  }, [nameExpanded]);

  useEffect(() => {
    descriptionExpandedRef.current = descriptionExpanded;
  }, [descriptionExpanded]);

  const toggleReview = (reviewId: string) => {
    setExpandedReviews((previous) => {
      const next = new Set(previous);

      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }

      return next;
    });
  };

  useEffect(() => {
    let ignore = false;

    const fetchProductData = async () => {
      setLoading(true);
      setError(null);
      setImageFailed(false);
      setReviewSort('recent');
      setVisibleReviewsCount(REVIEW_PAGE_SIZE);
      setNameExpanded(false);
      setDescriptionExpanded(false);
      setNameTruncated(false);
      setDescriptionTruncated(false);
      setExpandedReviews(new Set<string>());
      setTruncatedReviews(new Set<string>());

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
              soldCount: getSoldCount(parsed),
              enabled: inventoryData?.enabled ?? true,
              stockAvailable: inventoryData?.stockAvailable ?? 0,
              stockTotal: inventoryData?.stockTotal ?? inventoryData?.stockAvailable ?? 0,
            });
            setReviews(productReviews);
          }

          return;
        }

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
        const productData = { id: productDoc.id, ...productDoc.data() } as Product;
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
            soldCount: getSoldCount(productData),
            enabled: inventoryData?.enabled ?? true,
            stockAvailable: inventoryData?.stockAvailable ?? 0,
            stockTotal: inventoryData?.stockTotal ?? inventoryData?.stockAvailable ?? 0,
          });
          setReviews(productReviews);
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

  useEffect(() => {
    const checkTitleTruncation = () => {
      if (nameExpandedRef.current) return;

      const trimmedLength = product?.name.trim().length ?? 0;
      let nextNameTruncated = trimmedLength > PRODUCT_NAME_EXPAND_LENGTH;

      if (!nextNameTruncated && titleRef.current) {
        nextNameTruncated = hasHiddenText(titleRef.current, PRODUCT_NAME_MAX_LINES);
      }

      setNameTruncated((previous) =>
        previous === nextNameTruncated ? previous : nextNameTruncated
      );
    };

    const frameId = window.requestAnimationFrame(checkTitleTruncation);
    const resizeObserver = titleRef.current ? new ResizeObserver(checkTitleTruncation) : null;

    if (titleRef.current) {
      resizeObserver?.observe(titleRef.current);
    }

    document.fonts?.ready.then(checkTitleTruncation);
    window.addEventListener('resize', checkTitleTruncation);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', checkTitleTruncation);
    };
  }, [product?.name, loading]);

  const sortedReviews = useMemo(() => sortReviews(reviews, reviewSort), [reviews, reviewSort]);
  const visibleReviews = useMemo(
    () => sortedReviews.slice(0, visibleReviewsCount),
    [sortedReviews, visibleReviewsCount]
  );

  useEffect(() => {
    const checkReviewTruncation = () => {
      const truncated = new Set<string>();

      reviewRefs.current.forEach((element, reviewId) => {
        if (element && element.scrollHeight > element.clientHeight) {
          truncated.add(reviewId);
        }
      });

      setTruncatedReviews((previous) =>
        areSetsEqual(previous, truncated) ? previous : truncated
      );
    };

    checkReviewTruncation();
    window.addEventListener('resize', checkReviewTruncation);

    return () => window.removeEventListener('resize', checkReviewTruncation);
  }, [visibleReviews]);

  const showOffer = hasValidOffer(product);
  const currentPrice = showOffer ? (product?.offerPrice ?? 0) : (product?.price ?? 0);
  const stockAvailable = product?.stockAvailable ?? 0;
  const isAvailable =
    stockAvailable > 0 &&
    product?.enabled !== false &&
    (product?.active ?? true) !== false;
  const normalizedDescription = product?.description?.trim();
  const descriptionText = normalizedDescription ? normalizedDescription : 'Sin descripción';

  useEffect(() => {
    const checkDescriptionTruncation = () => {
      if (descriptionExpandedRef.current) return;

      let nextDescriptionTruncated = descriptionText.length > PRODUCT_DESCRIPTION_EXPAND_LENGTH;

      if (!nextDescriptionTruncated && descriptionRef.current) {
        const measurementElement = fullDescriptionRef.current ?? descriptionRef.current;
        nextDescriptionTruncated = hasHiddenText(measurementElement, PRODUCT_DESCRIPTION_MAX_LINES);
      }

      setDescriptionTruncated((previous) =>
        previous === nextDescriptionTruncated ? previous : nextDescriptionTruncated
      );
    };

    const frameId = window.requestAnimationFrame(checkDescriptionTruncation);
    const resizeObserver = descriptionRef.current
      ? new ResizeObserver(checkDescriptionTruncation)
      : null;

    if (descriptionRef.current) {
      resizeObserver?.observe(descriptionRef.current);
    }

    document.fonts?.ready.then(checkDescriptionTruncation);
    window.addEventListener('resize', checkDescriptionTruncation);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', checkDescriptionTruncation);
    };
  }, [descriptionText, loading]);

  const badgeData = getBadgeData(product);
  const showPopularBadge = isPopularProduct(product);
  const hasMoreReviews = sortedReviews.length > visibleReviews.length;
  const reviewsCount = reviews.length;
  const averageRating = reviewsCount
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewsCount
    : 0;
  const averageLabel = reviewsCount ? `${averageRating.toFixed(1)} de 5` : 'Sin calificaciones';
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
          <nav
            aria-label="Ruta de navegación"
            className="flex items-center gap-2 text-sm text-text-light"
          >
            <a href="/" className="font-semibold opacity-70 transition-opacity hover:opacity-100">
              Inicio
            </a>
            <ChevronRight size={14} className="opacity-35" aria-hidden="true" />
            <a href="/productos" className="font-semibold opacity-70 transition-opacity hover:opacity-100">
              Productos
            </a>
            <ChevronRight size={14} className="opacity-35" aria-hidden="true" />
            <span className="font-bold text-primary" aria-current="page">
              Detalle
            </span>
          </nav>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-border-light bg-card-bg-light px-4 py-2 text-sm font-semibold text-text-light transition-colors hover:border-primary hover:text-primary"
          >
            <ArrowLeft size={16} />
            Atrás
          </button>
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
                          <div key={starIndex} className="h-3.5 w-3.5 animate-pulse rounded-full bg-secondary-bg-light" />
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

                  <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                    {badgeData && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeData.className}`}
                      >
                        {badgeData.label}
                      </span>
                    )}
                    {showPopularBadge && (
                      <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-amber-950">
                        Popular
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center rounded-[2rem] border border-border-light bg-card-bg-light px-5 py-6 sm:px-8 sm:py-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Detalle del producto
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-text-light sm:text-4xl">
                  <span
                    ref={titleRef as React.RefObject<HTMLSpanElement>}
                    title={product.name}
                    className="leading-[1.12] pb-1"
                    style={getAnimatedClampStyle(nameExpanded, PRODUCT_NAME_MAX_LINES)}
                  >
                    {product.name}
                  </span>
                </h1>
                {(nameTruncated || nameExpanded) && (
                  <button
                    type="button"
                    onClick={() => setNameExpanded(!nameExpanded)}
                    className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
                    aria-label={nameExpanded ? 'Mostrar menos nombre' : 'Mostrar más nombre'}
                    title={nameExpanded ? 'Mostrar menos' : 'Mostrar más'}
                  >
                    {nameExpanded ? (
                      <ChevronUp size={18} aria-hidden="true" />
                    ) : (
                      <ChevronDown size={18} aria-hidden="true" />
                    )}
                  </button>
                )}

                <div className="mt-5 flex items-center gap-3">
                  <span className="text-2xl font-black text-text-light">
                    {formatPrice(currentPrice)}
                  </span>
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

                {isAvailable && (
                  <button
                    type="button"
                    onClick={() => addToCart(product.id, stockAvailable)}
                    className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  >
                    <FaCartPlus size={16} />
                    Agregar al carrito
                  </button>
                )}

                <div className="relative mt-6">
                  <div style={getDescriptionWrapperStyle(descriptionExpanded)}>
                    <p
                      ref={descriptionRef}
                      className={`text-sm leading-7 text-text-light opacity-80 ${
                        !descriptionExpanded ? 'line-clamp-7' : ''
                      }`}
                    >
                      {descriptionText}
                    </p>
                  </div>
                  <p
                    ref={fullDescriptionRef}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 right-0 top-0 -z-10 text-sm leading-7 text-text-light opacity-0"
                  >
                    {descriptionText}
                  </p>
                  {(descriptionTruncated || descriptionExpanded) && (
                    <button
                      type="button"
                      onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                      className="mt-1 text-sm font-semibold text-primary hover:underline"
                    >
                      {descriptionExpanded ? 'mostrar menos' : 'mostrar más'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <section className="rounded-[2rem] border border-border-light bg-card-bg-light px-5 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} className="text-primary" />
                  <h2 className="text-xl font-black text-text-light">Comentarios del producto</h2>
                </div>
                {reviewsCount > 0 && (
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
                )}
              </div>

              {reviewsCount === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-border-light px-5 py-8 text-center">
                  <p className="text-base font-semibold text-text-light">Sin calificaciones</p>
                  <p className="mt-2 text-sm text-text-light opacity-60">
                    Este producto aún no tiene comentarios registrados.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-6 grid gap-4 rounded-3xl border border-border-light bg-secondary-bg-light/45 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
                    <div className="flex items-center gap-2">
                      {renderStars(averageRating, 'average')}
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-text-light">{averageLabel}</p>
                      <p className="text-sm text-text-light opacity-65">
                        {`${reviewsCount} calificación${reviewsCount === 1 ? '' : 'es'} registradas`}
                      </p>
                    </div>
                  </div>

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
                            <div className="flex items-center gap-1">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-sm font-semibold text-text-light opacity-70">
                              {review.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <p
                          ref={(element) => {
                            if (element) reviewRefs.current.set(review.id, element);
                            else reviewRefs.current.delete(review.id);
                          }}
                          className={`mt-3 text-sm leading-6 text-text-light opacity-80 ${!expandedReviews.has(review.id) ? 'line-clamp-3' : ''}`}
                        >
                          {review.comment}
                        </p>
                        {(truncatedReviews.has(review.id) || expandedReviews.has(review.id)) && (
                          <button
                            type="button"
                            onClick={() => toggleReview(review.id)}
                            className="mt-1 cursor-pointer text-sm font-semibold text-primary hover:underline"
                          >
                            {expandedReviews.has(review.id) ? 'mostrar menos' : 'mostrar más'}
                          </button>
                        )}
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
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </section>
  );
}

export default function ProductDetail(props: ProductDetailProps) {
  return (
    <CartProvider>
      <ProductDetailInner {...props} />
    </CartProvider>
  );
}