import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AuthenticatedScreenContainer from '../components/AuthenticatedScreenContainer';
import BannerAdSlot from '../components/BannerAdSlot';
import { defaultBannerSize, homeBannerAdUnitId } from '../config/ads';
import { RootStackParamList } from '../types/navigation';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../store/slices/authSlice';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const quickActions = [
  { label: 'Manage teams', description: 'Edit rosters & tactics', route: 'Team' as const },
  { label: 'Create team', description: 'Spin up a new squad', route: 'CreateTeam' as const },
  { label: 'Join tournaments', description: 'Enter upcoming events', route: 'Tournaments' as const },
  { label: 'Update profile', description: 'Refresh details & premium', route: 'Profile' as const },
];

const featureHighlights = [
  {
    title: 'Match scheduling hub',
    copy:
      'Coordinate fixtures, collect availability votes, and sync confirmed games straight to everyone’s calendars.',
  },
  {
    title: 'Scouting marketplace',
    copy:
      'Promote open positions, browse free agents by skill tags, and invite prospects to trial sessions.',
  },
  {
    title: 'Season ladders & challenges',
    copy:
      'Track promotion and relegation paths, tackle rotating community skill drills, and earn badge rewards.',
  },
  {
    title: 'Personalised training packs',
    copy:
      'Serve drills and wellness tips tuned to each player’s profile, with premium plans unlocking deeper insights.',
  },
];

const designOpportunities = [
  'Introduce a matchday dashboard tile that surfaces live tactics, kit colours, and weather in a single glance.',
  'Layer subtle gradients and club accent colours into team cards for clearer visual hierarchy.',
  'Add micro-interactions (progress pulses, celebratory confetti) when teams hit milestones or unlock rewards.',
  'Bring in a dark mode palette that echoes stadium floodlights for late-night strategising.',
];

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const greetingName = currentUser?.fullName.split(' ')[0] ?? 'coach';
  const welcomeMessage = currentUser
    ? `Ready for another matchday, ${greetingName}?`
    : 'Sign in to unlock the full football experience.';

  return (
    <AuthenticatedScreenContainer contentStyle={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Welcome to Football App</Text>
          <Text style={styles.title}>{welcomeMessage}</Text>
          <Text style={styles.helperText}>
            Manage squads, schedule fixtures, and unlock insights that keep your club one step ahead.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.quickActionGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.route}
                onPress={() => navigation.navigate(action.route)}
                style={styles.quickActionCard}
              >
                <Text style={styles.quickActionLabel}>{action.label}</Text>
                <Text style={styles.quickActionDescription}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feature highlights</Text>
          <View style={styles.featureList}>
            {featureHighlights.map((feature) => (
              <View key={feature.title} style={styles.featureCard}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureCopy}>{feature.copy}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Design opportunities</Text>
          <View style={styles.designList}>
            {designOpportunities.map((idea) => (
              <View key={idea} style={styles.designIdea}>
                <Text style={styles.designIdeaText}>{idea}</Text>
              </View>
            ))}
          </View>
        </View>

        <BannerAdSlot unitId={homeBannerAdUnitId} size={defaultBannerSize} />
      </ScrollView>
    </AuthenticatedScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#eef2ff',
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 24,
  },
  heroCard: {
    backgroundColor: '#1d4ed8',
    borderRadius: 24,
    padding: 24,
    gap: 12,
  },
  eyebrow: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '600',
    color: '#bfdbfe',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 32,
  },
  helperText: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#1e293b',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flexBasis: '48%',
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#dbeafe',
    gap: 8,
  },
  quickActionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e40af',
  },
  quickActionDescription: {
    fontSize: 12,
    color: '#1d4ed8',
  },
  featureList: {
    gap: 12,
  },
  featureCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  featureCopy: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  designList: {
    gap: 12,
  },
  designIdea: {
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  designIdeaText: {
    fontSize: 13,
    color: '#1f2937',
    lineHeight: 18,
  },
});

export default HomeScreen;
