import type { EmitterSubscription } from 'react-native';

type Product = {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency?: string;
};

type ProductPurchase = {
  productId: string;
  transactionId: string;
  transactionReceipt: string | null;
};

type PurchaseError = {
  code: string;
  message: string;
};

type PurchaseResult = ProductPurchase;

type Listener<TArgs extends any[]> = (...args: TArgs) => void | Promise<void>;

const createSubscription = <TArgs extends any[]>(
  listener: Listener<TArgs>,
): EmitterSubscription => {
  return {
    remove: () => {
      // no-op stub
    },
  } as EmitterSubscription;
};

export const initConnection = async (): Promise<boolean> => true;
export const flushFailedPurchasesCachedAsPendingAndroid = async (): Promise<void> => {};
export const endConnection = async (): Promise<void> => {};

export const getProducts = async (productIds: string[]): Promise<Product[]> =>
  productIds.map((productId) => ({
    productId,
    title: productId,
    description: '',
    price: '0.00',
  }));

export const requestPurchase = async (productId: string): Promise<PurchaseResult> => ({
  productId,
  transactionId: `stub-${Date.now()}`,
  transactionReceipt: null,
});

export const finishTransaction = async (_purchase: ProductPurchase): Promise<void> => {};

export const getAvailablePurchases = async (): Promise<ProductPurchase[]> => [];

export const purchaseUpdatedListener = (
  listener: Listener<[ProductPurchase]>,
): EmitterSubscription => createSubscription(listener);

export const purchaseErrorListener = (
  listener: Listener<[PurchaseError]>,
): EmitterSubscription => createSubscription(listener);

export type {
  Product,
  ProductPurchase,
  PurchaseError,
  PurchaseResult,
};
