import { useEffect, useState } from 'react';
import { animated, useTransition } from '@react-spring/web';
import { useInterval } from '@mantine/hooks';

// Word rotator (react-spring): each word flips up and the next rises in.

interface RotatingTextProps {
  words: string[];
  intervalMs?: number;
  className?: string;
}

export default function RotatingText({ words, intervalMs = 2600, className = '' }: RotatingTextProps) {
  const [index, setIndex] = useState(0);
  const interval = useInterval(() => setIndex((i) => (i + 1) % words.length), intervalMs);

  useEffect(() => {
    interval.start();
    return interval.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const transitions = useTransition(words[index], {
    from: { opacity: 0, transform: 'translateY(105%)' },
    enter: { opacity: 1, transform: 'translateY(0%)' },
    leave: { opacity: 0, transform: 'translateY(-105%)', position: 'absolute' as const },
    config: { tension: 320, friction: 28 },
  });

  return (
    <span className={`relative inline-grid overflow-hidden align-bottom ${className}`}>
      {transitions((style, word) => (
        <animated.span style={style} className="whitespace-nowrap [grid-area:1/1]">
          {word}
        </animated.span>
      ))}
    </span>
  );
}
