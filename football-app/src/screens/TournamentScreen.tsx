import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Button, Alert } from 'react-native';
import { useRewardedAd } from 'react-native-google-mobile-ads';

import { tournamentRewardedAdUnitId } from '../config/ads';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { creditWallet } from '../store/slices/walletSlice';
import AuthenticatedScreenContainer from '../components/AuthenticatedScreenContainer';

const FALLBACK_REWARD_AMOUNT = 5;

const TournamentScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const credits = useAppSelector((state) => state.wallet.credits);
  const isPremium = useAppSelector((state) => state.premium.entitled);
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
    <AuthenticatedScreenContainer style={styles.safeArea} contentStyle={styles.content}>
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

      {isPremium ? (
        <View style={styles.premiumInsights}>
          <Text style={styles.premiumInsightsTitle}>Premium tournament insights</Text>
          <Text style={styles.premiumInsightsDetail}>Next best event: Elite Cup (opens in 3 days)</Text>
          <Text style={styles.premiumInsightsDetail}>Recommended entry fee budget: 120 credits</Text>
        </View>
      ) : (
        <View style={styles.premiumUpsell}>
          <Text style={styles.premiumUpsellText}>
            Premium members get tournament recommendations tailored to their squad. Unlock from the
            Profile screen.
          </Text>
        </View>
      )}
    </AuthenticatedScreenContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    gap: 20,
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
  premiumInsights: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ecfccb',
    gap: 8,
  },
  premiumInsightsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#365314',
  },
  premiumInsightsDetail: {
    fontSize: 13,
    color: '#3f6212',
  },
  premiumUpsell: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5f5',
  },
  premiumUpsellText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
});


export default TournamentScreen;
