import { useEffect, useState, useRef } from 'react';

interface Props {
  value: number;
  className?: string;
}

export function AnimatedAmount({ value, className }: Props) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const prevValue = prevValueRef.current;
    if (prevValue === value) return;

    prevValueRef.current = value;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const duration = 600;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = prevValue + (value - prevValue) * eased;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);

  return (
    <span className={`inline-flex items-baseline whitespace-nowrap tabular-nums ${className ?? ''}`}>
      Bs {displayValue.toFixed(2)}
    </span>
  );
}
