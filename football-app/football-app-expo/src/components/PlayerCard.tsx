import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PlayerCardProps {
  name: string;
  position: string;
  age: number;
  team: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ name, position, age, team }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.details}>Position: {position}</Text>
      <Text style={styles.details}>Age: {age}</Text>
      <Text style={styles.details}>Team: {team}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    margin: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    fontSize: 14,
    color: '#555',
  },
});

export default PlayerCard;