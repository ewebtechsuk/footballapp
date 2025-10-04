import { configureStore } from '@reduxjs/toolkit';

import teamsReducer from './slices/teamsSlice';
import walletReducer from './slices/walletSlice';

export const store = configureStore({
  reducer: {
    teams: teamsReducer,
    wallet: walletReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
