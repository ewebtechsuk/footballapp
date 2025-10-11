import type { Fixture } from '../store/slices/scheduleSlice';
import { formatKickoffTime, getFixtureStartDate } from '../store/slices/scheduleSlice';

export interface CommunicationDigestEntry {
  id: string;
  sender: string;
  message: string;
  date: string;
}

export interface FormattedFixtureSummary {
  id: string;
  opponent: string;
  kickoffLabel: string;
  location: string;
  status: Fixture['status'];
}

export interface FormattedCommunicationEntry extends CommunicationDigestEntry {
  formattedDate: string;
}

export const formatFixturesForDisplay = (nextFixtures: Fixture[]): FormattedFixtureSummary[] =>
  nextFixtures.map((fixture) => {
    const startDate = getFixtureStartDate(fixture);
    const kickoffLabel = startDate ? formatKickoffTime(startDate.toISOString()) : 'Kickoff TBC';

    return {
      id: fixture.id,
      opponent: fixture.opponent,
      kickoffLabel,
      location: fixture.location,
      status: fixture.status,
    };
  });

export const formatCommunicationDigest = (
  communications: CommunicationDigestEntry[],
): FormattedCommunicationEntry[] =>
  communications.map((entry) => {
    const date = new Date(entry.date);
    const formattedDate = Number.isNaN(date.getTime())
      ? entry.date
      : date.toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

    return {
      ...entry,
      formattedDate,
    };
  });
