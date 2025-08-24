import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { createTeam } from '../services/firestore';
import { auth } from '../services/firebase';

const CreateTeamScreen = () => {
    const [teamName, setTeamName] = useState('');
    const [teamMembers, setTeamMembers] = useState(['']);

    const handleAddMember = () => {
        setTeamMembers([...teamMembers, '']);
    };

    const handleMemberChange = (text: string, index: number) => {
        const updatedMembers = [...teamMembers];
        updatedMembers[index] = text;
        setTeamMembers(updatedMembers);
    };

    const handleSubmit = async () => {
        if (!teamName.trim()) return Alert.alert('Team name is required');
        try {
            const ownerId = auth.currentUser ? auth.currentUser.uid : null;
            const team = { teamName, members: teamMembers.filter(m => m.trim()), ownerId };
            await createTeam(team);
            Alert.alert('Team created');
            // navigate to My Teams
            // @ts-ignore navigation exists on props via stack
            // we can use navigation passed implicitly in component in App stack
            // attempt to navigate to Team screen
            try { (navigation as any).navigate('Team'); } catch {}
        } catch (err) {
            console.error('Failed to create team', err);
            Alert.alert('Failed to create team');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Your Football Team</Text>
            <TextInput
                style={styles.input}
                placeholder="Team Name"
                value={teamName}
                onChangeText={setTeamName}
            />
            {teamMembers.map((member, index) => (
                <TextInput
                    key={index}
                    style={styles.input}
                    placeholder={`Member ${index + 1} Name`}
                    value={member}
                    onChangeText={(text) => handleMemberChange(text, index)}
                />
            ))}
            <Button title="Add Member" onPress={handleAddMember} />
            <Button title="Create Team" onPress={handleSubmit} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        paddingLeft: 8,
    },
});

export default CreateTeamScreen;