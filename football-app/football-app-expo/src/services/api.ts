import axios from 'axios';

const API_BASE_URL = 'https://api.yourfootballapp.com'; // Replace with your actual API base URL

// Function to get all teams
export const getTeams = async (): Promise<any[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/teams`);
        return response.data;
    } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error('Error fetching teams: ' + msg);
    }
};

// Function to create a new team
export const createTeam = async (teamData: any) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/teams`, teamData);
        return response.data;
    } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error('Error creating team: ' + msg);
    }
};

// Function to get tournaments
export const getTournaments = async (): Promise<any[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/tournaments`);
        return response.data;
    } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error('Error fetching tournaments: ' + msg);
    }
};

// Function to enter a tournament
export const enterTournament = async (tournamentId: string, userId: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/tournaments/${tournamentId}/enter`, { userId });
        return response.data;
    } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error('Error entering tournament: ' + msg);
    }
};