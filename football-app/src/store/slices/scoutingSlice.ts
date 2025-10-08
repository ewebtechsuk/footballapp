import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '..';

export type OpenPositionStatus = 'open' | 'inviting' | 'filled';

export interface OpenPosition {
  id: string;
  teamId: string;
  position: string;
  commitmentLevel: 'casual' | 'competitive';
  description: string;
  status: OpenPositionStatus;
  createdAt: string;
}

export interface FreeAgentProfile {
  id: string;
  name: string;
  primaryPosition: string;
  secondaryPosition?: string;
  location: string;
  strengths: string[];
  socialHandles: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  highlightReelUrl?: string;
  invitedByTeamIds: string[];
}

export interface ScoutingState {
  openPositions: OpenPosition[];
  freeAgents: FreeAgentProfile[];
}

const initialState: ScoutingState = {
  openPositions: [
    {
      id: 'position-1',
      teamId: 'team-1',
      position: 'Ball playing centre-back',
      commitmentLevel: 'competitive',
      description: 'Weekly training on Tuesdays, fixtures on Sundays. Comfortable in a back three.',
      status: 'inviting',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      id: 'position-2',
      teamId: 'team-2',
      position: 'Impact winger',
      commitmentLevel: 'casual',
      description: 'Ideal for a pacey wide player who enjoys 7-a-side weeknights.',
      status: 'open',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    },
  ],
  freeAgents: [
    {
      id: 'free-agent-1',
      name: 'Jordan Mensah',
      primaryPosition: 'Forward',
      secondaryPosition: 'Winger',
      location: 'London, UK',
      strengths: ['Explosive pace', 'Clinical finishing', 'Pressing from the front'],
      socialHandles: {
        instagram: '@jordmensah',
        twitter: '@jordmensah9',
      },
      highlightReelUrl: 'https://highlights.football/jordanmensah',
      invitedByTeamIds: ['team-1'],
    },
    {
      id: 'free-agent-2',
      name: 'Amelia Rossi',
      primaryPosition: 'Goalkeeper',
      location: 'Manchester, UK',
      strengths: ['Penalty specialist', 'Commands the box', 'Distribution under pressure'],
      socialHandles: {
        instagram: '@amelia.rossi',
      },
      invitedByTeamIds: [],
    },
    {
      id: 'free-agent-3',
      name: 'Nina Osei',
      primaryPosition: 'Midfielder',
      secondaryPosition: 'Full-back',
      location: 'Birmingham, UK',
      strengths: ['Two-footed', 'Reads the game', 'Durable'],
      socialHandles: {
        tiktok: '@ninaosei',
      },
      invitedByTeamIds: [],
    },
  ],
};

const scoutingSlice = createSlice({
  name: 'scouting',
  initialState,
  reducers: {
    createOpenPosition: (
      state,
      action: PayloadAction<{
        teamId: string;
        position: string;
        commitmentLevel: 'casual' | 'competitive';
        description: string;
      }>,
    ) => {
      const { teamId, position, commitmentLevel, description } = action.payload;
      state.openPositions.unshift({
        id: nanoid(),
        teamId,
        position,
        commitmentLevel,
        description,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    },
    updateOpenPositionStatus: (
      state,
      action: PayloadAction<{ positionId: string; status: OpenPositionStatus }>,
    ) => {
      const listing = state.openPositions.find((position) => position.id === action.payload.positionId);
      if (!listing) {
        return;
      }

      listing.status = action.payload.status;
    },
    inviteFreeAgent: (
      state,
      action: PayloadAction<{ freeAgentId: string; teamId: string }>,
    ) => {
      const profile = state.freeAgents.find((agent) => agent.id === action.payload.freeAgentId);
      if (!profile) {
        return;
      }

      if (!profile.invitedByTeamIds.includes(action.payload.teamId)) {
        profile.invitedByTeamIds.push(action.payload.teamId);
      }
    },
  },
});

export const { createOpenPosition, updateOpenPositionStatus, inviteFreeAgent } = scoutingSlice.actions;

export const selectOpenPositionsForTeam = (state: RootState, teamId: string): OpenPosition[] =>
  state.scouting.openPositions.filter((position) => position.teamId === teamId);

export const selectFreeAgents = (state: RootState): FreeAgentProfile[] => state.scouting.freeAgents;

export default scoutingSlice.reducer;
