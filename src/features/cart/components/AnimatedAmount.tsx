import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

interface Props {
  value: number;
  className?: string;
}

export function AnimatedAmount({ value, className }: Props) {
  const displayed = useAnimatedNumber(value);
  return (
    <span
      className={`inline-flex items-baseline whitespace-nowrap tabular-nums ${className ?? ''}`}
      style={{ minWidth: '12ch' }}
    >
      Bs {displayed.toFixed(2)}
    </span>
  );
}