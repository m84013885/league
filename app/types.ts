export type ShotType = '2p' | '3p' | 'ft' | 'foul' | 'flagrant';
export type StatType = 'rebound' | 'assist' | 'steal' | 'turnover' | 'block';

export interface PlayerStats {
    totalScore: number;
    fouls: number;
    flagrantFouls: number;
    attempts: {
        '2p': { made: number; total: number; };
        '3p': { made: number; total: number; };
        'ft': { made: number; total: number; };
    };
    stats: {
        rebounds: number;
        assists: number;
        steals: number;
        turnovers: number;
        blocks: number;
    };
}

export interface ScoreHistory {
    player: string;
    type: ShotType;
    isSuccess: boolean;
    isTeam1: boolean;
    previousStats: PlayerStats;
}

export interface StatHistory {
    player: string;
    type: StatType;
    isTeam1: boolean;
    previousStats: PlayerStats;
} 