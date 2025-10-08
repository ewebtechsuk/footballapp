import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DatePickerAndroid,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  DatePickerIOS,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Product, ProductPurchase, PurchaseError } from 'react-native-iap';

import AuthenticatedScreenContainer from '../components/AuthenticatedScreenContainer';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { creditWallet } from '../store/slices/walletSlice';
import type {
  ProfilePaymentMethod,
  ProfileState,
} from '../store/slices/profileSlice';
import {
  PROFILE_PAYMENT_METHODS,
  hydrateProfile,
  updateProfile,
} from '../store/slices/profileSlice';
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
import { loadStoredProfile, persistProfile as persistProfileToStorage } from '../services/profileStorage';
import {
  logoutUser,
  selectCurrentUser,
  updateBiometricPreference,
  updateMarketingPreference,
} from '../store/slices/authSlice';
import type { RootStackParamList } from '../types/navigation';
import { detectBiometricSupport, requestBiometricAuthentication } from '../services/biometricAuth';
import type { BiometricSupport } from '../services/biometricAuth';

const sanitizeProfile = (profile: ProfileState): ProfileState => ({
  fullName: profile.fullName.trim(),
  displayName: profile.displayName.trim(),
  mobileNumber: profile.mobileNumber.trim(),
  dateOfBirth: profile.dateOfBirth.trim(),
  bio: profile.bio.trim(),
  address: {
    line1: profile.address.line1.trim(),
    line2: profile.address.line2.trim(),
    city: profile.address.city.trim(),
    state: profile.address.state.trim(),
    postalCode: profile.address.postalCode.trim(),
    country: profile.address.country.trim(),
  },
  social: {
    twitter: profile.social.twitter.trim(),
    instagram: profile.social.instagram.trim(),
    facebook: profile.social.facebook.trim(),
    twitch: profile.social.twitch.trim(),
    youtube: profile.social.youtube.trim(),
    website: profile.social.website.trim(),
  },
  paymentMethods: profile.paymentMethods.filter(
    (method, index, methods): method is ProfilePaymentMethod =>
      PROFILE_PAYMENT_METHODS.includes(method) && methods.indexOf(method) === index,
  ),
});

const parseUkDate = (value: string): Date | null => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const year = Number(match[3]);

  const candidate = new Date(year, monthIndex, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== monthIndex ||
    candidate.getDate() !== day
  ) {
    return null;
  }

  return candidate;
};

const formatUkDate = (date: Date): string => {
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = `${date.getFullYear()}`;
  return `${day}/${month}/${year}`;
};

