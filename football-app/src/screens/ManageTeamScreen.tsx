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
import {
  FormationPositionKey,
  TeamMember,
  TeamRole,
  TeamSettings,
  defaultTeamSettings,
  updateTeam,
} from '../store/slices/teamsSlice';
import PitchFormation from '../components/PitchFormation';

type ManageTeamRouteProp = RouteProp<RootStackParamList, 'ManageTeam'>;
type ManageTeamNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ManageTeam'>;

const TEAM_ROLES: TeamRole[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Substitute'];

const determineDefaultRole = (index: number): TeamRole => {
  if (index === 0) {
    return 'Goalkeeper';
  }

  if (index <= 4) {
    return 'Defender';
  }

  if (index <= 8) {
    return 'Midfielder';
  }

  return 'Forward';
};

const createTeamMemberFromName = (name: string, existingMembers: TeamMember[]): TeamMember => {
  const index = existingMembers.length;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    role: determineDefaultRole(index),
    position: null,
    isCaptain: existingMembers.length === 0,
  };
};

const ManageTeamScreen: React.FC = () => {
  const route = useRoute<ManageTeamRouteProp>();
  const navigation = useNavigation<ManageTeamNavigationProp>();
  const dispatch = useAppDispatch();

  const teamId = route.params?.teamId ?? null;

  const team = useAppSelector((state) =>
    teamId ? state.teams.teams.find((currentTeam) => currentTeam.id === teamId) : undefined,
  );

  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newMember, setNewMember] = useState('');
  const [settings, setSettings] = useState<TeamSettings>(defaultTeamSettings);
  const [usernameQuery, setUsernameQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (team) {
      setTeamName(team.name);
      setMembers(team.members);
      setSettings(team.settings);
      const captain = team.members.find((member) => member.isCaptain);
      setSelectedMemberId(captain?.id ?? team.members[0]?.id ?? null);
    }
  }, [team]);

  const invitationLink = useMemo(() => {
    if (!teamId) {
      return 'https://football.app/team';
    }

    return `https://football.app/team/${teamId}`;
  }, [teamId]);
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

    if (members.some((member) => member.name.toLowerCase() === trimmedMember.toLowerCase())) {
      Alert.alert('Already added', `${trimmedMember} is already part of your roster.`);
      return;
    }

    setMembers((previousMembers) => {
      const cleanedName = trimmedMember;
      const newMemberEntry = createTeamMemberFromName(cleanedName, previousMembers);

      const updatedMembers = [...previousMembers.map((member) => ({ ...member })), newMemberEntry];

      setSelectedMemberId(newMemberEntry.id);

      return updatedMembers;
    });
    setNewMember('');
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers((previousMembers) => {
      const filteredMembers = previousMembers
        .filter((member) => member.id !== memberId)
        .map((member) => ({ ...member }));

      if (filteredMembers.length > 0 && !filteredMembers.some((member) => member.isCaptain)) {
        filteredMembers.forEach((member, index) => {
          filteredMembers[index] = { ...member, isCaptain: index === 0 };
        });
        setSelectedMemberId((currentSelected) =>
          currentSelected === memberId ? filteredMembers[0].id : currentSelected,
        );
      } else if (filteredMembers.length === 0) {
        setSelectedMemberId(null);
      } else if (filteredMembers.some((member) => member.isCaptain)) {
        const captain = filteredMembers.find((member) => member.isCaptain);
        setSelectedMemberId((currentSelected) =>
          currentSelected === memberId ? captain?.id ?? filteredMembers[0].id : currentSelected,
        );
      }

      return filteredMembers;
    });
  };

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId((currentSelected) => (currentSelected === memberId ? null : memberId));
  };

  const handleCycleRole = (memberId: string) => {
    setMembers((previousMembers) =>
      previousMembers.map((member) => {
        if (member.id !== memberId) {
          return member;
        }

        const currentIndex = Math.max(0, TEAM_ROLES.indexOf(member.role));
        const nextRole = TEAM_ROLES[(currentIndex + 1) % TEAM_ROLES.length];

        return { ...member, role: nextRole };
      }),
    );
  };

  const handleSetCaptain = (memberId: string) => {
    setMembers((previousMembers) =>
      previousMembers.map((member) => ({
        ...member,
        isCaptain: member.id === memberId,
      })),
    );
    setSelectedMemberId(memberId);
  };

  const handleClearPosition = (memberId: string) => {
    setMembers((previousMembers) =>
      previousMembers.map((member) =>
        member.id === memberId ? { ...member, position: null } : member,
      ),
    );
  };

  const handleSpotPress = (positionKey: FormationPositionKey, occupantId: string | null) => {
    if (!selectedMemberId) {
      if (occupantId) {
        setMembers((previousMembers) =>
          previousMembers.map((member) =>
            member.id === occupantId ? { ...member, position: null } : member,
          ),
        );
      } else {
        Alert.alert('Select a player', 'Choose a player from the roster before assigning a position.');
      }
      return;
    }

    if (occupantId && occupantId === selectedMemberId) {
      setMembers((previousMembers) =>
        previousMembers.map((member) =>
          member.id === selectedMemberId ? { ...member, position: null } : member,
        ),
      );
      return;
    }

    setMembers((previousMembers) =>
      previousMembers.map((member) => {
        if (member.id === selectedMemberId) {
          return { ...member, position: positionKey };
        }

        if (member.position === positionKey) {
          return { ...member, position: null };
        }

        return member;
      }),
    );
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
      .map((member) => ({
        ...member,
        name: member.name.trim(),
      }))
      .filter((member) => member.name.length > 0);

    const ensuredCaptainMembers = cleanedMembers.some((member) => member.isCaptain)
      ? cleanedMembers
      : cleanedMembers.map((member, index) => ({
          ...member,
          isCaptain: index === 0,
        }));

    if (!teamId) {
      Alert.alert('Team unavailable', 'We could not determine which team to update.');
      return;
    }

    dispatch(
      updateTeam({
        id: teamId,
        name: trimmedName,
        members: ensuredCaptainMembers,
        settings,
      }),
    );

    Alert.alert('Team updated', `${trimmedName} has been updated.`);
    navigation.goBack();
  };

  if (!teamId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Team unavailable</Text>
          <Text style={styles.subtitle}>
            We could not determine which team you wanted to manage. Please go back and try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
              <View style={styles.memberList}>
                {members.map((member) => (
                  <View
                    key={member.id}
                    style={[styles.memberCard, selectedMemberId === member.id && styles.memberCardSelected]}
                  >
                    <TouchableOpacity
                      style={styles.memberCardBody}
                      onPress={() => handleSelectMember(member.id)}
                    >
                      <View style={styles.memberHeaderRow}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        {member.isCaptain ? <Text style={styles.captainBadge}>Captain</Text> : null}
                      </View>
                      <Text style={styles.memberPositionText}>
                        {member.position ? `Pitch position: ${member.position}` : 'Not placed on the pitch yet'}
                      </Text>
                      <Text style={styles.memberSelectHint}>
                        {selectedMemberId === member.id
                          ? 'Selected for pitch placement'
                          : 'Tap to select and place on the pitch'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.memberFooterRow}>
                      <TouchableOpacity
                        style={styles.roleButton}
                        onPress={() => handleCycleRole(member.id)}
                      >
                        <Text style={styles.roleButtonText}>{member.role}</Text>
                        <Text style={styles.roleButtonHint}>Change role</Text>
                      </TouchableOpacity>

                      <View style={styles.memberActionGroup}>
                        <TouchableOpacity
                          style={styles.secondaryAction}
                          onPress={() => handleClearPosition(member.id)}
                        >
                          <Text style={styles.secondaryActionText}>Clear spot</Text>
                        </TouchableOpacity>
                        {member.isCaptain ? null : (
                          <TouchableOpacity
                            style={styles.secondaryAction}
                            onPress={() => handleSetCaptain(member.id)}
                          >
                            <Text style={styles.secondaryActionText}>Make captain</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.removeAction}
                          onPress={() => handleRemoveMember(member.id)}
                        >
                          <Text style={styles.removeActionText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
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
          <Text style={styles.sectionTitle}>Team structure</Text>
          <Text style={styles.sectionSubtitle}>
            Select a player from the roster, then tap a marker to place them on the pitch.
          </Text>

          <PitchFormation
            members={members}
            selectedMemberId={selectedMemberId}
            onSpotPress={handleSpotPress}
          />

          <Text style={styles.pitchInstructions}>
            The captain is highlighted with a badge and can be reassigned at any time.
          </Text>
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
  memberList: {
    marginTop: 8,
  },
  memberCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  memberCardSelected: {
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  memberCardBody: {
    marginBottom: 12,
  },
  memberHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberName: {
    fontWeight: '700',
    color: '#0f172a',
    fontSize: 16,
  },
  captainBadge: {
    backgroundColor: '#facc15',
    color: '#1e293b',
    fontWeight: '700',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  memberPositionText: {
    color: '#1f2937',
    fontSize: 14,
  },
  memberSelectHint: {
    marginTop: 6,
    color: '#64748b',
    fontSize: 12,
  },
  memberFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  roleButton: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 8,
  },
  roleButtonText: {
    fontWeight: '700',
    color: '#1d4ed8',
  },
  roleButtonHint: {
    fontSize: 11,
    color: '#1d4ed8',
  },
  memberActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 12,
  },
  secondaryAction: {
    marginRight: 12,
  },
  secondaryActionText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  removeAction: {
    marginRight: 0,
  },
  removeActionText: {
    color: '#ef4444',
    fontWeight: '700',
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
  pitchInstructions: {
    marginTop: 12,
    color: '#475569',
    fontSize: 13,
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
