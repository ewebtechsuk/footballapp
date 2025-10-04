import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PremiumEntitlementState } from '../store/slices/premiumSlice';

const STORAGE_KEY = '@footballapp/premium-entitlement';

export const loadPremiumEntitlement = async (): Promise<PremiumEntitlementState | null> => {
  try {
    const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (!storedValue) {
      return null;
    }

    const parsed: PremiumEntitlementState = JSON.parse(storedValue);
    return parsed;
  } catch (error) {
    console.warn('Unable to load premium entitlement from storage', error);
    return null;
  }
};

export const persistPremiumEntitlement = async (
  entitlement: PremiumEntitlementState,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entitlement));
  } catch (error) {
    console.warn('Unable to persist premium entitlement', error);
  }
};

export const clearPremiumEntitlement = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to clear premium entitlement', error);
  }
};
