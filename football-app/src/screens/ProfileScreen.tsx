import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

import { useAppSelector } from '../store/hooks';
import type { RootState } from '../store';

const ProfileScreen: React.FC = () => {
  const credits = useAppSelector((state: RootState) => state.wallet.credits);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.description}>Manage your account details here.</Text>

        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Wallet credits</Text>
          <Text style={styles.walletValue}>{credits}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  walletCard: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  walletLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  walletValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#16a34a',
  },
});

export default ProfileScreen;
