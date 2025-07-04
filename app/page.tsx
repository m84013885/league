"use client";

import { useState, useMemo, useEffect } from "react";
// 组件
import Toast from "@/app/components/toast";
import SelectTeam from "@/app/components/selectTeam";
import Header from "@/app/components/header";
import AddScoreBox from "@/app/components/addScoreBox";
import AddDataBox from "@/app/components/addDataBox";
import Setting from "@/app/components/setting";
import History from '@/app/components/history';
import { PlayerStats, StatType } from './types';
// 1. 引入API
import { createGame, createGameDetailMain, getGameDetails, deleteGameDetailMain, createGameDetailData, deleteGameDetailData } from '@/app/db/api';

interface PlayerStatsMap {
  [key: string]: PlayerStats;
}

type ShotType = '2p' | '3p' | 'ft';

// 定义数据库明细类型
interface GameDetailMainRow {
  id: number;
  player_id: number;
  score?: number;
  fouls?: number;
  flagrant_fouls?: number;
  '2p_made'?: number;
  '2p_attempts'?: number;
  '3p_made'?: number;
  '3p_attempts'?: number;
  'ft_made'?: number;
  'ft_attempts'?: number;
  created_at: string;
}

// 定义数据库统计数据明细类型
interface GameDetailDataRow {
  id: number;
  player_id: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  turnovers?: number;
  blocks?: number;
  created_at: string;
}

// 定义Game类型
interface Game {
  id: number;
  season_id: number;
  team1_id: number;
  team2_id: number;
  team1_score?: number;
  team2_score?: number;
  end_time?: string;
  created_at: string;
}

