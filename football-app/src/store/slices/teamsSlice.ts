import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TeamRole = 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward' | 'Substitute';

export type FormationPositionKey =
  | 'GK'
  | 'RB'
  | 'RCB'
  | 'LCB'
  | 'LB'
  | 'CDM'
  | 'RM'
  | 'CM'
  | 'LM'
  | 'RW'
  | 'ST'
  | 'LW';

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  position: FormationPositionKey | null;
  isCaptain: boolean;
}

export interface TeamSettings {
  allowJoinRequests: boolean;
  notifyMembersOfChanges: boolean;
  shareAvailabilityCalendar: boolean;
  autoCollectMatchStats: boolean;
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
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

const ensureTeamMembers = (members?: (string | TeamMember)[]): TeamMember[] => {
  if (!members || members.length === 0) {
    return [];
  }

  const normalisedMembers = members.map((member, index) => {
    if (typeof member === 'string') {
      return {
        id: `${Date.now()}-${index}`,
        name: member,
        role: index === 0 ? 'Goalkeeper' : 'Forward',
        position: null,
        isCaptain: index === 0,
      };
    }

    return {
      id: member.id ?? `${Date.now()}-${index}`,
      name: member.name,
      role: member.role ?? (index === 0 ? 'Goalkeeper' : 'Forward'),
      position: member.position ?? null,
      isCaptain: Boolean(member.isCaptain),
    };
  });

  let captainAssigned = false;
  const withSingleCaptain = normalisedMembers.map((member, index) => {
    if (member.isCaptain && !captainAssigned) {
      captainAssigned = true;
      return member;
    }

    if (member.isCaptain && captainAssigned) {
      return { ...member, isCaptain: false };
    }

    if (!captainAssigned && index === 0) {
      captainAssigned = true;
      return { ...member, isCaptain: true };
    }

    return member;
  });

  return withSingleCaptain;
};

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    addTeam: (state: TeamsState, action: PayloadAction<Team>) => {
      const teamWithDefaults: Team = {
        ...action.payload,
        members: ensureTeamMembers(action.payload.members),
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
        members?: TeamMember[];
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
        teamToUpdate.members = ensureTeamMembers(members);

        const hasCaptain = teamToUpdate.members.some((member) => member.isCaptain);
        if (!hasCaptain && teamToUpdate.members.length > 0) {
          teamToUpdate.members = teamToUpdate.members.map((member, index) => ({
            ...member,
            isCaptain: index === 0,
          }));
        } else if (hasCaptain) {
          let captainAssigned = false;
          teamToUpdate.members = teamToUpdate.members.map((member) => {
            if (member.isCaptain && !captainAssigned) {
              captainAssigned = true;
              return member;
            }

            return {
              ...member,
              isCaptain: captainAssigned ? false : member.isCaptain,
            };
          });
        }
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
