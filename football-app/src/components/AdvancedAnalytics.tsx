import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Team } from '../store/slices/teamsSlice';

interface Props {
  teams: Team[];
}

const AdvancedAnalytics: React.FC<Props> = ({ teams }) => {
  const totalWins = teams.reduce((acc, team) => {
    const [wins] = team.record.split('-');
    return acc + Number.parseInt(wins, 10);
  }, 0);

  const averageWins = teams.length ? (totalWins / teams.length).toFixed(1) : '0';

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Premium Analytics</Text>
      <Text style={styles.row}>Teams tracked: {teams.length}</Text>
      <Text style={styles.row}>Average wins: {averageWins}</Text>
      <Text style={styles.hint}>Unlock deeper insights across your squads.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1c3faa',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  row: {
    color: '#f0f4ff',
    fontSize: 14,
    marginBottom: 4,
  },
  hint: {
    color: '#dbe5ff',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default AdvancedAnalytics;
