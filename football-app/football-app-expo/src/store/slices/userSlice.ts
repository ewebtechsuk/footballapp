import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Core user profile shape tracked in redux. Extend cautiously; keep optional
// fields undefined unless explicitly loaded from Firestore so components can
// detect loading states if needed.
export interface UserState {
  id: string | null;
  name: string | null; // canonical full name
  displayName?: string | null; // short / public name
  bio?: string | null;
  position?: string | null; // playing position
  avatarUrl?: string | null;
  email: string | null;
  teams: string[];
}

const initialState: UserState = {
  id: null,
  name: null,
  email: null,
  teams: [],
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserState>) {
      return { ...state, ...action.payload } as UserState;
    },
    clearUser(state) {
      return initialState;
    },
    updateName(state, action: PayloadAction<string>) {
      state.name = action.payload;
    },
    updateProfile(state, action: PayloadAction<Partial<UserState>>) {
      return { ...state, ...action.payload } as UserState;
    },
    addTeam(state, action: PayloadAction<string>) {
      state.teams.push(action.payload);
    },
    removeTeam(state, action: PayloadAction<string>) {
      state.teams = state.teams.filter(team => team !== action.payload);
    },
  },
});

export const { setUser, clearUser, updateName, updateProfile, addTeam, removeTeam } = userSlice.actions;

export default userSlice.reducer;