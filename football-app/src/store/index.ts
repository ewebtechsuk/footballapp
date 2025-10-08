import { configureStore } from '@reduxjs/toolkit';

import teamsReducer from './slices/teamsSlice';
import walletReducer from './slices/walletSlice';
import premiumReducer from './slices/premiumSlice';
import profileReducer from './slices/profileSlice';
import scheduleReducer from './slices/scheduleSlice';
import scoutingReducer from './slices/scoutingSlice';
import tournamentsReducer from './slices/tournamentsSlice';
import challengesReducer from './slices/challengesSlice';
import { authReducer } from './slices/authSlice';
import { adminReducer } from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    teams: teamsReducer,
    wallet: walletReducer,
    premium: premiumReducer,
    profile: profileReducer,
    schedule: scheduleReducer,
    scouting: scoutingReducer,
    tournaments: tournamentsReducer,
    challenges: challengesReducer,
    auth: authReducer,
    admin: adminReducer,

  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

