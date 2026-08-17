import { useEffect, useState } from 'react';
import Rive from '@rive-app/react-canvas';

// Rive animation slot (rive-app/rive-react). Renders only if the .riv asset
// actually exists, so it can be wired up before the animation file lands —
// drop a file in public/rive/ and it appears.

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
      <Rive src={src} />
    </div>
  );
}
