import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Team {
    id: string;
    name: string;
    players: string[];
    tournaments: string[];
}

interface TeamsState {
    teams: Team[];
}

const initialState: TeamsState = {
    teams: [],
};

const teamsSlice = createSlice({
    name: 'teams',
    initialState,
    reducers: {
        addTeam(state, action: PayloadAction<Team>) {
            state.teams.push(action.payload);
        },
        removeTeam(state, action: PayloadAction<string>) {
            state.teams = state.teams.filter(team => team.id !== action.payload);
        },
        updateTeam(state, action: PayloadAction<Team>) {
            const index = state.teams.findIndex(team => team.id === action.payload.id);
            if (index !== -1) {
                state.teams[index] = action.payload;
            }
        },
        clearTeams(state) {
            state.teams = [];
        },
    },
});

export const { addTeam, removeTeam, updateTeam, clearTeams } = teamsSlice.actions;

export default teamsSlice.reducer;