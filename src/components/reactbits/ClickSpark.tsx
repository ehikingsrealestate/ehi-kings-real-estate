import { useEffect, useRef } from 'react';

// Adapted from react-bits ClickSpark — small line sparks burst from every
// click. Fixed full-viewport canvas + window listener so it covers the whole
// site without wrapping the DOM tree.

interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
}

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

export default function ClickSpark({
  sparkColor = '#0063DE',
  sparkSize = 9,
  sparkRadius = 20,
  sparkCount = 8,
  duration = 450,
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onClick = (e: MouseEvent) => {
      const now = performance.now();
      for (let i = 0; i < sparkCount; i++) {
        sparksRef.current.push({
          x: e.clientX,
          y: e.clientY,
          angle: (2 * Math.PI * i) / sparkCount + Math.random() * 0.35,
          startTime: now,
        });
      }
    };
    window.addEventListener('click', onClick);

    let raf = 0;
    const ease = (t: number) => t * (2 - t);
    const draw = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) return false;
        const progress = elapsed / duration;
        const eased = ease(progress);
        const distance = eased * sparkRadius;
        const lineLength = sparkSize * (1 - eased);
        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1 - progress;
        ctx.beginPath();
        ctx.moveTo(spark.x + distance * Math.cos(spark.angle), spark.y + distance * Math.sin(spark.angle));
        ctx.lineTo(
          spark.x + (distance + lineLength) * Math.cos(spark.angle),
          spark.y + (distance + lineLength) * Math.sin(spark.angle)
        );
        ctx.stroke();
        ctx.globalAlpha = 1;
        return true;
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('click', onClick);
      window.removeEventListener('resize', resize);
    };
  }, [sparkColor, sparkSize, sparkRadius, sparkCount, duration]);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-[95]" />;
}
