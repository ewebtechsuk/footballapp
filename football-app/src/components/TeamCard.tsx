import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Team } from '../store/slices/teamsSlice';

interface Props {
  team: Team;
  onRemove: () => void;
}

const TeamCard: React.FC<Props> = ({ team, onRemove }) => {
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.name}>{team.name}</Text>
        <Text style={styles.meta}>Coach: {team.coach}</Text>
        <Text style={styles.meta}>Record: {team.record}</Text>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  meta: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  removeButton: {
    backgroundColor: '#d9534f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TeamCard;
