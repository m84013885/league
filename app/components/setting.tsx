import { useState } from 'react';

interface SettingProps {
    team1?: {
        name: string;
        list: string[];
        jumpBalls: number;
        hiddenPlayers: string[];
        totalScore: number;
    } | null;
    team2?: {
        name: string;
        list: string[];
        jumpBalls: number;
        hiddenPlayers: string[];
        totalScore: number;
    } | null;
    onJumpBall?: (isTeam1: boolean) => void;
    onResetJumpBalls?: (isTeam1: boolean) => void;
    onTogglePlayer?: (player: string, isTeam1: boolean) => void;
    playerStats?: {
        [key: string]: {
            fouls: number;
            flagrantFouls: number;
            totalScore: number;
            stats: {
                rebounds: number;
                assists: number;
                steals: number;
                turnovers: number;
                blocks: number;
            };
        };
    };
}

export default function Setting({ team1, team2, onJumpBall, onResetJumpBalls, onTogglePlayer, playerStats }: SettingProps) {
    const [selectedTeam, setSelectedTeam] = useState<'team1' | 'team2'>('team1');
    const [showJumpBalls, setShowJumpBalls] = useState(false);
    const [showTeamFouls, setShowTeamFouls] = useState(false);

    // 计算队伍总犯规数
    const calculateTeamFouls = (teamList: string[] = []) => {
        return teamList.reduce((total, player) => {
            const stats = playerStats?.[player];
            return total + (stats?.fouls || 0) + (stats?.flagrantFouls || 0);
        }, 0);
    };

    const team1TotalFouls = calculateTeamFouls(team1?.list);
    const team2TotalFouls = calculateTeamFouls(team2?.list);

    // 按得分排序球员
    const getSortedPlayers = (players: string[] = []) => {
        return [...players].sort((a, b) => {
            const scoreA = playerStats?.[a]?.totalScore || 0;
            const scoreB = playerStats?.[b]?.totalScore || 0;
            return scoreB - scoreA;  // 降序排列
        });
    };

    const renderPlayerStats = (player: string, isTeam1: boolean) => {
        const isHidden = isTeam1
            ? team1?.hiddenPlayers.includes(player)
            : team2?.hiddenPlayers.includes(player);
        const stats = playerStats?.[player];

        return (
            <div key={player}
                className={`card bg-base-100/90 backdrop-blur-sm shadow-md rounded-xl transition-all duration-200
                    ${isHidden ? 'opacity-50' : 'hover:shadow-lg'}`}
            >
                <div className="card-body p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                className={`btn btn-xs ${isHidden 
                                    ? 'bg-red-100 hover:bg-red-200 text-red-800 border-red-200' 
                                    : 'bg-green-100 hover:bg-green-200 text-green-800 border-green-200'}`}
                                onClick={() => onTogglePlayer?.(player, isTeam1)}
                            >
                                {isHidden ? '显示' : '隐藏'}
                            </button>
                            <span className={`text-base font-semibold ${isHidden ? 'line-through opacity-70' : ''}`}>
                                {player}
                            </span>
                        </div>
                        <div className={`badge badge-lg ${isTeam1 ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'} font-medium`}>
                            {stats?.totalScore || 0} 分
                        </div>
                    </div>
                    <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm opacity-70">犯规:</span>
                            <span className="badge bg-base-200 text-base-content font-medium">{stats?.fouls || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm opacity-70">恶犯:</span>
                            <span className="badge bg-red-100 text-red-800 font-medium">{stats?.flagrantFouls || 0}</span>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                        <div className="flex items-center gap-1">
                            <span className="text-xs opacity-70">篮板:</span>
                            <span className="badge badge-sm bg-blue-100 text-blue-800">{stats?.stats?.rebounds || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-xs opacity-70">助攻:</span>
                            <span className="badge badge-sm bg-green-100 text-green-800">{stats?.stats?.assists || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-xs opacity-70">抢断:</span>
                            <span className="badge badge-sm bg-orange-100 text-orange-800">{stats?.stats?.steals || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-xs opacity-70">失误:</span>
                            <span className="badge badge-sm bg-red-100 text-red-800">{stats?.stats?.turnovers || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-xs opacity-70">盖帽:</span>
                            <span className="badge badge-sm bg-indigo-100 text-indigo-800">{stats?.stats?.blocks || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="drawer">
            <input
                id="setting-drawer"
                type="checkbox"
                className="drawer-toggle"
            />
            <div className="drawer-side z-50">
                <label
                    htmlFor="setting-drawer"
                    aria-label="close sidebar"
                    className="drawer-overlay"
                ></label>
                <div className="menu p-6 w-2/3 sm:w-2/3 md:w-1/2 h-full bg-base-200/95 backdrop-blur-xl text-base-content flex flex-col">
                    {/* 比分显示 */}
                    <div className="stats shadow-lg w-full mb-4 bg-base-100/90 backdrop-blur-sm rounded-2xl">
                        <div className="stat p-4">
                            <div className="stat-title text-sm font-medium opacity-70">{team1?.name || '队伍1'}</div>
                            <div className="stat-value text-3xl text-primary">{team1?.totalScore || 0}</div>
                        </div>
                        <div className="stat p-4">
                            <div className="stat-title text-sm font-medium opacity-70">{team2?.name || '队伍2'}</div>
                            <div className="stat-value text-3xl text-secondary">{team2?.totalScore || 0}</div>
                        </div>
                    </div>

                    {/* 争球按钮 */}
                    <div className="mb-4 card bg-base-100/90 backdrop-blur-sm shadow-md rounded-xl overflow-hidden">
                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-base-200/50"
                             onClick={() => setShowJumpBalls(!showJumpBalls)}>
                            <h3 className="text-lg font-semibold">争球机会</h3>
                            <button className={`btn btn-circle btn-ghost btn-sm transition-transform duration-200 
                                ${showJumpBalls ? 'rotate-180' : ''}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                        <div className={`px-4 pb-4 transition-all duration-200 ${showJumpBalls ? 'block' : 'hidden'}`}>
                            <div className="flex gap-3 mb-3">
                                <button
                                    className={`btn btn-sm flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-200`}
                                    onClick={() => onJumpBall?.(true)}
                                    disabled={!team1}
                                >
                                    {team1?.name.slice(0, 4) || '队伍1'} ({team1?.jumpBalls || 0})
                                </button>
                                <button
                                    className={`btn btn-sm flex-1 bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-200`}
                                    onClick={() => onJumpBall?.(false)}
                                    disabled={!team2}
                                >
                                    {team2?.name.slice(0, 4) || '队伍2'} ({team2?.jumpBalls || 0})
                                </button>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    className="btn btn-xs btn-error flex-1 bg-opacity-80 hover:bg-opacity-100"
                                    onClick={() => onResetJumpBalls?.(true)}
                                    disabled={!team1 || team1.jumpBalls === 0}
                                >
                                    重置{team1?.name || '队伍1'}
                                </button>
                                <button
                                    className="btn btn-xs btn-error flex-1 bg-opacity-80 hover:bg-opacity-100"
                                    onClick={() => onResetJumpBalls?.(false)}
                                    disabled={!team2 || team2.jumpBalls === 0}
                                >
                                    重置{team2?.name || '队伍2'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 队伍总犯规统计 */}
                    <div className="mb-4 card bg-base-100/90 backdrop-blur-sm shadow-md rounded-xl overflow-hidden">
                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-base-200/50"
                             onClick={() => setShowTeamFouls(!showTeamFouls)}>
                            <h3 className="text-lg font-semibold">队伍总犯规</h3>
                            <button className={`btn btn-circle btn-ghost btn-sm transition-transform duration-200 
                                ${showTeamFouls ? 'rotate-180' : ''}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                        <div className={`transition-all duration-200 ${showTeamFouls ? 'block' : 'hidden'}`}>
                            <div className="stats w-full">
                                <div className="stat p-4">
                                    <div className="stat-title text-sm font-medium opacity-70">{team1?.name || '队伍1'}</div>
                                    <div className="stat-value text-2xl text-primary">{team1TotalFouls}</div>
                                </div>
                                <div className="stat p-4">
                                    <div className="stat-title text-sm font-medium opacity-70">{team2?.name || '队伍2'}</div>
                                    <div className="stat-value text-2xl text-secondary">{team2TotalFouls}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 球员统计 */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <h3 className="text-lg font-semibold mb-3">球员统计</h3>
                        <div className="tabs tabs-boxed mb-3 bg-base-100/50 p-1 rounded-2xl">
                            <a
                                className={`tab flex-1 transition-all duration-200 rounded-xl ${selectedTeam === 'team1' ? 'tab-active bg-yellow-100 text-yellow-900' : ''}`}
                                onClick={() => setSelectedTeam('team1')}
                            >
                                {team1?.name || '队伍1'}
                            </a>
                            <a
                                className={`tab flex-1 transition-all duration-200 rounded-xl ${selectedTeam === 'team2' ? 'tab-active bg-purple-100 text-purple-900' : ''}`}
                                onClick={() => setSelectedTeam('team2')}
                            >
                                {team2?.name || '队伍2'}
                            </a>
                        </div>

                        <div className="overflow-y-auto flex-1 pb-safe [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
                            <div className="space-y-3 pb-6">
                                {getSortedPlayers(selectedTeam === 'team1' ? team1?.list : team2?.list).map(player =>
                                    renderPlayerStats(player, selectedTeam === 'team1')
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}