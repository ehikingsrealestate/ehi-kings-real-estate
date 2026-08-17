import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { CONVEX_ENABLED } from '../admin/convexClient';
import { DEFAULT_SITE_BLOCKS, type SiteBlock } from './siteBlocks';

export function useSiteBlocks() {
  const remote = CONVEX_ENABLED ? (useQuery(api.site.listBlocks, {}) as SiteBlock[] | undefined) : undefined;

  return useMemo(() => {
    const map = new Map(DEFAULT_SITE_BLOCKS.map((block) => [block.key, block.value]));
    for (const block of remote ?? []) map.set(block.key, block.value);
    return {
      get: (key: string, fallback = '') => map.get(key) ?? fallback,
      hasRemote: Boolean(remote && remote.length),
    };
  }, [remote]);
}
