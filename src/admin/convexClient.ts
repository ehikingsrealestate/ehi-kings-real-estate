import { ConvexReactClient } from 'convex/react';

const url = import.meta.env.VITE_CONVEX_URL as string | undefined;

// Null when no backend is configured — the marketing site still builds and runs,
// and the admin shows a "backend not configured" notice instead of crashing.
export const convex = url ? new ConvexReactClient(url) : null;
export const CONVEX_ENABLED = Boolean(url);
