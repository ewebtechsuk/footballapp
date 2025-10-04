import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Button,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNIap from 'react-native-iap';
import type { Product, Purchase } from 'react-native-iap';
import {
  setProducts,
  setLoading,
  setPremium,
  setError,
  setLastTransactionId,
  PREMIUM_ENTITLEMENT_STORAGE_KEY,
} from '../store/slices/premiumSlice';
import type { RootState } from '../store';

const PRODUCT_IDS = Platform.select({
  ios: ['football_premium'],
  android: ['football_premium'],
}) ?? [];

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { products, loading, isPremium, error, lastTransactionId } = useSelector(
    (state: RootState) => state.premium
  );
  const [initialised, setInitialised] = useState(false);

  const hydrateEntitlement = useCallback(async () => {
    const storedValue = await AsyncStorage.getItem(PREMIUM_ENTITLEMENT_STORAGE_KEY);
    if (storedValue === 'true') {
      dispatch(setPremium(true));
    }
  }, [dispatch]);

  const finishAndUnlock = useCallback(
    async (purchase: Purchase) => {
      try {
        await RNIap.finishTransaction({ purchase, isConsumable: false });
      } catch (finishError) {
        // Still continue to mark premium even if finishing fails; logs are handled by RN IAP
      }
      await AsyncStorage.setItem(PREMIUM_ENTITLEMENT_STORAGE_KEY, 'true');
      dispatch(setPremium(true));
      dispatch(setLastTransactionId(purchase.transactionId ?? null));
      Alert.alert('Premium unlocked', 'Enjoy your new analytics tools!');
    },
    [dispatch]
  );

  useEffect(() => {
    let purchaseUpdateSubscription: RNIap.PurchaseUpdatedListener | undefined;
    let purchaseErrorSubscription: RNIap.PurchaseErrorListener | undefined;

    const initialise = async () => {
      dispatch(setError(null));
      dispatch(setLoading(true));
      try {
        await hydrateEntitlement();
        const connected = await RNIap.initConnection();
        if (Platform.OS === 'android') {
          await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
        }
        if (connected) {
          const availableProducts = await RNIap.getProducts(PRODUCT_IDS);
          dispatch(setProducts(availableProducts));
        }
      } catch (initialiseError) {
        dispatch(setError((initialiseError as Error).message));
      } finally {
        setInitialised(true);
        dispatch(setLoading(false));
      }

      purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(async (purchase) => {
        if (purchase.transactionReceipt) {
          await finishAndUnlock(purchase);
        }
      });

      purchaseErrorSubscription = RNIap.purchaseErrorListener((purchaseError) => {
        dispatch(setError(purchaseError.message));
      });
    };

    initialise();

    return () => {
      purchaseUpdateSubscription?.remove();
      purchaseErrorSubscription?.remove();
      RNIap.endConnection();
    };
  }, [dispatch, finishAndUnlock, hydrateEntitlement]);

  const requestPurchase = useCallback(
    async (productId: string) => {
      try {
        dispatch(setError(null));
        dispatch(setLoading(true));
        await RNIap.requestPurchase({ sku: productId });
      } catch (purchaseError) {
        dispatch(setError((purchaseError as Error).message));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const restorePurchases = useCallback(async () => {
    try {
      dispatch(setError(null));
      dispatch(setLoading(true));
      const purchases = await RNIap.getAvailablePurchases();
      const premiumPurchase = purchases.find((purchase) =>
        PRODUCT_IDS.includes(purchase.productId)
      );
      if (premiumPurchase) {
        await finishAndUnlock(premiumPurchase);
        Alert.alert('Restored', 'Your premium access has been restored.');
      } else {
        Alert.alert('No purchases', 'We could not find an active premium purchase for this account.');
      }
    } catch (restoreError) {
      dispatch(setError((restoreError as Error).message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, finishAndUnlock]);

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Text style={styles.productTitle}>{item.title || 'Premium Membership'}</Text>
      <Text style={styles.productDescription}>{item.description || 'Unlock pro analytics and more.'}</Text>
      <Text style={styles.productPrice}>{item.localizedPrice || '$4.99'}</Text>
      <Button title="Upgrade" onPress={() => requestPurchase(item.productId)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account status</Text>
        <Text style={styles.sectionBody}>{isPremium ? 'Premium' : 'Free'} member</Text>
        {lastTransactionId ? (
          <Text style={styles.transaction}>Last transaction: {lastTransactionId}</Text>
        ) : null}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Premium access</Text>
        {loading && !initialised ? <ActivityIndicator style={styles.loading} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {isPremium ? (
          <Text style={styles.sectionBody}>
            Thank you for supporting Football App! Enjoy unlimited analytics across your squads.
          </Text>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.productId}
            renderItem={renderProduct}
            ListEmptyComponent={
              initialised ? (
                <Text style={styles.sectionBody}>
                  No purchasable products were returned. Double check your store configuration.
                </Text>
              ) : null
            }
          />
        )}
        <View style={styles.restoreContainer}>
          <Button title="Restore purchases" onPress={restorePurchases} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 15,
    color: '#444',
  },
  transaction: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 13,
  },
  loading: {
    marginVertical: 16,
  },
  error: {
    color: '#d14343',
    marginBottom: 12,
  },
  productCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  productDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  restoreContainer: {
    marginTop: 12,
  },
});

export default ProfileScreen;
