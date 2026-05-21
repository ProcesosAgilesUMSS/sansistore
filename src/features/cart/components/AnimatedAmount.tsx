import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  className?: string;
}

function DigitColumn({ target, delay }: { target: number; delay: number }) {
  const [y, setY] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    const from = current.current;
    const to = target;
    if (from === to) return;
    current.current = to;

    const start = performance.now();
    const dur = 250 + delay;

    const step = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = t * (2 - t);
      setY(from + (to - from) * ease);
      if (t < 1) requestAnimationFrame(step);
      else setY(to);
    };

    requestAnimationFrame(step);
  }, [target, delay]);

  return (
    <span className="inline-block overflow-hidden align-bottom" style={{ height: '1.2em', lineHeight: '1.2em' }}>
      <span style={{ display: 'block', transform: `translateY(-${y * 1.2}em)` }}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} style={{ display: 'block', height: '1.2em' }}>{i}</span>
        ))}
      </span>
    </span>
  );
}

export function AnimatedAmount({ value, className }: Props) {
  const formatted = value.toFixed(2);
  let di = 0;

  return (
    <span className={`inline-flex items-baseline whitespace-nowrap tabular-nums ${className ?? ''}`}>
      {formatted.split('').map((ch, i) => {
        if (/\d/.test(ch)) {
          const d = parseInt(ch, 10);
          const idx = di++;
          return <DigitColumn key={i} target={d} delay={idx * 30} />;
        }
        return <span key={i}>{ch}</span>;
      })}&nbsp;Bs
    </span>
  );
}
