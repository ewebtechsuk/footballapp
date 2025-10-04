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
import type { Product, ProductPurchase, PurchaseError } from 'react-native-iap';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { creditWallet } from '../store/slices/walletSlice';
import type { CreditPackage } from '../config/purchases';
import {
  PREMIUM_FEATURE_BENEFITS,
  PREMIUM_PRODUCT_IDS,
} from '../config/purchases';
import {
  getCreditPackages,
  purchaseCreditPackage,
  restorePurchaseHistory,
  syncWallet,
} from '../services/payments';
import {
  endIapConnection,
  fetchProducts,
  finishPremiumPurchase,
  initIapConnection,
  registerPurchaseListener,
  requestPremiumPurchase,
  restorePremiumPurchases,
} from '../services/iap';
import {
  loadPremiumEntitlement,
  persistPremiumEntitlement,
} from '../services/premiumStorage';
import {
  grantPremium,
  hydratePremium,
} from '../store/slices/premiumSlice';

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const credits = useAppSelector((state) => state.wallet.credits);
  const premium = useAppSelector((state) => state.premium);

  const [availablePackages, setAvailablePackages] = useState<CreditPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [processingPackageId, setProcessingPackageId] = useState<string | null>(null);
  const [restoringCreditPurchases, setRestoringCreditPurchases] = useState(false);
  const [premiumProducts, setPremiumProducts] = useState<Product[]>([]);
  const [loadingPremium, setLoadingPremium] = useState(true);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [unlockingProductId, setUnlockingProductId] = useState<string | null>(null);
  const [restoringPremium, setRestoringPremium] = useState(false);

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

  useEffect(() => {
    let mounted = true;
    let removePurchaseListener: (() => void) | undefined;

    const hydrateEntitlement = async () => {
      const storedEntitlement = await loadPremiumEntitlement();
      if (storedEntitlement && mounted) {
        dispatch(hydratePremium(storedEntitlement));
      }
    };

    const bootstrapPremium = async () => {
      await hydrateEntitlement();

      const connected = await initIapConnection();
      if (!connected) {
        if (mounted) {
          setPremiumError('Unable to connect to the billing service right now.');
          setLoadingPremium(false);
        }
        return;
      }

      removePurchaseListener = registerPurchaseListener(
        async (purchase: ProductPurchase) => {
          if (!PREMIUM_PRODUCT_IDS.includes(purchase.productId)) {
            return;
          }

          const receipt = purchase.transactionReceipt;
          if (!receipt) {
            return;
          }

          await finishPremiumPurchase(purchase);

          const purchaseDateIso = purchase.transactionDate
            ? new Date(Number(purchase.transactionDate)).toISOString()
            : new Date().toISOString();

          dispatch(
            grantPremium({
              productId: purchase.productId,
              purchaseDate: purchaseDateIso,
            }),
          );

          await persistPremiumEntitlement({
            entitled: true,
            entitlementProductId: purchase.productId,
            lastPurchaseDate: purchaseDateIso,
          });

          if (mounted) {
            setUnlockingProductId(null);
            setPremiumError(null);
          }

          Alert.alert(
            'Premium unlocked',
            'You now have access to all premium features.',
          );
        },
        (error: PurchaseError) => {
          console.error('Premium purchase failed', error);
          if (mounted) {
            setPremiumError(error.message);
            setUnlockingProductId(null);
          }
        },
      );

      const products = await fetchProducts(PREMIUM_PRODUCT_IDS);
      if (mounted) {
        setPremiumProducts(products);
        setLoadingPremium(false);
      }
    };

    bootstrapPremium();

    return () => {
      mounted = false;
      removePurchaseListener?.();
      endIapConnection();
    };
  }, [dispatch]);

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

  const handleRestoreCreditPurchases = async () => {
    if (restoringCreditPurchases) {
      return;
    }

    setRestoringCreditPurchases(true);
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
      setRestoringCreditPurchases(false);
    }
  };

  const handleUnlockPremium = async (productId: string) => {
    if (unlockingProductId) {
      return;
    }

    setPremiumError(null);
    setUnlockingProductId(productId);
    try {
      await requestPremiumPurchase(productId);
    } catch (error) {
      console.error('Failed to initiate premium purchase', error);
      setPremiumError('Unable to start the purchase flow. Please try again.');
      setUnlockingProductId(null);
    }
  };

  const handleRestorePremium = async () => {
    if (restoringPremium) {
      return;
    }

    setRestoringPremium(true);
    try {
      const purchases = await restorePremiumPurchases();
      const premiumPurchase = purchases.find((purchase) =>
        PREMIUM_PRODUCT_IDS.includes(purchase.productId),
      );

      if (!premiumPurchase) {
        Alert.alert('No premium purchases', 'We could not find a premium unlock to restore.');
        return;
      }

      await finishPremiumPurchase(premiumPurchase);

      const purchaseDateIso = premiumPurchase.transactionDate
        ? new Date(Number(premiumPurchase.transactionDate)).toISOString()
        : new Date().toISOString();

      dispatch(
        grantPremium({
          productId: premiumPurchase.productId,
          purchaseDate: purchaseDateIso,
        }),
      );

      await persistPremiumEntitlement({
        entitled: true,
        entitlementProductId: premiumPurchase.productId,
        lastPurchaseDate: purchaseDateIso,
      });

      Alert.alert('Premium restored', 'Welcome back! Premium access has been restored.');
    } catch (error) {
      console.error('Failed to restore premium', error);
      Alert.alert(
        'Restore failed',
        'We were unable to confirm a previous premium purchase. Please try again later.',
      );
    } finally {
      setRestoringPremium(false);
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
          style={[styles.restoreButton, restoringCreditPurchases && styles.restoreButtonDisabled]}
          accessibilityRole="button"
          accessibilityState={{ disabled: restoringCreditPurchases }}
          disabled={restoringCreditPurchases}
          onPress={handleRestoreCreditPurchases}
        >
          <Text style={styles.restoreButtonText}>
            {restoringCreditPurchases ? 'Restoring purchases…' : 'Restore credit purchases'}
          </Text>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Football App Premium</Text>
          <Text style={styles.sectionSubtitle}>
            Unlock pro-level tools to better manage and analyze your team.
          </Text>
        </View>

        {loadingPremium ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#2563eb" />
          </View>
        ) : premium.entitled ? (
          <View style={styles.premiumStatusCard}>
            <Text style={styles.premiumStatusTitle}>Premium active</Text>
            {premium.lastPurchaseDate && (
              <Text style={styles.premiumStatusSubtitle}>
                Last confirmed {new Date(premium.lastPurchaseDate).toLocaleDateString()}
              </Text>
            )}

            <View style={styles.benefitsList}>
              {PREMIUM_FEATURE_BENEFITS.map((benefit) => (
                <View key={benefit} style={styles.benefitItem}>
                  <Text style={styles.benefitBullet}>•</Text>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.restoreButton, restoringPremium && styles.restoreButtonDisabled]}
              accessibilityRole="button"
              accessibilityState={{ disabled: restoringPremium }}
              disabled={restoringPremium}
              onPress={handleRestorePremium}
            >
              <Text style={styles.restoreButtonText}>
                {restoringPremium ? 'Checking entitlement…' : 'Revalidate premium access'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.premiumUnlockContainer}>
            {premiumError && <Text style={styles.errorText}>{premiumError}</Text>}
            {premiumProducts.length ? (
              premiumProducts.map((product) => {
                const isUnlocking = unlockingProductId === product.productId;
                return (
                  <TouchableOpacity
                    key={product.productId}
                    style={styles.premiumProductCard}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isUnlocking }}
                    disabled={isUnlocking}
                    onPress={() => handleUnlockPremium(product.productId)}
                  >
                    <Text style={styles.premiumProductTitle}>{product.title}</Text>
                    <Text style={styles.premiumProductPrice}>{product.localizedPrice}</Text>
                    {!!product.description && (
                      <Text style={styles.premiumProductDescription}>{product.description}</Text>
                    )}
                    <Text style={styles.premiumCta}>
                      {isUnlocking ? 'Processing…' : 'Unlock premium'}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.emptyPremiumText}>
                Premium products are not available yet. Please try again later.
              </Text>
            )}

            <TouchableOpacity
              style={[styles.restoreButton, restoringPremium && styles.restoreButtonDisabled]}
              accessibilityRole="button"
              accessibilityState={{ disabled: restoringPremium }}
              disabled={restoringPremium}
              onPress={handleRestorePremium}
            >
              <Text style={styles.restoreButtonText}>
                {restoringPremium ? 'Checking entitlement…' : 'Restore premium purchases'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.disclaimer}>
          In-app purchases require a configured billing provider. Use sandbox accounts when testing
          premium unlocks and wallet top ups.
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
  premiumStatusCard: {
    backgroundColor: '#1d4ed8',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  premiumStatusTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  premiumStatusSubtitle: {
    color: '#cbd5f5',
    fontSize: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  benefitBullet: {
    color: '#bfdbfe',
    fontSize: 16,
    lineHeight: 18,
  },
  benefitText: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
  },
  premiumUnlockContainer: {
    gap: 16,
  },
  premiumProductCard: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#eff6ff',
    gap: 8,
  },
  premiumProductTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  premiumProductPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  premiumProductDescription: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  premiumCta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  emptyPremiumText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ProfileScreen;
