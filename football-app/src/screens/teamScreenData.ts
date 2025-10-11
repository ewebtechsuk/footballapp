import type { Team } from '../store/slices/teamsSlice';
import type { TeamCommunication } from '../store/slices/communicationsSlice';
import type { Fixture } from '../store/slices/scheduleSlice';
import {
  formatKickoffTime,
  getFixtureStartDate,
  selectFixturesByTeam,
  selectNextFixtureForTeam,
  selectTeamRecord,
} from '../store/slices/scheduleSlice';
import type { RootState } from '../store';
import type { CommunicationDigestEntry } from '../components/teamCardFormatting';

export interface TeamScheduleSummaryEntry {
  record: { wins: number; draws: number; losses: number };
  nextFixtureLabel?: string;
  nextFixtures: Fixture[];
}

export type TeamScheduleSummary = Record<string, TeamScheduleSummaryEntry>;

export type TeamCommunicationDigest = Record<string, CommunicationDigestEntry[]>;

export interface TeamCardData {
  team: Team;
  record?: TeamScheduleSummaryEntry['record'];
  nextFixtureLabel?: string;
  nextFixtures: Fixture[];
  communications: CommunicationDigestEntry[];
}

const buildNextFixtureLabel = (fixture: Fixture | undefined): string | undefined => {
  if (!fixture) {
    return undefined;
  }

  const kickoffOption = fixture.acceptedKickoffOptionId
    ? fixture.kickoffOptions.find((option) => option.id === fixture.acceptedKickoffOptionId)
    : fixture.kickoffOptions
        .slice()
        .sort((a, b) => new Date(a.isoTime).getTime() - new Date(b.isoTime).getTime())[0];

  if (!kickoffOption) {
    return fixture.opponent;
  }

  return `${fixture.opponent} • ${formatKickoffTime(kickoffOption.isoTime)}`;
};

export const buildScheduleSummary = (
  state: RootState,
  teams: Team[],
): TeamScheduleSummary => {
  const summary: TeamScheduleSummary = {};

  teams.forEach((team) => {
    const record = selectTeamRecord(state, team.id);
    const nextFixture = selectNextFixtureForTeam(state, team.id);
    const upcomingFixtures = selectFixturesByTeam(state, team.id)
      .filter((fixture) => fixture.status !== 'completed')
      .sort((a, b) => {
        const aDate = getFixtureStartDate(a)?.getTime() ?? Number.POSITIVE_INFINITY;
        const bDate = getFixtureStartDate(b)?.getTime() ?? Number.POSITIVE_INFINITY;
        return aDate - bDate;
      });

    summary[team.id] = {
      record,
      nextFixtureLabel: buildNextFixtureLabel(nextFixture),
      nextFixtures: upcomingFixtures.slice(0, 3),
    };
  });

  return summary;
};

export const buildCommunicationDigest = (
  state: RootState,
  teams: Team[],
): TeamCommunicationDigest => {
  const digest: TeamCommunicationDigest = {};
  const communications: TeamCommunication[] = state.communications.communications;

  teams.forEach((team) => {
    const teamCommunications = communications
      .filter((item) => item.teamId === team.id)
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .map<CommunicationDigestEntry>((item) => ({
        id: item.id,
        sender: 'Team Staff',
        message: item.title,
        date: item.status === 'scheduled' && item.scheduledFor ? item.scheduledFor : item.createdAt,
      }));

    digest[team.id] = teamCommunications;
  });

  return digest;
};

export const buildTeamCardsData = (
  teams: Team[],
  scheduleSummary: TeamScheduleSummary,
  communicationDigest: TeamCommunicationDigest,
): TeamCardData[] =>
  teams.map((team) => ({
    team,
    record: scheduleSummary[team.id]?.record,
    nextFixtureLabel: scheduleSummary[team.id]?.nextFixtureLabel,
    nextFixtures: scheduleSummary[team.id]?.nextFixtures ?? [],
    communications: communicationDigest[team.id] ?? [],
  }));
