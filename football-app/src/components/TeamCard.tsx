import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Team } from '../store/slices/teamsSlice';

type TeamCardProps = {
  team: Team;
  onRemove: () => void;
};

const TeamCard: React.FC<TeamCardProps> = ({ team, onRemove }) => {
  return (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{team.name}</Text>
        {team.city ? <Text style={styles.detail}>City: {team.city}</Text> : null}
        {team.coach ? <Text style={styles.detail}>Coach: {team.coach}</Text> : null}
        {Array.isArray(team.players) && team.players.length > 0 ? (
          <Text style={styles.detail}>Players: {team.players.length}</Text>
        ) : null}
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
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoContainer: {
    flex: 1,
    marginRight: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: '#555',
  },
  removeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#ff4d4f',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default TeamCard;
