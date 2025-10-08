import React from 'react';
import { Alert, StyleSheet, View, Text, Button, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

import BannerAdSlot from '../components/BannerAdSlot';
import { defaultBannerSize, homeBannerAdUnitId } from '../config/ads';
import { AuthenticatedTabParamList, RootStackParamList } from '../types/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../store/slices/authSlice';
import {
  claimChallengeReward,
  markChallengeCompleted,
  selectActiveChallenges,
} from '../store/slices/challengesSlice';
import { creditWallet } from '../store/slices/walletSlice';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<AuthenticatedTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to the Football App!</Text>
        <Text style={styles.subtitle}>{welcomeMessage}</Text>
        <View style={styles.buttonGroup}>
          <View style={styles.buttonWrapper}>
            <Button title="Manage Teams" onPress={() => navigation.navigate('ManageTeams')} />
          </View>
          <View style={styles.buttonWrapper}>
            <Button title="Create a Team" onPress={() => navigation.navigate('CreateTeam')} />
          </View>
          <View style={styles.buttonWrapper}>
            <Button title="Join Tournaments" onPress={() => navigation.navigate('Tournaments')} />
          </View>
          <View style={styles.buttonWrapper}>
            <Button title="Profile" onPress={() => navigation.navigate('Profile')} />
          </View>

        </View>

        <View style={styles.challengeSection}>
          <Text style={styles.challengeHeading}>Community challenges</Text>
          <Text style={styles.challengeSubtitle}>
            Complete weekly drills to earn wallet credits and collectible badges.
          </Text>
          {challenges.map((challenge) => {
            const expires = new Date(challenge.expiresAt);
            const rewardText =
              challenge.reward.type === 'credits'
                ? `${challenge.reward.amount} credits`
                : `${challenge.reward.name} badge`;

            return (
              <View key={challenge.id} style={styles.challengeCard}>
                <View style={styles.challengeDetails}>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeDescription}>{challenge.description}</Text>
                  <Text style={styles.challengeMeta}>
                    Reward: {rewardText} • Expires {expires.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.challengeActions}>
                  {challenge.status === 'available' ? (
                    <TouchableOpacity
                      style={[styles.challengeButton, styles.challengePrimary]}
                      onPress={() => handleCompleteChallenge(challenge.id)}
                    >
                      <Text style={styles.challengeButtonText}>Mark complete</Text>
                    </TouchableOpacity>
                  ) : null}
                  {challenge.status === 'completed' ? (
                    <TouchableOpacity
                      style={[styles.challengeButton, styles.challengePrimary]}
                      onPress={() => handleClaimReward(challenge.id)}
                    >
                      <Text style={styles.challengeButtonText}>Claim reward</Text>
                    </TouchableOpacity>
                  ) : null}
                  {challenge.status === 'claimed' ? (
                    <View style={styles.claimedBadge}>
                      <Text style={styles.claimedBadgeText}>Claimed</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </View>
      <BannerAdSlot unitId={homeBannerAdUnitId} size={defaultBannerSize} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonGroup: {
    width: '100%',
  },
  buttonWrapper: {
    marginBottom: 12,
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