const defaultDob = () => {
  const today = new Date();
  return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
};

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const credits = useAppSelector((state) => state.wallet.credits);
  const premium = useAppSelector((state) => state.premium);
  const profile = useAppSelector((state) => state.profile);
  const currentUser = useAppSelector(selectCurrentUser);

  const [profileForm, setProfileForm] = useState<ProfileState>(profile);
  const [loadingProfileDetails, setLoadingProfileDetails] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<CreditPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [processingPackageId, setProcessingPackageId] = useState<string | null>(null);
  const [restoringCreditPurchases, setRestoringCreditPurchases] = useState(false);
  const [premiumProducts, setPremiumProducts] = useState<Product[]>([]);
  const [loadingPremium, setLoadingPremium] = useState(true);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [unlockingProductId, setUnlockingProductId] = useState<string | null>(null);
  const [restoringPremium, setRestoringPremium] = useState(false);
  const [iosDobPickerVisible, setIosDobPickerVisible] = useState(false);
  const [iosDobCandidate, setIosDobCandidate] = useState<Date>(defaultDob());
  const [updatingSelfMarketing, setUpdatingSelfMarketing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [checkingBiometricSupport, setCheckingBiometricSupport] = useState(false);
  const [biometricSupport, setBiometricSupport] = useState<BiometricSupport | null>(null);
  const [updatingBiometrics, setUpdatingBiometrics] = useState(false);

  useEffect(() => {
    let mounted = true;

    const hydrateProfileDetails = async () => {
      try {
        const storedProfile = await loadStoredProfile();
        if (!mounted) {
          return;
        }

        if (storedProfile) {
          dispatch(hydrateProfile(storedProfile));
        }
      } finally {
        if (mounted) {
          setLoadingProfileDetails(false);
        }
      }
    };

    hydrateProfileDetails();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    setProfileForm(profile);
  }, [profile]);

  useEffect(() => {
    let cancelled = false;

    const evaluateSupport = async () => {
      if (!currentUser) {
        setBiometricSupport(null);
        setCheckingBiometricSupport(false);
        return;
      }

      setCheckingBiometricSupport(true);
      const support = await detectBiometricSupport();
      if (!cancelled) {
        setBiometricSupport(support);
        setCheckingBiometricSupport(false);
      }
    };

    evaluateSupport();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const socialFieldConfigs = useMemo<
    Array<{ key: keyof ProfileState['social']; label: string; placeholder: string }>
  >(
    () => [
      { key: 'twitter', label: 'Twitter', placeholder: '@username' },
      { key: 'instagram', label: 'Instagram', placeholder: '@username' },
      { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/username' },
      { key: 'twitch', label: 'Twitch', placeholder: 'https://twitch.tv/username' },
      { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
      { key: 'website', label: 'Website', placeholder: 'https://yourdomain.com' },
    ],
    [],
  );

  const handleProfileFieldChange = (
    key: 'fullName' | 'displayName' | 'mobileNumber' | 'dateOfBirth' | 'bio',
  ) => (value: string) => {
    setProfileForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAddressChange = (key: keyof ProfileState['address']) => (value: string) => {
    setProfileForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [key]: value,
      },
    }));
  };

  const handleSocialChange = (key: keyof ProfileState['social']) => (value: string) => {
    setProfileForm((prev) => ({
      ...prev,
      social: {
        ...prev.social,
        [key]: value,
      },
    }));
  };

  const handleSelfMarketingPreference = useCallback(
    async (value: boolean) => {
      if (!currentUser || updatingSelfMarketing) {
        return;
      }

      setUpdatingSelfMarketing(true);
      try {
        await dispatch(
          updateMarketingPreference({ userId: currentUser.id, marketingOptIn: value }),
        ).unwrap();
      } catch (error) {
        const message = typeof error === 'string' ? error : 'Unable to update preference.';
        Alert.alert('Update failed', message);
      } finally {
        setUpdatingSelfMarketing(false);
      }
    },
    [currentUser, dispatch, updatingSelfMarketing],
  );

  const handleBiometricPreference = useCallback(
    async (enabled: boolean) => {
      if (!currentUser || updatingBiometrics) {
        return;
      }

      if (!biometricSupport) {
        Alert.alert(
          'Biometrics unavailable',
          'We could not verify your device\'s biometric capabilities. Please try again later.',
        );
        return;
      }

      if (enabled) {
        if (!biometricSupport.available) {
          Alert.alert(
            'Biometrics not supported',
            'This device does not support biometric authentication.',
          );
          return;
        }

        if (!biometricSupport.enrolled) {
          Alert.alert(
            'Biometrics not set up',
            'Set up Face ID, Touch ID or a fingerprint on your device before enabling biometric login.',
          );
          return;
        }

        const authResult = await requestBiometricAuthentication('Enable biometric login');
        if (!authResult.success) {
          Alert.alert(
            'Biometric check failed',
            authResult.error ?? 'We were unable to verify your identity with biometrics.',
          );
          return;
        }
      }

      setUpdatingBiometrics(true);
      try {
        await dispatch(
          updateBiometricPreference({ userId: currentUser.id, biometricEnabled: enabled }),
        ).unwrap();

        Alert.alert(
          enabled ? 'Biometric login enabled' : 'Biometric login disabled',
          enabled
            ? 'You can now use biometrics to sign in to Football App faster.'
            : 'Biometric sign in has been turned off for this account.',
        );
      } catch (error) {
        const message =
          typeof error === 'string'
            ? error
            : 'Unable to update your biometric preference. Please try again later.';
        Alert.alert('Update failed', message);
      } finally {
        setUpdatingBiometrics(false);
      }
    },
    [biometricSupport, currentUser, dispatch, updatingBiometrics],
  );

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Unable to sign out right now.';
      Alert.alert('Logout failed', message);
    } finally {
      setLoggingOut(false);
    }
  }, [dispatch]);

  const paymentMethodOptions = useMemo(
    () => [
      { key: 'card' as ProfilePaymentMethod, label: 'Credit or debit card' },
      { key: 'cash' as ProfilePaymentMethod, label: 'Cash' },
      { key: 'paypal' as ProfilePaymentMethod, label: 'PayPal' },
      { key: 'bank_transfer' as ProfilePaymentMethod, label: 'Bank transfer' },
    ],
    [],
  );

  const handleTogglePaymentMethod = useCallback((method: ProfilePaymentMethod) => {
    setProfileForm((prev) => {
      const isSelected = prev.paymentMethods.includes(method);
      return {
        ...prev,
        paymentMethods: isSelected
          ? prev.paymentMethods.filter((item) => item !== method)
          : [...prev.paymentMethods, method],
      };
    });
  }, []);

  const openIosDobPicker = useCallback(
    (date: Date) => {
      setIosDobCandidate(date);
      setIosDobPickerVisible(true);
    },
    [],
  );

  const handleOpenDobPicker = useCallback(async () => {
    const currentDob = parseUkDate(profileForm.dateOfBirth) ?? defaultDob();
    if (Platform.OS === 'android') {
      try {
        const result = await DatePickerAndroid.open({
          date: currentDob,
          mode: 'calendar',
          maxDate: new Date(),
        });

        if (result.action !== DatePickerAndroid.dismissedAction) {
          const { day, month, year } = result;
          if (
            typeof day === 'number' &&
            typeof month === 'number' &&
            typeof year === 'number'
          ) {
            const selectedDate = new Date(year, month, day);
            setProfileForm((prev) => ({
              ...prev,
              dateOfBirth: formatUkDate(selectedDate),
            }));
          }
        }
      } catch (error) {
        console.error('Failed to open date picker', error);
        Alert.alert(
          'Unable to open calendar',
          'We could not open the date picker. Please try again later.',
        );
      }
    } else {
      openIosDobPicker(currentDob);
    }
  }, [profileForm.dateOfBirth, openIosDobPicker]);

  const handleConfirmIosDob = useCallback(() => {
    setProfileForm((prev) => ({
      ...prev,
      dateOfBirth: formatUkDate(iosDobCandidate),
    }));
    setIosDobPickerVisible(false);
  }, [iosDobCandidate]);

  const handleCancelIosDob = useCallback(() => {
    setIosDobPickerVisible(false);
  }, []);

  const calculatedAge = useMemo(() => {
    const parsedDob = parseUkDate(profileForm.dateOfBirth);
    if (!parsedDob) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - parsedDob.getFullYear();
    const monthDiff = today.getMonth() - parsedDob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedDob.getDate())) {
      age -= 1;
    }

    return age >= 0 ? age : null;
  }, [profileForm.dateOfBirth]);

  const handleSaveProfile = async () => {
    if (savingProfile) {
      return;
    }

    const sanitizedProfile = sanitizeProfile(profileForm);
    sanitizedProfile.paymentMethods = PROFILE_PAYMENT_METHODS.filter((method) =>
      sanitizedProfile.paymentMethods.includes(method),
    );

    if (sanitizedProfile.dateOfBirth) {
      const parsedDob = parseUkDate(sanitizedProfile.dateOfBirth);
      if (!parsedDob) {
        Alert.alert('Invalid date of birth', 'Please use the DD/MM/YYYY format.');
        return;
      }

      if (parsedDob > new Date()) {
        Alert.alert('Invalid date of birth', 'Date of birth cannot be in the future.');
        return;
      }

      sanitizedProfile.dateOfBirth = formatUkDate(parsedDob);
    }

    setSavingProfile(true);
    try {
      dispatch(updateProfile(sanitizedProfile));
      await persistProfileToStorage(sanitizedProfile);
      Alert.alert('Profile updated', 'Your profile details have been saved.');
    } catch (error) {
      console.error('Failed to save profile details', error);
      Alert.alert(
        'Save failed',
        'We were unable to store your profile information. Please try again later.',
      );
    } finally {
      setSavingProfile(false);
    }
  };

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
    <AuthenticatedScreenContainer style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.description}>
            Manage your account details and top up your wallet to join more tournaments.
          </Text>
        </View>

        {currentUser ? (
          <View style={styles.accountCard}>
            <View style={styles.accountHeader}>
              <View>
                <Text style={styles.accountName}>{currentUser.fullName}</Text>
                <Text style={styles.accountEmail}>{currentUser.email}</Text>
              </View>
              <Text
                style={[
                  styles.accountRoleBadge,
                  currentUser.role === 'admin'
                    ? styles.accountRoleBadgeAdmin
                    : styles.accountRoleBadgeManager,
                ]}
              >
                {currentUser.role === 'admin' ? 'Admin' : 'Manager'}
              </Text>
            </View>
            <View style={styles.accountRow}>
              <View style={styles.accountRowCopy}>
                <Text style={styles.accountRowLabel}>Marketing updates</Text>
                <Text style={styles.accountRowDescription}>
                  {currentUser.marketingOptIn
                    ? 'You are subscribed to announcements and offers.'
                    : 'Enable this to hear about new tournaments and partners.'}
                </Text>
              </View>
              <Switch
                value={currentUser.marketingOptIn}
                onValueChange={handleSelfMarketingPreference}
                disabled={updatingSelfMarketing}
              />
            </View>
            <View style={styles.accountActions}>
              {currentUser.role === 'admin' ? (
                <TouchableOpacity
                  style={[styles.accountButton, styles.accountPrimaryButton]}
                  onPress={() => navigation.navigate('AdminDashboard')}
                >
                  <Text style={styles.accountPrimaryButtonText}>Open admin centre</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.accountButton, styles.accountSecondaryButton]}
                onPress={handleLogout}
                disabled={loggingOut}
              >
                <Text style={styles.accountSecondaryButtonText}>
                  {loggingOut ? 'Signing out…' : 'Sign out'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {currentUser ? (
          <View style={styles.securityCard}>
            <Text style={styles.sectionTitle}>Security settings</Text>
            <Text style={styles.sectionSubtitle}>
              Keep your account protected and sign in faster with biometrics.
            </Text>
            <View style={styles.securityRow}>
              <View style={styles.securityCopy}>
                <Text style={styles.securityLabel}>Biometric login</Text>
                <Text style={styles.securityDescription}>
                  {currentUser.biometricEnabled
                    ? 'Use your fingerprint or face to sign in without typing your password.'
                    : 'Enable Touch ID, Face ID or fingerprint unlock to sign in more quickly.'}
                </Text>
                {biometricSupport && !biometricSupport.available ? (
                  <Text style={styles.securityHelper}>
                    This device does not support biometric authentication.
                  </Text>
                ) : null}
                {biometricSupport && biometricSupport.available && !biometricSupport.enrolled ? (
                  <Text style={styles.securityHelper}>
                    Set up biometrics in your device settings before turning this on.
                  </Text>
                ) : null}
              </View>
              {checkingBiometricSupport ? (
                <ActivityIndicator color="#2563eb" />
              ) : (
                <Switch
                  value={currentUser.biometricEnabled}
                  onValueChange={handleBiometricPreference}
                  disabled={
                    updatingBiometrics ||
                    !biometricSupport ||
                    !biometricSupport.available ||
                    (!biometricSupport.enrolled && !currentUser.biometricEnabled)
                  }
                />
              )}
            </View>
          </View>
        ) : null}

        <View style={styles.profileCard}>
          <Text style={styles.sectionTitle}>Account details</Text>
          <Text style={styles.sectionSubtitle}>
            Keep your personal information and social links up to date.
          </Text>

          {loadingProfileDetails ? (
            <View style={styles.profileLoadingContainer}>
              <ActivityIndicator color="#2563eb" />
            </View>
          ) : (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full name</Text>
                <TextInput
                  style={styles.textInput}
                  value={profileForm.fullName}
                  onChangeText={handleProfileFieldChange('fullName')}
                  placeholder="Enter your full legal name"
                  autoCapitalize="words"
                  accessibilityLabel="Full name"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Display name</Text>
                <TextInput
                  style={styles.textInput}
                  value={profileForm.displayName}
                  onChangeText={handleProfileFieldChange('displayName')}
                  placeholder="Name shown to other managers"
                  autoCapitalize="words"
                  accessibilityLabel="Display name"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Mobile number</Text>
                <TextInput
                  style={styles.textInput}
                  value={profileForm.mobileNumber}
                  onChangeText={handleProfileFieldChange('mobileNumber')}
                  placeholder="e.g. +44 7123 456 789"
                  keyboardType="phone-pad"
                  accessibilityLabel="Mobile number"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Date of birth</Text>
                <TouchableOpacity
                  style={styles.dobPickerButton}
                  onPress={handleOpenDobPicker}
                  accessibilityRole="button"
                  accessibilityLabel="Select date of birth"
                >
                  <Text
                    style={
                      profileForm.dateOfBirth
                        ? styles.dobPickerText
                        : [styles.dobPickerText, styles.dobPickerPlaceholder]
                    }
                  >
                    {profileForm.dateOfBirth || 'DD/MM/YYYY'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.fieldHelper}>Use the UK format DD/MM/YYYY.</Text>
                {typeof calculatedAge === 'number' && (
                  <Text style={styles.ageHelper}>
                    Player age: <Text style={styles.ageValue}>{calculatedAge}</Text>
                  </Text>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>About you</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={profileForm.bio}
                  onChangeText={handleProfileFieldChange('bio')}
                  placeholder="Share a short bio to introduce yourself."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  accessibilityLabel="About you"
                />
              </View>

              <Text style={styles.groupHeading}>Mailing address</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Address line 1</Text>
                <TextInput
                  style={styles.textInput}
                  value={profileForm.address.line1}
                  onChangeText={handleAddressChange('line1')}
                  placeholder="Street address"
                  autoCapitalize="words"
                  accessibilityLabel="Address line 1"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Address line 2</Text>
                <TextInput
                  style={styles.textInput}
                  value={profileForm.address.line2}
                  onChangeText={handleAddressChange('line2')}
                  placeholder="Apartment, suite, etc. (optional)"
                  autoCapitalize="words"
                  accessibilityLabel="Address line 2"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput
                  style={styles.textInput}
                  value={profileForm.address.city}
                  onChangeText={handleAddressChange('city')}
                  placeholder="City"
                  autoCapitalize="words"
                  accessibilityLabel="City"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>State / Province</Text>
                <TextInput
                  style={styles.textInput}
                  value={profileForm.address.state}
                  onChangeText={handleAddressChange('state')}
                  placeholder="State or province"
                  autoCapitalize="characters"
                  accessibilityLabel="State or province"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Postal code</Text>
                <TextInput
                  style={styles.textInput}
                  value={profileForm.address.postalCode}
                  onChangeText={handleAddressChange('postalCode')}
                  placeholder="ZIP or postal code"
                  autoCapitalize="characters"
                  accessibilityLabel="Postal code"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Country</Text>
                <TextInput
                  style={styles.textInput}
                  value={profileForm.address.country}
                  onChangeText={handleAddressChange('country')}
                  placeholder="Country"
                  autoCapitalize="words"
                  accessibilityLabel="Country"
                />
              </View>

              <Text style={styles.groupHeading}>Social links</Text>

              {socialFieldConfigs.map((field) => (
                <View key={field.key} style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profileForm.social[field.key]}
                    onChangeText={handleSocialChange(field.key)}
                    placeholder={field.placeholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel={`${field.label} link`}
                  />
                </View>
              ))}

              <Text style={styles.groupHeading}>Payment methods</Text>

              <View style={[styles.fieldGroup, styles.paymentGroup]}>
                <Text style={styles.fieldHelper}>
                  Select the payment types you accept for competition entry fees.
                </Text>
                <View style={styles.paymentOptionsContainer}>
                  {paymentMethodOptions.map((option) => {
                    const selected = profileForm.paymentMethods.includes(option.key);
                    return (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.paymentOption,
                          selected && styles.paymentOptionSelected,
                        ]}
                        onPress={() => handleTogglePaymentMethod(option.key)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                      >
                        <Text
                          style={[
                            styles.paymentOptionLabel,
                            selected && styles.paymentOptionLabelSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, savingProfile && styles.saveButtonDisabled]}
                accessibilityRole="button"
                accessibilityState={{ disabled: savingProfile }}
                disabled={savingProfile}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>
                  {savingProfile ? 'Saving…' : 'Save profile'}
                </Text>
              </TouchableOpacity>
            </>
          )}
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
      {Platform.OS === 'ios' && (
        <Modal
          visible={iosDobPickerVisible}
          transparent
          animationType="slide"
          onRequestClose={handleCancelIosDob}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select date of birth</Text>
              <DatePickerIOS
                date={iosDobCandidate}
                mode="date"
                maximumDate={new Date()}
                onDateChange={setIosDobCandidate}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalSecondaryButton]}
                  onPress={handleCancelIosDob}
                  accessibilityRole="button"
                >
                  <Text style={styles.modalSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleConfirmIosDob}
                  accessibilityRole="button"
                >
                  <Text style={styles.modalPrimaryText}>Select</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </AuthenticatedScreenContainer>
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
    paddingBottom: 48,
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
  accountCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountName: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  accountEmail: {
    color: '#cbd5f5',
    marginTop: 4,
  },
  accountRoleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#0f172a',
  },
  accountRoleBadgeAdmin: {
    backgroundColor: '#fbbf24',
    color: '#0f172a',
  },
  accountRoleBadgeManager: {
    backgroundColor: '#bae6fd',
    color: '#0f172a',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  accountRowCopy: {
    flex: 1,
    paddingRight: 12,
  },
  accountRowLabel: {
    color: '#f8fafc',
    fontWeight: '700',
    marginBottom: 4,
  },
  accountRowDescription: {
    color: '#cbd5f5',
    fontSize: 13,
    lineHeight: 18,
  },
  accountActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  accountButton: {
    flexGrow: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountPrimaryButton: {
    backgroundColor: '#38bdf8',
  },
  accountPrimaryButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  accountSecondaryButton: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    backgroundColor: 'transparent',
  },
  accountSecondaryButtonText: {
    color: '#cbd5f5',
    fontWeight: '600',
  },
  securityCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    padding: 20,
    gap: 16,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  securityCopy: {
    flex: 1,
    paddingRight: 12,
  },
  securityLabel: {
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  securityDescription: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  securityHelper: {
    marginTop: 8,
    color: '#ef4444',
    fontSize: 12,
    lineHeight: 16,
  },
  profileCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    gap: 16,
  },
  profileLoadingContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 96,
    paddingTop: 12,
    paddingBottom: 12,
  },
  fieldHelper: {
    fontSize: 12,
    color: '#64748b',
  },
  dobPickerButton: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dobPickerText: {
    fontSize: 14,
    color: '#0f172a',
  },
  dobPickerPlaceholder: {
    color: '#94a3b8',
  },
  ageHelper: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
  },
  ageValue: {
    color: '#2563eb',
  },
  groupHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  paymentGroup: {
    gap: 12,
  },
  paymentOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    backgroundColor: '#fff',
  },
  paymentOptionSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#e0ecff',
  },
  paymentOptionLabel: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  paymentOptionLabelSelected: {
    color: '#1d4ed8',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  modalSecondaryButton: {
    backgroundColor: '#e2e8f0',
  },
  modalPrimaryText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalSecondaryText: {
    color: '#1e293b',
    fontWeight: '600',
  },
  saveButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
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
