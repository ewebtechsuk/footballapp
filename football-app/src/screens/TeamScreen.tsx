import React, { useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, Button } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';

import AuthenticatedScreenContainer from '../components/AuthenticatedScreenContainer';
import TeamCard from '../components/TeamCard';
import BannerAdSlot from '../components/BannerAdSlot';
import { defaultBannerSize, teamBannerAdUnitId } from '../config/ads';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { removeTeam, Team } from '../store/slices/teamsSlice';
import { AuthenticatedTabParamList, RootStackParamList } from '../types/navigation';
import {
  formatKickoffTime,
  getFixtureStartDate,
  selectFixturesByTeam,
  selectNextFixtureForTeam,
  selectTeamRecord,
} from '../store/slices/scheduleSlice';
import type { CommunicationStatus, TeamCommunication } from '../store/slices/communicationsSlice';

type TeamScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<AuthenticatedTabParamList, 'ManageTeams'>,
  NativeStackNavigationProp<RootStackParamList>
>;


const TeamScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const teams = useAppSelector((state) => state.teams.teams);
  const isPremium = useAppSelector((state) => state.premium.entitled);
  const navigation = useNavigation<TeamScreenNavigationProp>();
  const scheduleSummary = useAppSelector((state) => {
    const summary: Record<
      string,
      {
        record: { wins: number; draws: number; losses: number };
        nextFixtureLabel?: string;
        upcomingFixtures: ReturnType<typeof selectFixturesByTeam>;
      }
    > = {};

    state.teams.teams.forEach((team) => {
      const record = selectTeamRecord(state, team.id);
      const nextFixture = selectNextFixtureForTeam(state, team.id);
      const upcomingFixtures = selectFixturesByTeam(state, team.id).filter(
        (fixture) => fixture.status !== 'completed',
      );

      let nextFixtureLabel: string | undefined;
      if (nextFixture) {
        const kickoffOption = nextFixture.acceptedKickoffOptionId
          ? nextFixture.kickoffOptions.find(
              (option) => option.id === nextFixture.acceptedKickoffOptionId,
            )
          : nextFixture.kickoffOptions
              .slice()
              .sort((a, b) => new Date(a.isoTime).getTime() - new Date(b.isoTime).getTime())[0];

        if (kickoffOption) {
          nextFixtureLabel = `${nextFixture.opponent} • ${formatKickoffTime(kickoffOption.isoTime)}`;
        } else {
          nextFixtureLabel = nextFixture.opponent;
        }
      }

      summary[team.id] = {
        record,
        nextFixtureLabel,
        upcomingFixtures,
      };
    });

    return summary;
  });
  const communicationDigest = useAppSelector((state) => {
    const summary: Record<string, CommunicationDigestEntry> = {};
    const allCommunications: TeamCommunication[] = state.communications.communications;

    state.teams.teams.forEach((team) => {
      const teamCommunications = allCommunications
        .filter((communication) => communication.teamId === team.id)
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (teamCommunications.length === 0) {
        return;
      }

      const latestSent = teamCommunications.find((communication) => communication.status === 'sent');
      const candidate = latestSent ?? teamCommunications[0];
      const timestamp = candidate.status === 'scheduled' ? candidate.scheduledFor : candidate.createdAt;

      summary[team.id] = {
        title: candidate.title,
        status: candidate.status,
        timestamp: timestamp ?? null,
      };
    });

    return summary;
  });

  const featuredTeamFixtures = useMemo(() => {
    if (teams.length === 0) {
      return [];
    }

    const firstTeam = teams[0];
    return scheduleSummary[firstTeam.id]?.upcomingFixtures ?? [];
  }, [scheduleSummary, teams]);

  return (
    <AuthenticatedScreenContainer style={styles.safeArea} contentStyle={styles.content}>
      <Text style={styles.title}>My Teams</Text>
      <FlatList
        data={teams}
        keyExtractor={(item: Team) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }: { item: Team }) => {
          const teamSummary = scheduleSummary[item.id];
          const teamCommunication = communicationDigest[item.id];

          return (
            <TeamCard
              team={item}
              onRemove={() => dispatch(removeTeam(item.id))}
              onManage={() => navigation.navigate('ManageTeam', { teamId: item.id })}
              record={teamSummary?.record}
              nextFixtureLabel={teamSummary?.nextFixtureLabel}
              latestCommunication={teamCommunication}
            />
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>Create your first team to get started.</Text>}
      />

      <View style={styles.analyticsSection}>
        <Text style={styles.analyticsTitle}>Team analytics</Text>
        {isPremium ? (
          <View style={styles.analyticsContent}>
            <Text style={styles.analyticsMetric}>Form (last 5): W • W • D • L • W</Text>
            <Text style={styles.analyticsMetric}>Projected seed: #3 in current tournament</Text>
            <Text style={styles.analyticsHint}>
              These insights refresh automatically after each recorded match.
            </Text>
          </View>
        ) : (
          <View style={styles.analyticsUpsell}>
            <Text style={styles.analyticsUpsellText}>
              Upgrade to Football App Premium to unlock match insights and projections.
            </Text>
            <Button title="View premium" onPress={() => navigation.navigate('Profile')} />
          </View>
        )}
      </View>
      <Button title="Create New Team" onPress={() => navigation.navigate('CreateTeam')} />
      <BannerAdSlot unitId={teamBannerAdUnitId} size={defaultBannerSize} />
    </AuthenticatedScreenContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 24,
  },
  analyticsSection: {
    marginVertical: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
  },
  scheduleSection: {
    marginVertical: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    gap: 16,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9a3412',
  },
  scheduleSubtitle: {
    fontSize: 13,
    color: '#c2410c',
    lineHeight: 18,
  },
  emptyScheduleText: {
    fontSize: 14,
    color: '#b45309',
  },
  fixtureCard: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fed7aa',
    gap: 4,
  },
  fixtureOpponent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c2d12',
  },
  fixtureMeta: {
    fontSize: 13,
    color: '#b45309',
  },
  fixtureKickoff: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  fixtureStatus: {
    marginTop: 4,
    fontSize: 12,
    color: '#9a3412',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  analyticsContent: {
    gap: 8,
  },
  analyticsMetric: {
    fontSize: 14,
    color: '#1e293b',
  },
  analyticsHint: {
    fontSize: 12,
    color: '#64748b',
  },
  analyticsUpsell: {
    gap: 12,
  },
  analyticsUpsellText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
});


export default TeamScreen;
