import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TeamSettings {
  allowJoinRequests: boolean;
  notifyMembersOfChanges: boolean;
  shareAvailabilityCalendar: boolean;
  autoCollectMatchStats: boolean;
}

export interface Team {
  id: string;
  name: string;
  members: string[];
  settings: TeamSettings;
}

export interface TeamsState {
  teams: Team[];
}

export const defaultTeamSettings: TeamSettings = {
  allowJoinRequests: true,
  notifyMembersOfChanges: true,
  shareAvailabilityCalendar: false,
  autoCollectMatchStats: false,
};

const initialState: TeamsState = {
  teams: [],
};

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    addTeam: (state: TeamsState, action: PayloadAction<Team>) => {
      const teamWithDefaults: Team = {
        ...action.payload,
        members: action.payload.members ?? [],
        settings: action.payload.settings ?? { ...defaultTeamSettings },
      };

      state.teams.push(teamWithDefaults);
    },
    removeTeam: (state: TeamsState, action: PayloadAction<string>) => {
      state.teams = state.teams.filter((team: Team) => team.id !== action.payload);
    },
    updateTeam: (
      state: TeamsState,
      action: PayloadAction<{
        id: string;
        name?: string;
        members?: string[];
        settings?: Partial<TeamSettings>;
      }>,
    ) => {
      const { id, name, members, settings } = action.payload;
      const teamToUpdate = state.teams.find((team: Team) => team.id === id);

      if (!teamToUpdate) {
        return;
      }

      if (typeof name === 'string') {
        teamToUpdate.name = name;
      }

      if (members) {
        teamToUpdate.members = members;
      }

      if (settings) {
        teamToUpdate.settings = {
          ...teamToUpdate.settings,
          ...settings,
        };
      }
    },
  },
});

export const { addTeam, removeTeam, updateTeam } = teamsSlice.actions;

export default teamsSlice.reducer;
