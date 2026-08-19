import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import {
  checkEntitlement,
  initPurchases,
  purchaseLifetimeUnlock,
  PurchaseResult,
  restorePurchases,
  subscribeToEntitlementChanges,
} from '../lib/purchases';

// Set to true to skip the paywall entirely while developing. Only takes effect in a dev client
// (__DEV__ is always false in production/TestFlight/internal-testing builds), so this can be left
// committed without risk. Flip to false when you actually need to test the real purchase/restore
// flow against RevenueCat sandbox.
const DEV_BYPASS_PAYWALL = true;

type PurchasesContextValue = {
  isUnlocked: boolean;
  loading: boolean;
  purchase: () => Promise<PurchaseResult>;
  restore: () => Promise<PurchaseResult>;
};

const PurchasesContext = createContext<PurchasesContextValue | undefined>(undefined);

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const bypass = __DEV__ && DEV_BYPASS_PAYWALL;
  const [isUnlocked, setIsUnlocked] = useState(bypass);
  const [loading, setLoading] = useState(!bypass);

  useEffect(() => {
    if (bypass) return;

    initPurchases();
    checkEntitlement().then((unlocked) => {
      setIsUnlocked(unlocked);
      setLoading(false);
    });

    const unsubscribe = subscribeToEntitlementChanges(setIsUnlocked);
    return unsubscribe;
  }, []);

  const purchase = useCallback(async () => {
    const result = await purchaseLifetimeUnlock();
    if (result.success) setIsUnlocked(true);
    return result;
  }, []);

  const restore = useCallback(async () => {
    const result = await restorePurchases();
    if (result.success) setIsUnlocked(true);
    return result;
  }, []);

  const value: PurchasesContextValue = { isUnlocked, loading, purchase, restore };

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases(): PurchasesContextValue {
  const ctx = useContext(PurchasesContext);
  if (!ctx) {
    throw new Error('usePurchases must be used within a PurchasesProvider');
  }
  return ctx;
}