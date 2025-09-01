import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AnyAction } from 'redux';
import store from './index';
import { UserState } from './slices/userSlice';

export type RootState = ReturnType<typeof store.getState> & { user: UserState };
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// User selectors
export const selectUser = (state: RootState) => state.user;
export const selectUserId = (state: RootState) => state.user.id;
export const selectUserDisplayName = (state: RootState) => state.user.displayName || state.user.name;
export const selectUserAvatar = (state: RootState) => state.user.avatarUrl;
