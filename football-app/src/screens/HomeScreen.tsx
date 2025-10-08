import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AuthenticatedScreenContainer from '../components/AuthenticatedScreenContainer';
import BannerAdSlot from '../components/BannerAdSlot';
import { defaultBannerSize, homeBannerAdUnitId } from '../config/ads';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  Challenge,
  claimChallengeReward,
  markChallengeCompleted,
  selectActiveChallenges,
} from '../store/slices/challengesSlice';
import { selectCurrentUser } from '../store/slices/authSlice';
import { creditWallet } from '../store/slices/walletSlice';
import { AuthenticatedTabParamList, RootStackParamList } from '../types/navigation';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<AuthenticatedTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

type QuickAction = {
  label: string;
  description: string;
  onPress: (navigation: HomeScreenNavigationProp) => void;
};

const quickActions: QuickAction[] = [
  {
    label: 'Manage teams',
    description: 'Edit rosters & tactics',
    onPress: (navigation) => navigation.navigate('ManageTeams'),
  },
  {
    label: 'Create team',
    description: 'Spin up a new squad',
    onPress: (navigation) => navigation.navigate('CreateTeam'),
  },
  {
    label: 'Join tournaments',
    description: 'Enter upcoming events',
    onPress: (navigation) => navigation.navigate('Tournaments'),
  },
  {
    label: 'Update profile',
    description: 'Refresh details & premium',
    onPress: (navigation) => navigation.navigate('Profile'),
  },
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

const formatTimeUntil = (isoDate: string): string => {
  const expiryDate = new Date(isoDate);
  if (Number.isNaN(expiryDate.getTime())) {
    return 'No expiry date';
  }

  const diffMs = expiryDate.getTime() - Date.now();
  if (diffMs <= 0) {
    return 'Expired';
  }

  const minutes = Math.ceil(diffMs / (1000 * 60));
  if (minutes < 60) {
    return `Due in ${minutes} min${minutes === 1 ? '' : 's'}`;
  }

  const hours = Math.ceil(diffMs / (1000 * 60 * 60));
  if (hours < 24) {
    return `Due in ${hours} hr${hours === 1 ? '' : 's'}`;
  }

  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return `Due in ${days} day${days === 1 ? '' : 's'}`;
};

const describeReward = (reward: Challenge['reward']): string => {
  if (reward.type === 'credits') {
    return `${reward.amount} credits`;
  }

  return `${reward.name} badge`;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const challenges = useAppSelector(selectActiveChallenges);
  const greetingName = currentUser?.fullName.split(' ')[0] ?? 'coach';
  const welcomeMessage = currentUser
    ? `Ready for another matchday, ${greetingName}?`
    : 'Sign in to unlock the full football experience.';

  const handleCompleteChallenge = (challengeId: string) => {
    dispatch(markChallengeCompleted({ challengeId }));
    Alert.alert('Challenge completed', 'Great work! Claim your reward whenever you are ready.');
  };

  const handleClaimReward = (challengeId: string) => {
    const challenge = challenges.find((item) => item.id === challengeId);
    if (!challenge || challenge.status !== 'completed') {
      return;
    }

    dispatch(claimChallengeReward({ challengeId }));

    if (challenge.reward.type === 'credits') {
      dispatch(creditWallet(challenge.reward.amount));
      Alert.alert('Reward claimed', `You earned ${challenge.reward.amount} credits!`);
    } else {
      Alert.alert('Badge unlocked', `You collected the ${challenge.reward.name} badge.`);
    }
  };

  return (
    <AuthenticatedScreenContainer style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>This week&apos;s focus</Text>
          <Text style={styles.title}>{welcomeMessage}</Text>
          <Text style={styles.helperText}>
            Keep your squad sharp with quick actions, curated drills, and tailored insights for every matchday.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.quickActionGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickActionCard}
                activeOpacity={0.8}
                onPress={() => action.onPress(navigation)}
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

        {challenges.length > 0 && (
          <View style={styles.challengeSection}>
            <Text style={styles.challengeHeading}>Squad challenges</Text>
            <Text style={styles.challengeSubtitle}>
              Complete drills to earn extra credits and exclusive recognition for your players.
            </Text>

            {challenges.map((challenge) => {
              const isAvailable = challenge.status === 'available';
              const isCompleted = challenge.status === 'completed';
              const isClaimed = challenge.status === 'claimed';
              const rewardDescription = describeReward(challenge.reward);
              const expiresLabel = formatTimeUntil(challenge.expiresAt);

              return (
                <View key={challenge.id} style={styles.challengeCard}>
                  <View style={styles.challengeDetails}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <Text style={styles.challengeDescription}>{challenge.description}</Text>
                    <Text style={styles.challengeMeta}>
                      Reward: {rewardDescription} • {expiresLabel}
                    </Text>
                  </View>

                  {isClaimed ? (
                    <View style={styles.claimedBadge}>
                      <Text style={styles.claimedBadgeText}>Reward claimed</Text>
                    </View>
                  ) : (
                    <View style={styles.challengeActions}>
                      {isAvailable && (
                        <TouchableOpacity
                          style={[styles.challengeButton, styles.challengePrimary]}
                          activeOpacity={0.85}
                          onPress={() => handleCompleteChallenge(challenge.id)}
                        >
                          <Text style={styles.challengeButtonText}>Mark complete</Text>
                        </TouchableOpacity>
                      )}

                      {isCompleted && (
                        <TouchableOpacity
                          style={[styles.challengeButton, styles.challengePrimary]}
                          activeOpacity={0.85}
                          onPress={() => handleClaimReward(challenge.id)}
                        >
                          <Text style={styles.challengeButtonText}>Claim reward</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

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
  challengeSection: {
    marginTop: 32,
    width: '100%',
    gap: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  challengeHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400e',
  },
  challengeSubtitle: {
    color: '#b45309',
    fontSize: 13,
  },
  challengeCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  challengeDetails: {
    gap: 6,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9a3412',
  },
  challengeDescription: {
    color: '#7c2d12',
    fontSize: 13,
  },
  challengeMeta: {
    fontSize: 12,
    color: '#b45309',
  },
  challengeActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  challengeButton: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  challengePrimary: {
    backgroundColor: '#f97316',
  },
  challengeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  claimedBadge: {
    backgroundColor: '#bbf7d0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  claimedBadgeText: {
    color: '#166534',
    fontWeight: '700',
  },
});

export default HomeScreen;
