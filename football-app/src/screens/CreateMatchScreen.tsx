import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppSelector } from '../store/hooks';
import type { AuthenticatedTabParamList, RootStackParamList } from '../types/navigation';

type CreateMatchNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<AuthenticatedTabParamList, 'CreateMatch'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const CreateMatchScreen: React.FC = () => {
  const navigation = useNavigation<CreateMatchNavigationProp>();
  const teams = useAppSelector((state) => state.teams.teams);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Organise a new match</Text>
        <Text style={styles.subtitle}>
          Choose one of your teams to start proposing fixtures, manage kickoff voting and sync
          confirmed matches to your calendar.
        </Text>

        {teams.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateHeading}>No teams yet</Text>
            <Text style={styles.emptyStateBody}>
              Create a team first so you can invite players and set up your first matchday.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => navigation.navigate('CreateTeam')}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Create a team</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.teamList}>
            <Text style={styles.teamListHeading}>Select a team</Text>
            {teams.map((team) => {
              const playerLabel = team.members.length === 1 ? 'player' : 'players';

              return (
                <TouchableOpacity
                  key={team.id}
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('ManageTeam', { teamId: team.id })}
                  style={styles.teamCard}
                >
                  <Text style={styles.teamName}>{team.name}</Text>
                  <Text style={styles.teamMeta}>
                    {team.members.length} {playerLabel}
                  </Text>
                  <Text style={styles.teamCta}>Manage fixtures</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  emptyStateHeading: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#111827',
  },
  emptyStateBody: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 16,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  teamList: {
    marginTop: 8,
    width: '100%',
  },
  teamListHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  teamCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  teamMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  teamCta: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
});

export default CreateMatchScreen;
