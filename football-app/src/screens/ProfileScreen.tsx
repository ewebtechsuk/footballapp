import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { creditWallet } from '../store/slices/walletSlice';
import type { CreditPackage } from '../config/purchases';
import {
  getCreditPackages,
  purchaseCreditPackage,
  restorePurchaseHistory,
  syncWallet,
} from '../services/payments';

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const credits = useAppSelector((state) => state.wallet.credits);

  const [availablePackages, setAvailablePackages] = useState<CreditPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [processingPackageId, setProcessingPackageId] = useState<string | null>(null);
  const [restoringPurchases, setRestoringPurchases] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadPackages = async () => {
      try {
        const packages = await getCreditPackages();
        if (mounted) {
          setAvailablePackages(packages);
        }
      } catch (error) {
        console.error('Failed to load credit packages', error);
        if (mounted) {
          Alert.alert(
            'Unable to load purchases',
            'Please check your connection and try again shortly.',
          );
        }
      } finally {
        if (mounted) {
          setLoadingPackages(false);
        }
      }
    };

    loadPackages();

    return () => {
      mounted = false;
    };
  }, []);

  const walletSummary = useMemo(
    () => ({
      balance: credits,
      nextTierCredits: credits >= 500 ? null : 500 - credits,
    }),
    [credits],
  );

  const handlePurchase = async (selectedPackage: CreditPackage) => {
    if (processingPackageId) {
      return;
    }

    setProcessingPackageId(selectedPackage.id);
    try {
      const receipt = await purchaseCreditPackage(selectedPackage);
      const updatedCredits = credits + receipt.creditsAwarded;

      dispatch(creditWallet(receipt.creditsAwarded));
      await syncWallet({ credits: updatedCredits });

      Alert.alert(
        'Purchase complete',
        `Added ${receipt.creditsAwarded} credits to your wallet.`,
      );
    } catch (error) {
      console.error('Failed to process purchase', error);
      Alert.alert(
        'Purchase failed',
        'We were unable to complete the purchase. Please try again later.',
      );
    } finally {
      setProcessingPackageId(null);
    }
  };

  const handleRestorePurchases = async () => {
    if (restoringPurchases) {
      return;
    }

    setRestoringPurchases(true);
    try {
      const history = await restorePurchaseHistory();

      if (!history.length) {
        Alert.alert('No purchases found', 'There are no past purchases to restore.');
      } else {
        const creditsRestored = history.reduce(
          (total, receipt) => total + receipt.creditsAwarded,
          0,
        );

        if (creditsRestored > 0) {
          const updatedCredits = credits + creditsRestored;
          dispatch(creditWallet(creditsRestored));
          await syncWallet({ credits: updatedCredits });
        }

        Alert.alert(
          'Purchases restored',
          `Restored ${creditsRestored} credits from previous transactions.`,
        );
      }
    } catch (error) {
      console.error('Failed to restore purchases', error);
      Alert.alert(
        'Restore failed',
        'We were unable to restore purchases. Please try again shortly.',
      );
    } finally {
      setRestoringPurchases(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.description}>
            Manage your account details and top up your wallet to join more tournaments.
          </Text>
        </View>

        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Wallet credits</Text>
          <Text style={styles.walletValue}>{walletSummary.balance}</Text>
          {walletSummary.nextTierCredits !== null && (
            <Text style={styles.walletHelper}>
              Earn {walletSummary.nextTierCredits} more credits to unlock exclusive tournaments.
            </Text>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Buy more credits</Text>
          <Text style={styles.sectionSubtitle}>
            Choose a package to instantly add credits to your wallet.
          </Text>
        </View>

        {loadingPackages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#16a34a" />
          </View>
        ) : (
          <View style={styles.packagesGrid}>
            {availablePackages.map((creditPackage) => {
              const isProcessing = processingPackageId === creditPackage.id;
              return (
                <TouchableOpacity
                  key={creditPackage.id}
                  style={[styles.packageCard, creditPackage.bestValue && styles.packageCardBestValue]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isProcessing }}
                  disabled={isProcessing}
                  onPress={() => handlePurchase(creditPackage)}
                >
                  {creditPackage.bestValue && <Text style={styles.popularBadge}>Best value</Text>}
                  <Text style={styles.packageName}>{creditPackage.name}</Text>
                  <Text style={styles.packageDescription}>{creditPackage.description}</Text>
                  <Text style={styles.packageCredits}>{creditPackage.credits} credits</Text>
                  <Text style={styles.packagePrice}>{creditPackage.priceLabel}</Text>
                  <Text style={styles.packageCta}>
                    {isProcessing ? 'Processing…' : 'Buy now'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={[styles.restoreButton, restoringPurchases && styles.restoreButtonDisabled]}
          accessibilityRole="button"
          accessibilityState={{ disabled: restoringPurchases }}
          disabled={restoringPurchases}
          onPress={handleRestorePurchases}
        >
          <Text style={styles.restoreButtonText}>
            {restoringPurchases ? 'Restoring purchases…' : 'Restore purchases'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          In-app purchases are simulated in this build. Connect your billing provider to enable
          live transactions.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  description: {
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
  walletCard: {
    backgroundColor: '#f3f4f6',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  walletLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  walletValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#16a34a',
  },
  walletHelper: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  sectionHeader: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubtitle: {
    color: '#6b7280',
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  packageCard: {
    flexBasis: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  packageCardBestValue: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#16a34a',
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    textTransform: 'uppercase',
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  packageDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  packageCredits: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16a34a',
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  packageCta: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  restoreButton: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#111827',
  },
  restoreButtonDisabled: {
    opacity: 0.6,
  },
  restoreButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ProfileScreen;
