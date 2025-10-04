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
                onPress={() => navigation.navigate(ROUTES.TEAM)}
            />
            <Button
                title="Create a Team"
                onPress={() => navigation.navigate(ROUTES.CREATE_TEAM)}
            />
            <Button
                title="Join Tournaments"
                onPress={() => navigation.navigate(ROUTES.TOURNAMENTS)}
            />
            <Button
                title="Profile"
                onPress={() => navigation.navigate(ROUTES.PROFILE)}
            />
        </View>
    );
};

export default HomeScreen;