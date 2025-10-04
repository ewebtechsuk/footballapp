import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Team {
  id: string;
  name: string;
  coach: string;
  record: string;
}

interface TeamsState {
  teams: Team[];
}

const initialState: TeamsState = {
  teams: [
    { id: '1', name: 'Red Warriors', coach: 'Coach Smith', record: '8-2-1' },
    { id: '2', name: 'Blue Strikers', coach: 'Coach Johnson', record: '6-4-1' },
  ],
};

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    addTeam: (state, action: PayloadAction<Team>) => {
      state.teams.push(action.payload);
    },
    removeTeam: (state, action: PayloadAction<string>) => {
      state.teams = state.teams.filter((team) => team.id !== action.payload);
    },
  },
});

export const { addTeam, removeTeam } = teamsSlice.actions;
export default teamsSlice.reducer;
