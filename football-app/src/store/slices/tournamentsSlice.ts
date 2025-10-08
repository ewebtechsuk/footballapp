import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '..';

export interface LadderTier {
  id: string;
  name: string;
  description: string;
  requiredCredits: number;
  promotionSlots: number;
  relegationSlots: number;
  analyticsHighlights: string[];
}

export interface LadderStanding {
  tierId: string;
  position: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  points: number;
  trend: 'up' | 'steady' | 'down';
}

export interface TournamentSeasonState {
  seasonLabel: string;
  ladderTiers: LadderTier[];
  currentStanding: LadderStanding | null;
  enrolledTierId: string | null;
  recentInsights: string[];
}

const initialState: TournamentSeasonState = {
  seasonLabel: 'Spring 2024 Ladder',
  ladderTiers: [
    {
      id: 'tier-elite',
      name: 'Elite Championship',
      description: 'Top tier clubs battling for continental qualification and cash prizes.',
      requiredCredits: 150,
      promotionSlots: 0,
      relegationSlots: 3,
      analyticsHighlights: [
        'Opponents average 2.1 goals scored per match',
        'High pressing teams concede 23% fewer shots on target',
      ],
    },
    {
      id: 'tier-competitive',
      name: 'Competitive Division',
      description: 'Ambitious squads pushing for promotion into the elite championship.',
      requiredCredits: 90,
      promotionSlots: 3,
      relegationSlots: 3,
      analyticsHighlights: [
        'Wing play accounts for 41% of assists in this tier',
        'Teams with 60%+ availability win 70% of fixtures',
      ],
    },
    {
      id: 'tier-community',
      name: 'Community League',
      description: 'Friendly fixtures with flexible scheduling and live match support.',
      requiredCredits: 40,
      promotionSlots: 4,
      relegationSlots: 0,
      analyticsHighlights: [
        'Average kickoff time: Saturday 1:30pm',
        'Teams with consistent weekly attendance gain +8 goal difference',
      ],
    },
  ],
  currentStanding: {
    tierId: 'tier-competitive',
    position: 3,
    matchesPlayed: 8,
    wins: 5,
    draws: 2,
    losses: 1,
    goalDifference: 9,
    points: 17,
    trend: 'up',
  },
  enrolledTierId: 'tier-competitive',
  recentInsights: [
    'Opposition scouts flagged your transition defence as an opportunity. Consider reinforcing midfield cover.',
    'Premium telemetry shows your forwards outperforming the league xG by 12%.',
  ],
};

const tournamentsSlice = createSlice({
  name: 'tournaments',
  initialState,
  reducers: {
    enrolInTier: (state, action: PayloadAction<{ tierId: string }>) => {
      const tier = state.ladderTiers.find((item) => item.id === action.payload.tierId);
      if (!tier) {
        return;
      }

      state.enrolledTierId = tier.id;
      state.currentStanding = {
        tierId: tier.id,
        position: tier.id === 'tier-elite' ? 8 : 12,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalDifference: 0,
        points: 0,
        trend: 'steady',
      };
      state.recentInsights.unshift(
        `Joined ${tier.name}. Live analytics will activate after your first two fixtures.`,
      );
    },
    updateStanding: (state, action: PayloadAction<LadderStanding>) => {
      state.currentStanding = action.payload;
    },
    addInsight: (state, action: PayloadAction<string>) => {
      state.recentInsights.unshift(action.payload);
    },
  },
});

export const { enrolInTier, updateStanding, addInsight } = tournamentsSlice.actions;

export const selectTournamentSeason = (state: RootState): TournamentSeasonState => state.tournaments;

export const selectTierById = (state: RootState, tierId: string): LadderTier | undefined =>
  state.tournaments.ladderTiers.find((tier) => tier.id === tierId);

export default tournamentsSlice.reducer;
