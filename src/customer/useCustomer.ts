import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const TOKEN_KEY = 'ek_customer_token';

// The signed-in customer, as returned by api.customer.me.
export type CustomerMe = {
  id: string;
  email: string;
  name: string;
  phone?: string;
} | null;

export type CustomerContextValue = {
  token: string | null;
  me: CustomerMe;
  /** True until api.customer.me has resolved for the current token. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (input: {
    email: string;
    name: string;
    phone?: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// Convex wraps thrown errors — surface just the human message.
function cleanError(e: unknown, fallback: string): string {
  const raw = e instanceof Error ? e.message : String(e);
  const match = raw.match(/Uncaught Error:\s*(.+?)(?:\s+at\s|$)/);
  return (match ? match[1] : raw).trim() || fallback;
}

// Backing hook. CustomerProvider owns the single instance; components consume
// it via useCustomer() so token state stays shared across the app.
export function useCustomerState(): CustomerContextValue {
  const [token, setToken] = useState<string | null>(() => readToken());

  const signInAction = useAction(api.customer.signIn);
  const signUpAction = useAction(api.customer.signUp);
  const signOutMutation = useMutation(api.customer.signOut);

  const me = useQuery(api.customer.me, token ? { token } : 'skip');
  // Loading only while we have a token but the profile hasn't resolved yet.
  const loading = token != null && me === undefined;

  const store = useCallback((next: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, next);
    } catch {
      /* ignore storage failures (private mode) */
    }
    setToken(next);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await signInAction({ email, password });
        store(res.token);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: cleanError(e, 'Could not sign in.') };
      }
    },
    [signInAction, store],
  );

  const signUp = useCallback(
    async (input: { email: string; name: string; phone?: string; password: string }) => {
      try {
        const res = await signUpAction(input);
        store(res.token);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: cleanError(e, 'Could not create your account.') };
      }
    },
    [signUpAction, store],
  );

  const signOut = useCallback(async () => {
    const current = token;
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setToken(null);
    if (current) {
      try {
        await signOutMutation({ token: current });
      } catch {
        /* session already gone — local clear is enough */
      }
    }
  }, [token, signOutMutation]);

  return useMemo(
    () => ({
      token,
      me: (me ?? null) as CustomerMe,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [token, me, loading, signIn, signUp, signOut],
  );
}

export const CustomerContext = createContext<CustomerContextValue | null>(null);

// Consume the shared customer session. Falls back to a standalone instance if
// no provider is mounted, so the hook is always safe to call.
export function useCustomer(): CustomerContextValue {
  const ctx = useContext(CustomerContext);
  const fallback = useCustomerState();
  return ctx ?? fallback;
}
