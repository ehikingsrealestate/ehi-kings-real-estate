// One-shot confetti burst on a temporary full-viewport canvas.

const BRAND_COLORS = ['#0063DE', '#6E8C14', '#d9a94f', '#144687', '#ffffff'];

export function confettiBurst(x: number, y: number, colors: string[] = BRAND_COLORS) {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = 'position:fixed;inset:0;z-index:96;pointer-events:none;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const particles = Array.from({ length: 70 }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    const speed = 5 + Math.random() * 9;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.35,
    };
  });

  const start = performance.now();
  const duration = 1500;

  const tick = (now: number) => {
    const t = (now - start) / duration;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (t >= 1) {
      canvas.remove();
      return;
    }
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28; // gravity
      p.vx *= 0.99;
      p.rotation += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
