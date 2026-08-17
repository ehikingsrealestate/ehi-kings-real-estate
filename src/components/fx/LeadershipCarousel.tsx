import { useEffect, useState } from 'react';
import { animated, useSpring, useTransition } from '@react-spring/web';
import { useHover, useInterval } from '@mantine/hooks';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { LEADERSHIP } from '../../data/site';

// Leadership "triangle" carousel: three circular portraits — the focused one
// floats large at the top, the other two float smaller below. Arrows (or
// clicking a portrait, or the 5s auto-rotate) spring the next photo up into
// focus while the rest re-arrange. Positions/sizes are react-spring springs;
// the levitating bob is CSS. Auto-rotate pauses while hovered.

const BIOS: Record<string, string> = {
  'Dr. Kingsley Ehikioya':
    "Leads Ehi-Kings with over two decades in property development, valuation, and construction — driving the company's mission to turn virgin land into modern living communities.",
  'Bethel Ehikioya':
    'Directs strategy and client relationships across the group, keeping every engagement documented, transparent, and accountable.',
  'Jude Obaseki':
    'Coordinates day-to-day operations across sites and estates — from inspection scheduling to allocation and delivery.',
};

// slot 0 = focused (top centre, large); 1 = bottom-left; 2 = bottom-right.
const SLOTS = [
  { left: 50, top: 30, size: 15, z: 30, dim: 1 },
  { left: 20, top: 78, size: 8, z: 20, dim: 0.75 },
  { left: 80, top: 78, size: 8, z: 20, dim: 0.75 },
];

function Portrait({
  leader,
  slot,
  floatDelay,
  onFocus,
}: {
  leader: (typeof LEADERSHIP)[number];
  slot: number;
  floatDelay: number;
  onFocus: () => void;
}) {
  const target = SLOTS[slot];
  const spring = useSpring({
    left: `${target.left}%`,
    top: `${target.top}%`,
    width: `${target.size}rem`,
    opacity: target.dim,
    config: { tension: 230, friction: 26 },
  });

  return (
    <animated.button
      type="button"
      onClick={onFocus}
      style={{ ...spring, zIndex: target.z }}
      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full"
      aria-label={`Show ${leader.name}`}
    >
      <span className="float-bob relative block rounded-full bg-white p-1.5 shadow-[0_26px_70px_rgba(16,62,118,0.22)] ring-1 ring-rule" style={{ animationDelay: `${floatDelay}s` }}>
        {slot === 0 && <span aria-hidden className="focus-pulse absolute -inset-1 rounded-full border-2 border-accent-2/50" />}
        <span className="block aspect-square w-full overflow-hidden rounded-full">
          <img src={leader.photo} alt={leader.name} className="h-full w-full rounded-full object-cover" />
        </span>
      </span>
    </animated.button>
  );
}

export default function LeadershipCarousel() {
  const [focus, setFocus] = useState(0);
  const { hovered, ref } = useHover<HTMLDivElement>();
  const interval = useInterval(() => setFocus((f) => (f + 1) % LEADERSHIP.length), 5000);

  useEffect(() => {
    if (hovered) interval.stop();
    else interval.start();
    return interval.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered]);

  const current = LEADERSHIP[focus];
  const textTransition = useTransition(current, {
    keys: (leader) => leader.name,
    from: { opacity: 0, transform: 'translateY(16px)' },
    enter: { opacity: 1, transform: 'translateY(0px)' },
    leave: { opacity: 0, transform: 'translateY(-10px)', position: 'absolute' as const, inset: '0' },
    config: { tension: 260, friction: 28 },
  });

  return (
    <div ref={ref} className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
      {/* Triangle of floating portraits */}
      <div className="relative mx-auto h-[24rem] w-full max-w-md sm:h-[27rem]">
        {LEADERSHIP.map((leader, index) => (
          <Portrait
            key={leader.name}
            leader={leader}
            slot={(index - focus + LEADERSHIP.length) % LEADERSHIP.length}
            floatDelay={index * 0.9}
            onFocus={() => setFocus(index)}
          />
        ))}
      </div>

      {/* Focused person */}
      <div>
        <div className="relative min-h-[13rem]">
          {textTransition((style, leader) => (
            <animated.div style={style}>
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent-2">{leader.role}</p>
              <h3 className="mt-3 font-heading text-3xl font-light leading-tight text-primary md:text-5xl">
                {leader.name}
              </h3>
              <p className="mt-5 max-w-xl leading-relaxed text-muted">{BIOS[leader.name] ?? leader.role}</p>
            </animated.div>
          ))}
        </div>
        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFocus((f) => (f - 1 + LEADERSHIP.length) % LEADERSHIP.length)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 text-primary transition duration-300 hover:border-primary hover:bg-primary hover:text-white active:scale-95"
            aria-label="Previous team member"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setFocus((f) => (f + 1) % LEADERSHIP.length)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 text-primary transition duration-300 hover:border-primary hover:bg-primary hover:text-white active:scale-95"
            aria-label="Next team member"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <div className="ml-2 flex items-center gap-2">
            {LEADERSHIP.map((leader, index) => (
              <button
                key={leader.name}
                type="button"
                onClick={() => setFocus(index)}
                aria-label={`Show ${leader.name}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${index === focus ? 'w-7 bg-accent' : 'w-3 bg-rule hover:bg-muted'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
