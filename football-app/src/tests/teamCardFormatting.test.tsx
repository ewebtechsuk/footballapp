import { strict as assert } from 'assert';
import React from 'react';
import TestRenderer from 'react-test-renderer';
import type { Team } from '../store/slices/teamsSlice';
import type { Fixture } from '../store/slices/scheduleSlice';
import type { CommunicationDigestEntry } from '../components/teamCardFormatting';
import TeamCard from '../components/TeamCard';
import { formatCommunicationDigest, formatFixturesForDisplay } from '../components/teamCardFormatting';

const defaultSettings: Team['settings'] = {
  allowJoinRequests: true,
  notifyMembersOfChanges: true,
  shareAvailabilityCalendar: false,
  autoCollectMatchStats: false,
};

const collectTextContent = (node: TestRenderer.ReactTestRendererNode): string[] => {
  if (!node) {
    return [];
  }

  if (typeof node === 'string') {
    return [node];
  }

  if (Array.isArray(node)) {
    return node.flatMap(collectTextContent);
  }

  return collectTextContent(node.children as TestRenderer.ReactTestRendererNode);
};

export const runTeamCardFormattingTests = () => {
  (function formatFixturesUsesKickoffOrFallback() {
    const fixtures: Fixture[] = [
      {
        id: 'fixture-1',
        teamId: 'team-1',
        opponent: 'Rivals FC',
        location: 'Home Ground',
        status: 'scheduled',
        kickoffOptions: [
          { id: 'kickoff-1', isoTime: '2024-05-01T18:00:00.000Z', votes: 5 },
        ],
        acceptedKickoffOptionId: 'kickoff-1',
        calendarSynced: false,
        result: null,
        notes: undefined,
        lastUpdated: '2024-04-01T12:00:00.000Z',
      },
      {
        id: 'fixture-2',
        teamId: 'team-1',
        opponent: 'Unknown XI',
        location: 'Training Pitch',
        status: 'proposed',
        kickoffOptions: [],
        acceptedKickoffOptionId: null,
        calendarSynced: false,
        result: null,
        notes: undefined,
        lastUpdated: '2024-04-01T12:00:00.000Z',
      },
    ];

    const formatted = formatFixturesForDisplay(fixtures);
    assert.equal(formatted.length, 2);
    assert.equal(formatted[0].opponent, 'Rivals FC');
    assert.ok(
      formatted[0].kickoffLabel.includes('Rivals FC') === false,
      'Kickoff label should only contain the formatted time',
    );
    assert.equal(formatted[1].kickoffLabel, 'Kickoff TBC');
  })();

  (function formatCommunicationsHandlesInvalidDates() {
    const communications: CommunicationDigestEntry[] = [
      {
        id: 'comm-1',
        sender: 'Coach',
        message: 'Training moved',
        date: '2024-04-02T18:30:00.000Z',
      },
      {
        id: 'comm-2',
        sender: 'Coach',
        message: 'Bring boots',
        date: 'Invalid date',
      },
    ];

    const formatted = formatCommunicationDigest(communications);
    assert.equal(formatted.length, 2);
    assert.equal(formatted[1].formattedDate, 'Invalid date');
    assert.notEqual(formatted[0].formattedDate, communications[0].date);
  })();

  (function formattingFunctionsArePureForEmptyInput() {
    assert.deepEqual(formatFixturesForDisplay([]), []);
    assert.deepEqual(formatCommunicationDigest([]), []);
  })();

  (function teamCardRendersEmptyStates() {
    const team: Team = { id: 'team-1', name: 'Alpha FC', members: [], settings: defaultSettings };
    let renderer: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <TeamCard
          team={team}
          onRemove={() => {}}
          onManage={() => {}}
          record={{ wins: 0, draws: 0, losses: 0 }}
          nextFixtureLabel={undefined}
          nextFixtures={[]}
          communications={[]}
        />,
      );
    });

    const textContent = collectTextContent(renderer!.toJSON());
    assert.ok(textContent.includes('No upcoming fixtures scheduled.'));
    assert.ok(textContent.includes('No recent messages.'));
  })();

  (function teamCardRendersUpcomingDetails() {
    const team: Team = {
      id: 'team-2',
      name: 'Bravo FC',
      members: [],
      settings: defaultSettings,
    };
    const fixtures: Fixture[] = [
      {
        id: 'fixture-3',
        teamId: 'team-2',
        opponent: 'Derby County',
        location: 'National Stadium',
        status: 'scheduled',
        kickoffOptions: [
          { id: 'opt-1', isoTime: '2024-05-05T19:00:00.000Z', votes: 2 },
        ],
        acceptedKickoffOptionId: 'opt-1',
        calendarSynced: false,
        result: null,
        notes: undefined,
        lastUpdated: '2024-04-01T12:00:00.000Z',
      },
    ];
    const communications: CommunicationDigestEntry[] = [
      {
        id: 'comm-3',
        sender: 'Coach',
        message: 'Travel plans confirmed',
        date: '2024-05-01T09:00:00.000Z',
      },
    ];

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <TeamCard
          team={team}
          onRemove={() => {}}
          onManage={() => {}}
          record={{ wins: 3, draws: 1, losses: 0 }}
          nextFixtureLabel="Derby County • Sun"
          nextFixtures={fixtures}
          communications={communications}
        />,
      );
    });

    const textContent = collectTextContent(renderer!.toJSON());
    assert.ok(textContent.some((value) => typeof value === 'string' && value.includes('Derby County')));
    assert.ok(textContent.includes('National Stadium'));
    assert.ok(textContent.includes('Travel plans confirmed'));
  })();
};
