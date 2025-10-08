import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '..';

type TeamSide = 'home' | 'away';

type MatchEventType =
  | 'countdown'
  | 'kickoff'
  | 'chance'
  | 'goal'
  | 'booking'
  | 'substitution'
  | 'half-time'
  | 'full-time';

export interface MatchEvent {
  id: string;
  minute: number;
  type: MatchEventType;
  description: string;
  team?: TeamSide;
  momentumDelta?: number;
  statChanges?: Partial<Record<'shots' | 'shotsOnTarget' | 'expectedGoals' | 'tacklesWon' | 'passesCompleted', number>>;
  possessionTilt?: number;
}

interface StatBundle {
  home: number;
  away: number;
}

export interface MatchStats {
  shots: StatBundle;
  shotsOnTarget: StatBundle;
  expectedGoals: StatBundle;
  tacklesWon: StatBundle;
  passesCompleted: StatBundle;
  possession: StatBundle;
}

export interface MomentumPoint {
  minute: number;
  home: number;
  away: number;
}

export interface LiveMatch {
  id: string;
  tournament: string;
  venue: string;
  kickoffIso: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  status: 'countdown' | 'live' | 'finished';
  commentary: MatchEvent[];
  remainingEvents: MatchEvent[];
  momentumHistory: MomentumPoint[];
  stats: MatchStats;
}

interface MatchCenterState {
  currentMatch: LiveMatch | null;
}

const createInitialMatch = (): LiveMatch => ({
  id: 'live-match-1',
  tournament: 'Elite Championship Semi-final',
  venue: 'Lions Arena',
  kickoffIso: new Date().toISOString(),
  homeTeam: 'Metro FC',
  awayTeam: 'Kingston Strikers',
  homeScore: 1,
  awayScore: 0,
  minute: 42,
  status: 'live',
  commentary: [
    {
      id: 'event-preload-1',
      minute: 38,
      type: 'chance',
      description: 'Metro FC probe down the left before curling a shot just past the far post.',
      team: 'home',
      momentumDelta: 6,
      statChanges: { shots: 1, expectedGoals: 0.12 },
    },
    {
      id: 'event-preload-2',
      minute: 33,
      type: 'goal',
      description: 'GOAL! Kingston Strikers keeper parries a cross but Alex Iwata slams home the rebound.',
      team: 'home',
      momentumDelta: 12,
      statChanges: { shots: 1, shotsOnTarget: 1, expectedGoals: 0.45 },
    },
  ],
  remainingEvents: [
    {
      id: 'event-3',
      minute: 45,
      type: 'half-time',
      description: 'The referee signals for half-time after two minutes of added time.',
    },
    {
      id: 'event-4',
      minute: 52,
      type: 'chance',
      description: 'Kingston Strikers counter quickly forcing a fingertip save from the Metro FC keeper.',
      team: 'away',
      momentumDelta: -8,
      statChanges: { shots: 1, shotsOnTarget: 1, expectedGoals: 0.27 },
      possessionTilt: -3,
    },
    {
      id: 'event-5',
      minute: 60,
      type: 'booking',
      description: 'Yellow card for Metro FC captain Jordan Leigh after halting a dangerous break.',
      team: 'home',
      momentumDelta: -2,
    },
    {
      id: 'event-6',
      minute: 67,
      type: 'goal',
      description: 'Equaliser! Kingston Strikers level it up through a thumping header from Maya Trent.',
      team: 'away',
      momentumDelta: -10,
      statChanges: { shots: 1, shotsOnTarget: 1, expectedGoals: 0.42 },
      possessionTilt: -4,
    },
    {
      id: 'event-7',
      minute: 74,
      type: 'substitution',
      description: 'Metro FC bring on youngster Tyrese Cole to freshen up the forward line.',
      team: 'home',
      momentumDelta: 4,
    },
    {
      id: 'event-8',
      minute: 81,
      type: 'chance',
      description: 'Cole rattles the bar with a curling effort as Metro FC crank up the pressure.',
      team: 'home',
      momentumDelta: 9,
      statChanges: { shots: 1, expectedGoals: 0.21 },
      possessionTilt: 3,
    },
    {
      id: 'event-9',
      minute: 88,
      type: 'goal',
      description: 'Scenes! Tyrese Cole reacts first to a loose ball to restore the Metro FC lead.',
      team: 'home',
      momentumDelta: 14,
      statChanges: { shots: 1, shotsOnTarget: 1, expectedGoals: 0.36 },
      possessionTilt: 4,
    },
    {
      id: 'event-10',
      minute: 94,
      type: 'full-time',
      description: 'Full-time! Metro FC march on to the final after a pulsating finish.',
    },
  ],
  momentumHistory: [
    { minute: 0, home: 50, away: 50 },
    { minute: 15, home: 56, away: 44 },
    { minute: 30, home: 61, away: 39 },
    { minute: 40, home: 68, away: 32 },
  ],
  stats: {
    shots: { home: 6, away: 4 },
    shotsOnTarget: { home: 4, away: 2 },
    expectedGoals: { home: 1.23, away: 0.79 },
    tacklesWon: { home: 9, away: 11 },
    passesCompleted: { home: 248, away: 232 },
    possession: { home: 55, away: 45 },
  },
});

