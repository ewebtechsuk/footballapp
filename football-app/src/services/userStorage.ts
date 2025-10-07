import AsyncStorage from '@react-native-async-storage/async-storage';

import type { StoredUserAccount } from '../types/user';

const USERS_KEY = '@footballapp/users';
const CURRENT_USER_KEY = '@footballapp/currentUserId';

export const loadStoredUsers = async (): Promise<StoredUserAccount[] | null> => {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed as StoredUserAccount[];
  } catch (error) {
    console.warn('Failed to parse stored users', error);
    return null;
  }
};

export const persistUsers = async (users: StoredUserAccount[]): Promise<void> => {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const loadStoredCurrentUserId = async (): Promise<string | null> => {
  const raw = await AsyncStorage.getItem(CURRENT_USER_KEY);
  return raw ?? null;
};

export const persistCurrentUserId = async (userId: string | null): Promise<void> => {
  if (userId) {
    await AsyncStorage.setItem(CURRENT_USER_KEY, userId);
  } else {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  }
};
