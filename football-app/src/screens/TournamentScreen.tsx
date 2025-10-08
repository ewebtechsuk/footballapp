import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Button, Alert, TouchableOpacity } from 'react-native';
import { useRewardedAd } from 'react-native-google-mobile-ads';

import { tournamentRewardedAdUnitId } from '../config/ads';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import LiveMatchCenter from '../components/LiveMatchCenter';
import { creditCosmeticTokens, creditWallet, debitWallet } from '../store/slices/walletSlice';
import { enrolInTier, selectTournamentSeason } from '../store/slices/tournamentsSlice';
import { selectFeaturedBroadcast, selectWeeklyReels } from '../store/slices/mediaSlice';
import AuthenticatedScreenContainer from '../components/AuthenticatedScreenContainer';

const FALLBACK_REWARD_AMOUNT = 5;

const TournamentScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const credits = useAppSelector((state) => state.wallet.credits);
  const cosmeticTokens = useAppSelector((state) => state.wallet.cosmeticTokens);
  const isPremium = useAppSelector((state) => state.premium.entitled);
  const season = useAppSelector(selectTournamentSeason);
  const featuredBroadcast = useAppSelector(selectFeaturedBroadcast);
  const weeklyReels = useAppSelector(selectWeeklyReels);
  const requestOptions = useMemo(() => ({ requestNonPersonalizedAdsOnly: true }), []);
  const { isLoaded, isClosed, load, show, reward, error } = useRewardedAd(
    tournamentRewardedAdUnitId,
    requestOptions,
  );
  const {
    isLoaded: isCosmeticLoaded,
    isClosed: isCosmeticClosed,
    load: loadCosmetic,
    show: showCosmetic,
    reward: cosmeticReward,
    error: cosmeticError,
  } = useRewardedAd(tournamentRewardedAdUnitId, requestOptions);

  const highlightedReels = useMemo(() => weeklyReels.slice(0, 2), [weeklyReels]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isClosed) {
      load();
    }
  }, [isClosed, load]);

  useEffect(() => {
    loadCosmetic();
  }, [loadCosmetic]);

  useEffect(() => {
    if (isCosmeticClosed) {
      loadCosmetic();
    }
  }, [isCosmeticClosed, loadCosmetic]);

  useEffect(() => {
    if (reward) {
      const rewardAmount = reward.amount ?? FALLBACK_REWARD_AMOUNT;
      dispatch(creditWallet(rewardAmount));
      Alert.alert('Reward earned!', `You received ${rewardAmount} credits.`);
    }
  }, [reward, dispatch]);

  useEffect(() => {
    if (cosmeticReward) {
      const rewardAmount = cosmeticReward.amount ?? 3;
      dispatch(creditCosmeticTokens(rewardAmount));
      Alert.alert('Kit tokens earned', `You collected ${rewardAmount} cosmetic tokens.`);
    }
  }, [cosmeticReward, dispatch]);

  const handleWatchToEarn = useCallback(() => {
    if (isLoaded) {
      show();
      return;
    }

    load();
  }, [isLoaded, load, show]);

  const handleWatchForCosmetics = useCallback(() => {
    if (isCosmeticLoaded) {
      showCosmetic();
      return;
    }

    loadCosmetic();
  }, [isCosmeticLoaded, loadCosmetic, showCosmetic]);

  useEffect(() => {
    if (error) {
      Alert.alert('Ad error', error.message);
    }
  }, [error]);

  useEffect(() => {
    if (cosmeticError) {
      Alert.alert('Ad error', cosmeticError.message);
    }
  }, [cosmeticError]);

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

      <View style={styles.matchCenterSection}>
        <Text style={styles.sectionHeading}>Live match centre</Text>
        <Text style={styles.sectionSubheading}>
          Follow simulated commentary, momentum swings, and key statistics without leaving the
          tournament hub.
        </Text>
        <LiveMatchCenter />
      </View>

      <View style={styles.tokensCard}>
        <View style={styles.tokensHeader}>
          <View>
            <Text style={styles.tokensTitle}>Cosmetic tokens</Text>
            <Text style={styles.tokensHelper}>Redeem for banners, kits, and celebration effects.</Text>
          </View>
          <Text style={styles.tokensValue}>{cosmeticTokens}</Text>
        </View>
        <Button
          title={
            isCosmeticLoaded ? 'Watch a short broadcast ad to earn kit tokens' : 'Load cosmetic ad'
          }
          onPress={handleWatchForCosmetics}
        />
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

      <View style={styles.ladderSection}>
        <Text style={styles.ladderTitle}>{season.seasonLabel}</Text>
        {season.currentStanding && (
          <View style={styles.standingCard}>
            <Text style={styles.standingTitle}>
              Current position: #{season.currentStanding.position} in {season.currentStanding.tierId}
            </Text>
            <Text style={styles.standingMeta}>
              W {season.currentStanding.wins} • D {season.currentStanding.draws} • L{' '}
              {season.currentStanding.losses} | GD {season.currentStanding.goalDifference}
            </Text>
            <Text style={styles.standingMeta}>Trend: {season.currentStanding.trend.toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.tierList}>
          {season.ladderTiers.map((tier) => {
            const isActive = tier.id === season.enrolledTierId;
            return (
              <View key={tier.id} style={[styles.tierCard, isActive && styles.tierCardActive]}>
                <View style={styles.tierHeader}>
                  <View>
                    <Text style={styles.tierName}>{tier.name}</Text>
                    <Text style={styles.tierDescription}>{tier.description}</Text>
                  </View>
                  <View>
                    <Text style={styles.tierCredits}>{tier.requiredCredits} credits</Text>
                    {isActive && <Text style={styles.activeBadge}>Active</Text>}
                  </View>
                </View>
                <View style={styles.tierInsights}>
                  <Text style={styles.tierMeta}>
                    Promotion spots: {tier.promotionSlots} • Relegation: {tier.relegationSlots}
                  </Text>
                  {tier.analyticsHighlights.map((highlight) => (
                    <Text key={highlight} style={styles.tierInsightBullet}>
                      • {highlight}
                    </Text>
                  ))}
                </View>
                {!isActive && (
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

        {season.recentInsights.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>Latest insights</Text>
            {season.recentInsights.map((insight) => (
              <Text key={insight} style={styles.ladderSubtitle}>
                • {insight}
              </Text>
            ))}
          </View>
        )}
      </View>

      {featuredBroadcast && (
        <View style={styles.broadcastCard}>
          <Text style={styles.sectionHeading}>Featured broadcast</Text>
          <Text style={styles.broadcastTitle}>{featuredBroadcast.title}</Text>
          <Text style={styles.broadcastMeta}>
            Hosted by {featuredBroadcast.host} • {new Date(featuredBroadcast.scheduledFor).toLocaleString()}
          </Text>
          <Text style={styles.broadcastSummary}>{featuredBroadcast.summary}</Text>
          <Text style={styles.broadcastLink}>{featuredBroadcast.streamUrl}</Text>
        </View>
      )}

      <View style={styles.reelCardContainer}>
        <Text style={styles.sectionHeading}>Weekly highlight reels</Text>
        {highlightedReels.map((reel) => (
          <View key={reel.id} style={styles.reelCard}>
            <Text style={styles.reelTitle}>{reel.title}</Text>
            <Text style={styles.reelMeta}>{reel.description}</Text>
            <Text style={styles.reelMeta}>
              Published {new Date(reel.publishedAt).toLocaleDateString()} • {reel.clipIds.length} clips
            </Text>
          </View>
        ))}
      </View>
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
  matchCenterSection: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubheading: {
    fontSize: 13,
    color: '#475569',
  },
  tokensCard: {
    backgroundColor: '#eef2ff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  tokensHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokensTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#312e81',
  },
  tokensHelper: {
    fontSize: 12,
    color: '#4338ca',
  },
  tokensValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4338ca',
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
  broadcastCard: {
    marginTop: 24,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  broadcastTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  broadcastMeta: {
    fontSize: 12,
    color: '#475569',
  },
  broadcastSummary: {
    fontSize: 13,
    color: '#1f2937',
  },
  broadcastLink: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  reelCardContainer: {
    marginTop: 24,
    gap: 12,
  },
  reelCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  reelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
  },
  reelMeta: {
    fontSize: 12,
    color: '#b45309',
  },
});


export default TournamentScreen;
