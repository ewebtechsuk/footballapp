import React from 'react';
import { View, Text, Button } from 'react-native';

const ROUTES = {
    TEAM: 'Team',
    CREATE_TEAM: 'Create Team',
    TOURNAMENTS: 'Tournaments',
    PROFILE: 'Profile',
} as const;

const HomeScreen = ({ navigation }) => {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Welcome to the Football App!</Text>
            <Button
                title="Manage Teams"
                onPress={() => navigation.navigate('Team')}
            />
            <Button
                title="Create a Team"
                onPress={() => navigation.navigate('Create Team')}
            />
            <Button
                title="Join Tournaments"
                onPress={() => navigation.navigate('Tournaments')}
            />
            <Button
                title="Profile"
                onPress={() => navigation.navigate('Profile')}

            />
        </View>
    );
};

export default HomeScreen;
