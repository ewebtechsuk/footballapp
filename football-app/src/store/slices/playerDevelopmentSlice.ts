import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '..';

export interface AttributeProgress {
  attribute: string;
  current: number;
  target: number;
  weeklyGain: number;
}

export interface PlayerDevelopmentProfile {
  playerId: string;
  playerName: string;
  position: string;
  age: number;
  attributes: AttributeProgress[];
  focusArea: string;
  lastUpdated: string;
}

export interface TrainingSession {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  drill: string;
  focus: string;
  durationMinutes: number;
  intensity: 'light' | 'moderate' | 'intense';
  completed: boolean;
  playerIds: string[];
}

export interface WeeklyTrainingPlan {
  id: string;
  teamId: string;
  weekLabel: string;
  sessions: TrainingSession[];
  wellnessNote: string;
  completionRate: number;
}

export interface RecommendedDrill {
  id: string;
  title: string;
  focus: string;
  description: string;
  durationMinutes: number;
  intensity: 'light' | 'moderate' | 'intense';
}

export interface PlayerDevelopmentState {
  plans: WeeklyTrainingPlan[];
  playerProfiles: PlayerDevelopmentProfile[];
  recommendedDrills: RecommendedDrill[];
}

const initialState: PlayerDevelopmentState = {
  plans: [
    {
      id: 'plan-1',
      teamId: 'team-1',
      weekLabel: 'Week of 6 May',
      completionRate: 0.68,
      wellnessNote: 'Focus on recovery micro-cycles after congested fixture list.',
      sessions: [
        {
          id: 'session-1',
          day: 'Mon',
          drill: 'Dynamic warm-up & screening',
          focus: 'Mobility',
          durationMinutes: 45,
          intensity: 'light',
          completed: true,
          playerIds: ['player-1', 'player-2', 'player-3'],
        },
        {
          id: 'session-2',
          day: 'Tue',
          drill: 'Small-sided overloads',
          focus: 'Decision making',
          durationMinutes: 70,
          intensity: 'intense',
          completed: true,
          playerIds: ['player-1', 'player-2', 'player-3'],
        },
        {
          id: 'session-3',
          day: 'Thu',
          drill: 'Finishing carousel',
          focus: 'Attacking patterns',
          durationMinutes: 60,
          intensity: 'moderate',
          completed: false,
          playerIds: ['player-4', 'player-5'],
        },
        {
          id: 'session-4',
          day: 'Sat',
          drill: 'Match prep walkthrough',
          focus: 'Set-pieces',
          durationMinutes: 40,
          intensity: 'light',
          completed: false,
          playerIds: ['player-1', 'player-6', 'player-7'],
        },
      ],
    },
  ],
  playerProfiles: [
    {
      playerId: 'player-1',
      playerName: 'Alex Iwata',
      position: 'Forward',
      age: 23,
      focusArea: 'Explosive first step',
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      attributes: [
        { attribute: 'Pace', current: 82, target: 87, weeklyGain: 0.8 },
        { attribute: 'Finishing', current: 84, target: 90, weeklyGain: 0.6 },
        { attribute: 'Pressing IQ', current: 76, target: 82, weeklyGain: 0.4 },
      ],
    },
    {
      playerId: 'player-2',
      playerName: 'Nina Osei',
      position: 'Midfielder',
      age: 25,
      focusArea: 'Switch of play accuracy',
      lastUpdated: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      attributes: [
        { attribute: 'Passing', current: 79, target: 85, weeklyGain: 0.7 },
        { attribute: 'Stamina', current: 88, target: 90, weeklyGain: 0.5 },
        { attribute: 'Tackling', current: 74, target: 80, weeklyGain: 0.5 },
      ],
    },
  ],
  recommendedDrills: [
    {
      id: 'drill-1',
      title: 'Reactive sprint ladders',
      focus: 'Acceleration',
      description: 'Three ladders with variable commands to sharpen first step and brain-body connection.',
      durationMinutes: 25,
      intensity: 'moderate',
    },
    {
      id: 'drill-2',
      title: 'Rondo with triggers',
      focus: 'Pressing IQ',
      description: '5v2 rondo adding colour triggers that force immediate transitions.',
      durationMinutes: 18,
      intensity: 'intense',
    },
    {
      id: 'drill-3',
      title: 'Video feedback huddle',
      focus: 'Decision making',
      description: 'Short film room review layering analytics overlays onto key possessions.',
      durationMinutes: 30,
      intensity: 'light',
    },
  ],
};

const playerDevelopmentSlice = createSlice({
  name: 'playerDevelopment',
  initialState,
  reducers: {
    markSessionCompleted: (
      state,
      action: PayloadAction<{ planId: string; sessionId: string; completed: boolean }>,
    ) => {
      const plan = state.plans.find((item) => item.id === action.payload.planId);
      if (!plan) {
        return;
      }

      const session = plan.sessions.find((item) => item.id === action.payload.sessionId);
      if (!session) {
        return;
      }

      session.completed = action.payload.completed;
      const completedSessions = plan.sessions.filter((item) => item.completed).length;
      plan.completionRate = plan.sessions.length > 0 ? completedSessions / plan.sessions.length : 0;
    },
    recordAttributeGain: (
      state,
      action: PayloadAction<{ playerId: string; attribute: string; delta: number }>,
    ) => {
      const profile = state.playerProfiles.find((item) => item.playerId === action.payload.playerId);
      if (!profile) {
        return;
      }

      const attribute = profile.attributes.find((item) => item.attribute === action.payload.attribute);
      if (!attribute) {
        profile.attributes.push({
          attribute: action.payload.attribute,
          current: action.payload.delta,
          target: action.payload.delta + 5,
          weeklyGain: action.payload.delta * 0.1,
        });
        return;
      }

      attribute.current = Math.min(attribute.target, attribute.current + action.payload.delta);
      profile.lastUpdated = new Date().toISOString();
    },
    addCustomDrill: (
      state,
      action: PayloadAction<{ title: string; focus: string; durationMinutes: number; intensity: TrainingSession['intensity']; description: string }>,
    ) => {
      state.recommendedDrills.unshift({
        id: nanoid(),
        title: action.payload.title,
        focus: action.payload.focus,
        description: action.payload.description,
        durationMinutes: action.payload.durationMinutes,
        intensity: action.payload.intensity,
      });
    },
  },
});

export const { markSessionCompleted, recordAttributeGain, addCustomDrill } = playerDevelopmentSlice.actions;

export const selectTrainingPlanForTeam = (
  state: RootState,
  teamId: string | undefined,
): WeeklyTrainingPlan | undefined => state.playerDevelopment.plans.find((plan) => plan.teamId === teamId);

export const selectPlayerDevelopmentProfiles = (state: RootState): PlayerDevelopmentProfile[] =>
  state.playerDevelopment.playerProfiles;

export const selectRecommendedDrills = (state: RootState): RecommendedDrill[] =>
  state.playerDevelopment.recommendedDrills;

export default playerDevelopmentSlice.reducer;
