import { configureStore } from '@reduxjs/toolkit';

import teamsReducer from './slices/teamsSlice';
import walletReducer from './slices/walletSlice';
import premiumReducer from './slices/premiumSlice';
import profileReducer from './slices/profileSlice';
import { authReducer } from './slices/authSlice';
import { adminReducer } from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    teams: teamsReducer,
    wallet: walletReducer,
    premium: premiumReducer,
    profile: profileReducer,
    auth: authReducer,
    admin: adminReducer,

  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

