export type ShotType = '2p' | '3p' | 'ft' | 'foul' | 'flagrant';

export interface PlayerStats {
    totalScore: number;
    fouls: number;
    flagrantFouls: number;
    attempts: {
        '2p': { made: number; total: number; };
        '3p': { made: number; total: number; };
        'ft': { made: number; total: number; };
    };
}

export interface ScoreHistory {
    player: string;
    type: ShotType;
    isSuccess: boolean;
    isTeam1: boolean;
    previousStats: PlayerStats;
} 