import { useState, useEffect, useRef } from 'react';

const animationDuration = 600;

export function useAnimatedNumber(target: number) {
  const isFirst = useRef(true);
  const [displayed, setDisplayed] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    const from = isFirst.current ? 0 : prevTarget.current;
    const to = target;
    isFirst.current = false;
    prevTarget.current = target;
    if (from === to) {
      return;
    }
    const startTime = performance.now();
    let frame: number;
    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(from + (to - from) * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return displayed;
}