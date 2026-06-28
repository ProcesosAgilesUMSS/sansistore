import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, ChevronDown } from 'lucide-react';
import type { Review, ReviewSortKey } from './types';
import { REVIEW_PAGE_SIZE } from './types';
import { renderStars, sortReviews, areSetsEqual } from './utils';
import ReviewCard from './ReviewCard';
import DeleteModal from './DeleteModal';

interface ReviewSectionProps {
  reviews: Review[];
  allReviews: Review[];
  editingReviewId: string | null;
  editReviewRating: number;
  editReviewComment: string;
  updatingReview: boolean;
  reviewToDelete: string | null;
  onEditRatingChange: (rating: number) => void;
  onEditCommentChange: (comment: string) => void;
  onStartEdit: (reviewId: string, rating: number, comment: string) => void;
  onCancelEdit: () => void;
  onUpdateReview: (e: React.FormEvent) => void;
  onDeleteRequest: (reviewId: string) => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

export default function ReviewSection({
  reviews,
  allReviews,
  editingReviewId,
  editReviewRating,
  editReviewComment,
  updatingReview,
  reviewToDelete,
  onEditRatingChange,
  onEditCommentChange,
  onStartEdit,
  onCancelEdit,
  onUpdateReview,
  onDeleteRequest,
  onConfirmDelete,
  onCancelDelete,
}: ReviewSectionProps) {
  const [reviewSort, setReviewSort] = useState<ReviewSortKey>('recent');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(REVIEW_PAGE_SIZE);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [truncatedReviews, setTruncatedReviews] = useState<Set<string>>(new Set());

  const reviewRefs = useRef<Map<string, HTMLParagraphElement>>(new Map());
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const sortedReviews = useMemo(() => sortReviews(reviews, reviewSort), [reviews, reviewSort]);
  const visibleReviews = useMemo(
    () => sortedReviews.slice(0, visibleReviewsCount),
    [sortedReviews, visibleReviewsCount]
  );

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

  const reviewsCount = allReviews.length;
  const averageRating = reviewsCount
    ? allReviews.reduce((sum, review) => sum + review.rating, 0) / reviewsCount
    : 0;
  const averageLabel = reviewsCount ? `${averageRating.toFixed(1)} de 5` : 'Sin calificaciones';
  const hasMoreReviews = sortedReviews.length > visibleReviews.length;

  const reviewSortOptions: Array<{ value: ReviewSortKey; label: string }> = [
    { value: 'recent', label: 'Más recientes' },
    { value: 'oldest', label: 'Más antiguos' },
    { value: 'highest', label: 'Mayor puntuación' },
    { value: 'lowest', label: 'Menor puntuación' },
  ];

  return (
    <section className="rounded-[2rem] border border-border-light bg-card-bg-light px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare size={18} className="text-primary" />
          <h2 className="text-lg font-black text-text-light">Comentarios del producto</h2>
        </div>
        {reviewsCount > 0 && (
          <div className="flex items-center gap-2 text-sm font-medium text-text-light">
            <span className="opacity-70">Ordenar por</span>
            <div ref={sortRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 rounded-full border border-border-light bg-card-bg-light px-4 py-2 text-sm font-semibold text-text-light transition-all hover:border-primary hover:text-primary"
              >
                <span>{reviewSortOptions.find((opt) => opt.value === reviewSort)?.label ?? 'Más recientes'}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 top-full mt-1 min-w-48 rounded-lg border border-border-light bg-card-bg-light py-1 shadow-lg z-20">
                  {reviewSortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setReviewSort(option.value);
                        setVisibleReviewsCount(REVIEW_PAGE_SIZE);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm font-medium transition-colors ${
                        reviewSort === option.value
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
              <ReviewCard
                key={review.id}
                review={review}
                isUserReview={false}
                isEditing={editingReviewId === review.id}
                isExpanded={expandedReviews.has(review.id)}
                isTruncated={truncatedReviews.has(review.id)}
                editRating={editReviewRating}
                editComment={editReviewComment}
                isUpdating={updatingReview}
                onEditRatingChange={onEditRatingChange}
                onEditCommentChange={onEditCommentChange}
                onStartEdit={() => onStartEdit(review.id, review.rating, review.comment)}
                onCancelEdit={onCancelEdit}
                onSaveEdit={onUpdateReview}
                onDelete={() => onDeleteRequest(review.id)}
                onToggleExpand={() => toggleReview(review.id)}
                setReviewRef={(element) => {
                  if (element) reviewRefs.current.set(review.id, element);
                  else reviewRefs.current.delete(review.id);
                }}
              />
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

      {reviewToDelete && (
        <DeleteModal
          onConfirm={onConfirmDelete}
          onCancel={onCancelDelete}
        />
      )}
    </section>
  );
}
