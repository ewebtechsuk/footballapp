import type { CreditPackage } from '../config/purchases';
import { CREDIT_PACKAGES } from '../config/purchases';
import type { WalletState } from '../store/slices/walletSlice';

const wait = (duration: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, duration);
  });

export interface PurchaseReceipt {
  packageId: string;
  transactionId: string;
  creditsAwarded: number;
  purchasedAt: string;
  restored?: boolean;
}

export const getCreditPackages = async (): Promise<CreditPackage[]> => {
  await wait(150);
  return CREDIT_PACKAGES;
};

export const purchaseCreditPackage = async (
  selectedPackage: CreditPackage,
): Promise<PurchaseReceipt> => {
  await wait(400);

  return {
    packageId: selectedPackage.id,
    transactionId: `${selectedPackage.id}-${Date.now()}`,
    creditsAwarded: selectedPackage.credits,
    purchasedAt: new Date().toISOString(),
  };
};

export const restorePurchaseHistory = async (): Promise<PurchaseReceipt[]> => {
  await wait(250);
  return [];
};

/**
 * Persists wallet data to a remote backend or Firebase instance.
 * Replace the body of this function with a real implementation when
 * backend APIs are available.
 */
export const syncWallet = async (wallet: WalletState): Promise<void> => {
  console.log('Syncing wallet with backend', wallet);
};
