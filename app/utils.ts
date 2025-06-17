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
import { ShotType, ScoreHistory, StatHistory } from './types';

interface PlayerStats {
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
    scoreHistory: ScoreHistory[];
    statHistory: StatHistory[];
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
 * 压缩游戏数据为短字符串
 */
export function compressGameData(data: GameData): string {
    if (!data.team1 || !data.team2) return '';

    const team1Id = getTeamIdByName(data.team1.name);
    const team2Id = getTeamIdByName(data.team2.name);
    
    // 基础格式：GAME_t1Id-t2Id
    let result = `GAME_${team1Id}-${team2Id}`;
    
    // 添加争球数据（如果有）
    if (data.team1.jumpBalls > 0 || data.team2.jumpBalls > 0) {
        result += `_j${data.team1.jumpBalls}${data.team2.jumpBalls}`;
    }

    // 添加球员列表数据
    const team1PlayerIds = data.team1.list.map(name => getPlayerIdByName(name)).filter(id => id !== -1);
    const team2PlayerIds = data.team2.list.map(name => getPlayerIdByName(name)).filter(id => id !== -1);
    result += `_${team1PlayerIds.map(id => id.toString().padStart(2, '0')).join('')}_${team2PlayerIds.map(id => id.toString().padStart(2, '0')).join('')}`;

    // 添加隐藏球员数据（如果有）
    const team1HiddenIds = data.team1.hiddenPlayers.map(name => getPlayerIdByName(name)).filter(id => id !== -1);
    const team2HiddenIds = data.team2.hiddenPlayers.map(name => getPlayerIdByName(name)).filter(id => id !== -1);
    if (team1HiddenIds.length > 0 || team2HiddenIds.length > 0) {
        result += `_h${team1HiddenIds.map(id => id.toString().padStart(2, '0')).join('')}|${team2HiddenIds.map(id => id.toString().padStart(2, '0')).join('')}`;
    }

    // 添加球员数据（只添加有得分或犯规的球员）
    const playerData: string[] = [];
    Object.entries(data.playerStats).forEach(([playerName, stats]) => {
        const playerId = getPlayerIdByName(playerName);
        if (playerId === -1) return;

        // 只有当球员有数据时才添加
        const hasData = stats.totalScore > 0 || stats.fouls > 0 || stats.flagrantFouls > 0 ||
                       (stats.stats && (stats.stats.rebounds > 0 || stats.stats.assists > 0 || 
                        stats.stats.steals > 0 || stats.stats.turnovers > 0 || stats.stats.blocks > 0));
        if (!hasData) return;

        // 格式：playerId:2p命中,2p总数,3p命中,3p总数,罚球命中,罚球总数,普通犯规,恶意犯规,篮板,助攻,抢断,失误,盖帽
        const playerStats = [
            stats.attempts['2p'].made,
            stats.attempts['2p'].total,
            stats.attempts['3p'].made,
            stats.attempts['3p'].total,
            stats.attempts['ft'].made,
            stats.attempts['ft'].total,
            stats.fouls,
            stats.flagrantFouls,
            stats.stats?.rebounds || 0,
            stats.stats?.assists || 0,
            stats.stats?.steals || 0,
            stats.stats?.turnovers || 0,
            stats.stats?.blocks || 0
        ].join(',');

        if (playerStats !== '0,0,0,0,0,0,0,0,0,0,0,0,0') {
            playerData.push(`${playerId}:${playerStats}`);
        }
    });

    // 添加球员数据到结果字符串（如果有）
    if (playerData.length > 0) {
        result += `_p${playerData.join('|')}`;
    }

    // 添加历史记录压缩（只保留最近5条）
    if (data.scoreHistory && Array.isArray(data.scoreHistory) && data.scoreHistory.length > 0) {
        const recentScoreHistory = data.scoreHistory.slice(-5);
        const compressedScoreHistory = recentScoreHistory.map(record => {
            const playerId = getPlayerIdByName(record.player);
            if (playerId === -1) return null;

            // 紧凑编码：队伍(1位) + 球员ID(2位) + 动作类型(1位)
            // 动作类型：a=2分命中, b=2分不中, c=3分命中, d=3分不中, e=罚球命中, f=罚球不中, g=犯规, h=恶意犯规
            let actionCode = '';
            if (record.type === '2p') actionCode = record.isSuccess ? 'a' : 'b';
            else if (record.type === '3p') actionCode = record.isSuccess ? 'c' : 'd';
            else if (record.type === 'ft') actionCode = record.isSuccess ? 'e' : 'f';
            else if (record.type === 'foul') actionCode = 'g';
            else if (record.type === 'flagrant') actionCode = 'h';

            return `${record.isTeam1 ? '1' : '2'}${playerId.toString().padStart(2, '0')}${actionCode}`;
        }).filter(Boolean).join('');

        if (compressedScoreHistory) {
            result += `_s${compressedScoreHistory}`;
        }
    }
    
    if (data.statHistory && Array.isArray(data.statHistory) && data.statHistory.length > 0) {
        const recentStatHistory = data.statHistory.slice(-5);
        const compressedStatHistory = recentStatHistory.map(record => {
            const playerId = getPlayerIdByName(record.player);
            if (playerId === -1) return null;

            // 紧凑编码：队伍(1位) + 球员ID(2位) + 统计类型(1位)
            // 统计类型：r=篮板, a=助攻, s=抢断, t=失误, b=盖帽
            let statCode = '';
            if (record.type === 'rebound') statCode = 'r';
            else if (record.type === 'assist') statCode = 'a';
            else if (record.type === 'steal') statCode = 's';
            else if (record.type === 'turnover') statCode = 't';
            else if (record.type === 'block') statCode = 'b';

            return `${record.isTeam1 ? '1' : '2'}${playerId.toString().padStart(2, '0')}${statCode}`;
        }).filter(Boolean).join('');

        if (compressedStatHistory) {
            result += `_t${compressedStatHistory}`;
        }
    }

    return result;
}

/**
 * 解压缩短字符串为游戏数据
 */
export function decompressGameData(compressed: string): GameData | null {
    try {
        if (!compressed.startsWith('GAME_')) return null;
        
        const fullData = compressed.slice(5); // 移除 'GAME_' 前缀
        const parts = fullData.split('_');
        
        // 解析队伍ID
        const [team1Id, team2Id] = parts[0].split('-').map(Number);
        const team1Name = getTeamNameById(team1Id);
        const team2Name = getTeamNameById(team2Id);
        
        if (!team1Name || !team2Name) return null;

        let currentIndex = 1;
        let team1JumpBalls = 0;
        let team2JumpBalls = 0;
        let team1Players: string[] = [];
        let team2Players: string[] = [];
        let team1Hidden: string[] = [];
        let team2Hidden: string[] = [];
        const playerStats: {[key: string]: PlayerStats} = {};
        const scoreHistory: ScoreHistory[] = [];
        const statHistory: StatHistory[] = [];

        // 解析争球数据
        if (parts[currentIndex]?.startsWith('j')) {
            const jumpData = parts[currentIndex].slice(1);
            team1JumpBalls = parseInt(jumpData[0]);
            team2JumpBalls = parseInt(jumpData[1]);
            currentIndex++;
        }

        // 解析球员列表
        const team1Ids = parts[currentIndex].match(/.{2}/g) || [];
        team1Players = team1Ids.map(id => getPlayerNameById(parseInt(id))).filter(Boolean);
        currentIndex++;

        const team2Ids = parts[currentIndex].match(/.{2}/g) || [];
        team2Players = team2Ids.map(id => getPlayerNameById(parseInt(id))).filter(Boolean);
        currentIndex++;

        // 解析隐藏球员列表
        if (parts[currentIndex]?.startsWith('h')) {
            const hiddenData = parts[currentIndex].slice(1);
            const [team1HiddenStr, team2HiddenStr] = hiddenData.split('|');
            
            if (team1HiddenStr) {
                const team1HiddenIds = team1HiddenStr.match(/.{2}/g) || [];
                team1Hidden = team1HiddenIds.map(id => getPlayerNameById(parseInt(id))).filter(Boolean);
            }
            
            if (team2HiddenStr) {
                const team2HiddenIds = team2HiddenStr.match(/.{2}/g) || [];
                team2Hidden = team2HiddenIds.map(id => getPlayerNameById(parseInt(id))).filter(Boolean);
            }
            
            currentIndex++;
        }

        // 初始化所有球员的统计数据
        [...team1Players, ...team2Players].forEach(player => {
            playerStats[player] = {
                totalScore: 0,
                fouls: 0,
                flagrantFouls: 0,
                attempts: {
                    '2p': { made: 0, total: 0 },
                    '3p': { made: 0, total: 0 },
                    'ft': { made: 0, total: 0 }
                },
                stats: {
                    rebounds: 0,
                    assists: 0,
                    steals: 0,
                    turnovers: 0,
                    blocks: 0
                }
            };
        });

        // 解析球员数据
        if (parts[currentIndex]?.startsWith('p')) {
            const playerData = parts[currentIndex].slice(1);
            const playerChunks = playerData.split('|');
            playerChunks.forEach(chunk => {
                const [playerIdStr, statsStr] = chunk.split(':');
                const playerId = parseInt(playerIdStr);
                const playerName = getPlayerNameById(playerId);
                if (!playerName || !statsStr) return;

                const stats = statsStr.split(',').map(Number);
                if (stats.length >= 13) {
                    playerStats[playerName] = {
                        totalScore: stats[0] * 2 + stats[2] * 3 + stats[4], // 2p命中*2 + 3p命中*3 + 罚球命中
                        fouls: stats[6],
                        flagrantFouls: stats[7],
                        attempts: {
                            '2p': { made: stats[0], total: stats[1] },
                            '3p': { made: stats[2], total: stats[3] },
                            'ft': { made: stats[4], total: stats[5] }
                        },
                        stats: {
                            rebounds: stats[8] || 0,
                            assists: stats[9] || 0,
                            steals: stats[10] || 0,
                            turnovers: stats[11] || 0,
                            blocks: stats[12] || 0
                        }
                    };
                }
            });
            currentIndex++;
        }

        // 解析得分历史记录
        if (parts[currentIndex]?.startsWith('s')) {
            const historyData = parts[currentIndex].slice(1);
            // 每个记录4个字符：队伍(1) + 球员ID(2) + 动作代码(1)
            for (let i = 0; i < historyData.length; i += 4) {
                const record = historyData.slice(i, i + 4);
                if (record.length < 4) break;
                
                const teamFlag = record[0];
                const playerId = parseInt(record.slice(1, 3));
                const actionCode = record[3];
                const playerName = getPlayerNameById(playerId);
                if (!playerName) continue;

                const isTeam1 = teamFlag === '1';
                let type: ShotType | 'foul' | 'flagrant';
                let isSuccess = false;

                switch (actionCode) {
                    case 'a': type = '2p'; isSuccess = true; break;
                    case 'b': type = '2p'; isSuccess = false; break;
                    case 'c': type = '3p'; isSuccess = true; break;
                    case 'd': type = '3p'; isSuccess = false; break;
                    case 'e': type = 'ft'; isSuccess = true; break;
                    case 'f': type = 'ft'; isSuccess = false; break;
                    case 'g': type = 'foul'; break;
                    case 'h': type = 'flagrant'; break;
                    default: continue;
                }

                scoreHistory.push({
                    player: playerName,
                    type,
                    isSuccess,
                    isTeam1,
                    previousStats: { ...playerStats[playerName] }
                });
            }
            currentIndex++;
        }

        // 解析统计历史记录
        if (parts[currentIndex]?.startsWith('t')) {
            const historyData = parts[currentIndex].slice(1);
            // 每个记录4个字符：队伍(1) + 球员ID(2) + 统计代码(1)
            for (let i = 0; i < historyData.length; i += 4) {
                const record = historyData.slice(i, i + 4);
                if (record.length < 4) break;
                
                const teamFlag = record[0];
                const playerId = parseInt(record.slice(1, 3));
                const statCode = record[3];
                const playerName = getPlayerNameById(playerId);
                if (!playerName) continue;

                const isTeam1 = teamFlag === '1';
                let type: 'rebound' | 'assist' | 'steal' | 'turnover' | 'block';

                switch (statCode) {
                    case 'r': type = 'rebound'; break;
                    case 'a': type = 'assist'; break;
                    case 's': type = 'steal'; break;
                    case 't': type = 'turnover'; break;
                    case 'b': type = 'block'; break;
                    default: continue;
                }

                statHistory.push({
                    player: playerName,
                    type,
                    isTeam1,
                    previousStats: { ...playerStats[playerName] }
                });
            }
            currentIndex++;
        }

        // 构建返回数据
        const gameDataResult: GameData = {
            team1: {
                name: team1Name,
                list: team1Players,
                totalScore: team1Players.reduce((total, player) => 
                    total + (playerStats[player]?.totalScore || 0), 0),
                jumpBalls: team1JumpBalls,
                hiddenPlayers: team1Hidden
            },
            team2: {
                name: team2Name,
                list: team2Players,
                totalScore: team2Players.reduce((total, player) => 
                    total + (playerStats[player]?.totalScore || 0), 0),
                jumpBalls: team2JumpBalls,
                hiddenPlayers: team2Hidden
            },
            playerStats,
            scoreHistory,
            statHistory
        };

        return gameDataResult;
    } catch (error) {
        console.error('解压缩数据失败:', error);
        return null;
    }
}