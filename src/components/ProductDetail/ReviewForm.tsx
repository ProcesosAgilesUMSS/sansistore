import { Star } from 'lucide-react';

interface ReviewFormProps {
  rating: number;
  comment: string;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  showCancel?: boolean;
}

export default function ReviewForm({
  rating,
  comment,
  onRatingChange,
  onCommentChange,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
  submittingLabel,
  showCancel,
}: ReviewFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text-light">Calificación</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
             <button
               type="button"
               key={star}
               onClick={() => onRatingChange(star)}
               className="transition-transform hover:scale-110"
             >
               <Star
                 size={24}
                 className={star <= rating ? "fill-primary text-primary" : "text-text-light opacity-20"}
               />
             </button>
          ))}
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="comment" className="text-sm font-medium text-text-light">Comentario</label>
          <span className="text-xs text-text-light opacity-60">{comment.length}/256</span>
        </div>
        <textarea
          id="comment"
          rows={3}
          maxLength={256}
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="¿Qué te pareció el producto? (Opcional)"
          className="w-full resize-none rounded-xl border border-border-light bg-secondary-bg-light/50 px-4 py-3 text-sm text-text-light outline-none transition-colors hover:border-primary focus:border-primary"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border-light px-6 py-2.5 text-sm font-semibold text-text-light transition-all hover:border-primary"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
