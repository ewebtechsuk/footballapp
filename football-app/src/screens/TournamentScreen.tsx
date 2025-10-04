import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Alert,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { debit } from '../store/slices/walletSlice';
import { syncWallet } from '../services/payments';

type Tournament = {
  id: string;
  name: string;
  location: string;
  entryFee: number;
  startDate: string;
};

const TournamentScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const wallet = useAppSelector((state) => state.wallet);
  const { balance } = wallet;

  useEffect(() => {
    syncWallet(wallet).catch((error) => {
      console.warn('Wallet sync failed', error);
    });
  }, [wallet]);

  const tournaments = useMemo<Tournament[]>(
    () => [
      {
        id: 'premier-cup',
        name: 'Premier Cup',
        location: 'London',
        entryFee: 25,
        startDate: '2024-09-02',
      },
      {
        id: 'continental-clash',
        name: 'Continental Clash',
        location: 'Paris',
        entryFee: 40,
        startDate: '2024-10-14',
      },
      {
        id: 'legends-league',
        name: 'Legends League',
        location: 'Rome',
        entryFee: 15,
        startDate: '2024-11-01',
      },
    ],
    [],
  );

  const handleEnterTournament = useCallback(
    (tournament: Tournament) => {
      if (tournament.entryFee > balance) {
        Alert.alert(
          'Insufficient Balance',
          'You do not have enough funds in your wallet to enter this tournament.',
        );
        return;
      }

      dispatch(
        debit({
          amount: tournament.entryFee,
          description: `Tournament entry: ${tournament.name}`,
        }),
      );

      Alert.alert(
        'Registered',
        `You have successfully entered the ${tournament.name}. Good luck!`,
      );
    },
    [balance, dispatch],
  );

  const renderTournament: ListRenderItem<Tournament> = useCallback(
    ({ item }) => (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.entryFee}>Entry Fee: ${item.entryFee.toFixed(2)}</Text>
        </View>
        <Text style={styles.cardSubTitle}>{item.location}</Text>
        <Text style={styles.cardBody}>Starts: {item.startDate}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => handleEnterTournament(item)}
          style={styles.enterButton}
        >
          <Text style={styles.enterButtonText}>Enter</Text>
        </TouchableOpacity>
      </View>
    ),
    [handleEnterTournament],
  );

  return (
    <View style={styles.container}>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balanceValue}>${balance.toFixed(2)}</Text>
      </View>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={tournaments}
        keyExtractor={(item) => item.id}
        renderItem={renderTournament}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    padding: 16,
  },
  balanceContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  listContent: {
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flexShrink: 1,
    paddingRight: 12,
  },
  cardSubTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 16,
  },
  entryFee: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  enterButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  enterButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TournamentScreen;
