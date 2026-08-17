import { useEffect } from 'react';

/**
 * Lightweight, dependency-free SEO head manager for the public SPA.
 *
 * On mount / prop change it sets document.title and upserts the meta tags and
 * canonical link that matter for search + social sharing. Tags are created if
 * missing and updated in place otherwise, so pages can mount and swap without
 * leaving stale duplicates behind. No teardown on unmount — the next page's
 * <Seo> overwrites the same tags.
 */

const SITE_NAME = 'Ehi-Kings Real Estate';
const TITLE_SUFFIX = ` · ${SITE_NAME}`;
const SITE_ORIGIN = 'https://ehikings.vercel.app';
const DEFAULT_IMAGE = '/hero/building-poster.jpg';

type SeoProps = {
  title: string;
  description?: string;
  image?: string;
  /** Path portion of the canonical URL, e.g. "/properties". Defaults to current pathname. */
  path?: string;
};

/** Create the tag if it does not exist yet, keyed by a CSS selector. */
function upsertTag(selector: string, create: () => HTMLElement): HTMLElement {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

function setMetaByName(name: string, content: string) {
  const el = upsertTag(`meta[name="${name}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute('name', name);
    return m;
  });
  el.setAttribute('content', content);
}

function setMetaByProperty(property: string, content: string) {
  const el = upsertTag(`meta[property="${property}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute('property', property);
    return m;
  });
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  const el = upsertTag('link[rel="canonical"]', () => {
    const l = document.createElement('link');
    l.setAttribute('rel', 'canonical');
    return l;
  });
  el.setAttribute('href', href);
}

/** Resolve a possibly-relative asset path to an absolute URL for social cards. */
function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_ORIGIN}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

export default function Seo({ title, description, image, path }: SeoProps) {
  useEffect(() => {
    const fullTitle = title.endsWith(SITE_NAME) ? title : `${title}${TITLE_SUFFIX}`;
    const resolvedPath =
      path ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
    const canonical = absoluteUrl(resolvedPath);
    const ogImage = absoluteUrl(image ?? DEFAULT_IMAGE);

    document.title = fullTitle;

    if (description) setMetaByName('description', description);

    setMetaByProperty('og:title', fullTitle);
    if (description) setMetaByProperty('og:description', description);
    setMetaByProperty('og:image', ogImage);
    setMetaByProperty('og:type', 'website');
    setMetaByProperty('og:url', canonical);
    setMetaByProperty('og:site_name', SITE_NAME);

    setMetaByName('twitter:card', 'summary_large_image');
    setMetaByName('twitter:title', fullTitle);
    if (description) setMetaByName('twitter:description', description);
    setMetaByName('twitter:image', ogImage);

    setCanonical(canonical);
  }, [title, description, image, path]);

  return null;
}
