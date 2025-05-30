import { useState } from 'react';
import { copyToClipboard } from '../utils';
import { compressGameData, decompressGameData } from '../utils';
import * as XLSX from 'xlsx';

// Other页面的数据类型定义
interface OtherPagePlayerStats {
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

interface HeaderProps {
    isHeaderVisible: boolean;
    setHeaderVisible: (visible: boolean) => void;
    onImportData: (data: string) => void;
    onClearData: () => void;
    onExportData: () => string;
    isTeamSelected: boolean;
    setMessage: (message: string) => void;
    isOtherPage?: boolean;
}

export default function Header({
    isHeaderVisible,
    setHeaderVisible,
    onImportData,
    onClearData,
    onExportData,
    isTeamSelected,
    setMessage,
    isOtherPage = false
}: HeaderProps) {
    const [importValue, setImportValue] = useState('');

    const handleImportData = () => {
        const trimmedData = importValue.trim();
        if (!trimmedData) {
            setMessage('请输入要导入的数据');
            return;
        }

        try {
            let parsedData;
            
            if (isOtherPage) {
                // Other页面的导入逻辑
                if (trimmedData.startsWith('OTHER_')) {
                    // 压缩格式数据
                    parsedData = decompressOtherPageData(trimmedData);
                    if (!parsedData) {
                        setMessage('压缩数据格式错误，请检查数据');
                        return;
                    }
                } else {
                    // 完整JSON格式数据
                    try {
                        parsedData = JSON.parse(trimmedData);
                        
                        // 验证是否为Other页面的数据格式
                        if (!parsedData.playerStats || parsedData.team1 || parsedData.team2) {
                            setMessage('数据格式不匹配，请确保导入的是球员统计数据');
                            return;
                        }
                        
                        // 确保历史记录字段存在
                        parsedData.scoreHistory = parsedData.scoreHistory || [];
                        parsedData.statHistory = parsedData.statHistory || [];
                        
                    } catch {
                        setMessage('JSON数据格式错误，请检查数据格式');
                        return;
                    }
                }
            } else {
                // 主页面的导入逻辑
                if (trimmedData.startsWith('GAME_')) {
                    // 压缩格式数据
                    parsedData = decompressGameData(trimmedData);
                    if (!parsedData) {
                        setMessage('压缩数据格式错误，请检查数据');
                        return;
                    }
                } else {
                    // 完整JSON格式数据
                    try {
                        parsedData = JSON.parse(trimmedData);
                        
                        // 验证是否为主页面的数据格式
                        if (!parsedData.team1 || !parsedData.team2) {
                            setMessage('数据格式不匹配，请确保导入的是比赛数据');
                            return;
                        }
                        
                        // 确保历史记录字段存在
                        parsedData.scoreHistory = parsedData.scoreHistory || [];
                        parsedData.statHistory = parsedData.statHistory || [];
                        
                    } catch {
                        setMessage('JSON数据格式错误，请检查数据格式');
                        return;
                    }
                }
            }

            // 合并历史记录
            const currentData = JSON.parse(onExportData());
            const mergedData = {
                ...parsedData,
                scoreHistory: [
                    ...(currentData.scoreHistory || []),
                    ...(parsedData.scoreHistory || [])
                ],
                statHistory: [
                    ...(currentData.statHistory || []),
                    ...(parsedData.statHistory || [])
                ]
            };

            onImportData(JSON.stringify(mergedData));
            setMessage('数据导入成功');
            setImportValue('');
        } catch (error) {
            console.error('导入失败:', error);
            setMessage('数据导入失败，请检查数据格式');
        }
    };

    // Other页面专用的压缩函数
    const compressOtherPageData = (data: { playerStats: { [key: string]: OtherPagePlayerStats }; scoreHistory: unknown[]; statHistory: unknown[]; customPlayers?: string[] }): string => {
        try {
            // 使用自定义球员号码或默认号码
            const players = data.customPlayers && data.customPlayers.length > 0 
                ? data.customPlayers 
                : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
            
            let result = 'OTHER_';
            
            // 压缩球员数据
            const playerData: string[] = [];
            players.forEach((player: string) => {
                const stats = data.playerStats?.[player];
                if (!stats) return;
                
                // 检查是否有数据
                const hasData = stats.totalScore > 0 || stats.fouls > 0 || stats.flagrantFouls > 0 ||
                               (stats.stats && (stats.stats.rebounds > 0 || stats.stats.assists > 0 || 
                                stats.stats.steals > 0 || stats.stats.turnovers > 0 || stats.stats.blocks > 0));
                
                if (!hasData) return;
                
                // 格式：球员号:得分,2p命中/总数,3p命中/总数,罚球命中/总数,犯规,恶意犯规,篮板,助攻,抢断,失误,盖帽
                const playerStats = [
                    stats.totalScore || 0,
                    `${stats.attempts?.['2p']?.made || 0}/${stats.attempts?.['2p']?.total || 0}`,
                    `${stats.attempts?.['3p']?.made || 0}/${stats.attempts?.['3p']?.total || 0}`,
                    `${stats.attempts?.['ft']?.made || 0}/${stats.attempts?.['ft']?.total || 0}`,
                    stats.fouls || 0,
                    stats.flagrantFouls || 0,
                    stats.stats?.rebounds || 0,
                    stats.stats?.assists || 0,
                    stats.stats?.steals || 0,
                    stats.stats?.turnovers || 0,
                    stats.stats?.blocks || 0
                ].join(',');
                
                playerData.push(`${player}:${playerStats}`);
            });
            
            if (playerData.length > 0) {
                result += playerData.join('|');
            }
            
            // 添加自定义球员号码信息（如果不是默认的1-10）
            const defaultPlayers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
            if (data.customPlayers && JSON.stringify(data.customPlayers) !== JSON.stringify(defaultPlayers)) {
                result += '#P:' + data.customPlayers.join(',');
            }
            
            // 添加历史记录压缩（只保留最近5条，使用紧凑编码）
            if (data.scoreHistory && Array.isArray(data.scoreHistory) && data.scoreHistory.length > 0) {
                const recentHistory = data.scoreHistory.slice(-5);
                const compressedHistory = recentHistory.map((record) => {
                    // 类型检查和转换
                    if (typeof record !== 'object' || record === null) return null;
                    const typedRecord = record as { player?: string; type?: string; isSuccess?: boolean };
                    
                    if (!typedRecord.player || !typedRecord.type) return null;
                    
                    // 使用球员在数组中的索引而不是球员号码本身
                    const playerIndex = players.indexOf(typedRecord.player);
                    if (playerIndex === -1) return null;
                    
                    // 紧凑编码：球员索引(1位) + 动作类型(1位)
                    let actionCode = '';
                    if (typedRecord.type === '2p') actionCode = typedRecord.isSuccess ? 'a' : 'b';
                    else if (typedRecord.type === '3p') actionCode = typedRecord.isSuccess ? 'c' : 'd';
                    else if (typedRecord.type === 'ft') actionCode = typedRecord.isSuccess ? 'e' : 'f';
                    else if (typedRecord.type === 'foul') actionCode = 'g';
                    else if (typedRecord.type === 'flagrant') actionCode = 'h';
                    
                    return `${playerIndex}${actionCode}`;
                }).filter(Boolean).join('');
                
                if (compressedHistory) {
                    result += '#S:' + compressedHistory;
                }
            }
            
            if (data.statHistory && Array.isArray(data.statHistory) && data.statHistory.length > 0) {
                const recentHistory = data.statHistory.slice(-5);
                const compressedHistory = recentHistory.map((record) => {
                    // 类型检查和转换
                    if (typeof record !== 'object' || record === null) return null;
                    const typedRecord = record as { player?: string; type?: string };
                    
                    if (!typedRecord.player || !typedRecord.type) return null;
                    
                    // 使用球员在数组中的索引而不是球员号码本身
                    const playerIndex = players.indexOf(typedRecord.player);
                    if (playerIndex === -1) return null;
                    
                    // 紧凑编码：球员索引(1位) + 统计类型(1位)
                    let statCode = '';
                    if (typedRecord.type === 'rebound') statCode = 'r';
                    else if (typedRecord.type === 'assist') statCode = 'a';
                    else if (typedRecord.type === 'steal') statCode = 's';
                    else if (typedRecord.type === 'turnover') statCode = 't';
                    else if (typedRecord.type === 'block') statCode = 'b';
                    
                    return `${playerIndex}${statCode}`;
                }).filter(Boolean).join('');
                
                if (compressedHistory) {
                    result += '#T:' + compressedHistory;
                }
            }
            
            return result;
        } catch (error) {
            console.error('压缩Other页面数据失败:', error);
            return '';
        }
    };

    // Other页面专用的解压缩函数
    const decompressOtherPageData = (compressed: string): { playerStats: { [key: string]: OtherPagePlayerStats }; scoreHistory: unknown[]; statHistory: unknown[]; customPlayers?: string[] } | null => {
        try {
            if (!compressed.startsWith('OTHER_')) return null;
            
            const fullData = compressed.slice(6); // 移除 'OTHER_' 前缀
            let players = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']; // 默认球员号码
            const playerStats: { [key: string]: OtherPagePlayerStats } = {};
            
            // 分离球员数据和历史记录
            let playerData = fullData;
            const scoreHistory: unknown[] = [];
            const statHistory: unknown[] = [];
            
            // 提取自定义球员号码（如果有）
            const customPlayersMatch = fullData.match(/#P:([^#]+)/);
            if (customPlayersMatch) {
                try {
                    const customPlayersData = customPlayersMatch[1];
                    players = customPlayersData.split(',');
                    playerData = playerData.replace(/#P:[^#]+/, '');
                } catch (e) {
                    console.warn('解析自定义球员号码失败:', e);
                }
            }
            
            // 提取得分历史记录（新的紧凑格式）
            const scoreHistoryMatch = fullData.match(/#S:([^#]+)/);
            if (scoreHistoryMatch) {
                try {
                    const historyData = scoreHistoryMatch[1];
                    // 解析紧凑编码的历史记录
                    for (let i = 0; i < historyData.length; i += 2) {
                        const playerIndexChar = historyData[i];
                        const actionCode = historyData[i + 1];
                        if (!playerIndexChar || !actionCode) break;
                        
                        const playerIndex = parseInt(playerIndexChar);
                        if (playerIndex < 0 || playerIndex >= players.length) continue;
                        
                        const playerName = players[playerIndex];
                        
                        let type = '';
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
                            isTeam1: true, // Other页面只有一个队伍
                            previousStats: {}
                        });
                    }
                    playerData = playerData.replace(/#S:[^#]+/, '');
                } catch (e) {
                    console.warn('解析得分历史记录失败:', e);
                }
            }
            
            // 提取统计历史记录（新的紧凑格式）
            const statHistoryMatch = fullData.match(/#T:([^#]+)/);
            if (statHistoryMatch) {
                try {
                    const historyData = statHistoryMatch[1];
                    // 解析紧凑编码的历史记录
                    for (let i = 0; i < historyData.length; i += 2) {
                        const playerIndexChar = historyData[i];
                        const statCode = historyData[i + 1];
                        if (!playerIndexChar || !statCode) break;
                        
                        const playerIndex = parseInt(playerIndexChar);
                        if (playerIndex < 0 || playerIndex >= players.length) continue;
                        
                        const playerName = players[playerIndex];
                        
                        let type = '';
                        
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
                            isTeam1: true, // Other页面只有一个队伍
                            previousStats: {}
                        });
                    }
                    playerData = playerData.replace(/#T:[^#]+/, '');
                } catch (e) {
                    console.warn('解析统计历史记录失败:', e);
                }
            }
            
            // 初始化所有球员数据
            players.forEach((player: string) => {
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
            if (playerData) {
                const playerDataList = playerData.split('|');
                playerDataList.forEach((playerDataStr: string) => {
                    const [player, statsStr] = playerDataStr.split(':');
                    if (!player || !statsStr) return;
                    
                    const stats = statsStr.split(',');
                    if (stats.length >= 11) {
                        const [totalScore, twoP, threeP, ft, fouls, flagrantFouls, rebounds, assists, steals, turnovers, blocks] = stats;
                        
                        const [twoMade, twoTotal] = twoP.split('/').map(Number);
                        const [threeMade, threeTotal] = threeP.split('/').map(Number);
                        const [ftMade, ftTotal] = ft.split('/').map(Number);
                        
                        playerStats[player] = {
                            totalScore: parseInt(totalScore) || 0,
                            fouls: parseInt(fouls) || 0,
                            flagrantFouls: parseInt(flagrantFouls) || 0,
                            attempts: {
                                '2p': { made: twoMade || 0, total: twoTotal || 0 },
                                '3p': { made: threeMade || 0, total: threeTotal || 0 },
                                'ft': { made: ftMade || 0, total: ftTotal || 0 }
                            },
                            stats: {
                                rebounds: parseInt(rebounds) || 0,
                                assists: parseInt(assists) || 0,
                                steals: parseInt(steals) || 0,
                                turnovers: parseInt(turnovers) || 0,
                                blocks: parseInt(blocks) || 0
                            }
                        };
                    }
                });
            }
            
            // 返回结果，包含自定义球员号码（如果不是默认的）
            const defaultPlayers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
            const result: { playerStats: { [key: string]: OtherPagePlayerStats }; scoreHistory: unknown[]; statHistory: unknown[]; customPlayers?: string[] } = {
                playerStats,
                scoreHistory,
                statHistory
            };
            
            if (JSON.stringify(players) !== JSON.stringify(defaultPlayers)) {
                result.customPlayers = players;
            }
            
            return result;
        } catch (error) {
            console.error('解压缩Other页面数据失败:', error);
            return null;
        }
    };

    const handleExportData = async () => {
        try {
            const data = onExportData();
            const jsonData = JSON.parse(data);
            
            let compressedData = '';
            if (isOtherPage) {
                // Other页面的压缩逻辑
                compressedData = compressOtherPageData({
                    ...jsonData,
                    scoreHistory: jsonData.scoreHistory || [],
                    statHistory: jsonData.statHistory || []
                });
            } else {
                // 主页面的压缩逻辑
                compressedData = compressGameData({
                    ...jsonData,
                    scoreHistory: jsonData.scoreHistory || [],
                    statHistory: jsonData.statHistory || []
                });
            }

            if (await copyToClipboard(compressedData)) {
                setMessage('数据已复制到剪贴板');
            } else {
                setMessage('复制失败，请手动复制数据');
            }
        } catch (err) {
            setMessage('导出失败，请稍后重试');
            console.error('导出失败:', err);
        }
    };

    const handleExportExcel = async () => {
        try {
            const data = onExportData();
            const jsonData = JSON.parse(data);

            if (isOtherPage) {
                // Other页面的Excel导出逻辑
                if (!jsonData?.playerStats) {
                    setMessage('数据格式不完整，请检查数据');
                    return;
                }

                const rows = [];
                // 使用自定义球员号码或默认号码
                const players = jsonData.customPlayers && jsonData.customPlayers.length > 0 
                    ? jsonData.customPlayers 
                    : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

                // 添加总分行
                const totalScore = players.reduce((total: number, player: string) => {
                    return total + (jsonData.playerStats[player]?.totalScore || 0);
                }, 0);

                rows.push({
                    球员: '总分',
                    得分: totalScore,
                    '2分命中率': '',
                    '3分命中率': '',
                    '罚球命中率': '',
                    '犯规': '',
                    '恶意犯规': '',
                    '篮板': '',
                    '助攻': '',
                    '抢断': '',
                    '失误': '',
                    '盖帽': ''
                });

                // 添加球员数据（按得分排序）
                players
                    .filter((player: string) => jsonData.playerStats[player])
                    .sort((a: string, b: string) => (jsonData.playerStats[b]?.totalScore || 0) - (jsonData.playerStats[a]?.totalScore || 0))
                    .forEach((player: string) => {
                        const stats = jsonData.playerStats[player] || {};
                        const attempts = stats.attempts || {};
                        const playerStats = stats.stats || {};
                        
                        rows.push({
                            球员: `${player}号`,
                            得分: stats.totalScore || 0,
                            '2分命中率': (() => {
                                const made = attempts['2p']?.made || 0;
                                const total = attempts['2p']?.total || 0;
                                return total > 0 ? `${made}/${total} (${Math.round((made / total) * 100)}%)` : '0/0 (0%)';
                            })(),
                            '3分命中率': (() => {
                                const made = attempts['3p']?.made || 0;
                                const total = attempts['3p']?.total || 0;
                                return total > 0 ? `${made}/${total} (${Math.round((made / total) * 100)}%)` : '0/0 (0%)';
                            })(),
                            '罚球命中率': (() => {
                                const made = attempts['ft']?.made || 0;
                                const total = attempts['ft']?.total || 0;
                                return total > 0 ? `${made}/${total} (${Math.round((made / total) * 100)}%)` : '0/0 (0%)';
                            })(),
                            '犯规': stats.fouls || 0,
                            '恶意犯规': stats.flagrantFouls || 0,
                            '篮板': playerStats.rebounds || 0,
                            '助攻': playerStats.assists || 0,
                            '抢断': playerStats.steals || 0,
                            '失误': playerStats.turnovers || 0,
                            '盖帽': playerStats.blocks || 0
                        });
                    });

                // 创建工作簿和工作表
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(rows);

                // 设置列宽
                const colWidths = [
                    { wch: 8 },  // 球员
                    { wch: 8 },  // 得分
                    { wch: 15 }, // 2分命中率
                    { wch: 15 }, // 3分命中率
                    { wch: 15 }, // 罚球命中率
                    { wch: 8 },  // 犯规
                    { wch: 10 }, // 恶意犯规
                    { wch: 8 },  // 篮板
                    { wch: 8 },  // 助攻
                    { wch: 8 },  // 抢断
                    { wch: 8 },  // 失误
                    { wch: 8 }   // 盖帽
                ];
                ws['!cols'] = colWidths;

                // 添加工作表到工作簿
                XLSX.utils.book_append_sheet(wb, ws, "球员统计");

                // 生成文件名
                const now = new Date();
                const fileName = `球员统计_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}.xlsx`;

                // 导出文件
                XLSX.writeFile(wb, fileName);
                setMessage('Excel文件已下载');
            } else {
                // 主页面的Excel导出逻辑（原有逻辑）
                if (!jsonData?.team1?.list || !jsonData?.team2?.list || !jsonData?.playerStats) {
                    setMessage('数据格式不完整，请检查数据');
                    return;
                }

                // 创建表头行
                const headerRow = {
                    队伍: '',
                    球员: '',
                    得分: '',
                    '2分命中率': '',
                    '3分命中率': '',
                    '罚球命中率': '',
                    '犯规': '',
                    '恶意犯规': '',
                    '篮板': '',
                    '助攻': '',
                    '抢断': '',
                    '失误': '',
                    '盖帽': ''
                };

                const rows = [];

                // 添加队伍1数据
                rows.push({
                    队伍: jsonData.team1.name,
                    球员: '总分',
                    得分: jsonData.team1.totalScore,
                    '2分命中率': '',
                    '3分命中率': '',
                    '罚球命中率': '',
                    '犯规': '',
                    '恶意犯规': '',
                    '篮板': '',
                    '助攻': '',
                    '抢断': '',
                    '失误': '',
                    '盖帽': ''
                });

                // 添加队伍1球员数据（按得分排序）
                [...jsonData.team1.list]
                    .sort((a: string, b: string) => (jsonData.playerStats[b]?.totalScore || 0) - (jsonData.playerStats[a]?.totalScore || 0))
                    .forEach((player: string) => {
                        const stats = jsonData.playerStats[player] || {};
                        const attempts = stats.attempts || {};
                        const playerStats = stats.stats || {};
                        
                        rows.push({
                            队伍: '',
                            球员: player || '未知球员',
                            得分: stats.totalScore || 0,
                            '2分命中率': (() => {
                                const made = attempts['2p']?.made || 0;
                                const total = attempts['2p']?.total || 0;
                                return total > 0 ? `${made}/${total} (${Math.round((made / total) * 100)}%)` : '0/0 (0%)';
                            })(),
                            '3分命中率': (() => {
                                const made = attempts['3p']?.made || 0;
                                const total = attempts['3p']?.total || 0;
                                return total > 0 ? `${made}/${total} (${Math.round((made / total) * 100)}%)` : '0/0 (0%)';
                            })(),
                            '罚球命中率': (() => {
                                const made = attempts['ft']?.made || 0;
                                const total = attempts['ft']?.total || 0;
                                return total > 0 ? `${made}/${total} (${Math.round((made / total) * 100)}%)` : '0/0 (0%)';
                            })(),
                            '犯规': stats.fouls || 0,
                            '恶意犯规': stats.flagrantFouls || 0,
                            '篮板': playerStats.rebounds || 0,
                            '助攻': playerStats.assists || 0,
                            '抢断': playerStats.steals || 0,
                            '失误': playerStats.turnovers || 0,
                            '盖帽': playerStats.blocks || 0
                        });
                    });

                // 添加空行
                rows.push(headerRow);

                // 添加队伍2数据
                rows.push({
                    队伍: jsonData.team2.name,
                    球员: '总分',
                    得分: jsonData.team2.totalScore,
                    '2分命中率': '',
                    '3分命中率': '',
                    '罚球命中率': '',
                    '犯规': '',
                    '恶意犯规': '',
                    '篮板': '',
                    '助攻': '',
                    '抢断': '',
                    '失误': '',
                    '盖帽': ''
                });

                // 添加队伍2球员数据（按得分排序）
                [...jsonData.team2.list]
                    .sort((a: string, b: string) => (jsonData.playerStats[b]?.totalScore || 0) - (jsonData.playerStats[a]?.totalScore || 0))
                    .forEach((player: string) => {
                        const stats = jsonData.playerStats[player] || {};
                        const attempts = stats.attempts || {};
                        const playerStats = stats.stats || {};
                        
                        rows.push({
                            队伍: '',
                            球员: player || '未知球员',
                            得分: stats.totalScore || 0,
                            '2分命中率': (() => {
                                const made = attempts['2p']?.made || 0;
                                const total = attempts['2p']?.total || 0;
                                return total > 0 ? `${made}/${total} (${Math.round((made / total) * 100)}%)` : '0/0 (0%)';
                            })(),
                            '3分命中率': (() => {
                                const made = attempts['3p']?.made || 0;
                                const total = attempts['3p']?.total || 0;
                                return total > 0 ? `${made}/${total} (${Math.round((made / total) * 100)}%)` : '0/0 (0%)';
                            })(),
                            '罚球命中率': (() => {
                                const made = attempts['ft']?.made || 0;
                                const total = attempts['ft']?.total || 0;
                                return total > 0 ? `${made}/${total} (${Math.round((made / total) * 100)}%)` : '0/0 (0%)';
                            })(),
                            '犯规': stats.fouls || 0,
                            '恶意犯规': stats.flagrantFouls || 0,
                            '篮板': playerStats.rebounds || 0,
                            '助攻': playerStats.assists || 0,
                            '抢断': playerStats.steals || 0,
                            '失误': playerStats.turnovers || 0,
                            '盖帽': playerStats.blocks || 0
                        });
                    });

                // 创建工作簿和工作表
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(rows);

                // 设置列宽
                const colWidths = [
                    { wch: 15 }, // 队伍
                    { wch: 10 }, // 球员
                    { wch: 8 },  // 得分
                    { wch: 15 }, // 2分命中率
                    { wch: 15 }, // 3分命中率
                    { wch: 15 }, // 罚球命中率
                    { wch: 8 },  // 犯规
                    { wch: 10 }, // 恶意犯规
                    { wch: 8 },  // 篮板
                    { wch: 8 },  // 助攻
                    { wch: 8 },  // 抢断
                    { wch: 8 },  // 失误
                    { wch: 8 }   // 盖帽
                ];
                ws['!cols'] = colWidths;

                // 添加工作表到工作簿
                XLSX.utils.book_append_sheet(wb, ws, "比赛数据");

                // 生成文件名（使用当前时间）
                const now = new Date();
                const fileName = `比赛数据_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}.xlsx`;

                // 导出文件
                XLSX.writeFile(wb, fileName);
                setMessage('Excel文件已下载');
            }
        } catch (err) {
            console.error('导出Excel失败:', err);
            setMessage('导出Excel失败，请稍后重试');
        }
    };

    return (
        <>
            {/* 遮罩层 */}
            {isHeaderVisible && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 z-[15]"
                    onClick={() => setHeaderVisible(false)}
                />
            )}
            <header className={`z-[20] fixed top-0 left-0 right-0 flex flex-col items-center justify-center p-3 sm:p-6 
                bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg z-10 transition-all duration-300 
                ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
                
                <div className="w-full max-w-6xl flex flex-col items-center justify-between gap-3 sm:gap-4">
                    {/* 导入数据部分 */}
                    <div className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <input
                                type="text"
                                value={importValue}
                                onChange={(e) => setImportValue(e.target.value)}
                                placeholder={isOtherPage ? "粘贴球员统计数据" : "粘贴比赛数据"}
                                className="w-full sm:flex-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 
                                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent 
                                    transition-all duration-200 shadow-sm placeholder:text-gray-400"
                            />
                            <button
                                onClick={handleImportData}
                                className="w-full sm:w-auto px-4 py-2.5 text-white bg-gradient-to-r from-blue-500 to-blue-600 
                                    rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 
                                    shadow-sm hover:shadow-md flex items-center justify-center gap-2 font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                导入数据
                            </button>
                        </div>
                    </div>

                    {isTeamSelected && (
                        <div className="w-full flex flex-col gap-2">
                            {/* 导出按钮组 */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleExportData}
                                    className="w-full px-4 py-2.5 text-white bg-gradient-to-r from-green-500 to-green-600 
                                        rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 
                                        shadow-sm hover:shadow-md flex items-center justify-center gap-2 font-medium"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    复制数据
                                </button>
                                <button
                                    onClick={handleExportExcel}
                                    className="w-full px-4 py-2.5 text-white bg-gradient-to-r from-green-500 to-green-600 
                                        rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 
                                        shadow-sm hover:shadow-md flex items-center justify-center gap-2 font-medium"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    下载excel
                                </button>
                            </div>

                            {/* 清除数据按钮 */}
                            <button
                                onClick={() => {
                                    if (confirm('清除数据前请确保保留的数据！确定要清除所有数据吗？此操作不可恢复。')) {
                                        setHeaderVisible(false);
                                        onClearData();
                                        const data = onExportData();
                                        const jsonData = JSON.parse(data);
                                        const compressedData = compressGameData(jsonData);
                                        copyToClipboard(compressedData);
                                        setMessage('所有数据已清除，已复制数据');
                                    }
                                }}
                                className="w-full px-4 py-2.5 text-white bg-gradient-to-r from-red-500 to-red-600 
                                    rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 
                                    shadow-sm hover:shadow-md flex items-center justify-center gap-2 font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                清除数据
                            </button>
                        </div>
                    )}
                </div>
            </header>
        </>
    );
};