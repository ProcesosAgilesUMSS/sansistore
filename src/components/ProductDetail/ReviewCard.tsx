import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Pencil, Star, Trash2, User as UserIcon } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (isEditing) {
    return (
      <form onSubmit={onSaveEdit} className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-light">Calificación</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
               <button
                 type="button"
                 key={star}
                 onClick={() => onEditRatingChange(star)}
                 className="transition-transform hover:scale-110"
               >
                 <Star
                   size={24}
                   className={star <= editRating ? "fill-primary text-primary" : "text-text-light opacity-20"}
                 />
               </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-text-light">Comentario</label>
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
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isUpdating ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-full border border-border-light px-6 py-2.5 text-sm font-semibold text-text-light transition-all hover:border-primary"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className="rounded-2xl border border-border-light bg-secondary-bg-light/50 px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          {review.authorPhotoUrl ? (
            <img
              src={review.authorPhotoUrl}
              alt={review.authorName || 'Avatar'}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-bg-light text-text-light/50">
              <UserIcon size={20} />
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-text-light">
              {review.authorName?.trim() || 'Comprador anónimo'}
            </p>
            {formatReviewDate(review) && (
              <p className="mt-0.5 text-xs uppercase tracking-wider text-text-light opacity-45">
                {formatReviewDate(review)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:self-start">
          <div className="flex items-center gap-1">
            {renderStars(review.rating)}
          </div>
          <span className="text-sm font-semibold text-text-light opacity-70">
            {review.rating.toFixed(1)}
          </span>
          {isUserReview && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="rounded p-1 text-text-light opacity-50 transition-colors hover:opacity-100"
              >
                <MoreVertical size={18} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-xl border border-border-light bg-card-bg-light py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => { onStartEdit(); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-light transition-colors hover:bg-secondary-bg-light"
                  >
                    <Pencil size={15} />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-secondary-bg-light"
                  >
                    <Trash2 size={15} />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )}
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
    </article>
  );
}
