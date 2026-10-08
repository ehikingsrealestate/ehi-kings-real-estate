import { lazy, Suspense, useEffect, useState } from 'react';

// Dynamically import Rive so the large WebAssembly runtime is only loaded
// when a real .riv animation is confirmed to exist.
const Rive = lazy(() => import('@rive-app/react-canvas'));

interface RiveSlotProps {
  src: string;
  className?: string;
}

export default function RiveSlot({ src, className = '' }: RiveSlotProps) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(src, { method: 'HEAD' })
      .then((r) => {
        const type = r.headers.get('content-type') ?? '';
        if (active) setAvailable(r.ok && !type.includes('text/html'));
      })
      .catch(() => active && setAvailable(false));
    return () => {
      active = false;
    };
  }, [src]);

  if (!available) return null;
  return (
    <div className={className} aria-hidden>
      <Suspense fallback={null}>
        <Rive src={src} />
      </Suspense>
    </div>
  );
}
