"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
// 组件
import Toast from "@/app/components/toast";
import Header from "@/app/components/header";
import AddScoreBox from "@/app/components/addScoreBox";
import AddDataBox from "@/app/components/addDataBox";
import History from '@/app/components/history';
import { PlayerStats, StatType, StatHistory } from '../types';

interface PlayerStatsMap {
  [key: string]: PlayerStats;
}

type ShotType = '2p' | '3p' | 'ft';

interface ScoreHistory {
  player: string;
  type: ShotType;
  isSuccess: boolean;
  isTeam1: boolean;
  previousStats: PlayerStats;
}

export default function Other() {
  // 定义数据结构接口
  interface GameData {
    playerStats: PlayerStatsMap;
    scoreHistory: ScoreHistory[];
    statHistory: StatHistory[];
    customPlayers?: string[]; // 添加自定义球员号码
  }

  // 默认10个球员的名称，可以被自定义
  const defaultPlayers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  
  // 球员号码状态
  const [customPlayers, setCustomPlayers] = useState<string[]>(defaultPlayers);
  const [isEditingPlayers, setIsEditingPlayers] = useState(false);
  const [tempPlayers, setTempPlayers] = useState<string[]>(defaultPlayers);

  // 使用自定义球员号码或默认号码
  const players = customPlayers;

  // 从localStorage读取数据的函数
  const loadGameData = (): GameData => {
    if (typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem('otherPageGameData');
        if (savedData) {
          const data = JSON.parse(savedData);
          
          // 验证数据结构是否符合标准
          if (!isValidGameData(data)) {
            console.warn('检测到无效的游戏数据，正在清除...');
            localStorage.removeItem('otherPageGameData');
            return getEmptyGameData();
          }
          
          return {
            playerStats: migratePlayerStats(data.playerStats || {}),
            scoreHistory: data.scoreHistory || [],
            statHistory: data.statHistory || [],
            customPlayers: data.customPlayers || []
          };
        }
      } catch (error) {
        console.error('解析游戏数据失败，正在清除无效数据:', error);
        localStorage.removeItem('otherPageGameData');
      }
    }
    return getEmptyGameData();
  };

  // 验证游戏数据是否有效
  const isValidGameData = (data: unknown): boolean => {
    try {
      if (!data || typeof data !== 'object') return false;
      
      const gameData = data as Record<string, unknown>;
      
      if (gameData.playerStats && !isValidPlayerStatsMap(gameData.playerStats)) return false;
      if (gameData.scoreHistory && !Array.isArray(gameData.scoreHistory)) return false;
      if (gameData.statHistory && !Array.isArray(gameData.statHistory)) return false;
      
      return true;
    } catch {
      return false;
    }
  };

  // 验证球员统计数据映射
  const isValidPlayerStatsMap = (playerStats: unknown): boolean => {
    if (!playerStats || typeof playerStats !== 'object') return false;
    
    const statsMap = playerStats as Record<string, unknown>;
    for (const [playerName, stats] of Object.entries(statsMap)) {
      if (typeof playerName !== 'string' || !isValidPlayerStats(stats)) {
        return false;
      }
    }
    return true;
  };

  // 验证单个球员统计数据
  const isValidPlayerStats = (stats: unknown): boolean => {
    if (!stats || typeof stats !== 'object') return false;
    
    const playerStats = stats as Record<string, unknown>;
    return typeof playerStats.totalScore === 'number' &&
           typeof playerStats.fouls === 'number' &&
           typeof playerStats.flagrantFouls === 'number' &&
           playerStats.attempts !== undefined &&
           isValidAttempts(playerStats.attempts);
  };

  // 验证投篮尝试数据
  const isValidAttempts = (attempts: unknown): boolean => {
    if (!attempts || typeof attempts !== 'object') return false;
    
    const attemptsData = attempts as Record<string, unknown>;
    const requiredTypes = ['2p', '3p', 'ft'];
    return requiredTypes.every(type => {
      const typeData = attemptsData[type];
      return typeData &&
             typeof typeData === 'object' &&
             typeof (typeData as Record<string, unknown>).made === 'number' &&
             typeof (typeData as Record<string, unknown>).total === 'number';
    });
  };

  // 迁移球员统计数据，确保包含新的统计字段
  const migratePlayerStats = (playerStats: unknown): PlayerStatsMap => {
    const migratedStats: PlayerStatsMap = {};
    
    if (!playerStats || typeof playerStats !== 'object') return migratedStats;
    
    const statsMap = playerStats as Record<string, unknown>;
    for (const [playerName, stats] of Object.entries(statsMap)) {
      if (typeof playerName === 'string' && isValidPlayerStats(stats)) {
        const playerStatsData = stats as PlayerStats;
        migratedStats[playerName] = {
          ...playerStatsData,
          stats: playerStatsData.stats || {
            rebounds: 0,
            assists: 0,
            steals: 0,
            turnovers: 0,
            blocks: 0
          }
        };
      }
    }
    
    return migratedStats;
  };

  // 获取空的游戏数据
  const getEmptyGameData = (): GameData => {
    return {
      playerStats: {},
      scoreHistory: [],
      statHistory: [],
      customPlayers: []
    };
  };

  const [message, setMessage] = useState('')
  const [isHeaderVisible, setIsHeaderVisible] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<{
    name: string;
    teamName: string;
    isTeam1: boolean;
  } | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStatsMap>({})
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([])
  const [statHistory, setStatHistory] = useState<StatHistory[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // 初始化数据 - 只在组件挂载时执行一次
  useEffect(() => {
    const initialData = loadGameData();
    
    setPlayerStats(initialData.playerStats);
    setScoreHistory(initialData.scoreHistory);
    setStatHistory(initialData.statHistory);
    
    if (initialData.customPlayers && initialData.customPlayers.length > 0) {
      setCustomPlayers(initialData.customPlayers);
      setTempPlayers(initialData.customPlayers);
    }
    
    setIsInitialized(true);
  }, []); // 空依赖数组，只在挂载时执行一次

  // 初始化球员数据 - 只在players变化且已初始化后执行
  useEffect(() => {
    if (!isInitialized) return;
    
    setPlayerStats(prev => {
      const initialStats: PlayerStatsMap = {};
      let hasNewPlayers = false;
      
      players.forEach(player => {
        if (!prev[player]) {
          hasNewPlayers = true;
          initialStats[player] = {
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
        }
      });
      
      return hasNewPlayers ? { ...prev, ...initialStats } : prev;
    });
  }, [players, isInitialized]); // 移除playerStats依赖，避免循环

  // 保存数据到localStorage的函数
  const saveGameData = useCallback(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      const gameData: GameData = {
        playerStats,
        scoreHistory,
        statHistory,
        customPlayers
      };
      localStorage.setItem('otherPageGameData', JSON.stringify(gameData));
    }
  }, [playerStats, scoreHistory, statHistory, customPlayers, isInitialized]);

  // 监听数据变化，自动保存到localStorage - 使用防抖避免频繁保存
  useEffect(() => {
    if (!isInitialized) return;
    
    const timeoutId = setTimeout(() => {
      saveGameData();
    }, 500); // 500ms 防抖

    return () => clearTimeout(timeoutId);
  }, [playerStats, scoreHistory, statHistory, customPlayers, isInitialized]);

  // 清除所有数据的函数
  const clearAllData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('otherPageGameData');
      
      // 重置球员号码到默认值
      setCustomPlayers(defaultPlayers);
      setTempPlayers(defaultPlayers);
      
      const initialStats: PlayerStatsMap = {};
      defaultPlayers.forEach(player => {
        initialStats[player] = {
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
      setPlayerStats(initialStats);
      setScoreHistory([]);
      setStatHistory([]);
      setMessage('所有数据已清除');
    }
  };

  // 导入数据的函数
  const handleImportData = (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      
      // 如果导入的数据包含自定义球员号码，使用它们
      if (parsedData.customPlayers && Array.isArray(parsedData.customPlayers) && parsedData.customPlayers.length > 0) {
        setCustomPlayers(parsedData.customPlayers);
        setTempPlayers(parsedData.customPlayers);
      }
      
      // 使用导入数据中的球员列表或当前的球员列表
      const playersToUse = parsedData.customPlayers && parsedData.customPlayers.length > 0 
        ? parsedData.customPlayers 
        : players;
      
      // 创建完整的球员数据结构
      const completePlayerStats: PlayerStatsMap = {};
      playersToUse.forEach((player: string) => {
        // 如果导入的数据中有该球员的数据，使用导入的数据，否则使用默认数据
        const importedPlayerData = parsedData.playerStats?.[player];
        completePlayerStats[player] = importedPlayerData ? {
          ...importedPlayerData,
          // 确保所有必需字段都存在
          stats: importedPlayerData.stats || {
            rebounds: 0,
            assists: 0,
            steals: 0,
            turnovers: 0,
            blocks: 0
          }
        } : {
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
      
      setPlayerStats(completePlayerStats);
      
      // 正确处理历史记录 - 使用导入的历史记录（已经在Header中合并过了）
      setScoreHistory(parsedData.scoreHistory || []);
      setStatHistory(parsedData.statHistory || []);
      
      setMessage('数据导入成功');
    } catch (error) {
      console.error('数据导入失败', error);
      setMessage('数据导入失败，请检查数据格式');
    }
  };

  // 导出数据的函数
  const handleExportData = () => {
    const gameData: GameData = {
      playerStats,
      scoreHistory,
      statHistory,
      customPlayers
    };
    return JSON.stringify(gameData, null, 2);
  };

  const handlePlayerClick = (player: string) => {
    setSelectedPlayer({
      name: player,
      teamName: '球员',
      isTeam1: true
    });
    // 打开得分抽屉
    const drawer = document.getElementById('add-data-drawer') as HTMLInputElement;
    if (drawer) {
      drawer.checked = true;
    }
  };

  const handlePlayerStatClick = (player: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPlayer({
      name: player,
      teamName: '球员',
      isTeam1: true
    });
    // 打开统计数据抽屉
    const drawer = document.getElementById('add-stat-drawer') as HTMLInputElement;
    if (drawer) {
      drawer.checked = true;
    }
  };

  const calculateShootingPercentage = (stats: PlayerStats) => {
    const fieldGoalAttempts = stats.attempts['2p'].total + stats.attempts['3p'].total;
    const fieldGoalMade = stats.attempts['2p'].made + stats.attempts['3p'].made;
    return fieldGoalAttempts === 0 ? 0 : Math.round((fieldGoalMade / fieldGoalAttempts) * 100);
  };

  const handleScoreAdd = (type: ShotType, isSuccess: boolean) => {
    if (!selectedPlayer) return;

    const scoreToAdd = isSuccess ? (type === '2p' ? 2 : type === '3p' ? 3 : 1) : 0;
    const currentStats = playerStats[selectedPlayer.name];

    setPlayerStats(prev => {
      const playerData = prev[selectedPlayer.name];
      return {
        ...prev,
        [selectedPlayer.name]: {
          ...playerData,
          totalScore: playerData.totalScore + scoreToAdd,
          attempts: {
            ...playerData.attempts,
            [type]: {
              made: playerData.attempts[type].made + (isSuccess ? 1 : 0),
              total: playerData.attempts[type].total + 1
            }
          }
        }
      };
    });

    setScoreHistory(history => {
      const newHistory = [...history, {
        player: selectedPlayer.name,
        type,
        isSuccess,
        isTeam1: true,
        previousStats: { ...currentStats }
      }];
      return newHistory;
    });

    const actionText = `${selectedPlayer.name}号 ${type === '2p' ? '2分球' : type === '3p' ? '3分球' : '罚球'}${isSuccess ? '命中' : '不中'}`;
    setMessage(actionText);

    if (type === '2p' || type === '3p') {
      const drawer = document.getElementById('add-data-drawer') as HTMLInputElement;
      if (drawer) {
        drawer.checked = false;
      }
    }
  };

  const handleDeleteLastScore = (targetType: ShotType, targetIsSuccess: boolean) => {
    if (!selectedPlayer) return;

    const currentStats = playerStats[selectedPlayer.name];
    const targetTypeStats = currentStats.attempts[targetType];

    if (targetTypeStats.total === 0 || (targetIsSuccess && targetTypeStats.made === 0)) {
      setMessage(`没有可删除的${targetType === '2p' ? '2分球' : targetType === '3p' ? '3分球' : '罚球'}${targetIsSuccess ? '命中' : '不中'}记录`);
      return;
    }

    const lastMatchingIndex = scoreHistory.map((record, index) => ({
      record,
      index
    })).reverse().find(({ record }) =>
      record.player === selectedPlayer.name &&
      record.type === targetType &&
      record.isSuccess === targetIsSuccess
    )?.index;

    if (lastMatchingIndex === undefined) {
      setMessage(`没有找到可删除的${targetType === '2p' ? '2分球' : targetType === '3p' ? '3分球' : '罚球'}${targetIsSuccess ? '命中' : '不中'}记录`);
      return;
    }

    const scoreToSubtract = targetIsSuccess ? (targetType === '2p' ? 2 : targetType === '3p' ? 3 : 1) : 0;

    setPlayerStats(prev => {
      const playerData = prev[selectedPlayer.name];
      const newTotalScore = playerData.totalScore - scoreToSubtract;
      const newMade = playerData.attempts[targetType].made - (targetIsSuccess ? 1 : 0);
      const newTotal = playerData.attempts[targetType].total - 1;

      if (newTotalScore < 0 || newMade < 0 || newTotal < 0) {
        setMessage('数据异常，无法删除记录');
        return prev;
      }

      return {
        ...prev,
        [selectedPlayer.name]: {
          ...playerData,
          totalScore: newTotalScore,
          attempts: {
            ...playerData.attempts,
            [targetType]: {
              made: newMade,
              total: newTotal
            }
          }
        }
      };
    });

    setScoreHistory(prev => prev.filter((_, index) => index !== lastMatchingIndex));
    setMessage(`已删除 ${selectedPlayer.name}号 的${targetType === '2p' ? '2分球' : targetType === '3p' ? '3分球' : '罚球'}${targetIsSuccess ? '命中' : '不中'}记录`);
  };

  const handleFoulAdd = (player: string, isFlagrant: boolean) => {
    const currentStats = playerStats[player];

    setPlayerStats(prev => {
      const playerData = prev[player];
      return {
        ...prev,
        [player]: {
          ...playerData,
          fouls: isFlagrant ? playerData.fouls : playerData.fouls + 1,
          flagrantFouls: isFlagrant ? playerData.flagrantFouls + 1 : playerData.flagrantFouls
        }
      };
    });

    setScoreHistory(history => {
      const newHistory = [...history, {
        player,
        type: (isFlagrant ? 'flagrant' : 'foul') as ShotType,
        isSuccess: false,
        isTeam1: true,
        previousStats: { ...currentStats }
      }];
      return newHistory;
    });

    setMessage(`${player}号 ${isFlagrant ? '恶意犯规' : '犯规'}`);
  };

  const handleFoulDelete = (player: string, isFlagrant: boolean) => {
    setPlayerStats(prev => {
      const playerData = prev[player];
      if ((isFlagrant && playerData.flagrantFouls === 0) || (!isFlagrant && playerData.fouls === 0)) {
        setMessage(`${player}号 没有${isFlagrant ? '恶意犯规' : '犯规'}记录可删除`);
        return prev;
      }
      return {
        ...prev,
        [player]: {
          ...playerData,
          fouls: isFlagrant ? playerData.fouls : playerData.fouls - 1,
          flagrantFouls: isFlagrant ? playerData.flagrantFouls - 1 : playerData.flagrantFouls
        }
      };
    });
    setMessage(`删除 ${player}号 的${isFlagrant ? '恶意犯规' : '犯规'}记录`);
  };

  const handleStatAdd = (type: StatType) => {
    if (!selectedPlayer) return;

    const currentStats = playerStats[selectedPlayer.name];

    setPlayerStats(prev => {
      const playerData = prev[selectedPlayer.name];
      return {
        ...prev,
        [selectedPlayer.name]: {
          ...playerData,
          stats: {
            ...playerData.stats,
            [type === 'rebound' ? 'rebounds' : 
             type === 'assist' ? 'assists' : 
             type === 'steal' ? 'steals' : 
             type === 'turnover' ? 'turnovers' : 'blocks']: 
             playerData.stats[type === 'rebound' ? 'rebounds' : 
                              type === 'assist' ? 'assists' : 
                              type === 'steal' ? 'steals' : 
                              type === 'turnover' ? 'turnovers' : 'blocks'] + 1
          }
        }
      };
    });

    setStatHistory(history => {
      const newHistory = [...history, {
        player: selectedPlayer.name,
        type,
        isTeam1: true,
        previousStats: { ...currentStats }
      }];
      return newHistory;
    });

    const statLabels = {
      rebound: '篮板',
      assist: '助攻',
      steal: '抢断',
      turnover: '失误',
      block: '盖帽'
    };

    setMessage(`${selectedPlayer.name}号 +1 ${statLabels[type]}`);
  };

  const handleStatDelete = (type: StatType) => {
    if (!selectedPlayer) return;

    const currentStats = playerStats[selectedPlayer.name];
    const statKey = type === 'rebound' ? 'rebounds' : 
                   type === 'assist' ? 'assists' : 
                   type === 'steal' ? 'steals' : 
                   type === 'turnover' ? 'turnovers' : 'blocks';
    
    if (currentStats.stats[statKey] <= 0) {
      const statLabels = {
        rebound: '篮板',
        assist: '助攻',
        steal: '抢断',
        turnover: '失误',
        block: '盖帽'
      };
      setMessage(`${selectedPlayer.name}号 没有${statLabels[type]}记录可删除`);
      return;
    }

    setPlayerStats(prev => {
      const playerData = prev[selectedPlayer.name];
      return {
        ...prev,
        [selectedPlayer.name]: {
          ...playerData,
          stats: {
            ...playerData.stats,
            [statKey]: playerData.stats[statKey] - 1
          }
        }
      };
    });

    const lastMatchingIndex = statHistory.map((record, index) => ({
      record,
      index
    })).reverse().find(({ record }) =>
      record.player === selectedPlayer.name && record.type === type
    )?.index;

    if (lastMatchingIndex !== undefined) {
      setStatHistory(prev => prev.filter((_, index) => index !== lastMatchingIndex));
    }

    const statLabels = {
      rebound: '篮板',
      assist: '助攻',
      steal: '抢断',
      turnover: '失误',
      block: '盖帽'
    };

    setMessage(`删除 ${selectedPlayer.name}号 的${statLabels[type]}记录`);
  };

  // 处理球员号码修改
  const handleEditPlayers = () => {
    setTempPlayers([...customPlayers]);
    setIsEditingPlayers(true);
  };

  const handleSavePlayers = () => {
    // 验证号码不能为空且不能重复
    const filteredPlayers = tempPlayers.filter(p => p.trim() !== '');
    const uniquePlayers = [...new Set(filteredPlayers)];
    
    if (uniquePlayers.length !== 10) {
      setMessage('请确保有10个不重复的球员号码');
      return;
    }

    // 更新球员数据，保持原有统计数据
    const newPlayerStats: PlayerStatsMap = {};
    uniquePlayers.forEach((newPlayer, index) => {
      const oldPlayer = customPlayers[index];
      if (playerStats[oldPlayer]) {
        // 如果旧球员有数据，转移到新号码
        newPlayerStats[newPlayer] = playerStats[oldPlayer];
      } else {
        // 新球员，初始化数据
        newPlayerStats[newPlayer] = {
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
      }
    });

    // 更新历史记录中的球员号码
    const newScoreHistory = scoreHistory.map(record => {
      const oldIndex = customPlayers.indexOf(record.player);
      if (oldIndex !== -1 && uniquePlayers[oldIndex]) {
        return { ...record, player: uniquePlayers[oldIndex] };
      }
      return record;
    });

    const newStatHistory = statHistory.map(record => {
      const oldIndex = customPlayers.indexOf(record.player);
      if (oldIndex !== -1 && uniquePlayers[oldIndex]) {
        return { ...record, player: uniquePlayers[oldIndex] };
      }
      return record;
    });

    setCustomPlayers(uniquePlayers);
    setPlayerStats(newPlayerStats);
    setScoreHistory(newScoreHistory);
    setStatHistory(newStatHistory);
    setIsEditingPlayers(false);
    setMessage('球员号码已更新');
  };

  const handleCancelEdit = () => {
    setTempPlayers([...customPlayers]);
    setIsEditingPlayers(false);
  };

  const renderPlayerCard = (player: string) => {
    const stats = playerStats[player];
    if (!stats) return null;

    const shootingPercentage = calculateShootingPercentage(stats);
    const hasShots = stats.attempts['2p'].total > 0 || stats.attempts['3p'].total > 0;

    const handleClick = () => {
      handlePlayerClick(player);
    };

    return (
      <div
        key={player}
        className="player-card bg-gradient-to-br from-blue-100 to-blue-300 
        rounded-xl p-3 text-center flex flex-col justify-between gap-1
        shadow-md hover:shadow-xl transition-all duration-300 relative min-h-[5.5rem]
        border border-opacity-20 border-blue-400 cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex flex-col items-center justify-start w-full">
          <span className="text-blue-900 font-bold text-lg mb-1">
            {player}号
          </span>
          <div className="text-blue-900 text-xl font-semibold flex items-center justify-center gap-1 score-animation">
            <span>{stats.totalScore}</span>
            <span className="text-sm opacity-70">分</span>
          </div>
        </div>

        {hasShots && (
          <div className="text-blue-900 text-xs font-medium flex items-center justify-center gap-0.5 mt-auto">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/5">
              <span className="opacity-70">命中</span>
              <span className="font-bold tabular-nums">{shootingPercentage}%</span>
            </div>
          </div>
        )}

        {/* 统计数据图标 - 右上角 */}
        <button
          onClick={(e) => handlePlayerStatClick(player, e)}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500/20 hover:bg-blue-500/30 
                     flex items-center justify-center transition-all duration-200 z-10"
          aria-label="统计数据"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-3 h-3 text-blue-600"
          >
            <path d="M3 3v18h18" />
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
          </svg>
        </button>

        {/* 犯规指示器 - 左上角 */}
        {(stats.fouls > 0 || stats.flagrantFouls > 0) && (
          <div className="absolute top-2 left-2 flex items-center gap-1">
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

  // 计算总分
  const totalScore = useMemo(() => {
    return players.reduce((total, player) => {
      return total + (playerStats[player]?.totalScore || 0);
    }, 0);
  }, [players, playerStats]);

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header
          isHeaderVisible={isHeaderVisible}
          setHeaderVisible={setIsHeaderVisible}
          onImportData={handleImportData}
          onClearData={clearAllData}
          onExportData={handleExportData}
          isTeamSelected={true}
          setMessage={setMessage}
          isOtherPage={true}
        />
        <div className={`fixed top-4 right-4 z-20 flex gap-2 transition-all duration-300 transform
          ${isHeaderVisible ? 'opacity-0 pointer-events-none translate-y-2' : 'opacity-100 translate-y-0'}`}>
          <button
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
          </button>
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
              onClick={handleEditPlayers}
              className="btn-hover-effect p-3 rounded-full bg-gray-100/80 hover:bg-gray-200/80 backdrop-blur-md shadow-lg 
                flex items-center justify-center w-12 h-12 text-gray-700"
              aria-label="编辑球员号码"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </div>
        <main className="flex flex-col w-full h-screen">
          <div className="w-full h-full relative">
            <div className="flex flex-col w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 p-6 pb-24">
              <div className="glass-effect rounded-2xl p-4 mb-6 text-center">
                <h3 className="text-3xl font-bold text-blue-800 mb-2">
                  球员统计
                </h3>
                <div className="text-xl text-blue-700 font-semibold">
                  总分：<span className="score-animation">{totalScore}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 flex-1">
                {players.map(player => renderPlayerCard(player))}
              </div>
            </div>
          </div>
        </main>
      </div>
      <Toast setMessage={setMessage} message={message} />
      <History 
        scoreHistory={scoreHistory} 
        statHistory={statHistory}
        team1Name="球员"
        team2Name=""
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

      {/* 编辑球员号码模态框 */}
      {isEditingPlayers && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">编辑球员号码</h3>
              <p className="text-sm text-gray-600 mt-1">修改球员号码，确保每个号码都不重复</p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <div className="grid grid-cols-2 gap-3">
                {tempPlayers.map((player, index) => (
                  <div key={index} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      球员 {index + 1}
                    </label>
                    <input
                      type="text"
                      value={player}
                      onChange={(e) => {
                        const newPlayers = [...tempPlayers];
                        newPlayers[index] = e.target.value;
                        setTempPlayers(newPlayers);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`球员${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSavePlayers}
                className="flex-1 px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}