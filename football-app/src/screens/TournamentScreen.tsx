import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Button, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRewardedAd } from 'react-native-google-mobile-ads';

import { tournamentRewardedAdUnitId } from '../config/ads';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { creditWallet } from '../store/slices/walletSlice';

const FALLBACK_REWARD_AMOUNT = 5;

const TournamentScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const credits = useAppSelector((state) => state.wallet.credits);
  const requestOptions = useMemo(() => ({ requestNonPersonalizedAdsOnly: true }), []);
  const { isLoaded, isClosed, load, show, reward, error } = useRewardedAd(
    tournamentRewardedAdUnitId,
    requestOptions,
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isClosed) {
      load();
    }
  }, [isClosed, load]);

  useEffect(() => {
    if (reward) {
      const rewardAmount = reward.amount ?? FALLBACK_REWARD_AMOUNT;
      dispatch(creditWallet(rewardAmount));
      Alert.alert('Reward earned!', `You received ${rewardAmount} credits.`);
    }
  }, [reward, dispatch]);

  const handleWatchToEarn = useCallback(() => {
    if (isLoaded) {
      show();
      return;
    }

    load();
  }, [isLoaded, load, show]);

  useEffect(() => {
    if (error) {
      Alert.alert('Ad error', error.message);
    }
  }, [error]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Tournaments</Text>
        <Text style={styles.subtitle}>Earn credits to enter premium tournaments.</Text>

        <View style={styles.rewardCard}>
          <Text style={styles.rewardTitle}>Wallet Balance</Text>
          <Text style={styles.rewardAmount}>{credits} credits</Text>
          <Button
            title={isLoaded ? 'Watch to earn entry credits' : 'Load rewarded ad'}
            onPress={handleWatchToEarn}
          />
          {!isLoaded && (
            <Text style={styles.helperText}>Tap the button again if the ad is still loading.</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  rewardCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  helperText: {
    marginTop: 12,
    textAlign: 'center',
    color: '#6b7280',
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  rewardAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 12,
  },
});

export default TournamentScreen;
