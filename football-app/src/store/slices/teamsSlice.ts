import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Team {
  id: string;
  name: string;
  coach?: string;
  city?: string;
  founded?: number;
  players?: string[];
}

export interface TeamsState {
  teams: Team[];
}

const initialState: TeamsState = {
  teams: [],
};

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    removeTeam: (state, action: PayloadAction<string>) => {
      state.teams = state.teams.filter((team) => team.id !== action.payload);
    },
  },
});

export const { removeTeam } = teamsSlice.actions;

export default teamsSlice.reducer;
