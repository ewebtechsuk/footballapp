import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import type { Team } from '../store/slices/teamsSlice';

interface TeamCardProps {
  team: Team;
  onRemove: () => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, onRemove }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{team.name}</Text>
      <Text style={styles.memberCount}>{team.members.length} members</Text>
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
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
  removeButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default TeamCard;
