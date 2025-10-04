import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Team {
  id: string;
  name: string;
  members: string[];

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
    addTeam: (state: TeamsState, action: PayloadAction<Team>) => {
      state.teams.push(action.payload);
    },
    removeTeam: (state: TeamsState, action: PayloadAction<string>) => {
      state.teams = state.teams.filter((team: Team) => team.id !== action.payload);
    },
  },
});

export const { addTeam, removeTeam } = teamsSlice.actions;

export default teamsSlice.reducer;
