import React, { useCallback } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { RootState, AppDispatch } from '../store';
import { removeTeam } from '../store/slices/teamsSlice';
import TeamCard from '../components/TeamCard';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const TeamScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const teams = useSelector((state: RootState) => state.teams.teams);
  const isPremium = useSelector((state: RootState) => state.premium.isPremium);

  const handleCreateTeam = useCallback(() => {
    navigation.navigate('CreateTeam');
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Teams</Text>
      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TeamCard team={item} onRemove={() => dispatch(removeTeam(item.id))} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Create your first team to get started.</Text>}
      />
      {isPremium ? (
        <AdvancedAnalytics teams={teams} />
      ) : (
        <View style={styles.premiumUpsell}>
          <Text style={styles.premiumTitle}>Premium analytics locked</Text>
          <Text style={styles.premiumDescription}>
            Upgrade on your profile screen to access deeper stats and performance trends.
          </Text>
        </View>
      )}
      <Button title="Create New Team" onPress={handleCreateTeam} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#777',
    marginVertical: 24,
  },
  premiumUpsell: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f4f6fb',
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  premiumDescription: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default TeamScreen;
