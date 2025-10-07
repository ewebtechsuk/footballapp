import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ProfileState } from '../store/slices/profileSlice';

const STORAGE_KEY = '@footballapp/profile';

export const loadStoredProfile = async (): Promise<ProfileState | null> => {
  try {
    const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed: ProfileState = JSON.parse(rawValue);
    return parsed;
  } catch (error) {
    console.warn('Unable to load profile from storage', error);
    return null;
  }
};

export const persistProfile = async (profile: ProfileState): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.warn('Unable to persist profile information', error);
  }
};

export const clearStoredProfile = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to remove stored profile information', error);
  }
};
