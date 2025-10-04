import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const isPremium = useSelector((state: RootState) => state.premium.isPremium);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Football App!</Text>
      {isPremium ? (
        <Text style={styles.premiumBadge}>Premium member</Text>
      ) : (
        <Text style={styles.subtitle}>Unlock premium for deeper analytics and insights.</Text>
      )}
      <View style={styles.actions}>
        <Button title="Manage Teams" onPress={() => navigation.navigate('Teams')} />
        <Button title="Create a Team" onPress={() => navigation.navigate('CreateTeam')} />
        <Button title="Join Tournaments" onPress={() => navigation.navigate('Tournaments')} />
        <Button title="Profile" onPress={() => navigation.navigate('Profile')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f7f9fc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#444',
    marginBottom: 20,
  },
  premiumBadge: {
    fontSize: 16,
    color: '#1c7c54',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
});

export default HomeScreen;
