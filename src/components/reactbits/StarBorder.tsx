import { createElement, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react';

// Adapted from react-bits StarBorder — a comet of light orbits the button's
// border. Inner surface restyled to the brand.

type StarBorderProps<T extends ElementType> = ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  innerClassName?: string;
  children?: ReactNode;
  color?: string;
  speed?: string;
};

export default function StarBorder<T extends ElementType = 'button'>({
  as,
  className = '',
  innerClassName = '',
  color = '#7cc0ff',
  speed = '5s',
  children,
  ...rest
}: StarBorderProps<T>) {
  const Component = (as || 'button') as ElementType;
  return createElement(
    Component,
    { className: `relative inline-block overflow-hidden rounded-full p-px ${className}`, ...rest },
    <>
      <div
        className="star-border-glow star-border-glow-bottom"
        style={{ background: `radial-gradient(circle, ${color}, transparent 12%)`, animationDuration: speed }}
      />
      <div
        className="star-border-glow star-border-glow-top"
        style={{ background: `radial-gradient(circle, ${color}, transparent 12%)`, animationDuration: speed }}
      />
      <div
        className={`relative z-[1] inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-white ${innerClassName}`}
      >
        {children}
      </div>
    </>
  );
}
