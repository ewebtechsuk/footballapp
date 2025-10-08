import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Team } from '../store/slices/teamsSlice';

const STORAGE_KEY = '@footballapp/teams';

export const loadStoredTeams = async (): Promise<Team[] | null> => {
  try {
    const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed: Team[] = JSON.parse(rawValue);
    return parsed;
  } catch (error) {
    console.warn('Unable to load stored teams', error);
    return null;
  }
};

export const persistTeams = async (teams: Team[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
  } catch (error) {
    console.warn('Unable to persist teams', error);
  }
};

export const clearStoredTeams = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to clear stored teams', error);
  }
};
