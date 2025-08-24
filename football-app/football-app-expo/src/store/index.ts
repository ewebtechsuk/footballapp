import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import teamsReducer from './slices/teamsSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    teams: teamsReducer,
  },
});

export default store;