import React from 'react';
import { StyleSheet, View, Text, FlatList, Button } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import AuthenticatedScreenContainer from '../components/AuthenticatedScreenContainer';
import TeamCard from '../components/TeamCard';
import BannerAdSlot from '../components/BannerAdSlot';
import { defaultBannerSize, teamBannerAdUnitId } from '../config/ads';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { removeTeam, Team } from '../store/slices/teamsSlice';
import { RootStackParamList } from '../types/navigation';

type TeamScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Team'>;


const TeamScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const teams = useAppSelector((state) => state.teams.teams);
  const isPremium = useAppSelector((state) => state.premium.entitled);
  const navigation = useNavigation<TeamScreenNavigationProp>();

  return (
    <AuthenticatedScreenContainer style={styles.safeArea} contentStyle={styles.content}>
      <Text style={styles.title}>My Teams</Text>
      <FlatList
        data={teams}
        keyExtractor={(item: Team) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }: { item: Team }) => (
          <TeamCard
            team={item}
            onRemove={() => dispatch(removeTeam(item.id))}
            onManage={() => navigation.navigate('ManageTeam', { teamId: item.id })}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Create your first team to get started.</Text>}
      />

      <View style={styles.analyticsSection}>
        <Text style={styles.analyticsTitle}>Team analytics</Text>
        {isPremium ? (
          <View style={styles.analyticsContent}>
            <Text style={styles.analyticsMetric}>Form (last 5): W • W • D • L • W</Text>
            <Text style={styles.analyticsMetric}>Projected seed: #3 in current tournament</Text>
            <Text style={styles.analyticsHint}>
              These insights refresh automatically after each recorded match.
            </Text>
          </View>
        ) : (
          <View style={styles.analyticsUpsell}>
            <Text style={styles.analyticsUpsellText}>
              Upgrade to Football App Premium to unlock match insights and projections.
            </Text>
            <Button title="View premium" onPress={() => navigation.navigate('Profile')} />
          </View>
        )}
      </View>
      <Button title="Create New Team" onPress={() => navigation.navigate('CreateTeam')} />
      <BannerAdSlot unitId={teamBannerAdUnitId} size={defaultBannerSize} />
    </AuthenticatedScreenContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
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
  analyticsSection: {
    marginVertical: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  analyticsContent: {
    gap: 8,
  },
  analyticsMetric: {
    fontSize: 14,
    color: '#1e293b',
  },
  analyticsHint: {
    fontSize: 12,
    color: '#64748b',
  },
  analyticsUpsell: {
    gap: 12,
  },
  analyticsUpsellText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
});


export default TeamScreen;
