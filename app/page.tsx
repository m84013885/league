"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
// 组件
import Toast from "@/app/components/toast";
import SelectTeam from "@/app/components/selectTeam";
import Header from "@/app/components/header";
import AddDataBox from "@/app/components/addDataBox";
import Setting from "@/app/components/setting";
import History from '@/app/components/history';

interface PlayerStats {
  totalScore: number;
  fouls: number;          // 普通犯规
  flagrantFouls: number;  // 恶意犯规
  attempts: {
    '2p': { made: number; total: number; };
    '3p': { made: number; total: number; };
    'ft': { made: number; total: number; };
  };
}

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
    scoreHistory: ScoreHistory[];
  }

  // 从localStorage读取数据的函数
  const loadGameData = (): GameData => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('basketballGameData');
      if (savedData) {
        return JSON.parse(savedData);
      }
    }
    return {
      team1: null,
      team2: null,
      playerStats: {},
      scoreHistory: []
    };
  };

  const initialData = loadGameData();
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
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>(initialData.scoreHistory)
  const [currentTeam, setCurrentTeam] = useState<'team1' | 'team2'>('team1');

  // 保存数据到localStorage的函数
  const saveGameData = useCallback(() => {
    if (typeof window !== 'undefined') {
      const gameData: GameData = {
        team1,
        team2,
        playerStats,
        scoreHistory
      };
      localStorage.setItem('basketballGameData', JSON.stringify(gameData));
    }
  }, [team1, team2, playerStats, scoreHistory]);

  // 清除所有数据的函数
  const clearAllData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('basketballGameData');
      setTeam1(null);
      setTeam2(null);
      setPlayerStats({});
      setScoreHistory([]);
      setMessage('所有数据已清除');
    }
  };

  // 导入数据的函数
  const handleImportData = (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      setTeam1(parsedData.team1);
      setTeam2(parsedData.team2);
      setPlayerStats(parsedData.playerStats);
      setScoreHistory(parsedData.scoreHistory);
      setMessage('数据导入成功');
    } catch (error) {
      console.error('数据导入失败', error);
      setMessage('数据导入失败，请检查数据格式');
    }
  };

  // 导出数据的函数
  const handleExportData = () => {
    const gameData: GameData = {
      team1,
      team2,
      playerStats,
      scoreHistory  // 导出完整的历史记录
    };
    return JSON.stringify(gameData, null, 2);
  };

  // 监听数据变化，自动保存到localStorage
  useEffect(() => {
    saveGameData();
  }, [team1, team2, playerStats, scoreHistory, saveGameData]);

  // 使用 IntersectionObserver 监听轮播状态
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCurrentTeam(entry.target.id as 'team1' | 'team2');
          }
        });
      },
      {
        root: document.querySelector('.carousel'),
        threshold: 0.5
      }
    );

    const team1Element = document.querySelector('#team1');
    const team2Element = document.querySelector('#team2');

    if (team1Element && team2Element) {
      observer.observe(team1Element);
      observer.observe(team2Element);
    }

    return () => observer.disconnect();
  }, []);

  // 处理指示器点击
  const handleIndicatorClick = (team: 'team1' | 'team2') => {
    const carousel = document.querySelector('.carousel');
    if (!carousel) return;

    const targetElement = document.querySelector(`#${team}`);
    if (!targetElement) return;

    targetElement.scrollIntoView({ behavior: 'smooth', inline: 'start' });
    setCurrentTeam(team);
  };

  const handleTeamsConfirm = (selectedTeam1: { name: string, list: string[] }, selectedTeam2: { name: string, list: string[] }) => {
    // 清除之前的数据
    clearAllData();

    setTeam1({ ...selectedTeam1, totalScore: 0, jumpBalls: 0, hiddenPlayers: [] });
    setTeam2({ ...selectedTeam2, totalScore: 0, jumpBalls: 0, hiddenPlayers: [] });
    setMessage(`对战确定：${selectedTeam1.name} VS ${selectedTeam2.name}`);

    // 初始化所有球员的数据
    const initialStats: PlayerStatsMap = {};
    [...selectedTeam1.list, ...selectedTeam2.list].forEach(player => {
      initialStats[player] = {
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
    setPlayerStats(initialStats);
  };

  const isTeamSelected = useMemo(() => {
    return !!team1 && !!team2;
  }, [team1, team2]);

  const handlePlayerClick = (player: string, teamName: string, isTeam1: boolean) => {
    setSelectedPlayer({
      name: player,
      teamName,
      isTeam1
    });
    // 打开抽屉
    const drawer = document.getElementById('add-data-drawer') as HTMLInputElement;
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

  const handleScoreAdd = (type: ShotType, isSuccess: boolean) => {
    if (!selectedPlayer) return;

    const scoreToAdd = isSuccess ? (type === '2p' ? 2 : type === '3p' ? 3 : 1) : 0;
    const currentStats = playerStats[selectedPlayer.name];

    setPlayerStats(prev => {
      const playerData = prev[selectedPlayer.name];
      const newPlayerStats = {
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

      // 立即更新队伍总分
      if (selectedPlayer.isTeam1 && team1) {
        const newTeam1Score = team1.list.reduce((total, player) => {
          return total + (player === selectedPlayer.name ?
            newPlayerStats[player].totalScore :
            (prev[player]?.totalScore || 0));
        }, 0);
        setTeam1(prev => ({ ...prev!, totalScore: newTeam1Score }));
      } else if (!selectedPlayer.isTeam1 && team2) {
        const newTeam2Score = team2.list.reduce((total, player) => {
          return total + (player === selectedPlayer.name ?
            newPlayerStats[player].totalScore :
            (prev[player]?.totalScore || 0));
        }, 0);
        setTeam2(prev => ({ ...prev!, totalScore: newTeam2Score }));
      }

      return newPlayerStats;
    });

    // 保存当前状态到历史记录
    setScoreHistory(history => {
      const newHistory = [...history, {
        player: selectedPlayer.name,
        type,
        isSuccess,
        isTeam1: selectedPlayer.isTeam1,
        previousStats: { ...currentStats }
      }];
      return newHistory;
    });

    const actionText = `${selectedPlayer.name} ${type === '2p' ? '2分球' : type === '3p' ? '3分球' : '罚球'}${isSuccess ? '命中' : '不中'}`;
    setMessage(actionText);

    // 只在记录2分球和3分球时关闭drawer
    if (type === '2p' || type === '3p') {
      const drawer = document.getElementById('add-data-drawer') as HTMLInputElement;
      if (drawer) {
        drawer.checked = false;
      }
    }
  };

  const handleDeleteLastScore = (targetType: ShotType, targetIsSuccess: boolean) => {
    if (!selectedPlayer) return;

    // 检查当前数据是否可以删除
    const currentStats = playerStats[selectedPlayer.name];
    const targetTypeStats = currentStats.attempts[targetType];

    // 检查总数和命中数是否足够删除
    if (targetTypeStats.total === 0 || (targetIsSuccess && targetTypeStats.made === 0)) {
      setMessage(`没有可删除的${targetType === '2p' ? '2分球' : targetType === '3p' ? '3分球' : '罚球'}${targetIsSuccess ? '命中' : '不中'}记录`);
      return;
    }

    // 从后向前查找匹配的记录
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

      // 再次检查确保不会出现负数
      if (newTotalScore < 0 || newMade < 0 || newTotal < 0) {
        setMessage('数据异常，无法删除记录');
        return prev;
      }

      const newPlayerStats = {
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

      // 立即更新队伍总分
      if (selectedPlayer.isTeam1 && team1) {
        const newTeam1Score = team1.list.reduce((total, player) => {
          return total + (player === selectedPlayer.name ?
            newPlayerStats[player].totalScore :
            (prev[player]?.totalScore || 0));
        }, 0);
        setTeam1(prev => ({ ...prev!, totalScore: newTeam1Score }));
      } else if (!selectedPlayer.isTeam1 && team2) {
        const newTeam2Score = team2.list.reduce((total, player) => {
          return total + (player === selectedPlayer.name ?
            newPlayerStats[player].totalScore :
            (prev[player]?.totalScore || 0));
        }, 0);
        setTeam2(prev => ({ ...prev!, totalScore: newTeam2Score }));
      }

      return newPlayerStats;
    });

    // 从历史记录中移除该记录
    setScoreHistory(prev => prev.filter((_, index) => index !== lastMatchingIndex));

    setMessage(`已删除 ${selectedPlayer.name} 的${targetType === '2p' ? '2分球' : targetType === '3p' ? '3分球' : '罚球'}${targetIsSuccess ? '命中' : '不中'}记录`);
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

    // 添加犯规历史记录
    setScoreHistory(history => {
      const newHistory = [...history, {
        player,
        type: (isFlagrant ? 'flagrant' : 'foul') as ShotType,
        isSuccess: false,
        isTeam1: team1?.list.includes(player) ?? false,
        previousStats: { ...currentStats }
      }];
      return newHistory;
    });

    setMessage(`${player} ${isFlagrant ? '恶意犯规' : '犯规'}`);
  };

  const handleFoulDelete = (player: string, isFlagrant: boolean) => {
    setPlayerStats(prev => {
      const playerData = prev[player];
      if ((isFlagrant && playerData.flagrantFouls === 0) || (!isFlagrant && playerData.fouls === 0)) {
        setMessage(`${player} 没有${isFlagrant ? '恶意犯规' : '犯规'}记录可删除`);
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
    setMessage(`删除 ${player} 的${isFlagrant ? '恶意犯规' : '犯规'}记录`);
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

  const renderPlayerCard = (player: string, isTeam1: boolean) => {
    if ((isTeam1 && team1?.hiddenPlayers.includes(player)) ||
      (!isTeam1 && team2?.hiddenPlayers.includes(player))) {
      return null;
    }

    const stats = playerStats[player];
    if (!stats) return null;

    const gradientClass = isTeam1 ? 'from-yellow-100 to-yellow-300' : 'from-purple-100 to-purple-300';
    const textColorClass = isTeam1 ? 'text-yellow-900' : 'text-purple-900';
    const shootingPercentage = calculateShootingPercentage(stats);
    const hasShots = stats.attempts['2p'].total > 0 || stats.attempts['3p'].total > 0;

    return (
      <div
        key={player}
        className={`player-card bg-gradient-to-br ${gradientClass} 
        rounded-xl p-3 text-center flex flex-col justify-between gap-1
        shadow-md hover:shadow-xl transition-all duration-300 relative min-h-[5.5rem]
        border border-opacity-20 ${isTeam1 ? 'border-yellow-400' : 'border-purple-400'}`}
        onClick={() => handlePlayerClick(player, isTeam1 ? team1!.name : team2!.name, isTeam1)}
      >
        <div className="flex flex-col items-center justify-start w-full">
          <span className={`${textColorClass} font-bold text-lg truncate w-[90%] mb-1`}>
            {player}
          </span>
          <div className={`${textColorClass} text-xl font-semibold flex items-center justify-center gap-1 score-animation`}>
            <span>{stats.totalScore}</span>
            <span className="text-sm opacity-70">分</span>
          </div>
        </div>

        {hasShots && (
          <div className={`${textColorClass} text-xs font-medium flex items-center justify-center gap-0.5 mt-auto`}>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/5">
              <span className="opacity-70">命中</span>
              <span className="font-bold tabular-nums">{shootingPercentage}%</span>
            </div>
          </div>
        )}

        {/* 犯规指示器 */}
        {(stats.fouls > 0 || stats.flagrantFouls > 0) && (
          <div className="absolute top-1 right-1 flex items-center gap-1">
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

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header
          isHeaderVisible={isHeaderVisible}
          setHeaderVisible={setIsHeaderVisible}
          onImportData={handleImportData}
          onClearData={clearAllData}
          onExportData={handleExportData}
          isTeamSelected={isTeamSelected}
          setMessage={setMessage}
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
        <main className="flex flex-col w-full h-screen">
          {!isTeamSelected ? (
            <div className="flex flex-col items-center gap-6 w-full h-full justify-center p-4">
              <button 
                className="btn-hover-effect btn btn-primary text-center text-lg font-semibold px-8 py-4 rounded-full shadow-lg"
                onClick={() => {
                  (document.getElementById('select-team-drawer') as HTMLInputElement).checked = true;
                }}
              >
                选择队伍开始比赛
              </button>
            </div>
          ) : (
            <div className="w-full h-full relative">
              <div className="carousel w-full h-full snap-x snap-mandatory">
                {/* 队伍一 */}
                <div id="team1" className="carousel-item w-full h-full relative snap-center">
                  <div className="flex flex-col w-full h-full bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 pb-24">
                    <div className="glass-effect rounded-2xl p-4 mb-6 text-center">
                      <h3 className="text-3xl font-bold text-yellow-800 mb-2">
                        {team1?.name}
                      </h3>
                      <div className="text-xl text-yellow-700 font-semibold">
                        总分：<span className="score-animation">{team1?.totalScore || 0}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 flex-1">
                      {team1?.list.map(player => renderPlayerCard(player, true))}
                    </div>
                  </div>
                </div>

                {/* 队伍二 */}
                <div id="team2" className="carousel-item w-full h-full relative snap-center">
                  <div className="flex flex-col w-full h-full bg-gradient-to-br from-purple-50 to-purple-100 p-6 pb-24">
                    <div className="glass-effect rounded-2xl p-4 mb-6 text-center">
                      <h3 className="text-3xl font-bold text-purple-800 mb-2">
                        {team2?.name}
                      </h3>
                      <div className="text-xl text-purple-700 font-semibold">
                        总分：<span className="score-animation">{team2?.totalScore || 0}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 flex-1">
                      {team2?.list.map(player => renderPlayerCard(player, false))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 队伍切换指示器 */}
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50">
                <button 
                  onClick={() => handleIndicatorClick('team1')}
                  className={`w-3 h-3 rounded-full transition-all duration-300 transform
                    ${currentTeam === 'team1' 
                      ? 'bg-yellow-500 scale-125 ring-4 ring-yellow-200' 
                      : 'bg-yellow-200 hover:bg-yellow-300'}`}
                />
                <button 
                  onClick={() => handleIndicatorClick('team2')}
                  className={`w-3 h-3 rounded-full transition-all duration-300 transform
                    ${currentTeam === 'team2' 
                      ? 'bg-purple-500 scale-125 ring-4 ring-purple-200' 
                      : 'bg-purple-200 hover:bg-purple-300'}`}
                />
              </div>
            </div>
          )}
        </main>
      </div>
      <Toast setMessage={setMessage} message={message} />
      <SelectTeam onTeamsConfirm={handleTeamsConfirm} />
      <Setting
        team1={team1}
        team2={team2}
        onJumpBall={handleJumpBall}
        onResetJumpBalls={handleResetJumpBalls}
        playerStats={playerStats}
        onTogglePlayer={handleTogglePlayer}
      />
      <History 
        scoreHistory={scoreHistory} 
        team1Name={team1?.name}
        team2Name={team2?.name}
      />
      <AddDataBox
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
    </>
  );
}
