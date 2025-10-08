import React, { useMemo, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import AuthenticatedScreenContainer from '../components/AuthenticatedScreenContainer';
import { RootStackParamList } from '../types/navigation';
import { useAppDispatch } from '../store/hooks';
import { TeamMember, TeamRole, addTeam, defaultTeamSettings } from '../store/slices/teamsSlice';

type CreateTeamScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateTeam'>;

const CreateTeamScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<CreateTeamScreenNavigationProp>();
  const [name, setName] = useState('');
  const [membersText, setMembersText] = useState('');

  const trimmedName = useMemo(() => name.trim(), [name]);
  const members = useMemo(
    () => membersText.split(',').map((member: string) => member.trim()).filter(Boolean),
    [membersText],
  );

  const determineRoleForIndex = (index: number): TeamRole => {
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

  const handleSubmit = () => {
    if (!trimmedName) {
      Alert.alert('Missing team name', 'Please give your team a name before saving.');
      return;
    }

    const teamName = trimmedName;
    const teamMembers: TeamMember[] = members.map((memberName, index) => ({
      id: `${Date.now()}-${index}-${memberName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: memberName,
      role: determineRoleForIndex(index),
      position: null,
      isCaptain: index === 0,
    }));

    dispatch(
      addTeam({
        id: `${Date.now()}`,
        name: teamName,
        members: teamMembers,
        settings: { ...defaultTeamSettings },
      }),
    );

    setName('');
    setMembersText('');

    navigation.navigate('Team');
    Alert.alert('Team created', `${teamName} has been added to your teams.`);
  };

  return (
    <AuthenticatedScreenContainer style={styles.safeArea} contentStyle={styles.content}>
      <Text style={styles.title}>Create a Team</Text>
      <Text style={styles.description}>
        Add your team name and an optional comma-separated list of members.
      </Text>

      <View style={styles.formField}>
        <Text style={styles.label}>Team name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Thunderbolts"
          style={styles.input}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.formField}>
        <Text style={styles.label}>Members</Text>
        <TextInput
          value={membersText}
          onChangeText={setMembersText}
          placeholder="Add members separated by commas"
          style={[styles.input, styles.multilineInput]}
          multiline
        />
      </View>

      <Button title="Save team" onPress={handleSubmit} />
    </AuthenticatedScreenContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    color: '#6b7280',
    marginBottom: 24,
  },
  formField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});


export default CreateTeamScreen;
