import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '..';

export interface CommunityContribution {
  id: string;
  teamId: string;
  amount: number;
  createdAt: string;
  message?: string;
}

export interface CoOpEvent {
  id: string;
  title: string;
  description: string;
  goal: number;
  progress: number;
  reward: string;
  endsAt: string;
  type: 'goals' | 'cleanSheets' | 'trainingHours';
  participatingTeams: number;
  contributions: CommunityContribution[];
}

export interface CommunitySpotlight {
  id: string;
  teamName: string;
  title: string;
  summary: string;
  publishedAt: string;
}

export interface CommunityState {
  events: CoOpEvent[];
  spotlights: CommunitySpotlight[];
}

const initialState: CommunityState = {
  events: [
    {
      id: 'event-1',
      title: 'Community Goal Rush',
      description: 'Collectively score 250 goals across all live tournaments this week.',
      goal: 250,
      progress: 192,
      reward: 'Neon celebration kit pattern',
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 30).toISOString(),
      type: 'goals',
      participatingTeams: 124,
      contributions: [
        {
          id: 'contribution-1',
          teamId: 'team-1',
          amount: 8,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
          message: 'Clinical finishing drill paid off! ',
        },
      ],
    },
    {
      id: 'event-2',
      title: 'Clean Sheet Collective',
      description: 'Rack up 75 clean sheets to unlock the limited edition goalkeeping gloves.',
      goal: 75,
      progress: 41,
      reward: 'Premium keeper gloves skin',
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
      type: 'cleanSheets',
      participatingTeams: 89,
      contributions: [],
    },
  ],
  spotlights: [
    {
      id: 'spotlight-1',
      teamName: 'Hackney Waves',
      title: 'Derby day masterclass',
      summary: 'A last-minute volley sealed their place in the Match of the Week broadcast.',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    },
    {
      id: 'spotlight-2',
      teamName: 'Midtown Mavericks',
      title: 'Training grind pays off',
      summary: 'Shared their wellness routines that pushed them to the top of community leaderboards.',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    },
  ],
};

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    contributeToEvent: (
      state,
      action: PayloadAction<{ eventId: string; teamId: string; amount: number; message?: string }>,
    ) => {
      const event = state.events.find((item) => item.id === action.payload.eventId);
      if (!event) {
        return;
      }

      event.progress = Math.min(event.goal, event.progress + action.payload.amount);
      event.participatingTeams += event.contributions.some((item) => item.teamId === action.payload.teamId)
        ? 0
        : 1;
      event.contributions.unshift({
        id: nanoid(),
        teamId: action.payload.teamId,
        amount: action.payload.amount,
        message: action.payload.message,
        createdAt: new Date().toISOString(),
      });
    },
  },
});

export const { contributeToEvent } = communitySlice.actions;

export const selectActiveCoOpEvents = (state: RootState): CoOpEvent[] => state.community.events;

export const selectCommunitySpotlights = (state: RootState): CommunitySpotlight[] => state.community.spotlights;

export default communitySlice.reducer;
