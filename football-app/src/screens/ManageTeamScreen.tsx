import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../types/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { TeamSettings, defaultTeamSettings, updateTeam } from '../store/slices/teamsSlice';
import {
  DiscoveredTeam,
  TeamDiscoveryScope,
  searchTeams,
} from '../services/teamDiscovery';

type ManageTeamRouteProp = RouteProp<RootStackParamList, 'ManageTeam'>;
type ManageTeamNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ManageTeam'>;

const ManageTeamScreen: React.FC = () => {
  const route = useRoute<ManageTeamRouteProp>();
  const navigation = useNavigation<ManageTeamNavigationProp>();
  const dispatch = useAppDispatch();

  const team = useAppSelector((state) =>
    state.teams.teams.find((currentTeam) => currentTeam.id === route.params.teamId),
  );

  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [newMember, setNewMember] = useState('');
  const [settings, setSettings] = useState<TeamSettings>(defaultTeamSettings);
  const [usernameQuery, setUsernameQuery] = useState('');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<TeamDiscoveryScope>('local');
  const [isSearchingTeams, setIsSearchingTeams] = useState(false);
  const [searchResults, setSearchResults] = useState<DiscoveredTeam[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (team) {
      setTeamName(team.name);
      setMembers(team.members);
      setSettings(team.settings);
    }
  }, [team]);

  const invitationLink = useMemo(() => `https://football.app/team/${route.params.teamId}`, [route.params.teamId]);
  const invitationMessage = useMemo(() => {
    const trimmedName = teamName.trim();
    const displayName = trimmedName.length > 0 ? trimmedName : 'my Football App squad';

    return `Join ${displayName} on Football App! Use the link ${invitationLink} to connect and see upcoming matches.`;
  }, [invitationLink, teamName]);

  const toggleSetting = (key: keyof TeamSettings) => {
    setSettings((previousSettings) => ({
      ...previousSettings,
      [key]: !previousSettings[key],
    }));
  };

  const handleAddMember = () => {
    const trimmedMember = newMember.trim();

    if (!trimmedMember) {
      Alert.alert('Missing name', 'Enter a name or email before adding a new team member.');
      return;
    }

    if (members.some((member) => member.toLowerCase() === trimmedMember.toLowerCase())) {
      Alert.alert('Already added', `${trimmedMember} is already part of your roster.`);
      return;
    }

    setMembers((previousMembers) => [...previousMembers, trimmedMember]);
    setNewMember('');
  };

  const handleRemoveMember = (index: number) => {
    setMembers((previousMembers) => previousMembers.filter((_, memberIndex) => memberIndex !== index));
  };

  const handleInviteFromContacts = () => {
    Alert.alert(
      'Invite from contacts',
      'This would open your phone book so you can pick players to invite directly from your contacts.',
    );
  };

  const handleInviteByUsername = () => {
    const trimmedQuery = usernameQuery.trim();

    if (!trimmedQuery) {
      Alert.alert('Enter a username', 'Search for a player by typing their Football App username.');
      return;
    }

    Alert.alert('Invite sent', `${trimmedQuery} has been invited to join ${teamName || 'your team'}.`);
    setUsernameQuery('');
  };

  const performTeamSearch = useCallback(
    async (scope: TeamDiscoveryScope, query: string) => {
      setIsSearchingTeams(true);
      setSearchError(null);

      try {
        const results = await searchTeams(scope, query);
        setSearchResults(results);

        if (results.length === 0) {
          setSearchError('No teams match your search yet. Try broadening the keywords.');
        }
      } catch (error) {
        setSearchError('We could not load teams right now. Please try again shortly.');
      } finally {
        setIsSearchingTeams(false);
      }
    },
    [],
  );

  const handleSearchTeams = useCallback(() => {
    performTeamSearch(searchScope, teamSearchQuery.trim());
  }, [performTeamSearch, searchScope, teamSearchQuery]);

  const handleScopeChange = useCallback(
    (nextScope: TeamDiscoveryScope) => {
      if (nextScope === searchScope) {
        return;
      }

      setSearchScope(nextScope);
      performTeamSearch(nextScope, teamSearchQuery.trim());
    },
    [performTeamSearch, searchScope, teamSearchQuery],
  );

  useEffect(() => {
    performTeamSearch('local', '');
  }, [performTeamSearch]);

  const handleChallengeTeam = (opponent: DiscoveredTeam) => {
    const trimmedName = teamName.trim();
    const displayTeamName = trimmedName.length > 0 ? trimmedName : 'your team';

    Alert.alert(
      'Challenge sent',
      `We'll notify ${opponent.name} that ${displayTeamName} would like to arrange a match. We'll message you when they respond.`,
    );
  };

  const openLink = useCallback(async (url: string, unavailableMessage: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert('Unavailable', unavailableMessage);
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Unable to share', 'Something went wrong while trying to open the selected app.');
    }
  }, []);

  const encodedMessage = useMemo(() => encodeURIComponent(`${invitationMessage}`), [invitationMessage]);
  const encodedLink = useMemo(() => encodeURIComponent(invitationLink), [invitationLink]);

  const handleInviteViaWhatsApp = () =>
    openLink(
      `whatsapp://send?text=${encodedMessage}`,
      'WhatsApp does not appear to be installed on this device.',
    );

  const handleInviteViaEmail = () =>
    openLink(
      `mailto:?subject=${encodeURIComponent('Join my Football App team')}&body=${encodedMessage}`,
      'Email sharing is not available on this device.',
    );

  const handleInviteViaFacebook = () =>
    openLink(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}&quote=${encodedMessage}`,
      'Facebook sharing is not available right now.',
    );

  const handleInviteViaX = () =>
    openLink(
      `https://twitter.com/intent/tweet?text=${encodedMessage}`,
      'X (Twitter) is not available right now.',
    );

  const handleInviteViaInstagram = () =>
    openLink(
      `https://www.instagram.com/direct/new/?text=${encodedMessage}`,
      'Instagram Direct sharing is not available on this device.',
    );

  const handleSaveChanges = () => {
    const trimmedName = teamName.trim();

    if (!trimmedName) {
      Alert.alert('Missing team name', 'Add a team name so your players know who they are joining.');
      return;
    }

    const cleanedMembers = members
      .map((member) => member.trim())
      .filter((member) => member.length > 0);

    dispatch(
      updateTeam({
        id: route.params.teamId,
        name: trimmedName,
        members: cleanedMembers,
        settings,
      }),
    );

    Alert.alert('Team updated', `${trimmedName} has been updated.`);
    navigation.goBack();
  };

  if (!team) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Team not found</Text>
          <Text style={styles.subtitle}>The team you are trying to manage could not be located.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.title}>Team details</Text>
          <Text style={styles.subtitle}>Update your team name and roster.</Text>

          <View style={styles.formField}>
            <Text style={styles.label}>Team name</Text>
            <TextInput
              value={teamName}
              onChangeText={setTeamName}
              placeholder="e.g. Hackney FC"
              style={styles.input}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Current roster</Text>
            {members.length === 0 ? (
              <Text style={styles.emptyState}>No members yet. Start by inviting your first player.</Text>
            ) : (
              members.map((member, index) => (
                <View key={`${member}-${index}`} style={styles.memberRow}>
                  <Text style={styles.memberName}>{member}</Text>
                  <TouchableOpacity onPress={() => handleRemoveMember(index)}>
                    <Text style={styles.removeMemberText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <View style={styles.addMemberRow}>
            <TextInput
              value={newMember}
              onChangeText={setNewMember}
              placeholder="Add member by name or email"
              style={[styles.input, styles.addMemberInput]}
            />
            <TouchableOpacity style={styles.addMemberButton} onPress={handleAddMember}>
              <Text style={styles.addMemberButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team settings</Text>
          <Text style={styles.sectionSubtitle}>
            Control how teammates join and how they receive updates.
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Allow join requests</Text>
              <Text style={styles.settingDescription}>
                Let players request to join using your public team link.
              </Text>
            </View>
            <Switch
              value={settings.allowJoinRequests}
              onValueChange={() => toggleSetting('allowJoinRequests')}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Notify roster changes</Text>
              <Text style={styles.settingDescription}>
                Send a push notification to members whenever you update the squad.
              </Text>
            </View>
            <Switch
              value={settings.notifyMembersOfChanges}
              onValueChange={() => toggleSetting('notifyMembersOfChanges')}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Share availability calendar</Text>
              <Text style={styles.settingDescription}>
                Give teammates access to see availability and match commitments.
              </Text>
            </View>
            <Switch
              value={settings.shareAvailabilityCalendar}
              onValueChange={() => toggleSetting('shareAvailabilityCalendar')}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Auto collect match stats</Text>
              <Text style={styles.settingDescription}>
                Automatically collect player stats when matches are recorded.
              </Text>
            </View>
            <Switch
              value={settings.autoCollectMatchStats}
              onValueChange={() => toggleSetting('autoCollectMatchStats')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challenge other teams</Text>
          <Text style={styles.sectionSubtitle}>
            Search nearby clubs or take on opponents from across the country.
          </Text>

          <View style={styles.scopeToggle}>
            <TouchableOpacity
              style={[styles.scopeButton, searchScope === 'local' && styles.scopeButtonActive]}
              onPress={() => handleScopeChange('local')}
            >
              <Text
                style={[styles.scopeButtonText, searchScope === 'local' && styles.scopeButtonTextActive]}
              >
                Local area
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scopeButton, searchScope === 'national' && styles.scopeButtonActive]}
              onPress={() => handleScopeChange('national')}
            >
              <Text
                style={[styles.scopeButtonText, searchScope === 'national' && styles.scopeButtonTextActive]}
              >
                National search
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              value={teamSearchQuery}
              onChangeText={setTeamSearchQuery}
              placeholder="Search by team name, city or ranking"
              style={[styles.input, styles.searchInput]}
              returnKeyType="search"
              onSubmitEditing={handleSearchTeams}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearchTeams}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          {isSearchingTeams ? (
            <View style={styles.searchStatus}>
              <ActivityIndicator size="small" color="#1d4ed8" />
              <Text style={styles.searchStatusText}>Searching teams…</Text>
            </View>
          ) : (
            <>
              {searchError ? <Text style={styles.searchError}>{searchError}</Text> : null}
              {searchResults.length > 0 ? (
                <View style={styles.challengeList}>
                  {searchResults.map((opponent) => (
                    <View key={opponent.id} style={styles.challengeCard}>
                      <View style={styles.challengeDetails}>
                        <Text style={styles.challengeName}>{opponent.name}</Text>
                        <Text style={styles.challengeLocation}>
                          {opponent.city}, {opponent.region}
                          {typeof opponent.distanceKm === 'number'
                            ? ` • ${opponent.distanceKm}km away`
                            : ''}
                        </Text>
                        <Text style={styles.challengeMeta}>{opponent.ranking}</Text>
                        <Text style={styles.challengeMeta}>{opponent.preferredMatchDay}</Text>
                        <Text style={styles.challengeForm}>Form: {opponent.recentForm}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.challengeButton}
                        onPress={() => handleChallengeTeam(opponent)}
                      >
                        <Text style={styles.challengeButtonText}>Challenge</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite players</Text>
          <Text style={styles.sectionSubtitle}>
            Share your team with contacts or send invites directly from Football App.
          </Text>

          <TouchableOpacity style={styles.inviteCard} onPress={handleInviteFromContacts}>
            <Text style={styles.inviteTitle}>Phone contacts</Text>
            <Text style={styles.inviteDescription}>Pick players directly from your phone book.</Text>
          </TouchableOpacity>

          <View style={styles.usernameRow}>
            <TextInput
              value={usernameQuery}
              onChangeText={setUsernameQuery}
              placeholder="Search by Football App username"
              style={[styles.input, styles.usernameInput]}
            />
            <TouchableOpacity style={styles.usernameButton} onPress={handleInviteByUsername}>
              <Text style={styles.usernameButtonText}>Invite</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.inviteCard} onPress={handleInviteViaWhatsApp}>
            <Text style={styles.inviteTitle}>WhatsApp</Text>
            <Text style={styles.inviteDescription}>Share a direct message with your team link.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.inviteCard} onPress={handleInviteViaEmail}>
            <Text style={styles.inviteTitle}>Email</Text>
            <Text style={styles.inviteDescription}>Send a personalised invite to the squad.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.inviteCard} onPress={handleInviteViaFacebook}>
            <Text style={styles.inviteTitle}>Facebook</Text>
            <Text style={styles.inviteDescription}>Share your team to Facebook with one tap.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.inviteCard} onPress={handleInviteViaX}>
            <Text style={styles.inviteTitle}>X (Twitter)</Text>
            <Text style={styles.inviteDescription}>Post a recruitment tweet for your team.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.inviteCard} onPress={handleInviteViaInstagram}>
            <Text style={styles.inviteTitle}>Instagram</Text>
            <Text style={styles.inviteDescription}>Send the link via Instagram Direct messages.</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <Text style={styles.saveButtonText}>Save changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
    gap: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    color: '#475569',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubtitle: {
    color: '#475569',
  },
  scopeToggle: {
    flexDirection: 'row',
    gap: 12,
  },
  scopeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#eef2ff',
  },
  scopeButtonActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  scopeButtonText: {
    fontWeight: '600',
    color: '#1e293b',
  },
  scopeButtonTextActive: {
    color: '#fff',
  },
  formField: {
    gap: 12,
  },
  label: {
    fontWeight: '600',
    color: '#1e293b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8fafc',
  },
  searchInput: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  searchStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchStatusText: {
    color: '#475569',
  },
  searchError: {
    color: '#ef4444',
    fontWeight: '500',
  },
  challengeList: {
    gap: 16,
  },
  challengeCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  challengeDetails: {
    flex: 1,
    gap: 4,
  },
  challengeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  challengeLocation: {
    color: '#475569',
  },
  challengeMeta: {
    color: '#1e293b',
    fontSize: 13,
  },
  challengeForm: {
    color: '#334155',
    fontSize: 12,
    fontStyle: 'italic',
  },
  challengeButton: {
    alignSelf: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 9999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  challengeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  memberName: {
    fontWeight: '600',
    color: '#1f2937',
  },
  removeMemberText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  addMemberRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  addMemberInput: {
    flex: 1,
  },
  addMemberButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addMemberButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    flex: 1,
    gap: 4,
  },
  settingLabel: {
    fontWeight: '600',
    color: '#1e293b',
  },
  settingDescription: {
    color: '#64748b',
    fontSize: 13,
  },
  inviteCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  inviteTitle: {
    fontWeight: '700',
    color: '#0f172a',
  },
  inviteDescription: {
    color: '#475569',
    fontSize: 13,
  },
  usernameRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  usernameInput: {
    flex: 1,
  },
  usernameButton: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  usernameButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#16a34a',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default ManageTeamScreen;
