import { useEffect, useRef } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
}

// Un numero che sale o scende contando invece di cambiare di colpo (saldi, piatto).
// Il testo lo scrive solo l'effetto, direttamente nel DOM a ogni frame, senza ridisegnare il componente.
export default function AnimatedNumber({ value, duration = 450 }: AnimatedNumberProps) {
  const el = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const from = shown.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (from === value || reduced) {
      shown.current = value;
      node.textContent = String(value);
      return;
    }
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      shown.current = Math.round(from + (value - from) * eased);
      node.textContent = String(shown.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span ref={el} />;
}