const initialState: MatchCenterState = {
  currentMatch: createInitialMatch(),
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const updateStatBundle = (bundle: StatBundle, team: TeamSide, delta: number) => {
  if (delta === 0) {
    return;
  }

  if (team === 'home') {
    bundle.home = Math.max(0, bundle.home + delta);
  } else {
    bundle.away = Math.max(0, bundle.away + delta);
  }
};

const matchCenterSlice = createSlice({
  name: 'matchCenter',
  initialState,
  reducers: {
    advanceMatchState: (state) => {
      const match = state.currentMatch;
      if (!match || match.remainingEvents.length === 0) {
        return;
      }

      const event = match.remainingEvents.shift()!;
      match.commentary = [event, ...match.commentary].slice(0, 12);
      match.minute = Math.max(match.minute, event.minute);

      if (event.type === 'kickoff') {
        match.status = 'live';
      }

      if (event.type === 'goal' && event.team) {
        if (event.team === 'home') {
          match.homeScore += 1;
        } else {
          match.awayScore += 1;
        }
      }

      if (event.team && event.statChanges) {
        (Object.entries(event.statChanges) as [
          keyof NonNullable<typeof event.statChanges>,
          number,
        ][]).forEach(([key, delta]) => {
          if (delta === undefined) {
            return;
          }

          switch (key) {
            case 'shots':
              updateStatBundle(match.stats.shots, event.team!, delta);
              break;
            case 'shotsOnTarget':
              updateStatBundle(match.stats.shotsOnTarget, event.team!, delta);
              break;
            case 'expectedGoals':
              updateStatBundle(match.stats.expectedGoals, event.team!, delta);
              break;
            case 'tacklesWon':
              updateStatBundle(match.stats.tacklesWon, event.team!, delta);
              break;
            case 'passesCompleted':
              updateStatBundle(match.stats.passesCompleted, event.team!, delta);
              break;
            default:
              break;
          }
        });
      }

      if (typeof event.possessionTilt === 'number' && event.team) {
        const tilt = clamp(event.possessionTilt, -8, 8);
        if (event.team === 'home') {
          match.stats.possession.home = clamp(match.stats.possession.home + tilt, 40, 65);
          match.stats.possession.away = 100 - match.stats.possession.home;
        } else {
          match.stats.possession.away = clamp(match.stats.possession.away + tilt, 40, 65);
          match.stats.possession.home = 100 - match.stats.possession.away;
        }
      }

      const previousMomentum = match.momentumHistory[match.momentumHistory.length - 1] ?? {
        minute: 0,
        home: 50,
        away: 50,
      };

      const delta = clamp(event.momentumDelta ?? 0, -20, 20);
      const nextMomentum: MomentumPoint = {
        minute: event.minute,
        home: clamp(previousMomentum.home + delta, 20, 80),
        away: clamp(previousMomentum.away - delta, 20, 80),
      };

      match.momentumHistory = [...match.momentumHistory, nextMomentum].slice(-12);

      if (event.type === 'full-time') {
        match.status = 'finished';
      }
    },
    resetMatchState: (state) => {
      state.currentMatch = createInitialMatch();
    },
    injectCustomEvent: (state, action: PayloadAction<MatchEvent>) => {
      const match = state.currentMatch;
      if (!match) {
        return;
      }

      match.remainingEvents.push(action.payload);
      match.remainingEvents.sort((a, b) => a.minute - b.minute);
    },
  },
});

export const { advanceMatchState, resetMatchState, injectCustomEvent } = matchCenterSlice.actions;

export const selectLiveMatch = (state: RootState): LiveMatch | null => state.matchCenter.currentMatch;

export const selectLiveMatchKeyStats = (state: RootState): { label: string; home: string; away: string }[] => {
  const match = state.matchCenter.currentMatch;
  if (!match) {
    return [];
  }

  return [
    { label: 'Shots', home: `${match.stats.shots.home}`, away: `${match.stats.shots.away}` },
    {
      label: 'On Target',
      home: `${match.stats.shotsOnTarget.home}`,
      away: `${match.stats.shotsOnTarget.away}`,
    },
    {
      label: 'Expected Goals',
      home: match.stats.expectedGoals.home.toFixed(2),
      away: match.stats.expectedGoals.away.toFixed(2),
    },
    {
      label: 'Passes Completed',
      home: `${match.stats.passesCompleted.home}`,
      away: `${match.stats.passesCompleted.away}`,
    },
    {
      label: 'Possession %',
      home: `${match.stats.possession.home}`,
      away: `${match.stats.possession.away}`,
    },
  ];
};

export const selectMomentumSummary = (state: RootState): MomentumPoint[] =>
  state.matchCenter.currentMatch?.momentumHistory ?? [];

export default matchCenterSlice.reducer;
