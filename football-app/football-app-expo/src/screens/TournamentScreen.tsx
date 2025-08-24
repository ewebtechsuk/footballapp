import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert } from 'react-native';
import TournamentCard from '../components/TournamentCard';
import { getTournaments } from '../services/api';
import TeamPicker from '../components/TeamPicker';
import { auth } from '../services/firebase';
import { listTeamsByOwner, enterTournament } from '../services/firestore';

const TournamentScreen = () => {
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userTeams, setUserTeams] = useState<any[]>([]);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);

    useEffect(() => {
        const loadTournaments = async () => {
            try {
                const data = await getTournaments();
                setTournaments(data);
            } catch (error) {
                console.error('Failed to load tournaments', error);
            } finally {
                setLoading(false);
            }
        };

        loadTournaments();
    }, []);

    const openTeamPicker = useCallback(async (tournamentId: string) => {
        const uid = auth.currentUser ? auth.currentUser.uid : null;
        if (!uid) {
            Alert.alert('You must be signed in to enter a tournament');
            return;
        }
        const teams = await listTeamsByOwner(uid);
        setUserTeams(teams || []);
        setSelectedTournamentId(tournamentId);
        setPickerVisible(true);
    }, []);

    const renderTournament = ({ item }: { item: any }) => (
        <TournamentCard tournamentName={item.name || item.tournamentName} date={item.date || ''} location={item.location || ''} onJoin={() => openTeamPicker(item.id)} />
    );

    const handleTeamSelect = async (teamId: string) => {
        setPickerVisible(false);
        if (!selectedTournamentId) return;
        try {
            await enterTournament(selectedTournamentId, teamId);
            Alert.alert('Entered tournament');
        } catch (err) {
            console.error('Failed to enter tournament', err);
            Alert.alert('Failed to enter tournament');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading tournaments...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Available Tournaments</Text>
            <FlatList
                data={tournaments}
                renderItem={renderTournament}
                keyExtractor={(item) => item.id.toString()}
            />
            <Button title="Create Tournament" onPress={() => {/* Navigate to create tournament screen */}} />
            <TeamPicker visible={pickerVisible} teams={userTeams} onSelect={handleTeamSelect} onClose={() => setPickerVisible(false)} />
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
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default TournamentScreen;