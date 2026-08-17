import type { ReactNode } from 'react';
import { CustomerContext, useCustomerState } from './useCustomer';

// Owns the single customer session and shares it through context so the Nav,
// Account page, and Dashboard all read/update the same token + profile.
export default function CustomerProvider({ children }: { children: ReactNode }) {
  const value = useCustomerState();
  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}
