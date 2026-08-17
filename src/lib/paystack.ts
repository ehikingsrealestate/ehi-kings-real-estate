// Paystack inline checkout — loads the official script on demand and opens the
// payment popup. Activates automatically once VITE_PAYSTACK_PUBLIC_KEY is set;
// server-side verification (secret key + webhook) is a follow-up once keys land.

type PaystackHandler = { openIframe: () => void };
type PaystackPop = {
  setup: (opts: {
    key: string;
    email: string;
    amount: number; // kobo
    currency?: string;
    ref?: string;
    metadata?: Record<string, unknown>;
    callback: (response: { reference: string }) => void;
    onClose: () => void;
  }) => PaystackHandler;
};

declare global {
  interface Window { PaystackPop?: PaystackPop }
}

let loading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { loading = null; reject(new Error('Could not load Paystack.')); };
    document.head.appendChild(s);
  });
  return loading;
}

export const PAYSTACK_PUBLIC_KEY = (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined) ?? '';

export async function openPaystack(opts: {
  email: string;
  amountNaira: number;
  metadata?: Record<string, unknown>;
}): Promise<{ reference: string } | null> {
  if (!PAYSTACK_PUBLIC_KEY) throw new Error('Paystack is not configured yet.');
  await loadScript();
  const pop = window.PaystackPop;
  if (!pop) throw new Error('Paystack failed to initialise.');
  return new Promise((resolve) => {
    pop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: opts.email,
      amount: Math.round(opts.amountNaira * 100), // naira → kobo
      currency: 'NGN',
      metadata: opts.metadata,
      callback: (response) => resolve({ reference: response.reference }),
      onClose: () => resolve(null),
    }).openIframe();
  });
}
