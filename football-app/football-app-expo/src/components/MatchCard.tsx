import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MatchCardProps {
  matchDate: string;
  teamA: string;
  teamB: string;
  score?: string;
}

const MatchCard: React.FC<MatchCardProps> = ({ matchDate, teamA, teamB, score }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.date}>{matchDate}</Text>
      <Text style={styles.teams}>{teamA} vs {teamB}</Text>
      {score && <Text style={styles.score}>{score}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    margin: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  date: {
    fontSize: 14,
    color: '#888',
  },
  teams: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  score: {
    fontSize: 16,
    color: '#333',
  },
});

export default MatchCard;