import { configureStore } from '@reduxjs/toolkit';

import teamsReducer, { TeamsState } from './slices/teamsSlice';
import walletReducer, { WalletState } from './slices/walletSlice';

export const store = configureStore({
  reducer: {
    teams: teamsReducer,
    wallet: walletReducer,
  },
});

export interface RootState {
  teams: TeamsState;
  wallet: WalletState;
}
export type AppDispatch = typeof store.dispatch;
