import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AdminSnapshot } from '../types/admin';

const ADMIN_KEY = '@footballapp/adminSnapshot';

export const loadAdminSnapshot = async (): Promise<AdminSnapshot | null> => {
  const raw = await AsyncStorage.getItem(ADMIN_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AdminSnapshot;
  } catch (error) {
    console.warn('Failed to parse admin snapshot', error);
    return null;
  }
};

export const persistAdminSnapshot = async (snapshot: AdminSnapshot): Promise<void> => {
  await AsyncStorage.setItem(ADMIN_KEY, JSON.stringify(snapshot));
};
