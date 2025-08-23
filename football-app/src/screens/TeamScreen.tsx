import React from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { removeTeam } from '../store/slices/teamsSlice';
import TeamCard from '../components/TeamCard';

const TeamScreen = () => {
    const dispatch = useDispatch();
    const teams = useSelector((state: RootState) => state.teams.teams);

    const handleRemoveTeam = (teamId: string) => {
        dispatch(removeTeam(teamId));
    };

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>My Teams</Text>
            <FlatList
                data={teams}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TeamCard
                        team={item}
                        onRemove={() => handleRemoveTeam(item.id)}
                    />
                )}
            />
            <Button title="Create New Team" onPress={() => {/* Navigate to CreateTeamScreen */}} />
        </View>
    );
};

export default TeamScreen;