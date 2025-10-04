import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { addTeam } from '../store/slices/teamsSlice';

const CreateTeamScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState('');
  const [coach, setCoach] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      return;
    }

    dispatch(
      addTeam({
        id: Date.now().toString(),
        name,
        coach: coach || 'Unassigned',
        record: '0-0-0',
      })
    );

    setName('');
    setCoach('');
  };

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
