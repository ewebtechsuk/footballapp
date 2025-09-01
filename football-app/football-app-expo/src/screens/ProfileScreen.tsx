import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { useNavigation } from '@react-navigation/native';
import * as auth from '../services/auth';

const ProfileScreen = () => {
    const user = useAppSelector(state => state.user);
    const navigation = useNavigation();

    const [isEditing, setIsEditing] = React.useState(false);

    const openEditProfile = () => {
        // prefer a named route that exists in the app navigator; fall back to inline edit
        const candidates = ['EditProfile', 'Edit Profile', 'ProfileEdit'];
        for (const route of candidates) {
            try {
                // navigation.navigate will throw if the route doesn't exist in some setups
                (navigation as any).navigate(route as any);
                return;
            } catch {
                // try next
            }
        }
        setIsEditing(true);
    };

    const handleEditProfile = () => openEditProfile();

    const handleSignOut = async () => {
        try {
            await auth.logout();
        } catch (err) {
            console.error('Sign out failed', err);
            Alert.alert('Sign out failed', String(err));
        }
    };

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Profile</Text>
                <Text style={styles.label}>Not signed in</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.label}>Name: {user?.name ?? '—'}</Text>
            <Text style={styles.label}>Email: {user?.email ?? '—'}</Text>

            <TouchableOpacity style={styles.button} onPress={handleEditProfile} accessibilityRole="button">
                <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleSignOut} accessibilityRole="button">
                <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 18,
        marginVertical: 10,
    },
    button: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#007AFF',
        borderRadius: 6,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
    },
});

export default ProfileScreen;