export interface User {
    id: string;
    username: string;
    email: string;
    teams: Team[];
}

export interface Team {
    id: string;
    name: string;
    players: Player[];
    tournaments: Tournament[];
}

export interface Player {
    id: string;
    name: string;
    position: string;
    age: number;
}

export interface Tournament {
    id: string;
    name: string;
    date: string;
    prize: string;
    teams: Team[];
}