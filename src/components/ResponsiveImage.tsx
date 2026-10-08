import { useState, useId, type ImgHTMLAttributes } from 'react';

interface ResponsiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> {
  src: string;
  alt: string;
  aspectRatio?: '16/10' | '4/3' | '1/1' | '16/9' | '3/4' | 'auto';
  sizes?: string;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
}

/**
 * Generates responsive srcset for Unsplash images or returns single source
 */
function buildSrcSet(src: string): { src: string; srcSet?: string } {
  if (!src) return { src: '' };
  
  // Unsplash images support dynamic width resizing via `w=...`
  if (src.includes('images.unsplash.com')) {
    const baseUrl = src.replace(/[?&]w=\d+/, '').replace(/[?&]auto=\w+/, '');
    const separator = baseUrl.includes('?') ? '&' : '?';
    const srcSet = [360, 640, 800, 1080, 1400]
      .map((w) => `${baseUrl}${separator}w=${w}&auto=format&fit=crop&q=80 ${w}w`)
      .join(', ');
    const defaultSrc = `${baseUrl}${separator}w=800&auto=format&fit=crop&q=80`;
    return { src: defaultSrc, srcSet };
  }

  return { src };
}

const ASPECT_RATIO_CLASSES: Record<string, string> = {
  '16/10': 'aspect-[16/10]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  '16/9': 'aspect-video',
  '3/4': 'aspect-[3/4]',
  'auto': '',
};

export default function ResponsiveImage({
  src,
  alt,
  aspectRatio = '16/10',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  className = '',
  containerClassName = '',
  ...rest
}: ResponsiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const id = useId();

  const { src: initialSrc, srcSet } = buildSrcSet(src);
  const aspectClass = ASPECT_RATIO_CLASSES[aspectRatio] || '';

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800/40 ${aspectClass} ${containerClassName}`}
    >
      {/* Skeleton Shimmer Placeholder to prevent Cumulative Layout Shift (CLS) */}
      {!loaded && !error && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-200/80 via-slate-100/50 to-slate-200/80 dark:from-slate-800/80 dark:via-slate-700/50 dark:to-slate-800/80"
        />
      )}

      {error ? (
        <div
          aria-label="Image failed to load"
          className="flex h-full w-full items-center justify-center bg-slate-200 text-xs text-slate-400 dark:bg-slate-800 dark:text-slate-500"
        >
          <span>Image preview</span>
        </div>
      ) : (
        <img
          id={id}
          src={initialSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ease-out ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...rest}
        />
      )}
    </div>
  );
}
