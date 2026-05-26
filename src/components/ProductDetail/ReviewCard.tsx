import { Pencil, Star, Trash2, User as UserIcon } from 'lucide-react';
import type { Review } from './types';
import { renderStars, formatReviewDate } from './utils';

interface ReviewCardProps {
  review: Review;
  isUserReview: boolean;
  isEditing: boolean;
  isExpanded: boolean;
  isTruncated: boolean;
  editRating: number;
  editComment: string;
  isUpdating: boolean;
  onEditRatingChange: (rating: number) => void;
  onEditCommentChange: (comment: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onToggleExpand: () => void;
  setReviewRef: (element: HTMLParagraphElement | null) => void;
}

export default function ReviewCard({
  review,
  isUserReview,
  isEditing,
  isExpanded,
  isTruncated,
  editRating,
  editComment,
  isUpdating,
  onEditRatingChange,
  onEditCommentChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onToggleExpand,
  setReviewRef,
}: ReviewCardProps) {
  if (isEditing) {
    return (
      <article className="rounded-2xl border-2 border-primary/20 bg-secondary-bg-light/80 px-5 py-4 shadow-[0_0_15px_-3px_rgba(var(--color-primary-rgb),0.1)]">
        <form onSubmit={onSaveEdit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text-light mb-2">Calificación (1-5)</label>
            <div className="flex gap-2 items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                 <button
                   type="button"
                   key={star}
                   onClick={() => onEditRatingChange(star)}
                   className="focus:outline-none transition-transform hover:scale-110"
                 >
                   <Star
                     size={28}
                     className={star <= editRating ? "fill-primary text-primary" : "text-text-light opacity-20"}
                   />
                 </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-text-light">Comentario</label>
              <span className="text-xs text-text-light opacity-60">{editComment.length}/256</span>
            </div>
            <textarea
              rows={3}
              maxLength={256}
              value={editComment}
              onChange={(e) => onEditCommentChange(e.target.value)}
              placeholder="¿Qué te pareció el producto? (Opcional)"
              className="w-full resize-none rounded-xl border border-border-light bg-secondary-bg-light/50 px-4 py-3 text-sm text-text-light outline-none transition-colors hover:border-primary focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isUpdating}
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isUpdating ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-full border border-border-light px-6 py-2 text-sm font-semibold text-text-light transition-all hover:border-primary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article
      className={`rounded-2xl border ${
        isUserReview
          ? 'border-2 border-primary/20 bg-secondary-bg-light/80 shadow-[0_0_15px_-3px_rgba(var(--color-primary-rgb),0.1)]'
          : 'border-border-light bg-secondary-bg-light/50'
      } px-5 py-4`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          {review.authorPhotoUrl ? (
            <img
              src={review.authorPhotoUrl}
              alt={review.authorName || 'Avatar'}
              className="h-10 w-10 rounded-full object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-bg-light/80 text-text-light/50">
              <UserIcon size={20} />
            </div>
          )}
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
      {review.comment && (
        <>
          <p
            ref={setReviewRef}
            className={`mt-3 break-all text-sm leading-6 text-text-light opacity-80 ${!isExpanded ? 'line-clamp-3' : ''}`}
          >
            {review.comment}
          </p>
          {(isTruncated || isExpanded) && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="mt-1 cursor-pointer text-sm font-semibold text-primary hover:underline"
            >
              {isExpanded ? 'mostrar menos' : 'mostrar más'}
            </button>
          )}
        </>
      )}
      {isUserReview && (
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            title="Editar comentario"
            onClick={onStartEdit}
            className="rounded p-1 text-primary transition-colors hover:bg-primary/10"
          >
            <Pencil size={18} />
          </button>
          <button
            type="button"
            title="Eliminar comentario"
            onClick={onDelete}
            className="rounded p-1 text-text-light transition-colors hover:bg-text-light/10"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </article>
  );
}
