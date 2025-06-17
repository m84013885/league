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

// 定义与主页面一致的类型
interface TeamType {
    name: string;
    list: string[];
    totalScore: number;
    jumpBalls: number;
    hiddenPlayers: string[];
    customPlayers?: string[];
}

interface PlayerStatsMap {
    [key: string]: OtherPagePlayerStats;
}

interface HeaderProps {
    isHeaderVisible: boolean;
    setHeaderVisible: (visible: boolean) => void;
    onClearData: () => void;
    isTeamSelected: boolean;
    setMessage: (message: string) => void;
    isOtherPage?: boolean;
    team1: TeamType | null;
    team2: TeamType | null;
    playerStats: PlayerStatsMap;
}

export default function Header({
    isHeaderVisible,
    setHeaderVisible,
    onClearData,
    isTeamSelected,
    setMessage,
    isOtherPage = false,
    team1,
    team2,
    playerStats
}: HeaderProps) {
    const handleExportExcel = async () => {
        try {
            const jsonData = { team1, team2, playerStats };

            if (isOtherPage) {
                // Other页面的Excel导出逻辑
                if (!jsonData?.playerStats) {
                    setMessage('数据格式不完整，请检查数据');
                    return;
                }

                const rows = [];
                // 使用自定义球员号码或默认号码（如有customPlayers字段则用，没有则用默认）
                const players = (jsonData.team1 && Array.isArray(jsonData.team1.customPlayers) && jsonData.team1.customPlayers.length > 0)
                    ? jsonData.team1.customPlayers
                    : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

                // 自动修正 playerStats 的 key，去掉"号"字
                const fixPlayerStats: { [key: string]: OtherPagePlayerStats } = {};
                Object.keys(jsonData.playerStats || {}).forEach((key: string) => {
                  const fixedKey = key.replace(/号$/, '');
                  fixPlayerStats[fixedKey] = (jsonData.playerStats as { [key: string]: OtherPagePlayerStats })[key];
                });
                const team1Players = (jsonData.team1?.list || []).map((name: string) => (name as string).replace(/号$/, ''));
                const safeStats1 = (player: string) => fixPlayerStats[player] || {
                    totalScore: 0,
                    fouls: 0,
                    flagrantFouls: 0,
                    attempts: { '2p': { made: 0, total: 0 }, '3p': { made: 0, total: 0 }, 'ft': { made: 0, total: 0 } },
                    stats: { rebounds: 0, assists: 0, steals: 0, turnovers: 0, blocks: 0 }
                };

                const totalScore = players.reduce((total: number, player: string) => {
                    return total + safeStats1(player).totalScore;
                }, 0);
                const total2pMade = players.reduce((total: number, player: string) => {
                    return total + safeStats1(player).attempts['2p'].made;
                }, 0);
                const total2pAttempts = players.reduce((total: number, player: string) => {
                    return total + safeStats1(player).attempts['2p'].total;
                }, 0);
                const total3pMade = players.reduce((total: number, player: string) => {
                    return total + safeStats1(player).attempts['3p'].made;
                }, 0);
                const total3pAttempts = players.reduce((total: number, player: string) => {
                    return total + safeStats1(player).attempts['3p'].total;
                }, 0);
                const totalFtMade = players.reduce((total: number, player: string) => {
                    return total + safeStats1(player).attempts['ft'].made;
                }, 0);
                const totalFtAttempts = players.reduce((total: number, player: string) => {
                    return total + safeStats1(player).attempts['ft'].total;
                }, 0);
                const totalFouls = players.reduce((total: number, player: string) => {
                    return total + safeStats1(player).fouls;
                }, 0);
                const totalFlagrantFouls = players.reduce((total: number, player: string) => {
                    return total + safeStats1(player).flagrantFouls;
                }, 0);
                // 总命中率不包含罚球
                const totalFieldGoalMade = total2pMade + total3pMade;
                const totalFieldGoalAttempts = total2pAttempts + total3pAttempts;

                rows.push({
                    球员: '总计',
                    得分: totalScore,
                    '2分命中率': total2pAttempts > 0 ? `${total2pMade}/${total2pAttempts} (${Math.round((total2pMade / total2pAttempts) * 100)}%)` : '0/0 (0%)',
                    '3分命中率': total3pAttempts > 0 ? `${total3pMade}/${total3pAttempts} (${Math.round((total3pMade / total3pAttempts) * 100)}%)` : '0/0 (0%)',
                    '罚球命中率': totalFtAttempts > 0 ? `${totalFtMade}/${totalFtAttempts} (${Math.round((totalFtMade / totalFtAttempts) * 100)}%)` : '0/0 (0%)',
                    '犯规': totalFouls,
                    '恶意犯规': totalFlagrantFouls,
                    '总命中率': totalFieldGoalAttempts > 0 ? `${totalFieldGoalMade}/${totalFieldGoalAttempts} (${Math.round((totalFieldGoalMade / totalFieldGoalAttempts) * 100)}%)` : '0/0 (0%)',
                    '篮板': players.reduce((total: number, player: string) => total + safeStats1(player).stats.rebounds, 0),
                    '助攻': players.reduce((total: number, player: string) => total + safeStats1(player).stats.assists, 0),
                    '抢断': players.reduce((total: number, player: string) => total + safeStats1(player).stats.steals, 0),
                    '失误': players.reduce((total: number, player: string) => total + safeStats1(player).stats.turnovers, 0),
                    '盖帽': players.reduce((total: number, player: string) => total + safeStats1(player).stats.blocks, 0)
                });

                // 添加球员数据（按得分排序）
                [...team1Players]
                    .sort((a: string, b: string) => ((jsonData.playerStats as { [key: string]: OtherPagePlayerStats })[b]?.totalScore || 0) - ((jsonData.playerStats as { [key: string]: OtherPagePlayerStats })[a]?.totalScore || 0))
                    .forEach((player: string) => {
                        const playerKey = player.replace(/号$/, '');
                        const stats = fixPlayerStats[playerKey] || {};
                        const attempts = stats.attempts || {};
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
                            '篮板': stats.stats?.rebounds || 0,
                            '助攻': stats.stats?.assists || 0,
                            '抢断': stats.stats?.steals || 0,
                            '失误': stats.stats?.turnovers || 0,
                            '盖帽': stats.stats?.blocks || 0
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
                    { wch: 15 }, // 总命中率
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
                    '总命中率': '',
                    '篮板': '',
                    '助攻': '',
                    '抢断': '',
                    '失误': '',
                    '盖帽': ''
                };

                const rows = [];

                // 计算队伍1总计数据
                const team1Players = jsonData.team1?.list || [];
                // 自动修正 playerStats 的 key，去掉"号"字
                const fixPlayerStats1: { [key: string]: OtherPagePlayerStats } = {};
                Object.keys(jsonData.playerStats || {}).forEach((key: string) => {
                  const fixedKey = key.replace(/号$/, '');
                  fixPlayerStats1[fixedKey] = (jsonData.playerStats as { [key: string]: OtherPagePlayerStats })[key];
                });
                const team1PlayersFixed = team1Players.map((name: string) => (name as string).replace(/号$/, ''));
                const safeStats1 = (player: string) => fixPlayerStats1[player] || {
                    totalScore: 0,
                    fouls: 0,
                    flagrantFouls: 0,
                    attempts: { '2p': { made: 0, total: 0 }, '3p': { made: 0, total: 0 }, 'ft': { made: 0, total: 0 } },
                    stats: { rebounds: 0, assists: 0, steals: 0, turnovers: 0, blocks: 0 }
                };
                const team1Total2pMade = team1PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats1(player).attempts['2p'].made;
                }, 0);
                const team1Total2pAttempts = team1PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats1(player).attempts['2p'].total;
                }, 0);
                const team1Total3pMade = team1PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats1(player).attempts['3p'].made;
                }, 0);
                const team1Total3pAttempts = team1PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats1(player).attempts['3p'].total;
                }, 0);
                const team1TotalFtMade = team1PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats1(player).attempts['ft'].made;
                }, 0);
                const team1TotalFtAttempts = team1PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats1(player).attempts['ft'].total;
                }, 0);
                const team1TotalFouls = team1PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats1(player).fouls;
                }, 0);
                const team1TotalFlagrantFouls = team1PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats1(player).flagrantFouls;
                }, 0);
                // 计算team1总命中率（不包含罚球）
                const team1TotalFieldGoalMade = team1Total2pMade + team1Total3pMade;
                const team1TotalFieldGoalAttempts = team1Total2pAttempts + team1Total3pAttempts;
                // 计算team1其他统计数据
                const team1TotalRebounds = team1PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats1(player).stats.rebounds;
                }, 0);
                const team1TotalAssists = team1PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats1(player).stats.assists;
                }, 0);
                const team1TotalSteals = team1PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats1(player).stats.steals;
                }, 0);
                const team1TotalTurnovers = team1PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats1(player).stats.turnovers;
                }, 0);
                const team1TotalBlocks = team1PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats1(player).stats.blocks;
                }, 0);

                // 添加队伍1数据
                rows.push({
                    队伍: jsonData.team1.name,
                    球员: '总计',
                    得分: jsonData.team1.totalScore,
                    '2分命中率': team1Total2pAttempts > 0 ? `${team1Total2pMade}/${team1Total2pAttempts} (${Math.round((team1Total2pMade / team1Total2pAttempts) * 100)}%)` : '0/0 (0%)',
                    '3分命中率': team1Total3pAttempts > 0 ? `${team1Total3pMade}/${team1Total3pAttempts} (${Math.round((team1Total3pMade / team1Total3pAttempts) * 100)}%)` : '0/0 (0%)',
                    '罚球命中率': team1TotalFtAttempts > 0 ? `${team1TotalFtMade}/${team1TotalFtAttempts} (${Math.round((team1TotalFtMade / team1TotalFtAttempts) * 100)}%)` : '0/0 (0%)',
                    '犯规': team1TotalFouls,
                    '恶意犯规': team1TotalFlagrantFouls,
                    '总命中率': team1TotalFieldGoalAttempts > 0 ? `${team1TotalFieldGoalMade}/${team1TotalFieldGoalAttempts} (${Math.round((team1TotalFieldGoalMade / team1TotalFieldGoalAttempts) * 100)}%)` : '0/0 (0%)',
                    '篮板': team1TotalRebounds,
                    '助攻': team1TotalAssists,
                    '抢断': team1TotalSteals,
                    '失误': team1TotalTurnovers,
                    '盖帽': team1TotalBlocks
                });

                // 添加队伍1球员数据（按得分排序）
                [...team1PlayersFixed]
                    .sort((a: string, b: string) => ((jsonData.playerStats as { [key: string]: OtherPagePlayerStats })[b]?.totalScore || 0) - ((jsonData.playerStats as { [key: string]: OtherPagePlayerStats })[a]?.totalScore || 0))
                    .forEach((player: string) => {
                        const playerKey = player.replace(/号$/, '');
                        const stats = fixPlayerStats1[playerKey] || {};
                        const attempts = stats.attempts || {};
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
                            '篮板': stats.stats?.rebounds || 0,
                            '助攻': stats.stats?.assists || 0,
                            '抢断': stats.stats?.steals || 0,
                            '失误': stats.stats?.turnovers || 0,
                            '盖帽': stats.stats?.blocks || 0
                        });
                    });

                // 添加空行
                rows.push(headerRow);

                // 计算队伍2总计数据
                const team2Players = jsonData.team2?.list || [];
                // 自动修正 playerStats 的 key，去掉"号"字
                const fixPlayerStats2: { [key: string]: OtherPagePlayerStats } = {};
                Object.keys(jsonData.playerStats || {}).forEach((key: string) => {
                  const fixedKey = key.replace(/号$/, '');
                  fixPlayerStats2[fixedKey] = (jsonData.playerStats as { [key: string]: OtherPagePlayerStats })[key];
                });
                const team2PlayersFixed = team2Players.map((name: string) => (name as string).replace(/号$/, ''));
                const safeStats2 = (player: string) => fixPlayerStats2[player] || {
                    totalScore: 0,
                    fouls: 0,
                    flagrantFouls: 0,
                    attempts: { '2p': { made: 0, total: 0 }, '3p': { made: 0, total: 0 }, 'ft': { made: 0, total: 0 } },
                    stats: { rebounds: 0, assists: 0, steals: 0, turnovers: 0, blocks: 0 }
                };
                const team2Total2pMade = team2PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats2(player).attempts['2p'].made;
                }, 0);
                const team2Total2pAttempts = team2PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats2(player).attempts['2p'].total;
                }, 0);
                const team2Total3pMade = team2PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats2(player).attempts['3p'].made;
                }, 0);
                const team2Total3pAttempts = team2PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats2(player).attempts['3p'].total;
                }, 0);
                const team2TotalFtMade = team2PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats2(player).attempts['ft'].made;
                }, 0);
                const team2TotalFtAttempts = team2PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats2(player).attempts['ft'].total;
                }, 0);
                const team2TotalFouls = team2PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats2(player).fouls;
                }, 0);
                const team2TotalFlagrantFouls = team2PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats2(player).flagrantFouls;
                }, 0);
                // 计算team2总命中率（不包含罚球）
                const team2TotalFieldGoalMade = team2Total2pMade + team2Total3pMade;
                const team2TotalFieldGoalAttempts = team2Total2pAttempts + team2Total3pAttempts;
                // 计算team2其他统计数据
                const team2TotalRebounds = team2PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats2(player).stats.rebounds;
                }, 0);
                const team2TotalAssists = team2PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats2(player).stats.assists;
                }, 0);
                const team2TotalSteals = team2PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats2(player).stats.steals;
                }, 0);
                const team2TotalTurnovers = team2PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats2(player).stats.turnovers;
                }, 0);
                const team2TotalBlocks = team2PlayersFixed.reduce((total: number, player: string) => {
                    return total + safeStats2(player).stats.blocks;
                }, 0);

                // 添加队伍2数据
                rows.push({
                    队伍: jsonData.team2.name,
                    球员: '总计',
                    得分: jsonData.team2.totalScore,
                    '2分命中率': team2Total2pAttempts > 0 ? `${team2Total2pMade}/${team2Total2pAttempts} (${Math.round((team2Total2pMade / team2Total2pAttempts) * 100)}%)` : '0/0 (0%)',
                    '3分命中率': team2Total3pAttempts > 0 ? `${team2Total3pMade}/${team2Total3pAttempts} (${Math.round((team2Total3pMade / team2Total3pAttempts) * 100)}%)` : '0/0 (0%)',
                    '罚球命中率': team2TotalFtAttempts > 0 ? `${team2TotalFtMade}/${team2TotalFtAttempts} (${Math.round((team2TotalFtMade / team2TotalFtAttempts) * 100)}%)` : '0/0 (0%)',
                    '犯规': team2TotalFouls,
                    '恶意犯规': team2TotalFlagrantFouls,
                    '总命中率': team2TotalFieldGoalAttempts > 0 ? `${team2TotalFieldGoalMade}/${team2TotalFieldGoalAttempts} (${Math.round((team2TotalFieldGoalMade / team2TotalFieldGoalAttempts) * 100)}%)` : '0/0 (0%)',
                    '篮板': team2TotalRebounds,
                    '助攻': team2TotalAssists,
                    '抢断': team2TotalSteals,
                    '失误': team2TotalTurnovers,
                    '盖帽': team2TotalBlocks
                });

                // 添加队伍2球员数据（按得分排序）
                [...team2PlayersFixed]
                    .sort((a: string, b: string) => ((jsonData.playerStats as { [key: string]: OtherPagePlayerStats })[b]?.totalScore || 0) - ((jsonData.playerStats as { [key: string]: OtherPagePlayerStats })[a]?.totalScore || 0))
                    .forEach((player: string) => {
                        const playerKey = player.replace(/号$/, '');
                        const stats = fixPlayerStats2[playerKey] || {};
                        const attempts = stats.attempts || {};
                        rows.push({
                            队伍: player ? '' : '未知球员',
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
                            '篮板': stats.stats?.rebounds || 0,
                            '助攻': stats.stats?.assists || 0,
                            '抢断': stats.stats?.steals || 0,
                            '失误': stats.stats?.turnovers || 0,
                            '盖帽': stats.stats?.blocks || 0
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
                    { wch: 15 }, // 总命中率
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
                    {isTeamSelected && (
                        <div className="w-full flex flex-col gap-2">
                            {/* 只保留下载excel和退出对战按钮 */}
                            <div className="grid grid-cols-2 gap-2">
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
                                <button
                                    onClick={() => {
                                        setHeaderVisible(false);
                                        setMessage('已退出对战');
                                        onClearData();
                                    }}
                                    className="w-full px-4 py-2.5 text-white bg-gradient-to-r from-red-500 to-red-600 
                                        rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 
                                        shadow-sm hover:shadow-md flex items-center justify-center gap-2 font-medium"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6.225 4.811a1 1 0 011.414 0L10 7.172l2.361-2.36a1 1 0 111.415 1.415L11.415 8.586l2.36 2.36a1 1 0 01-1.415 1.415L10 10.001l-2.361 2.36a1 1 0 01-1.414-1.415l2.36-2.36-2.36-2.36a1 1 0 010-1.415z" clipRule="evenodd" />
                                    </svg>
                                    退出对战
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>
        </>
    );
};