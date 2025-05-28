/**
* 将文本复制到剪贴板
* @param text - 要复制的文本
* @returns Promise<boolean> - 表示是否成功复制的 Promise
*/
export async function copyToClipboard(text: string): Promise<boolean> {
    if (navigator.clipboard && navigator.permissions) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy text to clipboard:', err);
            return false;
        }
    } else {
        // Clipboard API 不可用时的回退方案
        return fallbackCopyTextToClipboard(text);
    }
}

/**
* 回退方案: 将文本复制到剪贴板
* @param text - 要复制的文本
* @returns boolean - 表示是否成功复制
*/
function fallbackCopyTextToClipboard(text: string): boolean {
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // 避免在 iOS 上的视觉跳动
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    let success = false;
    try {
        success = document.execCommand('copy');
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
    return success;
}

import { PLAYER_LIST, TEAM_LIST } from './config';

interface PlayerStats {
    totalScore: number;
    fouls: number;
    flagrantFouls: number;
    attempts: {
        '2p': { made: number; total: number; };
        '3p': { made: number; total: number; };
        'ft': { made: number; total: number; };
    };
}

interface GameData {
    team1: {
        name: string;
        list: string[];
        totalScore: number;
        jumpBalls: number;
        hiddenPlayers: string[];
    } | null;
    team2: {
        name: string;
        list: string[];
        totalScore: number;
        jumpBalls: number;
        hiddenPlayers: string[];
    } | null;
    playerStats: {
        [key: string]: PlayerStats;
    };
    scoreHistory: any[];
}

/**
 * 将球员名字转换为ID
 */
function getPlayerIdByName(name: string): number {
    const player = PLAYER_LIST.find(p => p.name === name);
    return player ? player.id : -1;
}

/**
 * 将球队名字转换为ID
 */
function getTeamIdByName(name: string): number {
    const team = TEAM_LIST.find(t => t.name === name);
    return team ? team.id : -1;
}

/**
 * 将ID转换为球员名字
 */
function getPlayerNameById(id: number): string {
    const player = PLAYER_LIST.find(p => p.id === id);
    return player ? player.name : '';
}

/**
 * 将ID转换为球队名字
 */
function getTeamNameById(id: number): string {
    const team = TEAM_LIST.find(t => t.id === id);
    return team ? team.name : '';
}

/**
 * 获取球队的所有球员
 */
function getTeamPlayers(teamName: string): string[] {
    // 这里需要根据实际情况返回球队的球员列表
    // 可以从配置或其他地方获取
    return PLAYER_LIST.map(p => p.name);
}

/**
 * 压缩游戏数据为短字符串
 */
export function compressGameData(data: GameData): string {
    if (!data.team1 || !data.team2) return '';

    const team1Id = getTeamIdByName(data.team1.name);
    const team2Id = getTeamIdByName(data.team2.name);
    
    // 基础格式：?play=team1IdVteam2Id
    let result = `?play=${team1Id}v${team2Id}`;
    
    // 添加争球数据
    result += `&jump=${data.team1.jumpBalls},${data.team2.jumpBalls}`;

    // 添加球员列表数据
    const team1PlayerIds = data.team1.list.map(name => getPlayerIdByName(name)).filter(id => id !== -1);
    const team2PlayerIds = data.team2.list.map(name => getPlayerIdByName(name)).filter(id => id !== -1);
    result += `&t1=${team1PlayerIds.join(',')}&t2=${team2PlayerIds.join(',')}`;

    // 添加隐藏球员数据
    const team1HiddenIds = data.team1.hiddenPlayers.map(name => getPlayerIdByName(name)).filter(id => id !== -1);
    const team2HiddenIds = data.team2.hiddenPlayers.map(name => getPlayerIdByName(name)).filter(id => id !== -1);
    if (team1HiddenIds.length > 0 || team2HiddenIds.length > 0) {
        result += `&h1=${team1HiddenIds.join(',')}&h2=${team2HiddenIds.join(',')}`;
    }

    // 添加球员数据
    const playerData: string[] = [];
    
    // 处理所有球员的数据
    Object.entries(data.playerStats).forEach(([playerName, stats]) => {
        const playerId = getPlayerIdByName(playerName);
        if (playerId === -1) return;

        // 格式：playerId=2p命中|2p未中|3p命中|3p未中|罚球命中|罚球未中|普通犯规|恶意犯规
        const playerStats = [
            stats.attempts['2p'].made,
            stats.attempts['2p'].total - stats.attempts['2p'].made,
            stats.attempts['3p'].made,
            stats.attempts['3p'].total - stats.attempts['3p'].made,
            stats.attempts['ft'].made,
            stats.attempts['ft'].total - stats.attempts['ft'].made,
            stats.fouls,
            stats.flagrantFouls
        ].join('|');

        if (playerStats !== '0|0|0|0|0|0|0|0') {
            playerData.push(`p${playerId}=${playerStats}`);
        }
    });

    // 添加球员数据到结果字符串
    if (playerData.length > 0) {
        result += '&' + playerData.join('&');
    }

    // Base64编码
    return btoa(result);
}

/**
 * 解压缩短字符串为游戏数据
 */
export function decompressGameData(compressed: string): GameData | null {
    try {
        // Base64解码
        const decoded = atob(compressed);
        if (!decoded.startsWith('?play=')) return null;

        // 解析基本信息
        const params = new URLSearchParams(decoded);
        
        // 解析队伍ID
        const [team1Id, team2Id] = params.get('play')!.split('v').map(Number);
        const team1Name = getTeamNameById(team1Id);
        const team2Name = getTeamNameById(team2Id);
        
        if (!team1Name || !team2Name) return null;

        // 解析争球数据
        const [team1JumpBalls, team2JumpBalls] = (params.get('jump') || '0,0').split(',').map(Number);

        // 解析球员列表
        const team1PlayerIds = (params.get('t1') || '').split(',').filter(Boolean).map(Number);
        const team2PlayerIds = (params.get('t2') || '').split(',').filter(Boolean).map(Number);
        const team1Players = team1PlayerIds.map(id => getPlayerNameById(id)).filter(Boolean);
        const team2Players = team2PlayerIds.map(id => getPlayerNameById(id)).filter(Boolean);

        // 解析隐藏球员列表
        const team1HiddenIds = (params.get('h1') || '').split(',').filter(Boolean).map(Number);
        const team2HiddenIds = (params.get('h2') || '').split(',').filter(Boolean).map(Number);
        const team1Hidden = team1HiddenIds.map(id => getPlayerNameById(id)).filter(Boolean);
        const team2Hidden = team2HiddenIds.map(id => getPlayerNameById(id)).filter(Boolean);

        // 初始化返回数据
        const gameData: GameData = {
            team1: {
                name: team1Name,
                list: team1Players,
                totalScore: 0,
                jumpBalls: team1JumpBalls,
                hiddenPlayers: team1Hidden
            },
            team2: {
                name: team2Name,
                list: team2Players,
                totalScore: 0,
                jumpBalls: team2JumpBalls,
                hiddenPlayers: team2Hidden
            },
            playerStats: {},
            scoreHistory: []
        };

        // 初始化所有球员的统计数据
        [...team1Players, ...team2Players].forEach(player => {
            gameData.playerStats[player] = {
                totalScore: 0,
                fouls: 0,
                flagrantFouls: 0,
                attempts: {
                    '2p': { made: 0, total: 0 },
                    '3p': { made: 0, total: 0 },
                    'ft': { made: 0, total: 0 }
                }
            };
        });

        // 解析球员数据
        for (const [key, value] of params.entries()) {
            if (key.startsWith('p')) {
                const playerId = parseInt(key.slice(1));
                const playerName = getPlayerNameById(playerId);
                if (!playerName) continue;

                const [made2p, missed2p, made3p, missed3p, madeFt, missedFt, fouls, flagrantFouls] = 
                    value.split('|').map(Number);

                gameData.playerStats[playerName] = {
                    totalScore: made2p * 2 + made3p * 3 + madeFt,
                    fouls,
                    flagrantFouls,
                    attempts: {
                        '2p': { made: made2p, total: made2p + missed2p },
                        '3p': { made: made3p, total: made3p + missed3p },
                        'ft': { made: madeFt, total: madeFt + missedFt }
                    }
                };
            }
        }

        // 计算队伍总分
        gameData.team1!.totalScore = gameData.team1!.list.reduce((total, player) => 
            total + (gameData.playerStats[player]?.totalScore || 0), 0);
        gameData.team2!.totalScore = gameData.team2!.list.reduce((total, player) => 
            total + (gameData.playerStats[player]?.totalScore || 0), 0);

        return gameData;
    } catch (error) {
        console.error('解压缩数据失败:', error);
        return null;
    }
}