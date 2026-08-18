import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import {
    checkEntitlement,
    initPurchases,
    purchaseLifetimeUnlock,
    PurchaseResult,
    restorePurchases,
    subscribeToEntitlementChanges,
} from '../lib/purchases';

type PurchasesContextValue = {
  isUnlocked: boolean;
  loading: boolean;
  purchase: () => Promise<PurchaseResult>;
  restore: () => Promise<PurchaseResult>;
};

const PurchasesContext = createContext<PurchasesContextValue | undefined>(undefined);

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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