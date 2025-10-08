import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Button, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRewardedAd } from 'react-native-google-mobile-ads';

import { tournamentRewardedAdUnitId } from '../config/ads';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { creditWallet, debitWallet } from '../store/slices/walletSlice';
import { enrolInTier, selectTournamentSeason } from '../store/slices/tournamentsSlice';

const FALLBACK_REWARD_AMOUNT = 5;

const TournamentScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const credits = useAppSelector((state) => state.wallet.credits);
  const isPremium = useAppSelector((state) => state.premium.entitled);
  const season = useAppSelector(selectTournamentSeason);
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

  const handleJoinTier = (tierId: string, requiredCredits: number, tierName: string) => {
    if (credits < requiredCredits) {
      Alert.alert('Not enough credits', 'Earn more credits to unlock this ladder tier.');
      return;
    }

    dispatch(debitWallet(requiredCredits));
    dispatch(enrolInTier({ tierId }));
    Alert.alert('Enrolled', `You are now competing in the ${tierName}. Good luck!`);
  };

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

        <View style={styles.ladderSection}>
          <Text style={styles.ladderTitle}>{season.seasonLabel}</Text>
          <Text style={styles.ladderSubtitle}>
            Promotion and relegation across three competitive tiers keeps every fixture meaningful.
          </Text>

          {season.currentStanding ? (
            <View style={styles.standingCard}>
              <Text style={styles.standingTitle}>Current standing</Text>
              <Text style={styles.standingMeta}>
                Tier: {season.ladderTiers.find((tier) => tier.id === season.currentStanding?.tierId)?.name ?? '—'}
              </Text>
              <Text style={styles.standingMeta}>
                Position {season.currentStanding.position} • {season.currentStanding.points} pts
              </Text>
              <Text style={styles.standingMeta}>
                W{season.currentStanding.wins} D{season.currentStanding.draws} L{season.currentStanding.losses} • GD {season.currentStanding.goalDifference}
              </Text>
            </View>
          ) : null}

          <View style={styles.tierList}>
            {season.ladderTiers.map((tier) => {
              const isActive = season.enrolledTierId === tier.id;
              return (
                <View
                  key={tier.id}
                  style={[styles.tierCard, isActive && styles.tierCardActive]}
                >
                  <View style={styles.tierHeader}>
                    <Text style={styles.tierName}>{tier.name}</Text>
                    <Text style={styles.tierCredits}>{tier.requiredCredits} credits</Text>
                  </View>
                  <Text style={styles.tierDescription}>{tier.description}</Text>
                  <Text style={styles.tierMeta}>
                    Promotion {tier.promotionSlots} • Relegation {tier.relegationSlots}
                  </Text>
                  <View style={styles.tierInsights}>
                    {tier.analyticsHighlights.map((highlight) => (
                      <Text key={highlight} style={styles.tierInsightBullet}>
                        • {highlight}
                      </Text>
                    ))}
                  </View>
                  {isActive ? (
                    <Text style={styles.activeBadge}>Currently enrolled</Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.joinButton}
                      onPress={() => handleJoinTier(tier.id, tier.requiredCredits, tier.name)}
                    >
                      <Text style={styles.joinButtonText}>Join tier</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {isPremium ? (
          <View style={styles.premiumInsights}>
            <Text style={styles.premiumInsightsTitle}>Premium tournament insights</Text>
            {season.recentInsights.slice(0, 3).map((insight) => (
              <Text key={insight} style={styles.premiumInsightsDetail}>
                {insight}
              </Text>
            ))}
          </View>
        ) : (
          <View style={styles.premiumUpsell}>
            <Text style={styles.premiumUpsellText}>
              Premium members unlock live ladder analytics, opponent scouting, and workload trends.
              Activate your membership from the Profile screen.
            </Text>
          </View>
        )}
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
  ladderSection: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    gap: 16,
  },
  ladderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#166534',
  },
  ladderSubtitle: {
    fontSize: 13,
    color: '#166534',
  },
  standingCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#dcfce7',
    gap: 4,
  },
  standingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  standingMeta: {
    fontSize: 12,
    color: '#166534',
  },
  tierList: {
    gap: 16,
  },
  tierCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 10,
  },
  tierCardActive: {
    borderColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
  },
  tierCredits: {
    color: '#047857',
    fontWeight: '700',
  },
  tierDescription: {
    color: '#14532d',
    fontSize: 13,
  },
  tierMeta: {
    fontSize: 12,
    color: '#15803d',
  },
  tierInsights: {
    gap: 4,
  },
  tierInsightBullet: {
    fontSize: 12,
    color: '#15803d',
  },
  joinButton: {
    borderRadius: 999,
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  activeBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
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
