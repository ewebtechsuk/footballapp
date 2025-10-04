import { configureStore } from '@reduxjs/toolkit';

import teamsReducer from './slices/teamsSlice';
import walletReducer from './slices/walletSlice';
import premiumReducer from './slices/premiumSlice';

export const store = configureStore({
  reducer: {
    teams: teamsReducer,
    wallet: walletReducer,
    premium: premiumReducer,

  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

