import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import Logo from '../components/Logo';

const HomeScreen = ({ navigation }: { navigation: any }) => {
    return (
        <View style={styles.container}>
            <Logo size={140} title="Football App" />
            <Text style={styles.subtitle}>Manage teams, tournaments & your profile</Text>
            <View style={styles.actions}>
                <Button title="Teams" onPress={() => navigation.navigate('Team')} />
                <Button title="Create Team" onPress={() => navigation.navigate('Create Team')} />
                <Button title="Tournaments" onPress={() => navigation.navigate('Tournaments')} />
                <Button title="Profile" onPress={() => navigation.navigate('Profile')} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    subtitle: { marginTop: 8, fontSize: 16, color: '#444' },
    actions: { marginTop: 24, width: '80%', gap: 10 },
});

export default HomeScreen;