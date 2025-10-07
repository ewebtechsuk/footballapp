import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
