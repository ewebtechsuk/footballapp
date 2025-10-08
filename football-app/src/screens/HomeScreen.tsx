import React, { useCallback, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

type QuickActionTarget =
  | { type: 'tab'; screen: keyof AuthenticatedTabParamList }
  | { type: 'stack'; screen: Exclude<keyof RootStackParamList, 'MainTabs'> };

interface QuickActionDefinition {
  label: string;
  description: string;
  target: QuickActionTarget;
}

const quickActions: QuickActionDefinition[] = [
  {
    label: 'Manage teams',
    description: 'Edit rosters & tactics',
    target: { type: 'tab', screen: 'ManageTeams' },
  },
  {
    label: 'Create team',
    description: 'Spin up a new squad',
    target: { type: 'stack', screen: 'CreateTeam' },
  },
  {
    label: 'Join tournaments',
    description: 'Enter upcoming events',
    target: { type: 'tab', screen: 'Tournaments' },
  },
  {
    label: 'Update profile',
    description: 'Refresh details & premium',
    target: { type: 'tab', screen: 'Profile' },
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

  const greetingName = useMemo(() => currentUser?.fullName.split(' ')[0] ?? 'coach', [currentUser]);
  const welcomeHeadline = currentUser
    ? `Ready for another matchday, ${greetingName}?`
    : 'Sign in to unlock the full football experience.';
  const helperCopy = currentUser
    ? 'Keep your squad sharp with quick actions and weekly challenges.'
    : 'Create your first team, explore tournaments, and rally players in minutes.';

  const handleQuickActionPress = useCallback(
    (target: QuickActionTarget) => {
      if (target.type === 'tab') {
        navigation.navigate('MainTabs', { screen: target.screen });
        return;
      }

      navigation.navigate(target.screen);
    },
    [navigation],
  );

  const formatReward = useCallback((challenge: Challenge) => {
    if (challenge.reward.type === 'credits') {
      return `${challenge.reward.amount} credits`;
    }

    return `${challenge.reward.name} badge`;
  }, []);

  const formatExpiry = useCallback((expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    if (Number.isNaN(expiryDate.getTime())) {
      return 'Expires soon';
    }

    return `Expires ${expiryDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })}`;
  }, []);

  const handleCompleteChallenge = useCallback(
    (challengeId: string) => {
      dispatch(markChallengeCompleted({ challengeId }));
    },
    [dispatch],
  );

  const handleClaimReward = useCallback(
    (challengeId: string) => {
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
    },
    [challenges, dispatch],
  );

  const handleQuickActionPress = (action: QuickAction) => {
    if (action.action.type === 'tab') {
      navigation.navigate(action.action.route);
    } else {
      navigation.navigate(action.action.route);
    }
  };

  return (
    <AuthenticatedScreenContainer style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Matchday HQ</Text>
          <Text style={styles.title}>{welcomeHeadline}</Text>
          <Text style={styles.helperText}>{helperCopy}</Text>

          <View style={styles.quickActionGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickActionCard}
                onPress={() => handleQuickActionPress(action.target)}
                accessibilityRole="button"
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

        <View style={styles.challengeSection}>
          <Text style={styles.challengeHeading}>Weekly challenges</Text>
          <Text style={styles.challengeSubtitle}>
            Sharpen your squad’s focus with rotating drills and skill missions.
          </Text>

          {challenges.length === 0 ? (
            <Text style={styles.challengeDescription}>
              Check back soon for new challenges tailored to your coaching goals.
            </Text>
          ) : (
            challenges.map((challenge) => (
              <View key={challenge.id} style={styles.challengeCard}>
                <View style={styles.challengeDetails}>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeDescription}>{challenge.description}</Text>
                  <Text style={styles.challengeMeta}>{formatReward(challenge)}</Text>
                  <Text style={styles.challengeMeta}>{formatExpiry(challenge.expiresAt)}</Text>
                </View>

                <View style={styles.challengeActions}>
                  {challenge.status === 'available' && (
                    <TouchableOpacity
                      style={[styles.challengeButton, styles.challengePrimary]}
                      onPress={() => handleCompleteChallenge(challenge.id)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.challengeButtonText}>Mark completed</Text>
                    </TouchableOpacity>
                  )}

                  {challenge.status === 'completed' && (
                    <TouchableOpacity
                      style={[styles.challengeButton, styles.challengePrimary]}
                      onPress={() => handleClaimReward(challenge.id)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.challengeButtonText}>Claim reward</Text>
                    </TouchableOpacity>
                  )}

                  {challenge.status === 'claimed' && (
                    <View style={styles.claimedBadge}>
                      <Text style={styles.claimedBadgeText}>Reward claimed</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <BannerAdSlot unitId={homeBannerAdUnitId} size={defaultBannerSize} />
      </ScrollView>
    </AuthenticatedScreenContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef2ff',
  },
  content: {
    flex: 1,
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
  heroTitle: {
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
  challengeList: {
    gap: 12,
  },
  challengeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  challengeStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  challengeCopy: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  challengeMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  challengeActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  challengeButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  challengeButtonLabel: {
    color: '#ffffff',
    fontWeight: '600',
  },
  claimButton: {
    backgroundColor: '#22c55e',
  },
  claimButtonLabel: {
    color: '#052e16',
  },
  claimedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
    alignSelf: 'center',
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
