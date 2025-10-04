import React from 'react';
import { StyleSheet, View, Text, FlatList, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BannerAd } from 'react-native-google-mobile-ads';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import TeamCard from '../components/TeamCard';
import { defaultBannerSize, teamBannerAdUnitId } from '../config/ads';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { removeTeam, Team } from '../store/slices/teamsSlice';
import { RootStackParamList } from '../types/navigation';

type TeamScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Team'>;

const TeamScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const teams = useAppSelector((state) => state.teams.teams);
  const navigation = useNavigation<TeamScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>My Teams</Text>
        <FlatList
          data={teams}
          keyExtractor={(item: Team) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }: { item: Team }) => (
            <TeamCard team={item} onRemove={() => dispatch(removeTeam(item.id))} />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Create your first team to get started.</Text>}
        />
        <Button title="Create New Team" onPress={() => navigation.navigate('CreateTeam')} />
      </View>
      <View style={styles.adContainer}>
        <BannerAd unitId={teamBannerAdUnitId} size={defaultBannerSize} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 24,
  },
  adContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
});

export default TeamScreen;
