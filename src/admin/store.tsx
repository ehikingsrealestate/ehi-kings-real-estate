import { createContext, useContext, useState, type ReactNode } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Role, Cap } from './ui';

export type Me = {
  id: string;
  email: string;
  name: string;
  role: Role;
  title: string;
  phone?: string;
  createdAt?: number;
  active: boolean;
  caps: Record<Cap, boolean>;
} | null;

type AuthCtx = {
  token: string | null;
  me: Me;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  can: (cap: Cap) => boolean;
};

const Ctx = createContext<AuthCtx | null>(null);
export const useAdmin = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAdmin must be used within AdminProvider');
  return v;
};

function cleanError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  const m = raw.match(/Uncaught Error:\s*(.+?)(?:\n|\s+at\s|$)/);
  return (m ? m[1] : raw).trim() || 'Something went wrong.';
}

// Read the session token synchronously at startup — from the "Sign in with Zoho"
// redirect fragment (#token=…) first, otherwise localStorage. Doing this in the
// state initializer (not an effect) is critical: the route guard runs on the very
// first render, so the token must already be present or the app bounces to /login
// and the fragment is lost.
function initialToken(): string | null {
  if (typeof window !== 'undefined') {
    const m = window.location.hash.match(/token=([^&]+)/);
    if (m) {
      const t = decodeURIComponent(m[1]);
      try { localStorage.setItem('ek_token', t); } catch { /* ignore */ }
      try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch { /* ignore */ }
      return t;
    }
  }
  try { return localStorage.getItem('ek_token'); } catch { return null; }
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(initialToken);

  const signIn = useAction(api.auth.signIn);
  const signOut = useMutation(api.auth.signOut);
  const me = useQuery(api.auth.me, token ? { token } : 'skip');

  const login = async (email: string, password: string) => {
    try {
      const { token: t } = await signIn({ email, password });
      localStorage.setItem('ek_token', t);
      setToken(t);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: cleanError(e) };
    }
  };

  const logout = async () => {
    if (token) { try { await signOut({ token }); } catch { /* ignore */ } }
    localStorage.removeItem('ek_token');
    setToken(null);
  };

  const value: AuthCtx = {
    token,
    me: (me ?? null) as Me,
    loading: token != null && me === undefined,
    login,
    logout,
    can: (cap) => Boolean((me as Me)?.caps?.[cap]),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export { roleBadgeClass, RANK, ROLES, CAPS } from './ui';
export type { Role, Cap } from './ui';
