import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import type { Team } from '../store/slices/teamsSlice';

interface TeamCardProps {
  team: Team;
  onRemove: () => void;
  onManage: () => void;
}


const TeamCard: React.FC<TeamCardProps> = ({ team, onRemove, onManage }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{team.name}</Text>
      <Text style={styles.memberCount}>{team.members.length} members</Text>

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
