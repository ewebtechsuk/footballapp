import { strict as assert } from 'assert';
import type { Team } from '../store/slices/teamsSlice';
import type { TeamCommunication } from '../store/slices/communicationsSlice';
import type { Fixture } from '../store/slices/scheduleSlice';
import {
  buildCommunicationDigest,
  buildScheduleSummary,
  buildTeamCardsData,
} from '../screens/teamScreenData';

const createTeam = (id: string, name: string): Team => ({
  id,
  name,
  members: [],
  settings: {
    allowJoinRequests: true,
    notifyMembersOfChanges: true,
    shareAvailabilityCalendar: false,
    autoCollectMatchStats: false,
  },
});

interface MockState {
  teams: { teams: Team[] };
  communications: { communications: TeamCommunication[] };
  schedule: { fixtures: Fixture[] };
  [key: string]: unknown;
}

const createState = (teams: Team[], fixtures: Fixture[], communications: TeamCommunication[]): MockState => ({
  teams: { teams },
  communications: { communications },
  schedule: { fixtures },
});

export const runTeamScreenDataTests = () => {
  (function buildScheduleSummaryOrdersFixtures() {
    const teams = [createTeam('team-1', 'Alpha FC')];
    const fixtures: Fixture[] = [
      {
        id: 'fixture-1',
        teamId: 'team-1',
        opponent: 'Beta FC',
        location: 'City Stadium',
        status: 'scheduled',
        kickoffOptions: [
          { id: 'option-1', isoTime: '2024-05-03T10:00:00.000Z', votes: 5 },
          { id: 'option-2', isoTime: '2024-05-02T10:00:00.000Z', votes: 3 },
        ],
        acceptedKickoffOptionId: null,
        calendarSynced: false,
        result: null,
        notes: undefined,
        lastUpdated: '2024-04-01T12:00:00.000Z',
      },
      {
        id: 'fixture-2',
        teamId: 'team-1',
        opponent: 'Gamma FC',
        location: 'Away Ground',
        status: 'completed',
        kickoffOptions: [
          { id: 'option-3', isoTime: '2024-04-01T10:00:00.000Z', votes: 5 },
        ],
        acceptedKickoffOptionId: 'option-3',
        calendarSynced: false,
        result: 'win',
        notes: undefined,
        lastUpdated: '2024-04-01T12:00:00.000Z',
      },
    ];
    const state = createState(teams, fixtures, []);

    const summary = buildScheduleSummary(state as any, teams);
    assert.equal(summary['team-1'].nextFixtures.length, 1);
    assert.equal(summary['team-1'].nextFixtures[0].id, 'fixture-1');
    assert.ok(summary['team-1'].nextFixtureLabel?.includes('Beta FC'));
    assert.deepEqual(summary['team-1'].record, { wins: 1, draws: 0, losses: 0 });
  })();

  (function buildCommunicationDigestReturnsLatestEntries() {
    const teams = [createTeam('team-1', 'Alpha FC')];
    const communications: TeamCommunication[] = [
      {
        id: 'comm-1',
        teamId: 'team-1',
        title: 'Match recap',
        body: 'Great game!',
        status: 'sent',
        createdAt: '2024-04-02T10:00:00.000Z',
        scheduledFor: null,
      },
      {
        id: 'comm-2',
        teamId: 'team-1',
        title: 'Training reminder',
        body: 'See you tomorrow',
        status: 'scheduled',
        createdAt: '2024-04-01T10:00:00.000Z',
        scheduledFor: '2024-04-03T10:00:00.000Z',
      },
    ];
    const state = createState(teams, [], communications);

    const digest = buildCommunicationDigest(state as any, teams);
    assert.equal(digest['team-1'].length, 2);
    assert.equal(digest['team-1'][0].id, 'comm-1');
    assert.equal(digest['team-1'][1].date, '2024-04-03T10:00:00.000Z');
  })();

  (function buildTeamCardsDataMergesSummaries() {
    const teams = [createTeam('team-1', 'Alpha FC'), createTeam('team-2', 'Bravo FC')];
    const scheduleSummary = {
      'team-1': {
        record: { wins: 1, draws: 0, losses: 0 },
        nextFixtureLabel: 'Next opponent',
        nextFixtures: [],
      },
    };
    const communicationDigest = {
      'team-2': [
        { id: 'comm', sender: 'Coach', message: 'Hi', date: '2024-04-01T00:00:00.000Z' },
      ],
    };

    const cards = buildTeamCardsData(teams, scheduleSummary as any, communicationDigest as any);
    assert.equal(cards.length, 2);
    assert.equal(cards[0].record?.wins, 1);
    assert.equal(cards[1].communications.length, 1);
    assert.deepEqual(cards[0].communications, []);
  })();
};
