import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import type { Team } from '../store/slices/teamsSlice';
import type { CommunicationStatus } from '../store/slices/communicationsSlice';

interface TeamRecordSummary {
  wins: number;
  draws: number;
  losses: number;
}

interface TeamCardProps {
  team: Team;
  onRemove: () => void;
  onManage: () => void;
  record?: TeamRecordSummary;
  nextFixtureLabel?: string;
  latestCommunication?: {
    title: string;
    status: CommunicationStatus;
    timestamp: string | null;
  };
}


const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onRemove,
  onManage,
  record,
  nextFixtureLabel,
  latestCommunication,
}) => {
  const hasRecord = record && (record.wins > 0 || record.draws > 0 || record.losses > 0);
  const communicationTimestampLabel = latestCommunication?.timestamp
    ? new Date(latestCommunication.timestamp).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;
  const communicationHeading = latestCommunication
    ? latestCommunication.status === 'scheduled'
      ? 'Next update'
      : 'Latest update'
    : null;

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{team.name}</Text>
      <Text style={styles.memberCount}>{team.members.length} members</Text>

      {hasRecord ? (
        <View style={styles.recordRow}>
          <Text style={styles.recordLabel}>Record</Text>
          <Text style={styles.recordValue}>
            {record?.wins ?? 0}-{record?.draws ?? 0}-{record?.losses ?? 0}
          </Text>
        </View>
      ) : null}

      {nextFixtureLabel ? (
        <View style={styles.fixtureRow}>
          <Text style={styles.fixtureLabel}>Next kickoff</Text>
          <Text style={styles.fixtureValue}>{nextFixtureLabel}</Text>
        </View>
      ) : null}

      {latestCommunication ? (
        <View style={styles.communicationRow}>
          {communicationHeading ? (
            <Text style={styles.communicationLabel}>{communicationHeading}</Text>
          ) : null}
          <Text style={styles.communicationTitle}>{latestCommunication.title}</Text>
          {communicationTimestampLabel ? (
            <Text style={styles.communicationMeta}>{communicationTimestampLabel}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity onPress={onManage} style={[styles.button, styles.manageButton]}>
          <Text style={[styles.buttonText, styles.manageButtonText]}>Manage</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRemove} style={[styles.button, styles.removeButton]}>
          <Text style={[styles.buttonText, styles.removeButtonText]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberCount: {
    color: '#6b7280',
    marginBottom: 12,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  recordLabel: {
    fontSize: 12,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recordValue: {
    fontWeight: '700',
    color: '#0f172a',
  },
  fixtureRow: {
    marginTop: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fixtureLabel: {
    fontSize: 12,
    color: '#1d4ed8',
    marginBottom: 2,
    fontWeight: '600',
  },
  fixtureValue: {
    fontSize: 14,
    color: '#1e293b',
  },
  communicationRow: {
    marginTop: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  communicationLabel: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  communicationTitle: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  communicationMeta: {
    fontSize: 12,
    color: '#475569',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonText: {
    fontWeight: '600',
  },
  manageButton: {
    backgroundColor: '#2563eb10',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  manageButtonText: {
    color: '#1d4ed8',
  },
  removeButton: {
    backgroundColor: '#ef4444',
  },
  removeButtonText: {
    color: '#fff',
  },
});

export default TeamCard;
