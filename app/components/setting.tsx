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
        };
    };
}

export default function Setting({ team1, team2, onJumpBall, onResetJumpBalls, onTogglePlayer, playerStats }: SettingProps) {
    const [selectedTeam, setSelectedTeam] = useState<'team1' | 'team2'>('team1');

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
                className={`card bg-base-100 shadow-md mb-2 ${isHidden ? 'opacity-50' : ''}`}
            >
                <div className="card-body p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                className={`btn btn-xs ${isHidden ? 'btn-error' : 'btn-success'}`}
                                onClick={() => onTogglePlayer?.(player, isTeam1)}
                            >
                                {isHidden ? '显示' : '隐藏'}
                            </button>
                            <span className={`text-base font-semibold ${isHidden ? 'line-through' : ''}`}>
                                {player}
                            </span>
                        </div>
                        <div className="badge badge-lg badge-primary">
                            {stats?.totalScore || 0} 分
                        </div>
                    </div>
                    <div className="flex gap-4 mt-1">
                        <div className="flex items-center gap-1">
                            <span className="text-sm opacity-70">犯规:</span>
                            <span className="badge badge-neutral">{stats?.fouls || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-sm opacity-70">恶犯:</span>
                            <span className="badge badge-error">{stats?.flagrantFouls || 0}</span>
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
                <div className="menu p-4 w-2/3 sm:w-2/3 md:w-1/2 h-full bg-base-200 text-base-content flex flex-col">
                    <h2 className="text-2xl font-bold mb-3">设置</h2>

                    {/* 比分显示 */}
                    <div className="stats shadow w-full mb-3 bg-base-100">
                        <div className="stat p-2">
                            <div className="stat-title text-sm">{team1?.name || '队伍1'}</div>
                            <div className="stat-value text-3xl text-primary">{team1?.totalScore || 0}</div>
                        </div>
                        <div className="stat p-2">
                            <div className="stat-title text-sm">{team2?.name || '队伍2'}</div>
                            <div className="stat-value text-3xl text-secondary">{team2?.totalScore || 0}</div>
                        </div>
                    </div>

                    {/* 争球按钮 */}
                    <div className="mb-3">
                        <h3 className="text-lg font-semibold mb-2">争球机会</h3>
                        <div className="flex gap-2 mb-2">
                            <button
                                className={`btn btn-sm flex-1 btn-outline`}
                                onClick={() => onJumpBall?.(true)}
                                disabled={!team1}
                            >
                                {team1?.name || '队伍1'} ({team1?.jumpBalls || 0})
                            </button>
                            <button
                                className={`btn btn-sm flex-1 btn-outline`}
                                onClick={() => onJumpBall?.(false)}
                                disabled={!team2}
                            >
                                {team2?.name || '队伍2'} ({team2?.jumpBalls || 0})
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="btn btn-xs btn-error flex-1"
                                onClick={() => onResetJumpBalls?.(true)}
                                disabled={!team1 || team1.jumpBalls === 0}
                            >
                                重置{team1?.name || '队伍1'}
                            </button>
                            <button
                                className="btn btn-xs btn-error flex-1"
                                onClick={() => onResetJumpBalls?.(false)}
                                disabled={!team2 || team2.jumpBalls === 0}
                            >
                                重置{team2?.name || '队伍2'}
                            </button>
                        </div>
                    </div>

                    {/* 队伍总犯规统计 */}
                    <div className="mb-3">
                        <h3 className="text-lg font-semibold mb-2">队伍总犯规</h3>
                        <div className="stats shadow w-full bg-base-100">
                            <div className="stat p-2">
                                <div className="stat-title text-sm">{team1?.name || '队伍1'}</div>
                                <div className="stat-value text-xl text-primary">{team1TotalFouls}</div>
                            </div>
                            <div className="stat p-2">
                                <div className="stat-title text-sm">{team2?.name || '队伍2'}</div>
                                <div className="stat-value text-xl text-secondary">{team2TotalFouls}</div>
                            </div>
                        </div>
                    </div>

                    {/* 球员统计 */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <h3 className="text-lg font-semibold mb-2">球员统计</h3>
                        <div className="tabs tabs-boxed mb-2">
                            <a
                                className={`tab tab-sm ${selectedTeam === 'team1' ? 'tab-active' : ''}`}
                                onClick={() => setSelectedTeam('team1')}
                            >
                                {team1?.name || '队伍1'}
                            </a>
                            <a
                                className={`tab tab-sm ${selectedTeam === 'team2' ? 'tab-active' : ''}`}
                                onClick={() => setSelectedTeam('team2')}
                            >
                                {team2?.name || '队伍2'}
                            </a>
                        </div>

                        <div className="overflow-y-auto flex-1 pb-safe">
                            <div className="space-y-2 pb-6">
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