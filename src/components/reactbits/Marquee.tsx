// Infinite scrolling text strip (CSS-driven, pauses on hover).

interface MarqueeProps {
  items: string[];
  className?: string;
  itemClassName?: string;
  speed?: number;
}

export default function Marquee({ items, className = '', itemClassName = '', speed = 28 }: MarqueeProps) {
  return (
    <div className={`overflow-hidden ${className}`} aria-hidden>
      <div className="marquee-track flex w-max items-center gap-10" style={{ animationDuration: `${speed}s` }}>
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center gap-10">
            {items.map((item, index) => (
              <span key={`${half}-${index}`} className={`flex shrink-0 items-center gap-10 ${itemClassName}`}>
                {item}
                <span className="inline-block h-2 w-2 rounded-full bg-accent-2/60" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
