import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

interface Props {
  value: number;
  className?: string;
}

export function AnimatedAmount({ value, className }: Props) {
  const displayed = useAnimatedNumber(value);
  return <span className={className}>Bs {displayed.toFixed(2)}</span>;
}