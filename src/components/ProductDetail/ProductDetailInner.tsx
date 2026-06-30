import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Timestamp,
  collection,
  getDocs,
  limit,
  query,
  where,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getSoldCount } from '../../lib/productPopularity';
import { useAuthUser } from '../../hooks/useAuthUser';
import type { Product, ProductDetailProps, Review, InventoryRecord } from './types';
import BreadcrumbNav from './BreadcrumbNav';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorState from './ErrorState';
import ProductImageSection from './ProductImageSection';
import ProductInfoSection from './ProductInfoSection';
import ReviewForm from './ReviewForm';
import ReviewCard from './ReviewCard';
import ReviewSection from './ReviewSection';

export default function ProductDetailInner({
  productSlug,
  initialProduct,
}: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewRating, setEditReviewRating] = useState(5);
  const [editReviewComment, setEditReviewComment] = useState('');
  const [updatingReview, setUpdatingReview] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  const [userReviewExpanded, setUserReviewExpanded] = useState(false);
  const [userReviewTruncated, setUserReviewTruncated] = useState(false);
  const userReviewRef = useRef<HTMLParagraphElement | null>(null);

  const setUserReviewRef = useCallback((element: HTMLParagraphElement | null) => {
    userReviewRef.current = element;
  }, []);

  const checkUserReviewTruncation = useCallback(() => {
    if (userReviewRef.current) {
      setUserReviewTruncated(userReviewRef.current.scrollHeight > userReviewRef.current.clientHeight);
    }
  }, []);

  useEffect(() => {
    checkUserReviewTruncation();
    window.addEventListener('resize', checkUserReviewTruncation);
    return () => window.removeEventListener('resize', checkUserReviewTruncation);
  }, [checkUserReviewTruncation]);

  const { user, authReady } = useAuthUser();

  useEffect(() => {
    if (!user) return;
    const fetchRole = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        setUserRoles(snap.data()?.roles || []);
      } catch (e) {
        console.error("Error fetching user role", e);
      }
    };
    fetchRole();
  }, [user]);

  const canReview = user && userRoles.includes('comprador');
  const userReview = user ? reviews.find((r) => r.authorId === user.uid) : undefined;
  const otherReviews = userReview ? reviews.filter((r) => r.id !== userReview.id) : reviews;

  useEffect(() => {
    let ignore = false;

    const fetchProductData = async () => {
      setLoading(true);
      setError(null);
      setNewReviewRating(5);
      setNewReviewComment('');
      setEditingReviewId(null);
      setReviewToDelete(null);

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
              stockReserved: inventoryData?.stockReserved ?? 0,
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
            stockReserved: inventoryData?.stockReserved ?? 0,
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

  const handleSubmitReview = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user || !canReview) return;
    setSubmittingReview(true);
    try {
      const reviewData = {
        productId: product.id,
        authorName: user.displayName || 'Comprador',
        authorId: user.uid,
        authorPhotoUrl: user.photoURL || null,
        rating: newReviewRating,
        comment: newReviewComment.trim(),
        active: true,
      };

      const docRef = await addDoc(collection(db, 'reviews'), {
        ...reviewData,
        createdAt: serverTimestamp(),
      });

      setReviews((prev) => [{ ...reviewData, id: docRef.id, createdAt: Timestamp.now() } as Review, ...prev]);
      setNewReviewComment('');
      setNewReviewRating(5);
    } catch (err) {
      console.error(err);
      alert('Error al publicar el comentario.');
    } finally {
      setSubmittingReview(false);
    }
  }, [product, user, canReview, newReviewRating, newReviewComment]);

  const handleUpdateReview = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReviewId || !user) return;
    setUpdatingReview(true);
    try {
      const reviewRef = doc(db, 'reviews', editingReviewId);
      await updateDoc(reviewRef, {
        rating: editReviewRating,
        comment: editReviewComment.trim(),
      });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === editingReviewId
            ? { ...r, rating: editReviewRating, comment: editReviewComment.trim() }
            : r
        )
      );
      setEditingReviewId(null);
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el comentario.');
    } finally {
      setUpdatingReview(false);
    }
  }, [editingReviewId, user, editReviewRating, editReviewComment]);

  const handleDeleteReview = useCallback(async () => {
    if (!reviewToDelete) return;
    try {
      const reviewRef = doc(db, 'reviews', reviewToDelete);
      await deleteDoc(reviewRef);
      setReviews((prev) => prev.filter((r) => r.id !== reviewToDelete));
      setReviewToDelete(null);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el comentario.');
    }
  }, [reviewToDelete]);

  return (
    <section className="min-h-screen bg-bg-light pb-10 pt-20 sm:pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <BreadcrumbNav />

        {loading && <LoadingSkeleton />}

        {!loading && error && <ErrorState error={error} />}

        {!loading && !error && product && (
          <div className="space-y-6 sm:space-y-10">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-[1.05fr_0.95fr] md:gap-8">
              <ProductImageSection product={product} />
              <ProductInfoSection product={product} loading={loading} />
            </div>

            {authReady && canReview && (
              <div className="rounded-[2rem] border border-border-light bg-card-bg-light px-5 py-6 sm:px-8 sm:py-8">
                <h3 className="mb-6 text-lg font-bold text-text-light">Tu opinión</h3>
                {!userReview ? (
                  <ReviewForm
                    rating={newReviewRating}
                    comment={newReviewComment}
                    onRatingChange={setNewReviewRating}
                    onCommentChange={setNewReviewComment}
                    onSubmit={handleSubmitReview}
                    isSubmitting={submittingReview}
                    submitLabel="Publicar comentario"
                    submittingLabel="Publicando..."
                  />
                ) : (
                  <ReviewCard
                    review={userReview}
                    isUserReview
                    isEditing={editingReviewId === userReview.id}
                    isExpanded={userReviewExpanded}
                    isTruncated={userReviewTruncated}
                    editRating={editReviewRating}
                    editComment={editReviewComment}
                    isUpdating={updatingReview}
                    onEditRatingChange={setEditReviewRating}
                    onEditCommentChange={setEditReviewComment}
                    onStartEdit={() => {
                      setEditingReviewId(userReview.id);
                      setEditReviewRating(userReview.rating);
                      setEditReviewComment(userReview.comment);
                    }}
                    onCancelEdit={() => setEditingReviewId(null)}
                    onSaveEdit={handleUpdateReview}
                    onDelete={() => setReviewToDelete(userReview.id)}
                    onToggleExpand={() => setUserReviewExpanded((prev) => !prev)}
                    setReviewRef={setUserReviewRef}
                  />
                )}
              </div>
            )}

            <ReviewSection
              reviews={otherReviews}
              allReviews={reviews}
              editingReviewId={editingReviewId}
              editReviewRating={editReviewRating}
              editReviewComment={editReviewComment}
              updatingReview={updatingReview}
              reviewToDelete={reviewToDelete}
              onEditRatingChange={setEditReviewRating}
              onEditCommentChange={setEditReviewComment}
              onStartEdit={(reviewId, rating, comment) => {
                setEditingReviewId(reviewId);
                setEditReviewRating(rating);
                setEditReviewComment(comment);
              }}
              onCancelEdit={() => setEditingReviewId(null)}
              onUpdateReview={handleUpdateReview}
              onDeleteRequest={setReviewToDelete}
              onConfirmDelete={handleDeleteReview}
              onCancelDelete={() => setReviewToDelete(null)}
            />
          </div>
        )}
      </div>
    </section>
  );
}
