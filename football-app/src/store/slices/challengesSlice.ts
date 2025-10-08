import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '..';

export type ChallengeStatus = 'available' | 'completed' | 'claimed';

export type ChallengeReward =
  | { type: 'credits'; amount: number }
  | { type: 'badge'; name: string };

export interface Challenge {
  id: string;
  title: string;
  description: string;
  status: ChallengeStatus;
  reward: ChallengeReward;
  expiresAt: string;
}

export interface ChallengesState {
  challenges: Challenge[];
}

const initialState: ChallengesState = {
  challenges: [
    {
      id: 'challenge-1',
      title: 'Precision Passing Drill',
      description: 'Complete 40 successful wall passes in under 5 minutes and upload your clip.',
      status: 'available',
      reward: { type: 'credits', amount: 10 },
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
      id: 'challenge-2',
      title: 'Weekly Fitness Check-in',
      description: 'Log three recovery sessions in your wellness journal.',
      status: 'available',
      reward: { type: 'badge', name: 'Wellness Warrior' },
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    },
    {
      id: 'challenge-3',
      title: 'Set-piece Strategy Review',
      description: 'Upload your planned corner routine and tag two teammates for feedback.',
      status: 'completed',
      reward: { type: 'credits', amount: 20 },
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    },
  ],
};

const challengesSlice = createSlice({
  name: 'challenges',
  initialState,
  reducers: {
    markChallengeCompleted: (state, action: PayloadAction<{ challengeId: string }>) => {
      const challenge = state.challenges.find((item) => item.id === action.payload.challengeId);
      if (!challenge || challenge.status !== 'available') {
        return;
      }

      challenge.status = 'completed';
    },
    claimChallengeReward: (state, action: PayloadAction<{ challengeId: string }>) => {
      const challenge = state.challenges.find((item) => item.id === action.payload.challengeId);
      if (!challenge || challenge.status !== 'completed') {
        return;
      }

      challenge.status = 'claimed';
    },
  },
});

export const { markChallengeCompleted, claimChallengeReward } = challengesSlice.actions;

export const selectActiveChallenges = (state: RootState): Challenge[] => state.challenges.challenges;

export default challengesSlice.reducer;
