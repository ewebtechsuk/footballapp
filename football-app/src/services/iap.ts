import { Platform } from 'react-native';
import type { EmitterSubscription } from 'react-native';
import * as RNIap from 'react-native-iap';
import type {
  Product,
  ProductPurchase,
  PurchaseError,
  PurchaseResult,
} from 'react-native-iap';

export const initIapConnection = async (): Promise<boolean> => {
  try {
    const initialized = await RNIap.initConnection();
    if (Platform.OS === 'android') {
      await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
    }
    return initialized;
  } catch (error) {
    console.warn('Failed to initialize IAP connection', error);
    return false;
  }
};

export const endIapConnection = async (): Promise<void> => {
  try {
    await RNIap.endConnection();
  } catch (error) {
    console.warn('Failed to end IAP connection', error);
  }
};

export const fetchProducts = async (productIds: string[]): Promise<Product[]> => {
  if (!productIds.length) {
    return [];
  }

  try {
    const products = await RNIap.getProducts(productIds);
    return products;
  } catch (error) {
    console.warn('Failed to fetch IAP products', error);
    return [];
  }
};

export const requestPremiumPurchase = async (productId: string): Promise<PurchaseResult> => {
  return RNIap.requestPurchase(productId, false);
};

export const finishPremiumPurchase = async (
  purchase: ProductPurchase,
): Promise<void> => {
  try {
    await RNIap.finishTransaction(purchase, false);
  } catch (error) {
    console.warn('Failed to finish premium purchase', error);
  }
};

export const restorePremiumPurchases = async (): Promise<ProductPurchase[]> => {
  try {
    const purchases = await RNIap.getAvailablePurchases();
    return purchases;
  } catch (error) {
    console.warn('Failed to restore premium purchases', error);
    return [];
  }
};

let purchaseUpdateSubscription: EmitterSubscription | null = null;
let purchaseErrorSubscription: EmitterSubscription | null = null;

export const registerPurchaseListener = (
  onPurchase: (purchase: ProductPurchase) => Promise<void> | void,
  onError: (error: PurchaseError) => void,
): (() => void) => {
  purchaseUpdateSubscription?.remove();
  purchaseErrorSubscription?.remove();

  purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(async (purchase) => {
    await onPurchase(purchase);
  });

  purchaseErrorSubscription = RNIap.purchaseErrorListener((error) => {
    onError(error);
  });

  return () => {
    purchaseUpdateSubscription?.remove();
    purchaseErrorSubscription?.remove();
    purchaseUpdateSubscription = null;
    purchaseErrorSubscription = null;
  };
};
