import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TournamentCardProps {
  tournamentName: string;
  date: string;
  location: string;
  onJoin: () => void;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournamentName, date, location, onJoin }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{tournamentName}</Text>
      <Text style={styles.details}>Date: {date}</Text>
      <Text style={styles.details}>Location: {location}</Text>
      <TouchableOpacity style={styles.button} onPress={onJoin}>
        <Text style={styles.buttonText}>Join Tournament</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    fontSize: 14,
    marginVertical: 4,
  },
  button: {
    backgroundColor: '#007BFF',
    borderRadius: 4,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TournamentCard;