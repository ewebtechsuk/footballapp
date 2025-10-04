import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { AppDispatch } from '../store';
import { addTeam } from '../store/slices/teamsSlice';
import type { RootStackParamList } from './HomeScreen';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const CreateTeamScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState('');
  const [coach, setCoach] = useState('');

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Team name required', 'Please add a name so we can save your new team.');
      return;
    }

    dispatch(
      addTeam({
        id: Date.now().toString(),
        name: name.trim(),
        coach: coach.trim() || 'Unassigned',
        record: '0-0-0',
      })
    );

    setName('');
    setCoach('');
    navigation.navigate('Teams');
  }, [coach, dispatch, name, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a new team</Text>
      <TextInput
        placeholder="Team name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Coach"
        value={coach}
        onChangeText={setCoach}
        style={styles.input}
      />
      <Button title="Add team" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
});

export default CreateTeamScreen;
