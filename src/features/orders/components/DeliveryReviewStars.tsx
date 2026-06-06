import { useEffect, useState } from 'react';
import { Star, CheckCircle } from 'lucide-react';
import type { Order } from '../types';
import {
  getDeliveryReviewForOrder,
  createDeliveryReview,
  addDeliveryReviewComment,
} from '../services/deliveryReviewsService';

interface DeliveryReviewStarsProps {
  order: Order;
}

const COMMENT_MAX_LENGTH = 256;

export default function DeliveryReviewStars({
  order,
}: DeliveryReviewStarsProps) {
  const [loading, setLoading] = useState(true);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [savingRating, setSavingRating] = useState(false);
  const [comment, setComment] = useState('');
  const [commentSaved, setCommentSaved] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const courierId = order.collectedBy ?? order.courierId ?? null;

  useEffect(() => {
    let active = true;
    getDeliveryReviewForOrder(order.id)
      .then((existing) => {
        if (!active) return;
        if (existing) {
          setReviewId(existing.id ?? null);
          setRating(existing.rating);
          setComment(existing.comment ?? '');
          if (existing.comment) setCommentSaved(true);
        }
      })
      .catch(() => {
        if (active) setError('No se pudo cargar la calificación.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [order.id]);

  const handleRate = async (value: number) => {
    if (reviewId || savingRating) return;
    setSavingRating(true);
    setError(null);
    try {
      const id = await createDeliveryReview({
        orderId: order.id,
        courierId,
        buyerId: order.buyerId,
        buyerName: order.buyerName,
        rating: value,
      });
      setReviewId(id);
      setRating(value);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar la calificación.'
      );
    } finally {
      setSavingRating(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewId || !comment.trim() || savingComment) return;
    setSavingComment(true);
    setError(null);
    try {
      await addDeliveryReviewComment(reviewId, comment);
      setCommentSaved(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar el comentario.'
      );
    } finally {
      setSavingComment(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Star size={18} /> Califica al mensajero
        </h3>
        <p className="text-xs opacity-60">Cargando calificación...</p>
      </div>
    );
  }

  const rated = reviewId !== null;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold flex items-center gap-2">
            <Star size={18} /> Califica al mensajero
          </h3>
          <p className="mt-1 text-sm opacity-70">
            {rated
              ? 'Gracias por calificar esta entrega.'
              : 'Toca una estrella para calificar el servicio de entrega.'}
          </p>
        </div>
        {rated && (
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <CheckCircle size={14} /> {rating}/5
          </span>
        )}
      </div>

      <div
        className="flex w-fit items-center gap-1 rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) p-1"
        onPointerLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= (hovered || rating);
          return (
            <button
              type="button"
              key={star}
              disabled={rated || savingRating}
              onClick={() => handleRate(star)}
              onPointerEnter={() => !rated && setHovered(star)}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors enabled:hover:bg-primary/10 disabled:cursor-default"
              aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
            >
              <Star
                size={28}
                className={`transition-colors ${filled ? 'fill-primary text-primary' : 'text-(--theme-text) opacity-25'}`}
              />
            </button>
          );
        })}
      </div>

      {rated &&
        (commentSaved ? (
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary">
            <CheckCircle size={16} /> Comentario guardado
          </p>
        ) : (
          <form
            onSubmit={handleSubmitComment}
            className="mt-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <label
                htmlFor="delivery-comment"
                className="text-sm font-medium opacity-70"
              >
                Agrega un comentario (opcional)
              </label>
              <span className="text-xs opacity-50">
                {comment.length}/{COMMENT_MAX_LENGTH}
              </span>
            </div>
            <textarea
              id="delivery-comment"
              rows={3}
              maxLength={COMMENT_MAX_LENGTH}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Cómo fue la entrega?"
              className="w-full resize-none rounded-xl border border-(--theme-border) bg-(--theme-bg) px-4 py-3 text-sm outline-none transition-colors hover:border-primary focus:border-primary"
            />
            <button
              type="submit"
              disabled={!comment.trim() || savingComment}
              className="self-start rounded-full bg-primary px-5 py-2 text-sm font-bold text-(--theme-bg) transition hover:brightness-105 active:scale-95 disabled:opacity-50"
            >
              {savingComment ? 'Guardando...' : 'Agregar comentario'}
            </button>
          </form>
        ))}

      {error && (
        <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>
      )}
    </div>
  );
}
