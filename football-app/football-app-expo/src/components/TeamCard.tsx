import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

interface TeamCardProps {
  teamName: string;
  teamLogo: string;
  membersCount: number;
  onRemove?: () => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ teamName, teamLogo, membersCount, onRemove }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.teamName}>{teamName}</Text>
      <Text style={styles.membersCount}>{membersCount} Members</Text>
      {teamLogo ? (
        <Image source={{ uri: teamLogo }} style={styles.logo} />
      ) : null}
      {onRemove ? (
        <TouchableOpacity onPress={onRemove} style={{ marginTop: 8 }}>
          <Text style={{ color: 'red' }}>Remove</Text>
        </TouchableOpacity>
      ) : null}
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
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  membersCount: {
    fontSize: 14,
    color: '#666',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});

export default TeamCard;