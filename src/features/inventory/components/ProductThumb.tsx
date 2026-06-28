import { useState } from 'react';
import { Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  src?: string;
  alt: string;
  /** Clases para la imagen cuando carga bien. */
  className?: string;
  /** Ícono de fallback (por defecto Package). */
  fallbackIcon?: LucideIcon;
  /** Clases del ícono de fallback. */
  fallbackClassName?: string;
}

/**
 * Miniatura de producto con fallback robusto: muestra el ícono cuando no hay
 * imagen O cuando la URL existe pero falla al cargar (404, rota, etc.).
 */
export const ProductThumb = ({
  src,
  alt,
  className = 'object-cover w-full h-full',
  fallbackIcon: Fallback = Package,
  fallbackClassName = 'w-10 h-10 opacity-20 text-(--theme-text)/35',
}: Props) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <Fallback className={fallbackClassName} />;
  }

  return (
    <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
  );
};
