import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '..';

export type FixtureStatus = 'proposed' | 'scheduled' | 'completed';
export type FixtureResult = 'win' | 'loss' | 'draw';

export interface KickoffOption {
  id: string;
  isoTime: string;
  votes: number;
}

export interface Fixture {
  id: string;
  teamId: string;
  opponent: string;
  location: string;
  status: FixtureStatus;
  kickoffOptions: KickoffOption[];
  acceptedKickoffOptionId: string | null;
  calendarSynced: boolean;
  result: FixtureResult | null;
  notes?: string;
  lastUpdated: string;
}

export interface ScheduleState {
  fixtures: Fixture[];
}

const initialState: ScheduleState = {
  fixtures: [
    {
      id: 'fixture-1',
      teamId: 'team-1',
      opponent: 'East London Rovers',
      location: 'Hackney Marshes Pitch 7',
      status: 'scheduled',
      kickoffOptions: [
        {
          id: 'fixture-1-slot-1',
          isoTime: new Date().toISOString(),
          votes: 5,
        },
        {
          id: 'fixture-1-slot-2',
          isoTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          votes: 3,
        },
      ],
      acceptedKickoffOptionId: 'fixture-1-slot-1',
      calendarSynced: false,
      result: null,
      notes: 'League fixture to decide top seed heading into playoffs.',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'fixture-2',
      teamId: 'team-1',
      opponent: 'Northside United',
      location: 'Riverbank Arena',
      status: 'completed',
      kickoffOptions: [
        {
          id: 'fixture-2-slot-1',
          isoTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          votes: 7,
        },
      ],
      acceptedKickoffOptionId: 'fixture-2-slot-1',
      calendarSynced: true,
      result: 'win',
      notes: 'Comfortable 3-1 victory with a rotated side.',
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
      id: 'fixture-3',
      teamId: 'team-2',
      opponent: 'Southbank Saints',
      location: 'Waterloo Park',
      status: 'proposed',
      kickoffOptions: [
        {
          id: 'fixture-3-slot-1',
          isoTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
          votes: 2,
        },
        {
          id: 'fixture-3-slot-2',
          isoTime: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
          votes: 5,
        },
      ],
      acceptedKickoffOptionId: null,
      calendarSynced: false,
      result: null,
      notes: 'Cup quarter-final proposal awaiting captain confirmation.',
      lastUpdated: new Date().toISOString(),
    },
  ],
};

const findFixture = (state: ScheduleState, fixtureId: string) =>
  state.fixtures.find((fixture) => fixture.id === fixtureId);

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    proposeFixture: (
      state,
      action: PayloadAction<{
        teamId: string;
        opponent: string;
        location: string;
        kickoffOptions: string[];
        notes?: string;
      }>,
    ) => {
      const { teamId, opponent, location, kickoffOptions, notes } = action.payload;
      const now = new Date().toISOString();

      const fixture: Fixture = {
        id: nanoid(),
        teamId,
        opponent,
        location,
        status: 'proposed',
        kickoffOptions: kickoffOptions.map((iso) => ({
          id: nanoid(),
          isoTime: iso,
          votes: 0,
        })),
        acceptedKickoffOptionId: null,
        calendarSynced: false,
        result: null,
        notes,
        lastUpdated: now,
      };

      state.fixtures.unshift(fixture);
    },
    voteOnKickoff: (
      state,
      action: PayloadAction<{ fixtureId: string; optionId: string }>,
    ) => {
      const { fixtureId, optionId } = action.payload;
      const fixture = findFixture(state, fixtureId);

      if (!fixture || fixture.status !== 'proposed') {
        return;
      }

      const option = fixture.kickoffOptions.find((item) => item.id === optionId);
      if (!option) {
        return;
      }

      option.votes += 1;
      fixture.lastUpdated = new Date().toISOString();
    },
    acceptFixtureKickoff: (
      state,
      action: PayloadAction<{ fixtureId: string; optionId: string }>,
    ) => {
      const { fixtureId, optionId } = action.payload;
      const fixture = findFixture(state, fixtureId);

      if (!fixture) {
        return;
      }

      const optionExists = fixture.kickoffOptions.some((option) => option.id === optionId);
      if (!optionExists) {
        return;
      }

      fixture.acceptedKickoffOptionId = optionId;
      fixture.status = 'scheduled';
      fixture.lastUpdated = new Date().toISOString();
    },
    syncFixtureToCalendar: (state, action: PayloadAction<{ fixtureId: string }>) => {
      const fixture = findFixture(state, action.payload.fixtureId);
      if (!fixture) {
        return;
      }

      fixture.calendarSynced = true;
      fixture.lastUpdated = new Date().toISOString();
    },
    recordFixtureResult: (
      state,
      action: PayloadAction<{ fixtureId: string; result: FixtureResult }>,
    ) => {
      const { fixtureId, result } = action.payload;
      const fixture = findFixture(state, fixtureId);

      if (!fixture) {
        return;
      }

      fixture.result = result;
      fixture.status = 'completed';
      fixture.lastUpdated = new Date().toISOString();
    },
  },
});

export const {
  proposeFixture,
  voteOnKickoff,
  acceptFixtureKickoff,
  syncFixtureToCalendar,
  recordFixtureResult,
} = scheduleSlice.actions;

export const selectFixturesByTeam = (state: RootState, teamId: string): Fixture[] =>
  state.schedule.fixtures.filter((fixture) => fixture.teamId === teamId);

export const selectNextFixtureForTeam = (
  state: RootState,
  teamId: string,
): Fixture | undefined => {
  const fixtures = selectFixturesByTeam(state, teamId).filter(
    (fixture) => fixture.status === 'scheduled' || fixture.status === 'proposed',
  );

  return fixtures
    .slice()
    .sort((a, b) => {
      const aDate = getFixtureStartDate(a);
      const bDate = getFixtureStartDate(b);
      if (!aDate && !bDate) {
        return 0;
      }
      if (!aDate) {
        return 1;
      }
      if (!bDate) {
        return -1;
      }
      return aDate.getTime() - bDate.getTime();
    })
    .shift();
};

export const selectTeamRecord = (
  state: RootState,
  teamId: string,
): { wins: number; draws: number; losses: number } => {
  const fixtures = selectFixturesByTeam(state, teamId);
  return fixtures.reduce(
    (record, fixture) => {
      if (fixture.status === 'completed' && fixture.result) {
        if (fixture.result === 'win') {
          record.wins += 1;
        } else if (fixture.result === 'loss') {
          record.losses += 1;
        } else {
          record.draws += 1;
        }
      }

      return record;
    },
    { wins: 0, draws: 0, losses: 0 },
  );
};

export const getFixtureStartDate = (fixture: Fixture): Date | null => {
  if (fixture.status === 'completed') {
    const option = fixture.kickoffOptions.find((item) => item.id === fixture.acceptedKickoffOptionId);
    return option ? new Date(option.isoTime) : null;
  }

  if (fixture.status === 'scheduled' && fixture.acceptedKickoffOptionId) {
    const option = fixture.kickoffOptions.find((item) => item.id === fixture.acceptedKickoffOptionId);
    return option ? new Date(option.isoTime) : null;
  }

  const proposed = fixture.kickoffOptions.slice().sort((a, b) => {
    const aTime = new Date(a.isoTime).getTime();
    const bTime = new Date(b.isoTime).getTime();
    return aTime - bTime;
  });

  return proposed.length > 0 ? new Date(proposed[0].isoTime) : null;
};

export const formatKickoffTime = (isoTime: string): string => {
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) {
    return isoTime;
  }

  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default scheduleSlice.reducer;
