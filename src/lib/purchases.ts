import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesError } from 'react-native-purchases';

// RevenueCat public SDK keys (safe to embed in the app).
const REVENUECAT_API_KEY_IOS = 'appl_zKHWOVpsnXtRtFtdqgeekZraUXm';
const REVENUECAT_API_KEY_ANDROID = 'goog_shuQjafgJjxPKeNDCoLeLSAzsRd';

// TODO: must match the Entitlement identifier configured in the RevenueCat dashboard.
export const ENTITLEMENT_ID = 'unlimited';

let configured = false;

export function initPurchases() {
  if (configured) return;
  configured = true;

  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  Purchases.configure({ apiKey });
}

function isEntitled(info: CustomerInfo): boolean {
  return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export async function checkEntitlement(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return isEntitled(info);
  } catch {
    return false;
  }
}

export function subscribeToEntitlementChanges(onChange: (isUnlocked: boolean) => void): () => void {
  const listener = (info: CustomerInfo) => onChange(isEntitled(info));
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}

export type PurchaseResult = { success: boolean; cancelled?: boolean; errorMessage?: string };

export async function purchaseLifetimeUnlock(): Promise<PurchaseResult> {
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages[0];
    if (!pkg) {
      return { success: false, errorMessage: 'The unlock isn’t available right now. Please try again later.' };
    }
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: isEntitled(customerInfo) };
  } catch (e) {
    const error = e as PurchasesError;
    if (error.userCancelled) {
      return { success: false, cancelled: true };
    }
    return { success: false, errorMessage: error.message ?? 'Something went wrong with the purchase.' };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  try {
    const info = await Purchases.restorePurchases();
    return { success: isEntitled(info) };
  } catch (e) {
    const error = e as PurchasesError;
    return { success: false, errorMessage: error.message ?? 'Could not restore purchases.' };
  }
}

export async function getLifetimeUnlockPriceString(): Promise<string | null> {
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages[0];
    return pkg?.product.priceString ?? null;
  } catch {
    return null;
  }
}