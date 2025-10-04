import { configureStore } from '@reduxjs/toolkit';
import premiumReducer from './slices/premiumSlice';
import teamsReducer from './slices/teamsSlice';

export const store = configureStore({
  reducer: {
    premium: premiumReducer,
    teams: teamsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
