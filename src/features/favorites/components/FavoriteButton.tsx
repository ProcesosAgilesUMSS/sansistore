import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  productId: string;
  productName: string;
  productSlug: string;
  isFavorite: boolean;
  onToggle: (productId: string) => void | Promise<unknown>;
  className?: string;
}

type FavoriteAnimation = 'idle' | 'adding' | 'removing';

export function FavoriteButton({
  productId,
  productName,
  productSlug,
  isFavorite,
  onToggle,
  className = '',
}: FavoriteButtonProps) {
  const [animation, setAnimation] = useState<FavoriteAnimation>('idle');
  const previousFavoriteRef = useRef(isFavorite);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (previousFavoriteRef.current === isFavorite) return;

    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);

    const nextAnimation = isFavorite ? 'adding' : 'removing';
    setAnimation(nextAnimation);
    animationTimeoutRef.current = setTimeout(
      () => setAnimation('idle'),
      nextAnimation === 'adding' ? 520 : 700
    );
    previousFavoriteRef.current = isFavorite;
  }, [isFavorite]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, []);

  const hasActiveAppearance = isFavorite || animation === 'removing';

  return (
    <button
      type="button"
      aria-label={
        isFavorite
          ? `Quitar ${productName} de favoritos`
          : `Agregar ${productName} a favoritos`
      }
      aria-pressed={isFavorite}
      title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      data-testid={`favorite-button-${productSlug}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle(productId);
      }}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-all active:scale-95 ${
        hasActiveAppearance
          ? 'border-primary bg-primary text-text-light shadow-md shadow-primary/25'
          : 'border-border-light bg-card-bg-light/90 text-text-light hover:border-primary hover:text-primary'
      } ${className}`}
    >
      <span className="relative flex h-[18px] w-[18px] items-center justify-center">
        {animation === 'adding' && <span aria-hidden="true" className="favorite-heart-burst absolute inset-0 rounded-full" />}
        <Heart
          size={18}
          fill={isFavorite ? 'currentColor' : 'none'}
          className={animation === 'adding' ? 'favorite-icon-pop' : ''}
        />
        {animation === 'removing' && (
          <span aria-hidden="true" className="favorite-heart-break absolute inset-0">
            <Heart
              size={18}
              fill="currentColor"
              className="favorite-heart-half favorite-heart-half-left absolute inset-0"
            />
            <Heart
              size={18}
              fill="currentColor"
              className="favorite-heart-half favorite-heart-half-right absolute inset-0"
            />
            <span className="favorite-heart-crack absolute inset-y-[1px] left-1/2 w-px -translate-x-1/2" />
          </span>
        )}
      </span>
    </button>
  );
}