export default function Home() {
  // 定义数据结构接口
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
    playerStats: PlayerStatsMap;
  }

  const initialData = {
    team1: null,
    team2: null,
    playerStats: {}
  };
  const [message, setMessage] = useState('')
  const [team1, setTeam1] = useState<GameData['team1']>(initialData.team1)
  const [team2, setTeam2] = useState<GameData['team2']>(initialData.team2)
  const [isHeaderVisible, setIsHeaderVisible] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<{
    name: string;
    teamName: string;
    isTeam1: boolean;
  } | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStatsMap>(initialData.playerStats)
  // 2. 新增currentGameId、players、teams等数据库ID状态
  const [currentGameId, setCurrentGameId] = useState<number | null>(null);
  const [players, setPlayers] = useState<{ id: number, name: string }[]>([]);
  const [teams, setTeams] = useState<{ id: number, name: string }[]>([]);
  // 新增：操作队列和重试状态
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());
  // 新增：初始加载状态
  const [initialLoading, setInitialLoading] = useState(true);
  // 移除：当前选中的队伍状态（不再需要）
  // const [currentTeam, setCurrentTeam] = useState<'team1' | 'team2'>('team1');
  // 新增：今天的比赛
  const [todayGames, setTodayGames] = useState<Game[]>([]);
  // 新增：游戏详情数据
  const [gameDetails, setGameDetails] = useState<GameDetailMainRow[]>([]);
  // 新增：游戏统计数据明细
  const [gameDataDetails, setGameDataDetails] = useState<GameDetailDataRow[]>([]);

  // 计算今天已有比赛的队伍名称
  const todayUsedTeamNames = useMemo(() => {
    const usedTeamIds = new Set<number>();
    todayGames.forEach(game => {
      usedTeamIds.add(game.team1_id);
      usedTeamIds.add(game.team2_id);
    });
    return Array.from(usedTeamIds)
      .map(teamId => teams.find(t => t.id === teamId)?.name)
      .filter(Boolean) as string[];
  }, [todayGames, teams]);

  // 初始化时拉取球员和队伍（可用useEffect）
  useEffect(() => {
    // 拉取球员和队伍
    (async () => {
      setInitialLoading(true);
      try {
        // 这里假设有getPlayers/getTeams API
        const players = await import('@/app/db/api').then(m => m.getPlayers());
        setPlayers(players);
        const teams = await import('@/app/db/api').then(m => m.getTeams());
        setTeams(teams);
        // 拉取今天的比赛
        const todayGames = await import('@/app/db/api').then(m => m.getTodayGames());
        setTodayGames(todayGames || []);
      } catch (error) {
        console.error('初始化数据失败:', error);
        setMessage('初始化数据失败');
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  // 处理队伍确认
  type TeamInfo = { name: string, list: string[] };
  const handleTeamsConfirm = async (selectedTeam1: TeamInfo, selectedTeam2: TeamInfo) => {
    // 找到队伍ID
    const team1Db = teams.find(t => t.name === selectedTeam1.name);
    const team2Db = teams.find(t => t.name === selectedTeam2.name);
    if (!team1Db || !team2Db) return setMessage('队伍不存在');
    // 拉取最新teams，确保有team_player
    const allTeams = await import('@/app/db/api').then(m => m.getTeams());
    const team1Full = allTeams.find((t: { id: number }) => t.id === team1Db.id);
    const team2Full = allTeams.find((t: { id: number }) => t.id === team2Db.id);
    // 组装球员列表
    const team1List = (team1Full?.team_player || []).map((tp: { player?: { name: string } }) => tp.player?.name).filter(Boolean);
    const team2List = (team2Full?.team_player || []).map((tp: { player?: { name: string } }) => tp.player?.name).filter(Boolean);
    // 创建game
    const game = await createGame({ season_id: 1, team1_id: team1Db.id, team2_id: team2Db.id });
    setCurrentGameId(game.id);
    setTeam1({ ...selectedTeam1, name: team1Db.name, list: team1List, totalScore: 0, jumpBalls: 0, hiddenPlayers: [] });
    setTeam2({ ...selectedTeam2, name: team2Db.name, list: team2List, totalScore: 0, jumpBalls: 0, hiddenPlayers: [] });
    // 拉取明细并聚合
    const details = await getGameDetails(game.id);
    setGameDetails(details.main as GameDetailMainRow[]);
    setGameDataDetails(details.data as GameDetailDataRow[]);
    const aggregatedStats = aggregatePlayerStats(details.main as GameDetailMainRow[], details.data as GameDetailDataRow[]);
    setPlayerStats(aggregatedStats);
    // 同步更新队伍总分，保证 Setting 组件比分显示
    const newTeam1Score = team1List.reduce((total: number, player: string) => total + (aggregatedStats[player]?.totalScore || 0), 0);
    const newTeam2Score = team2List.reduce((total: number, player: string) => total + (aggregatedStats[player]?.totalScore || 0), 0);
    setTeam1(prev => prev ? { ...prev, totalScore: newTeam1Score } : prev);
    setTeam2(prev => prev ? { ...prev, totalScore: newTeam2Score } : prev);
  };

  // 移除：队伍指示器点击处理（不再需要）
  // const handleIndicatorClick = (team: 'team1' | 'team2') => {
  //   setCurrentTeam(team);
  //   // 滚动到对应的队伍页面
  //   const element = document.getElementById(team);
  //   if (element) {
  //     element.scrollIntoView({ behavior: 'smooth' });
  //   }
  // };

  const isTeamSelected = useMemo(() => {
    return !!team1 && !!team2;
  }, [team1, team2]);

  // 移除：滚动监听（不再需要）
  // useEffect(() => {
  //   if (!isTeamSelected) return;
  //   const handleScroll = () => {
  //     // 滚动处理逻辑
  //   };
  //   const carousel = document.querySelector('.carousel');
  //   if (carousel) {
  //     carousel.addEventListener('scroll', handleScroll);
  //     return () => carousel.removeEventListener('scroll', handleScroll);
  //   }
  // }, [isTeamSelected]);

  const handlePlayerClick = (player: string, teamName: string, isTeam1: boolean) => {
    setSelectedPlayer({
      name: player,
      teamName,
      isTeam1
    });
    // 打开得分抽屉
    const drawer = document.getElementById('add-data-drawer') as HTMLInputElement;
    if (drawer) {
      drawer.checked = true;
    }
  };

  const handlePlayerStatClick = (player: string, teamName: string, isTeam1: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡到父元素
    setSelectedPlayer({
      name: player,
      teamName,
      isTeam1
    });
    // 打开统计数据抽屉
    const drawer = document.getElementById('add-stat-drawer') as HTMLInputElement;
    if (drawer) {
      drawer.checked = true;
    }
  };

  const calculateShootingPercentage = (stats: PlayerStats) => {
    // 只计算2分球和3分球的命中率
    const fieldGoalAttempts = stats.attempts['2p'].total + stats.attempts['3p'].total;
    const fieldGoalMade = stats.attempts['2p'].made + stats.attempts['3p'].made;
    return fieldGoalAttempts === 0 ? 0 : Math.round((fieldGoalMade / fieldGoalAttempts) * 100);
  };

  // 通用乐观更新函数
  const performOptimisticUpdate = async (
    operationId: string,
    optimisticUpdate: () => void,
    apiCall: () => Promise<void>,
    rollbackUpdate: () => void,
    maxRetries = 3
  ) => {
    // 添加到等待队列
    setPendingOperations(prev => new Set([...prev, operationId]));
    
    // 立即执行乐观更新
    optimisticUpdate();
    
    // 尝试API调用
    let retryCount = 0;
    while (retryCount < maxRetries) {
      try {
        await apiCall();
        // 成功，从等待队列移除
        setPendingOperations(prev => {
          const newSet = new Set(prev);
          newSet.delete(operationId);
          return newSet;
        });
        return;
      } catch (error) {
        console.error(`API调用失败 (重试 ${retryCount}/${maxRetries}):`, error);
        retryCount++;
        if (retryCount < maxRetries) {
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }
    
    // 所有重试都失败了
    setPendingOperations(prev => {
      const newSet = new Set(prev);
      newSet.delete(operationId);
      return newSet;
    });
    
    // 回滚更新
    rollbackUpdate();
    setMessage('网络错误，操作失败，请重试');
  };

  // 通用聚合球员数据函数
  const aggregatePlayerStats = (mainRows: GameDetailMainRow[], dataRows: GameDetailDataRow[]): PlayerStatsMap => {
    const newStats: PlayerStatsMap = {};
    
    // 处理得分和犯规数据
    mainRows.forEach((row) => {
      const playerName = players.find(p => p.id === row.player_id)?.name;
      if (!playerName) return;
      if (!newStats[playerName]) {
        newStats[playerName] = {
          totalScore: 0,
          fouls: 0,
          flagrantFouls: 0,
          attempts: { '2p': { made: 0, total: 0 }, '3p': { made: 0, total: 0 }, 'ft': { made: 0, total: 0 } },
          stats: { rebounds: 0, assists: 0, steals: 0, turnovers: 0, blocks: 0 }
        };
      }
      newStats[playerName].totalScore += row.score || 0;
      newStats[playerName].fouls += row.fouls || 0;
      newStats[playerName].flagrantFouls += row.flagrant_fouls || 0;
      if (row['2p_made']) newStats[playerName].attempts['2p'].made += row['2p_made'];
      if (row['2p_attempts']) newStats[playerName].attempts['2p'].total += row['2p_attempts'];
      if (row['3p_made']) newStats[playerName].attempts['3p'].made += row['3p_made'];
      if (row['3p_attempts']) newStats[playerName].attempts['3p'].total += row['3p_attempts'];
      if (row['ft_made']) newStats[playerName].attempts['ft'].made += row['ft_made'];
      if (row['ft_attempts']) newStats[playerName].attempts['ft'].total += row['ft_attempts'];
    });

    // 处理统计数据
    dataRows.forEach((row) => {
      const playerName = players.find(p => p.id === row.player_id)?.name;
      if (!playerName) return;
      if (!newStats[playerName]) {
        newStats[playerName] = {
          totalScore: 0,
          fouls: 0,
          flagrantFouls: 0,
          attempts: { '2p': { made: 0, total: 0 }, '3p': { made: 0, total: 0 }, 'ft': { made: 0, total: 0 } },
          stats: { rebounds: 0, assists: 0, steals: 0, turnovers: 0, blocks: 0 }
        };
      }
      newStats[playerName].stats.rebounds += row.rebounds || 0;
      newStats[playerName].stats.assists += row.assists || 0;
      newStats[playerName].stats.steals += row.steals || 0;
      newStats[playerName].stats.turnovers += row.turnovers || 0;
      newStats[playerName].stats.blocks += row.blocks || 0;
    });

    // 补全所有球员
    const allPlayers = [...(team1?.list || []), ...(team2?.list || [])];
    allPlayers.forEach(player => {
      if (!newStats[player]) {
        newStats[player] = {
          totalScore: 0,
          fouls: 0,
          flagrantFouls: 0,
          attempts: { '2p': { made: 0, total: 0 }, '3p': { made: 0, total: 0 }, 'ft': { made: 0, total: 0 } },
          stats: { rebounds: 0, assists: 0, steals: 0, turnovers: 0, blocks: 0 }
        };
      }
    });

    return newStats;
  };

  // 6. handleScoreAdd/handleDeleteLastScore/handleStatAdd/handleStatDelete 全部改为数据库操作
  const handleScoreAdd = async (type: ShotType, isSuccess: boolean) => {
    if (!selectedPlayer || !currentGameId) return;
    
    const playerObj = players.find(p => p.name === selectedPlayer.name);
    if (!playerObj) return;
    
    let teamId: number | undefined = undefined;
    if (selectedPlayer.isTeam1 && team1) {
      teamId = teams.find(t => t.name === team1.name)?.id;
    } else if (!selectedPlayer.isTeam1 && team2) {
      teamId = teams.find(t => t.name === team2.name)?.id;
    }
    if (teamId === undefined) return;

    // 乐观更新：先更新UI状态
    const scoreToAdd = isSuccess ? (type === '2p' ? 2 : type === '3p' ? 3 : 1) : 0;
    const playerName = selectedPlayer.name;
    const currentStats = playerStats[playerName] || {
      totalScore: 0,
      fouls: 0,
      flagrantFouls: 0,
      attempts: { '2p': { made: 0, total: 0 }, '3p': { made: 0, total: 0 }, 'ft': { made: 0, total: 0 } },
      stats: { rebounds: 0, assists: 0, steals: 0, turnovers: 0, blocks: 0 }
    };

    await performOptimisticUpdate(
      `score-${playerName}-${type}-${isSuccess}-${Date.now()}`,
      // 乐观更新
      () => {
        const newStats = { ...currentStats };
        newStats.totalScore += scoreToAdd;
        newStats.attempts[type].total += 1;
        if (isSuccess) {
          newStats.attempts[type].made += 1;
        }
        
        setPlayerStats(prev => ({
          ...prev,
          [playerName]: newStats
        }));
        
        // 同步更新队伍总分
        if (selectedPlayer.isTeam1 && team1) {
          const newTeam1Score = team1.list.reduce((total, player) => {
            const stats = player === playerName ? newStats : (playerStats[player] || { totalScore: 0 });
            return total + (stats.totalScore || 0);
          }, 0);
          setTeam1(prev => prev ? { ...prev, totalScore: newTeam1Score } : prev);
        } else if (!selectedPlayer.isTeam1 && team2) {
          const newTeam2Score = team2.list.reduce((total, player) => {
            const stats = player === playerName ? newStats : (playerStats[player] || { totalScore: 0 });
            return total + (stats.totalScore || 0);
          }, 0);
          setTeam2(prev => prev ? { ...prev, totalScore: newTeam2Score } : prev);
        }
        
        setMessage('分数已记录');
      },
      // API 调用
      async () => {
        await createGameDetailMain({
          game_id: currentGameId,
          player_id: playerObj.id,
          team_id: teamId!,
          score: scoreToAdd,
          [`${type}_made`]: isSuccess ? 1 : 0,
          [`${type}_attempts`]: 1,
          fouls: 0,
          flagrant_fouls: 0
        });
        
        // 拉取最新数据并同步
        const details = await getGameDetails(currentGameId);
        setGameDetails(details.main as GameDetailMainRow[]);
        setGameDataDetails(details.data as GameDetailDataRow[]);
        const newStats = aggregatePlayerStats(details.main as GameDetailMainRow[], details.data as GameDetailDataRow[]);
        setPlayerStats(newStats);
        
        // 同步更新队伍总分
        if (team1) {
          const newTeam1Score = team1.list.reduce((total, player) => total + (newStats[player]?.totalScore || 0), 0);
          setTeam1(prev => prev ? { ...prev, totalScore: newTeam1Score } : prev);
        }
        if (team2) {
          const newTeam2Score = team2.list.reduce((total, player) => total + (newStats[player]?.totalScore || 0), 0);
          setTeam2(prev => prev ? { ...prev, totalScore: newTeam2Score } : prev);
        }
      },
      // 回滚更新
      () => {
        setPlayerStats(prev => ({
          ...prev,
          [playerName]: currentStats
        }));
        
        // 回滚队伍总分
        if (selectedPlayer.isTeam1 && team1) {
          const rollbackTeam1Score = team1.list.reduce((total, player) => total + (playerStats[player]?.totalScore || 0), 0);
          setTeam1(prev => prev ? { ...prev, totalScore: rollbackTeam1Score } : prev);
        } else if (!selectedPlayer.isTeam1 && team2) {
          const rollbackTeam2Score = team2.list.reduce((total, player) => total + (playerStats[player]?.totalScore || 0), 0);
          setTeam2(prev => prev ? { ...prev, totalScore: rollbackTeam2Score } : prev);
        }
      }
    );
  };

  const handleDeleteLastScore = async (targetType: ShotType, targetIsSuccess: boolean) => {
    if (!selectedPlayer || !currentGameId) return;
    try {
      const playerObj = players.find(p => p.name === selectedPlayer.name);
      if (!playerObj) return;
      // 拉取所有明细
      const details = await getGameDetails(currentGameId);
      // 找到最后一条匹配的明细
      const typeMadeKey = `${targetType}_made`;
      const typeAttemptsKey = `${targetType}_attempts`;
      // 过滤出该球员、该类型、命中/未命中的明细
      const filtered = (details.main as GameDetailMainRow[]).filter(row => {
        if (row.player_id !== playerObj.id) return false;
        // 类型断言为 Record<string, number> 以便动态访问
        const rowNum = row as unknown as Record<string, number>;
        if (targetIsSuccess) {
          return rowNum[typeMadeKey] === 1 && rowNum[typeAttemptsKey] === 1;
        } else {
          return rowNum[typeMadeKey] === 0 && rowNum[typeAttemptsKey] === 1;
        }
      });
      if (filtered.length === 0) {
        setMessage(`没有可删除的${targetType === '2p' ? '2分球' : targetType === '3p' ? '3分球' : '罚球'}${targetIsSuccess ? '命中' : '不中'}记录`);
        return;
      }
      // 取最后一条
      const lastRow = filtered[filtered.length - 1] as unknown as Record<string, number>;
      await deleteGameDetailMain(lastRow.id);
      // 删除后重新拉取聚合
      const newDetails = await getGameDetails(currentGameId);
      setGameDetails(newDetails.main as GameDetailMainRow[]);
      setGameDataDetails(newDetails.data as GameDetailDataRow[]);
      const newStats = aggregatePlayerStats(newDetails.main as GameDetailMainRow[], newDetails.data as GameDetailDataRow[]);
      setPlayerStats(newStats);
      // 同步更新队伍总分，保证 Setting 组件比分显示
      if (team1) {
        const newTeam1Score = team1.list.reduce((total, player) => total + (newStats[player]?.totalScore || 0), 0);
        setTeam1(prev => prev ? { ...prev, totalScore: newTeam1Score } : prev);
      }
      if (team2) {
        const newTeam2Score = team2.list.reduce((total, player) => total + (newStats[player]?.totalScore || 0), 0);
        setTeam2(prev => prev ? { ...prev, totalScore: newTeam2Score } : prev);
      }
      setMessage(`已删除 ${selectedPlayer.name} 的${targetType === '2p' ? '2分球' : targetType === '3p' ? '3分球' : '罚球'}${targetIsSuccess ? '命中' : '不中'}记录`);
    } catch {
      setMessage('删除失败');
    }
  };

  const handleJumpBall = (isTeam1: boolean) => {
    if (isTeam1 && team1) {
      setTeam1(prev => ({ ...prev!, jumpBalls: prev!.jumpBalls + 1 }));
      setMessage(`${team1.name} 获得一次争球机会`);
    } else if (!isTeam1 && team2) {
      setTeam2(prev => ({ ...prev!, jumpBalls: prev!.jumpBalls + 1 }));
      setMessage(`${team2.name} 获得一次争球机会`);
    }
  };

  const handleResetJumpBalls = (isTeam1: boolean) => {
    if (isTeam1 && team1) {
      setTeam1(prev => ({ ...prev!, jumpBalls: 0 }));
      setMessage(`${team1.name} 的争球机会已重置`);
    } else if (!isTeam1 && team2) {
      setTeam2(prev => ({ ...prev!, jumpBalls: 0 }));
      setMessage(`${team2.name} 的争球机会已重置`);
    }
  };

  const handleFoulAdd = async (player: string, isFlagrant: boolean) => {
    if (!currentGameId) return;
    
    const playerObj = players.find(p => p.name === player);
    if (!playerObj) return;
    
    let teamId: number | undefined = undefined;
    if (team1 && team1.list.includes(player)) {
      teamId = teams.find(t => t.name === team1.name)?.id;
    } else if (team2 && team2.list.includes(player)) {
      teamId = teams.find(t => t.name === team2.name)?.id;
    }
    if (teamId === undefined) return;

    const currentStats = playerStats[player] || {
      totalScore: 0,
      fouls: 0,
      flagrantFouls: 0,
      attempts: { '2p': { made: 0, total: 0 }, '3p': { made: 0, total: 0 }, 'ft': { made: 0, total: 0 } },
      stats: { rebounds: 0, assists: 0, steals: 0, turnovers: 0, blocks: 0 }
    };

    await performOptimisticUpdate(
      `foul-${player}-${isFlagrant}-${Date.now()}`,
      // 乐观更新
      () => {
        const newStats = { ...currentStats };
        if (isFlagrant) {
          newStats.flagrantFouls += 1;
        } else {
          newStats.fouls += 1;
        }
        
        setPlayerStats(prev => ({
          ...prev,
          [player]: newStats
        }));
        
        setMessage(`${player} ${isFlagrant ? '恶意犯规' : '犯规'}`);
      },
      // API 调用
      async () => {
        await createGameDetailMain({
          game_id: currentGameId,
          player_id: playerObj.id,
          team_id: teamId!,
          fouls: isFlagrant ? 0 : 1,
          flagrant_fouls: isFlagrant ? 1 : 0,
          score: 0,
          '2p_made': 0,
          '2p_attempts': 0,
          '3p_made': 0,
          '3p_attempts': 0,
          'ft_made': 0,
          'ft_attempts': 0
        });
        
        // 拉取最新数据并同步
        const details = await getGameDetails(currentGameId);
        setGameDetails(details.main as GameDetailMainRow[]);
        setGameDataDetails(details.data as GameDetailDataRow[]);
        const newStats = aggregatePlayerStats(details.main as GameDetailMainRow[], details.data as GameDetailDataRow[]);
        setPlayerStats(newStats);
        
        // 同步更新队伍总分
        if (team1) {
          const newTeam1Score = team1.list.reduce((total, player) => total + (newStats[player]?.totalScore || 0), 0);
          setTeam1(prev => prev ? { ...prev, totalScore: newTeam1Score } : prev);
        }
        if (team2) {
          const newTeam2Score = team2.list.reduce((total, player) => total + (newStats[player]?.totalScore || 0), 0);
          setTeam2(prev => prev ? { ...prev, totalScore: newTeam2Score } : prev);
        }
      },
      // 回滚更新
      () => {
        setPlayerStats(prev => ({
          ...prev,
          [player]: currentStats
        }));
      }
    );
  };

  const handleFoulDelete = async (player: string, isFlagrant: boolean) => {
    if (!currentGameId) return;
    try {
      const playerObj = players.find(p => p.name === player);
      if (!playerObj) return;
      // 拉取所有明细
      const details = await getGameDetails(currentGameId);
      // 过滤出该球员的普通犯规或恶意犯规明细
      const filtered = (details.main as GameDetailMainRow[]).filter(row => {
        if (row.player_id !== playerObj.id) return false;
        if (isFlagrant) {
          return row.flagrant_fouls === 1;
        } else {
          return row.fouls === 1;
        }
      });
      if (filtered.length === 0) {
        setMessage(`${player} 没有${isFlagrant ? '恶意犯规' : '犯规'}记录可删除`);
        return;
      }
      // 取最后一条
      const lastRow = filtered[filtered.length - 1] as unknown as { id: number };
      await deleteGameDetailMain(lastRow.id);
      // 删除后重新拉取聚合
      const newDetails = await getGameDetails(currentGameId);
      setGameDetails(newDetails.main as GameDetailMainRow[]);
      setGameDataDetails(newDetails.data as GameDetailDataRow[]);
      const newStats = aggregatePlayerStats(newDetails.main as GameDetailMainRow[], newDetails.data as GameDetailDataRow[]);
      setPlayerStats(newStats);
      // 同步更新队伍总分，保证 Setting 组件比分显示
      if (team1) {
        const newTeam1Score = team1.list.reduce((total, player) => total + (newStats[player]?.totalScore || 0), 0);
        setTeam1(prev => prev ? { ...prev, totalScore: newTeam1Score } : prev);
      }
      if (team2) {
        const newTeam2Score = team2.list.reduce((total, player) => total + (newStats[player]?.totalScore || 0), 0);
        setTeam2(prev => prev ? { ...prev, totalScore: newTeam2Score } : prev);
      }
      setMessage(`删除 ${player} 的${isFlagrant ? '恶意犯规' : '犯规'}记录`);
    } catch {
      setMessage('删除失败');
    }
  };

  // 添加处理隐藏/显示球员的函数
  const handleTogglePlayer = (player: string, isTeam1: boolean) => {
    if (isTeam1 && team1) {
      setTeam1(prev => ({
        ...prev!,
        hiddenPlayers: prev!.hiddenPlayers.includes(player)
          ? prev!.hiddenPlayers.filter(p => p !== player)
          : [...prev!.hiddenPlayers, player]
      }));
    } else if (!isTeam1 && team2) {
      setTeam2(prev => ({
        ...prev!,
        hiddenPlayers: prev!.hiddenPlayers.includes(player)
          ? prev!.hiddenPlayers.filter(p => p !== player)
          : [...prev!.hiddenPlayers, player]
      }));
    }
  };

  // 添加统计数据处理函数
  const handleStatAdd = async (type: StatType) => {
    if (!selectedPlayer || !currentGameId) return;
    
    const playerObj = players.find(p => p.name === selectedPlayer.name);
    if (!playerObj) return;
    
    let teamId: number | undefined = undefined;
    if (selectedPlayer.isTeam1 && team1) {
      teamId = teams.find(t => t.name === team1.name)?.id;
    } else if (!selectedPlayer.isTeam1 && team2) {
      teamId = teams.find(t => t.name === team2.name)?.id;
    }
    if (teamId === undefined) return;

    const playerName = selectedPlayer.name;
    const currentStats = playerStats[playerName] || {
      totalScore: 0,
      fouls: 0,
      flagrantFouls: 0,
      attempts: { '2p': { made: 0, total: 0 }, '3p': { made: 0, total: 0 }, 'ft': { made: 0, total: 0 } },
      stats: { rebounds: 0, assists: 0, steals: 0, turnovers: 0, blocks: 0 }
    };

    const statLabels = {
      rebound: '篮板',
      assist: '助攻',
      steal: '抢断',
      turnover: '失误',
      block: '盖帽'
    };

    await performOptimisticUpdate(
      `stat-${playerName}-${type}-${Date.now()}`,
      // 乐观更新
      () => {
        const newStats = { ...currentStats };
        switch (type) {
          case 'rebound':
            newStats.stats.rebounds += 1;
            break;
          case 'assist':
            newStats.stats.assists += 1;
            break;
          case 'steal':
            newStats.stats.steals += 1;
            break;
          case 'turnover':
            newStats.stats.turnovers += 1;
            break;
          case 'block':
            newStats.stats.blocks += 1;
            break;
        }
        
        setPlayerStats(prev => ({
          ...prev,
          [playerName]: newStats
        }));
        
        setMessage(`${playerName} +1 ${statLabels[type]}`);
      },
      // API 调用
      async () => {
        const statData: {
          game_id: number;
          player_id: number;
          team_id: number;
          rebounds?: number;
          assists?: number;
          steals?: number;
          turnovers?: number;
          blocks?: number;
        } = {
          game_id: currentGameId,
          player_id: playerObj.id,
          team_id: teamId!
        };
        
        // 根据类型设置对应的统计数据
        switch (type) {
          case 'rebound':
            statData.rebounds = 1;
            break;
          case 'assist':
            statData.assists = 1;
            break;
          case 'steal':
            statData.steals = 1;
            break;
          case 'turnover':
            statData.turnovers = 1;
            break;
          case 'block':
            statData.blocks = 1;
            break;
        }

        await createGameDetailData(statData);

        // 拉取最新数据并同步
        const details = await getGameDetails(currentGameId);
        setGameDetails(details.main as GameDetailMainRow[]);
        setGameDataDetails(details.data as GameDetailDataRow[]);
        const newStats = aggregatePlayerStats(details.main as GameDetailMainRow[], details.data as GameDetailDataRow[]);
        setPlayerStats(newStats);

        // 同步更新队伍总分
        if (team1) {
          const newTeam1Score = team1.list.reduce((total, player) => total + (newStats[player]?.totalScore || 0), 0);
          setTeam1(prev => prev ? { ...prev, totalScore: newTeam1Score } : prev);
        }
        if (team2) {
          const newTeam2Score = team2.list.reduce((total, player) => total + (newStats[player]?.totalScore || 0), 0);
          setTeam2(prev => prev ? { ...prev, totalScore: newTeam2Score } : prev);
        }
      },
      // 回滚更新
      () => {
        setPlayerStats(prev => ({
          ...prev,
          [playerName]: currentStats
        }));
      }
    );
  };

  const handleStatDelete = async (type: StatType) => {
    if (!selectedPlayer || !currentGameId) return;
    try {
      const playerObj = players.find(p => p.name === selectedPlayer.name);
      if (!playerObj) return;

      // 拉取所有统计数据明细
      const details = await getGameDetails(currentGameId);
      
      // 找到最后一条匹配的统计数据明细
      const filtered = (details.data as GameDetailDataRow[]).filter(row => {
        if (row.player_id !== playerObj.id) return false;
        
        switch (type) {
          case 'rebound':
            return row.rebounds === 1;
          case 'assist':
            return row.assists === 1;
          case 'steal':
            return row.steals === 1;
          case 'turnover':
            return row.turnovers === 1;
          case 'block':
            return row.blocks === 1;
          default:
            return false;
        }
      });

      if (filtered.length === 0) {
        const statLabels = {
          rebound: '篮板',
          assist: '助攻',
          steal: '抢断',
          turnover: '失误',
          block: '盖帽'
        };
        setMessage(`${selectedPlayer.name} 没有${statLabels[type]}记录可删除`);
        return;
      }

      // 取最后一条
      const lastRow = filtered[filtered.length - 1];
      await deleteGameDetailData(lastRow.id);

      // 删除后重新拉取聚合
      const newDetails = await getGameDetails(currentGameId);
      setGameDetails(newDetails.main as GameDetailMainRow[]);
      setGameDataDetails(newDetails.data as GameDetailDataRow[]);
      const newStats = aggregatePlayerStats(newDetails.main as GameDetailMainRow[], newDetails.data as GameDetailDataRow[]);
      setPlayerStats(newStats);

      const statLabels = {
        rebound: '篮板',
        assist: '助攻',
        steal: '抢断',
        turnover: '失误',
        block: '盖帽'
      };

      setMessage(`删除 ${selectedPlayer.name} 的${statLabels[type]}记录`);

      // 同步更新队伍总分，保证 Setting 组件比分显示
      if (team1) {
        const newTeam1Score = team1.list.reduce((total, player) => total + (newStats[player]?.totalScore || 0), 0);
        setTeam1(prev => prev ? { ...prev, totalScore: newTeam1Score } : prev);
      }
      if (team2) {
        const newTeam2Score = team2.list.reduce((total, player) => total + (newStats[player]?.totalScore || 0), 0);
        setTeam2(prev => prev ? { ...prev, totalScore: newTeam2Score } : prev);
      }
    } catch {
      setMessage('删除失败');
    }
  };

  const renderPlayerCard = (player: string, isTeam1: boolean) => {
    if ((isTeam1 && team1?.hiddenPlayers.includes(player)) ||
      (!isTeam1 && team2?.hiddenPlayers.includes(player))) {
      return null;
    }

    // 为没有数据的球员创建默认的stats对象
    const stats = playerStats[player] || {
      totalScore: 0,
      fouls: 0,
      flagrantFouls: 0,
      attempts: { '2p': { made: 0, total: 0 }, '3p': { made: 0, total: 0 }, 'ft': { made: 0, total: 0 } },
      stats: { rebounds: 0, assists: 0, steals: 0, turnovers: 0, blocks: 0 }
    };

    const gradientClass = isTeam1 ? 'from-yellow-100 to-yellow-300' : 'from-purple-100 to-purple-300';
    const textColorClass = isTeam1 ? 'text-yellow-900' : 'text-purple-900';
    const shootingPercentage = calculateShootingPercentage(stats);
    const hasShots = stats.attempts['2p'].total > 0 || stats.attempts['3p'].total > 0;
    
    // 检查是否有正在进行的操作
    const hasPendingOperation = Array.from(pendingOperations).some(op => op.includes(player));

    const handleClick = () => {
      // 直接执行点击操作
      handlePlayerClick(player, isTeam1 ? team1!.name : team2!.name, isTeam1);
    };

    return (
      <div
        key={player}
        className={`player-card bg-gradient-to-br ${gradientClass} 
        rounded-lg lg:rounded-xl p-2 lg:p-3 text-center flex flex-col justify-between gap-1
        shadow-md hover:shadow-xl transition-all duration-300 relative min-h-[4.5rem] lg:min-h-[5.5rem]
        border border-opacity-20 ${isTeam1 ? 'border-yellow-400' : 'border-purple-400'}`}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center justify-start w-full">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className={`${textColorClass} font-bold text-sm lg:text-lg truncate`}>
              {player}
            </span>
            {hasPendingOperation && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current opacity-70"></div>
            )}
          </div>
          <div className={`${textColorClass} text-lg lg:text-xl font-bold flex items-center justify-center gap-1 score-animation`}>
            <span>{stats.totalScore}</span>
            <span className="text-xs lg:text-sm opacity-70">分</span>
          </div>
        </div>

        {hasShots && (
          <div className={`${textColorClass} text-xs font-medium flex items-center justify-center gap-0.5 mt-auto`}>
            <div className="flex items-center gap-0.5 lg:gap-1 px-1 lg:px-2 py-0.5 rounded-full bg-black/5">
              <span className="opacity-70 text-xs">命中</span>
              <span className="font-bold tabular-nums text-xs">{shootingPercentage}%</span>
            </div>
          </div>
        )}

        {/* 统计数据图标 - 右上角 */}
        <button
          onClick={(e) => handlePlayerStatClick(player, isTeam1 ? team1!.name : team2!.name, isTeam1, e)}
          className="absolute top-0.5 right-0.5 lg:top-1 lg:right-1 w-7 h-7 lg:w-10 lg:h-10 rounded-full bg-blue-500/30 hover:bg-blue-500/50 
                     shadow-lg hover:shadow-xl backdrop-blur-sm border border-blue-200/50
                     flex items-center justify-center transition-all duration-200 z-10
                     active:scale-95 hover:scale-105"
          aria-label="查看统计数据"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 lg:w-5 lg:h-5 text-blue-700"
          >
            <path d="M3 3v18h18" />
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
          </svg>
        </button>

        {/* 当有命中率时，将统计数据指示器移到右上角避免重叠 */}
        {(stats.stats.rebounds > 0 || stats.stats.assists > 0 || stats.stats.steals > 0 || stats.stats.blocks > 0) && !hasShots && (
          <div className="absolute bottom-1 right-1 flex items-center gap-0.5 max-w-[calc(100%-0.5rem)]">
            {stats.stats.rebounds > 0 && (
              <div className="text-[10px] px-0.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 font-medium">
                {stats.stats.rebounds}板
              </div>
            )}
            {stats.stats.assists > 0 && (
              <div className="text-[10px] px-0.5 py-0.5 rounded-full bg-green-500/10 text-green-700 font-medium">
                {stats.stats.assists}助
              </div>
            )}
            {stats.stats.steals > 0 && (
              <div className="text-[10px] px-0.5 py-0.5 rounded-full bg-orange-500/10 text-orange-700 font-medium">
                {stats.stats.steals}断
              </div>
            )}
            {stats.stats.blocks > 0 && (
              <div className="text-[10px] px-0.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 font-medium">
                {stats.stats.blocks}帽
              </div>
            )}
          </div>
        )}

        {/* 当有命中率时，统计数据指示器显示在右上角 */}
        {(stats.stats.rebounds > 0 || stats.stats.assists > 0 || stats.stats.steals > 0 || stats.stats.blocks > 0) && hasShots && (
          <div className="absolute top-7 right-1 lg:top-8 lg:right-2 flex items-center gap-0.5 max-w-[calc(100%-1rem)]">
            {stats.stats.rebounds > 0 && (
              <div className="text-[10px] px-0.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 font-medium">
                {stats.stats.rebounds}板
              </div>
            )}
            {stats.stats.assists > 0 && (
              <div className="text-[10px] px-0.5 py-0.5 rounded-full bg-green-500/10 text-green-700 font-medium">
                {stats.stats.assists}助
              </div>
            )}
            {stats.stats.steals > 0 && (
              <div className="text-[10px] px-0.5 py-0.5 rounded-full bg-orange-500/10 text-orange-700 font-medium">
                {stats.stats.steals}断
              </div>
            )}
            {stats.stats.blocks > 0 && (
              <div className="text-[10px] px-0.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 font-medium">
                {stats.stats.blocks}帽
              </div>
            )}
          </div>
        )}

        {/* 犯规指示器 - 左上角 */}
        {(stats.fouls > 0 || stats.flagrantFouls > 0) && (
          <div className="absolute top-1 left-1 lg:top-2 lg:left-2 flex items-center gap-1">
            {stats.fouls > 0 && (
              <div className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-700">
                {stats.fouls}
              </div>
            )}
            {stats.flagrantFouls > 0 && (
              <div className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-800 font-bold">
                {stats.flagrantFouls}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // 新增：快速进入今天的比赛
  const handleQuickEnterGame = async (game: Game) => {
    try {
      setCurrentGameId(game.id);
      // 查找队伍
      const team1Db = teams.find(t => t.id === game.team1_id);
      const team2Db = teams.find(t => t.id === game.team2_id);
      if (!team1Db || !team2Db) {
        setMessage('队伍信息缺失');
        return;
      }
      // 拉取最新teams，确保有team_player
      const allTeams = await import('@/app/db/api').then(m => m.getTeams());
      const team1Full = allTeams.find((t: { id: number }) => t.id === team1Db.id);
      const team2Full = allTeams.find((t: { id: number }) => t.id === team2Db.id);
      const team1List = (team1Full?.team_player || []).map((tp: { player?: { name: string } }) => tp.player?.name).filter(Boolean);
      const team2List = (team2Full?.team_player || []).map((tp: { player?: { name: string } }) => tp.player?.name).filter(Boolean);
      setTeam1({ name: team1Db.name, list: team1List, totalScore: 0, jumpBalls: 0, hiddenPlayers: [] });
      setTeam2({ name: team2Db.name, list: team2List, totalScore: 0, jumpBalls: 0, hiddenPlayers: [] });
      // 拉取明细并聚合球员数据
      const details = await getGameDetails(game.id);
      setGameDetails(details.main as GameDetailMainRow[]);
      setGameDataDetails(details.data as GameDetailDataRow[]);
      const initialStats = aggregatePlayerStats(details.main as GameDetailMainRow[], details.data as GameDetailDataRow[]);
      setPlayerStats(initialStats);
      // 同步更新队伍总分，保证 Setting 组件比分显示
      const newTeam1Score = team1List.reduce((total: number, player: string) => total + (initialStats[player]?.totalScore || 0), 0);
      const newTeam2Score = team2List.reduce((total: number, player: string) => total + (initialStats[player]?.totalScore || 0), 0);
      setTeam1(prev => prev ? { ...prev, totalScore: newTeam1Score } : prev);
      setTeam2(prev => prev ? { ...prev, totalScore: newTeam2Score } : prev);
      setMessage('已进入今日比赛');
    } catch {
      setMessage('进入比赛失败');
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header
          isHeaderVisible={isHeaderVisible}
          setHeaderVisible={setIsHeaderVisible}
          onClearData={() => {
            setTeam1(null);
            setTeam2(null);
            setPlayerStats({});
            setGameDetails([]);
            setMessage('已退出对战');
          }}
          isTeamSelected={isTeamSelected}
          setMessage={setMessage}
          team1={team1}
          team2={team2}
          playerStats={playerStats}
        />
        <div className={`fixed top-4 right-4 z-20 flex gap-2 transition-all duration-300 transform
          ${isHeaderVisible ? 'opacity-0 pointer-events-none translate-y-2' : 'opacity-100 translate-y-0'}`}>
          {isTeamSelected && <button
            onClick={() => setIsHeaderVisible(!isHeaderVisible)}
            className={`btn-hover-effect p-3 rounded-full flex items-center justify-center w-12 h-12
              ${isHeaderVisible
                ? 'bg-gray-800/80 text-white'
                : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80'} 
              backdrop-blur-md shadow-lg`}
            aria-label={isHeaderVisible ? '隐藏头部' : '显示头部'}
          >
            <div className={`transform transition-transform duration-300 ${isHeaderVisible ? 'rotate-180' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </button>}
          {isTeamSelected && (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  const drawer = document.getElementById('history-drawer') as HTMLInputElement;
                  if (drawer) {
                    drawer.checked = true;
                  }
                }}
                className="btn-hover-effect p-3 rounded-full bg-gray-100/80 hover:bg-gray-200/80 backdrop-blur-md shadow-lg 
                  flex items-center justify-center w-12 h-12 text-gray-700"
                aria-label="历史记录"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M12 8v4l3 3" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const drawer = document.getElementById('setting-drawer') as HTMLInputElement;
                  if (drawer) {
                    drawer.checked = true;
                  }
                }}
                className="btn-hover-effect p-3 rounded-full bg-gray-100/80 hover:bg-gray-200/80 backdrop-blur-md shadow-lg 
                  flex items-center justify-center w-12 h-12 text-gray-700"
                aria-label="设置"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          )}
        </div>
        {/* 新增：左上角刷新按钮 */}
        {isTeamSelected && (
          <div className="fixed top-4 left-4 z-20">
            <button
              onClick={async () => {
                if (!currentGameId) return;
                try {
                  // 重新拉取比赛详情数据
                  const details = await getGameDetails(currentGameId);
                  setGameDetails(details.main as GameDetailMainRow[]);
                  setGameDataDetails(details.data as GameDetailDataRow[]);
                  
                  // 重新聚合球员数据
                  const newStats = aggregatePlayerStats(details.main as GameDetailMainRow[], details.data as GameDetailDataRow[]);
                  setPlayerStats(newStats);
                  
                  // 同步更新队伍总分
                  if (team1) {
                    const newTeam1Score = team1.list.reduce((total, player) => total + (newStats[player]?.totalScore || 0), 0);
                    setTeam1(prev => prev ? { ...prev, totalScore: newTeam1Score } : prev);
                  }
                  if (team2) {
                    const newTeam2Score = team2.list.reduce((total, player) => total + (newStats[player]?.totalScore || 0), 0);
                    setTeam2(prev => prev ? { ...prev, totalScore: newTeam2Score } : prev);
                  }
                  
                  setMessage('数据已刷新');
                } catch {
                  setMessage('刷新失败');
                }
              }}
              className="btn-hover-effect p-3 rounded-full bg-blue-100/80 hover:bg-blue-200/80 backdrop-blur-md shadow-lg 
                flex items-center justify-center w-12 h-12 text-blue-700 transition-all duration-200"
              aria-label="刷新数据"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-6 h-6"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
            </button>
          </div>
        )}
        <main className="flex flex-col w-full h-screen">
          {/* 初始加载状态 */}
          {initialLoading ? (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                <div className="text-lg font-bold text-gray-700">正在加载数据...</div>
              </div>
            </div>
          ) : !isTeamSelected ? (
            <div className="flex flex-col items-center gap-6 w-full h-full justify-center p-4">
              <button
                className="btn-hover-effect btn btn-primary text-center text-lg font-bold px-8 py-4 rounded-full shadow-lg"
                onClick={() => {
                  (document.getElementById('select-team-drawer') as HTMLInputElement).checked = true;
                }}
              >
                选择队伍开始比赛
              </button>
              {/* 新增：今日比赛快速进入 */}
              {todayGames.length > 0 && (
                <div className="w-full max-w-md mb-2 flex flex-col items-center gap-2">
                  <div className="text-base font-bold text-gray-700">今日已有比赛：</div>
                  {todayGames.map(game => (
                    <div key={game.id} className="w-full flex items-center justify-between bg-white rounded-lg shadow p-3 border border-gray-100 mb-1">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800">{teams.find(t => t.id === game.team1_id)?.name || '队伍1'} vs {teams.find(t => t.id === game.team2_id)?.name || '队伍2'}</span>
                        <span className="text-xs text-gray-500">{new Date(game.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <button className="btn btn-sm btn-primary ml-2" onClick={() => handleQuickEnterGame(game)}>快速进入</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full relative">
              {/* 两个队伍在同一页面显示 */}
              <div className="flex flex-col lg:flex-row w-full h-full gap-2 lg:gap-4 p-2 lg:p-4 pb-20 lg:pb-24">
                {/* 队伍一 */}
                <div id="team1" className="flex-1 min-h-0 lg:flex-1">
                  <div className="flex flex-col w-full h-full bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl lg:rounded-2xl p-3 lg:p-4">
                    <div className="glass-effect rounded-xl lg:rounded-2xl p-3 lg:p-4 mb-3 lg:mb-4 text-center flex-shrink-0">
                      <h3 className="text-xl lg:text-2xl xl:text-3xl font-bold text-yellow-800 mb-1 lg:mb-2">
                        {team1?.name}
                      </h3>
                      <div className="text-base lg:text-lg xl:text-xl text-yellow-700 font-bold">
                        总分：<span className="score-animation">{team1?.totalScore || 0}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 lg:gap-3 pb-2">
                        {team1?.list.map(player => renderPlayerCard(player, true))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 队伍二 */}
                <div id="team2" className="flex-1 min-h-0 lg:flex-1">
                  <div className="flex flex-col w-full h-full bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl lg:rounded-2xl p-3 lg:p-4">
                    <div className="glass-effect rounded-xl lg:rounded-2xl p-3 lg:p-4 mb-3 lg:mb-4 text-center flex-shrink-0">
                      <h3 className="text-xl lg:text-2xl xl:text-3xl font-bold text-purple-800 mb-1 lg:mb-2">
                        {team2?.name}
                      </h3>
                      <div className="text-base lg:text-lg xl:text-xl text-purple-700 font-bold">
                        总分：<span className="score-animation">{team2?.totalScore || 0}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 lg:gap-3 pb-2">
                        {team2?.list.map(player => renderPlayerCard(player, false))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <Toast setMessage={setMessage} message={message} />
      <SelectTeam onTeamsConfirm={handleTeamsConfirm} todayUsedTeamNames={todayUsedTeamNames} />
      <Setting
        team1={team1}
        team2={team2}
        onJumpBall={handleJumpBall}
        onResetJumpBalls={handleResetJumpBalls}
        playerStats={playerStats}
        onTogglePlayer={handleTogglePlayer}
      />
      <History
        gameDetails={gameDetails}
        gameDataDetails={gameDataDetails}
        players={players}
        team1Name={team1?.name}
        team2Name={team2?.name}
        team1List={team1?.list || []}
      />
      <AddScoreBox
        player={selectedPlayer?.name}
        teamName={selectedPlayer?.teamName}
        isTeam1={selectedPlayer?.isTeam1}
        onClose={() => setSelectedPlayer(null)}
        onScoreAdd={handleScoreAdd}
        onDeleteLastScore={handleDeleteLastScore}
        onFoulAdd={(isFlagrant) => selectedPlayer && handleFoulAdd(selectedPlayer.name, isFlagrant)}
        onFoulDelete={(isFlagrant) => selectedPlayer && handleFoulDelete(selectedPlayer.name, isFlagrant)}
        stats={selectedPlayer ? playerStats[selectedPlayer.name] : undefined}
      />
      <AddDataBox
        player={selectedPlayer?.name}
        teamName={selectedPlayer?.teamName}
        isTeam1={selectedPlayer?.isTeam1}
        onClose={() => setSelectedPlayer(null)}
        onStatAdd={handleStatAdd}
        onStatDelete={handleStatDelete}
        stats={selectedPlayer ? playerStats[selectedPlayer.name] : undefined}
      />
      {/* 移除loading界面，使用乐观更新 */}
    </>
  );
}
