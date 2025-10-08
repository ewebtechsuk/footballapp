import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  advanceMatchState,
  resetMatchState,
  selectLiveMatch,
  selectLiveMatchKeyStats,
  selectMomentumSummary,
} from '../store/slices/matchCenterSlice';

const formatStatus = (status: 'countdown' | 'live' | 'finished', minute: number) => {
  if (status === 'countdown') {
    return 'Kick-off imminent';
  }

  if (status === 'live') {
    return `${minute}' live`;
  }

  return `Full-time ${minute}'`;
};

const LiveMatchCenter: React.FC = () => {
  const dispatch = useAppDispatch();
  const match = useAppSelector(selectLiveMatch);
  const keyStats = useAppSelector(selectLiveMatchKeyStats);
  const momentumHistory = useAppSelector(selectMomentumSummary);

  if (!match) {
    return null;
  }

  const handleAdvance = () => {
    dispatch(advanceMatchState());
  };

  const handleReset = () => {
    dispatch(resetMatchState());
  };

  const latestMomentum = momentumHistory[momentumHistory.length - 1];
  const momentumSummary = latestMomentum
    ? `${latestMomentum.home}% : ${latestMomentum.away}%`
    : '50% : 50%';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.scoreRow}>
          <View style={styles.teamColumn}>
            <Text style={styles.teamLabel}>{match.homeTeam}</Text>
            <Text style={styles.score}>{match.homeScore}</Text>
          </View>
          <View style={styles.centerColumn}>
            <Text style={styles.status}>{formatStatus(match.status, match.minute)}</Text>
            <Text style={styles.venueLabel}>{match.tournament}</Text>
            <Text style={styles.venueMeta}>{match.venue}</Text>
          </View>
          <View style={styles.teamColumn}>
            <Text style={[styles.teamLabel, styles.rightAlign]}>{match.awayTeam}</Text>
            <Text style={[styles.score, styles.rightAlign]}>{match.awayScore}</Text>
          </View>
        </View>
        <Text style={styles.momentumLabel}>Momentum (home : away) {momentumSummary}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleAdvance}>
          <Text style={styles.primaryButtonLabel}>
            {match.remainingEvents.length > 0 ? 'Simulate next moment' : 'Simulation complete'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
          <Text style={styles.secondaryButtonLabel}>Restart</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Key stats</Text>
        <View style={styles.statGrid}>
          {keyStats.map((stat) => (
            <View key={stat.label} style={styles.statRow}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.home}</Text>
              <Text style={[styles.statValue, styles.rightAlign]}>{stat.away}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.commentaryCard}>
        <Text style={styles.sectionTitle}>Live commentary</Text>
        <FlatList
          data={match.commentary}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.commentaryItem}>
              <Text style={styles.commentaryMinute}>{item.minute}'</Text>
              <View style={styles.commentaryBody}>
                <Text style={styles.commentaryDescription}>{item.description}</Text>
                {item.team && (
                  <Text style={styles.commentaryTeam}>
                    {item.team === 'home' ? match.homeTeam : match.awayTeam}
                  </Text>
                )}
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.commentaryDivider} />}
          style={styles.commentaryList}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: '#111827',
    padding: 20,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamColumn: {
    flex: 1,
  },
  centerColumn: {
    flex: 1.4,
    alignItems: 'center',
  },
  teamLabel: {
    fontSize: 14,
    color: '#e5e7eb',
    fontWeight: '600',
  },
  status: {
    color: '#facc15',
    fontSize: 16,
    fontWeight: '700',
  },
  score: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
  },
  venueLabel: {
    color: '#9ca3af',
    fontSize: 13,
  },
  venueMeta: {
    color: '#6b7280',
    fontSize: 12,
  },
  momentumLabel: {
    color: '#22d3ee',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3b82f6',
    justifyContent: 'center',
  },
  secondaryButtonLabel: {
    color: '#bfdbfe',
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 16,
  },
  statGrid: {
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statLabel: {
    flex: 1,
    color: '#94a3b8',
    fontSize: 13,
  },
  statValue: {
    width: 60,
    color: '#f1f5f9',
    textAlign: 'left',
    fontWeight: '600',
  },
  commentaryCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    maxHeight: 300,
  },
  commentaryList: {
    maxHeight: 220,
  },
  commentaryItem: {
    flexDirection: 'row',
    gap: 12,
  },
  commentaryMinute: {
    color: '#38bdf8',
    fontWeight: '700',
    width: 40,
  },
  commentaryBody: {
    flex: 1,
    gap: 6,
  },
  commentaryDescription: {
    color: '#f1f5f9',
    fontSize: 13,
  },
  commentaryTeam: {
    color: '#cbd5f5',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  commentaryDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 8,
  },
  rightAlign: {
    textAlign: 'right',
  },
});

export default LiveMatchCenter;
