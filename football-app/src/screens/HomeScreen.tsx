import React from 'react';
import { View, Text, Button } from 'react-native';

const HomeScreen = ({ navigation }) => {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Welcome to the Football App!</Text>
            <Button
                title="Manage Teams"
                onPress={() => navigation.navigate('TeamScreen')}
            />
            <Button
                title="Create a Team"
                onPress={() => navigation.navigate('CreateTeamScreen')}
            />
            <Button
                title="Join Tournaments"
                onPress={() => navigation.navigate('TournamentScreen')}
            />
            <Button
                title="Profile"
                onPress={() => navigation.navigate('ProfileScreen')}
            />
        </View>
    );
};

export default HomeScreen;