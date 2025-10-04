import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TournamentScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tournaments</Text>
      <Text style={styles.copy}>
        Tournament management is coming soon. Stay tuned for brackets, schedules, and live stats.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  copy: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
});

export default TournamentScreen;
