import { useEffect, useRef } from 'react';

// Canvas star field for the hero sky — tiny stars twinkling at individual
// phases. 2D canvas, DPR-aware, pointer-events-none.

interface TwinkleStarsProps {
  count?: number;
  className?: string;
}

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
}

export default function TwinkleStars({ count = 110, className = '' }: TwinkleStarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stars: Star[] = [];
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const seed = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        // keep stars in the upper sky, clear of the building
        y: Math.random() * height * 0.62,
        r: 0.4 + Math.random() * 1.1,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.2,
      }));
    };

    seed();
    const ro = new ResizeObserver(seed);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    let raf = 0;
    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const star of stars) {
        const alpha = 0.16 + 0.5 * (0.5 + 0.5 * Math.sin((t / 1000) * star.speed + star.phase));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [count]);

  return <canvas ref={canvasRef} aria-hidden className={`pointer-events-none absolute inset-0 ${className}`} />;
}
