import React from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { removeTeam } from '../store/slices/teamsSlice';
import TeamCard from '../components/TeamCard';
import { auth } from '../services/firebase';
import { listTeamsByOwner } from '../services/firestore';
import { deleteTeam } from '../services/firestore';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

const TeamScreen = () => {
    const dispatch = useDispatch();
    const teamsFromStore: any[] = useSelector((state: any) => state.teams.teams || []);
    const [teams, setTeams] = useState<any[]>(teamsFromStore || []);

    useEffect(() => {
        const load = async () => {
            const uid = auth.currentUser ? auth.currentUser.uid : null;
            if (!uid) return;
            const list = await listTeamsByOwner(uid);
            setTeams(list || []);
        };
        load();
    }, []);

    const handleRemoveTeam = async (teamId: string) => {
        try {
            await deleteTeam(teamId);
            setTeams(prev => prev.filter(t => t.id !== teamId));
            dispatch(removeTeam(teamId));
        } catch (err) {
            console.error('Failed to delete team', err);
        }
    };

    const confirmDelete = (teamId: string, teamName?: string) => {
        Alert.alert(
            'Delete team',
            `Are you sure you want to delete '${teamName || 'this team'}'? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => handleRemoveTeam(teamId) }
            ]
        );
    };

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>My Teams</Text>
            <FlatList
                data={teams}
                keyExtractor={(item) => item.id}
                renderItem={({ item }: { item: any }) => (
                    <TeamCard
                        teamName={item.teamName || item.name}
                        teamLogo={item.logo || ''}
                        membersCount={(item.members && item.members.length) || 0}
                        onRemove={() => confirmDelete(item.id, item.teamName || item.name)}
                    />
                )}
            />
            <Button title="Create New Team" onPress={() => {/* Navigate to CreateTeamScreen */}} />
        </View>
    );
};

export default TeamScreen;