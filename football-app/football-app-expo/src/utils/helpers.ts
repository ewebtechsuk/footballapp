export const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
};

export const calculateTeamScore = (matches: Array<{ goalsFor: number; goalsAgainst: number }>): number => {
    return matches.reduce((total, match) => {
        return total + (match.goalsFor > match.goalsAgainst ? 3 : match.goalsFor === match.goalsAgainst ? 1 : 0);
    }, 0);
};

export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const generateUniqueId = (): string => {
    return 'id-' + Math.random().toString(36).substr(2, 16);
};