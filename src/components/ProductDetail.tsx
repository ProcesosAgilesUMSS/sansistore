import { useEffect, useState } from 'react';
import { ArrowLeft, MessageSquare, Package, Star } from 'lucide-react';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
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
  authorName: string;
  comment: string;
  rating: number;
  active?: boolean;
}

interface ProductDetailProps {
  productSlug: string;
}

interface InventoryRecord {
  productId: string;
  stockAvailable?: number;
  stockTotal?: number;
  enabled?: boolean;
}

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

function getBadgeData(product: Product | null) {
  const discountPercentage = getDiscountPercentage(product);

  if (discountPercentage) {
    return {
      label: `-${discountPercentage}%`,
      className: 'bg-red-600 text-white',
    };
  }

  if (!product?.badge) return null;

  return {
    label: product.badge,
    className: 'bg-primary-action text-white',
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

export default function ProductDetail({ productSlug }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchProductData = async () => {
      setLoading(true);
      setError(null);
      setImageFailed(false);

      try {
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
          .sort((left, right) => right.rating - left.rating || left.authorName.localeCompare(right.authorName));

        if (!ignore) {
          setProduct({
            ...productData,
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
  }, [productSlug]);

  const showOffer = hasValidOffer(product);
  const currentPrice = showOffer ? product?.offerPrice ?? 0 : product?.price ?? 0;
  const stockAvailable = product?.stockAvailable ?? 0;
  const isAvailable = stockAvailable > 0 && product?.enabled !== false;
  const normalizedDescription = product?.description?.trim();
  const descriptionText = normalizedDescription ? normalizedDescription : 'Sin descripción';
  const badgeData = getBadgeData(product);

  return (
    <section className="min-h-screen bg-bg-light py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <a
          href="/#productos"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
        >
          <ArrowLeft size={16} />
          Volver al catálogo
        </a>

        {loading && (
          <div className="space-y-10">
            <div className="grid gap-8 md:grid-cols-[1.05fr_0.95fr]">
              <div className="overflow-hidden rounded-[2rem] border border-border-light bg-card-bg-light">
                <div className="relative aspect-square animate-pulse bg-secondary-bg-light">
                  <div className="absolute left-5 top-5 h-7 w-20 rounded-full bg-card-bg-light/80" />
                </div>
              </div>

              <div className="rounded-[2rem] border border-border-light bg-card-bg-light px-6 py-8 sm:px-8">
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

            <section className="rounded-[2rem] border border-border-light bg-card-bg-light px-6 py-8 sm:px-8">
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
          <div className="space-y-10">
            <div className="grid gap-8 md:grid-cols-[1.05fr_0.95fr]">
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

              <div className="flex flex-col justify-center rounded-[2rem] border border-border-light bg-card-bg-light px-6 py-8 sm:px-8">
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
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isAvailable ? 'bg-primary/15 text-primary' : 'bg-text-light/10 text-text-light'
                    }`}
                  >
                    {isAvailable ? 'Disponible' : 'Producto agotado'}
                  </span>
                  <span className="text-sm text-text-light opacity-70">
                    Stock: {stockAvailable} disponibles
                  </span>
                </div>

                <p className="mt-6 text-sm leading-7 text-text-light opacity-80">
                  {descriptionText}
                </p>
              </div>
            </div>

            <section className="rounded-[2rem] border border-border-light bg-card-bg-light px-6 py-8 sm:px-8">
              <div className="flex items-center gap-3">
                <MessageSquare size={18} className="text-primary" />
                <h2 className="text-xl font-black text-text-light">Comentarios del producto</h2>
              </div>

              {reviews.length === 0 ? (
                <p className="mt-6 text-sm text-text-light opacity-60">
                  Este producto aún no tiene comentarios registrados.
                </p>
              ) : (
                <div className="mt-6 grid gap-4">
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-2xl border border-border-light bg-secondary-bg-light/50 px-5 py-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-bold text-text-light">{review.authorName}</p>
                        <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-text-light opacity-80">
                        {review.comment}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
