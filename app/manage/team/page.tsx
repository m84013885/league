"use client";

import { useState, useEffect } from 'react';
import { createTeam, getTeams, hideTeam, updateTeamPlayers, getSeasons, getPlayers } from '../../db/api';

interface Season {
    id: number;
    name: string;
    created_at: string;
}

interface Player {
    id: number;
    name: string;
    total_score: number;
    total_rebounds: number;
    total_assists: number;
    total_steals: number;
    total_turnovers: number;
    total_blocks: number;
    created_at: string;
}

interface Team {
    id: number;
    name: string;
    season_id: number;
    season?: {
        name: string;
    };
    team_player: { player_id: number; player: { name: string } }[];
}

export default function TeamManagePage() {
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
    const [teamName, setTeamName] = useState('');
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedSeasonId) {
            fetchTeams();
        }
    }, [selectedSeasonId]);

    const fetchInitialData = async () => {
        try {
            setFetchLoading(true);
            const [seasonsData, playersData] = await Promise.all([
                getSeasons(),
                getPlayers()
            ]);
            setSeasons(seasonsData || []);
            setPlayers(playersData || []);
        } catch (error) {
            console.error('获取初始数据失败:', error);
            alert('获取数据失败');
        } finally {
            setFetchLoading(false);
        }
    };

    const fetchTeams = async () => {
        if (!selectedSeasonId) return;

        try {
            const teamsData = await getTeams(selectedSeasonId);
            setTeams(teamsData || []);
        } catch (error) {
            console.error('获取队伍列表失败:', error);
            alert('获取队伍列表失败');
        }
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamName.trim()) {
            alert('请输入队伍名称');
            return;
        }
        if (!selectedSeasonId) {
            alert('请选择赛季');
            return;
        }

        try {
            setLoading(true);
            await createTeam(teamName.trim(), selectedSeasonId);
            setTeamName('');
            setSelectedPlayerIds([]);
            await fetchTeams();
            alert('队伍创建成功！');
        } catch (error) {
            console.error('创建队伍失败:', error);
            alert('创建队伍失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const handleHideTeam = async (id: number, name: string) => {
        if (!confirm(`确定要隐藏队伍 "${name}" 吗？隐藏后将不再显示，但数据仍会保留。`)) {
            return;
        }

        try {
            await hideTeam(id);
            await fetchTeams();
            alert('队伍隐藏成功！');
        } catch (error) {
            console.error('隐藏队伍失败:', error);
            alert('隐藏队伍失败，请重试');
        }
    };

    const handleEditTeam = (team: Team) => {
        setEditingTeam(team);
        setSelectedPlayerIds((team.team_player || []).map(tp => tp.player_id));
    };

    const handleUpdateTeamPlayers = async () => {
        if (!editingTeam) return;

        try {
            setLoading(true);
            await updateTeamPlayers(editingTeam.id, selectedPlayerIds);
            setEditingTeam(null);
            setSelectedPlayerIds([]);
            await fetchTeams();
            alert('队伍球员更新成功！');
        } catch (error) {
            console.error('更新队伍球员失败:', error);
            alert('更新队伍球员失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const handlePlayerToggle = (playerId: number) => {
        setSelectedPlayerIds(prev =>
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    };

    // 计算已被其他队伍选中的球员ID集合（排除当前正在编辑的队伍）
    const selectedPlayerIdsInOtherTeams = teams
        .filter(team => !editingTeam || team.id !== editingTeam.id)
        .flatMap(team => (team.team_player || []).map(tp => tp.player_id));

    if (fetchLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4 flex justify-center items-center">
                <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    <span className="text-gray-600">加载中...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
            <div className="max-w-6xl mx-auto">
                {/* 页面标题 */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">队伍管理</h1>
                    <p className="text-gray-600">创建和管理队伍信息</p>
                </div>

                {/* 选择赛季 */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">选择赛季</h2>
                    {seasons.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>还没有赛季，请先创建赛季</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {seasons.map((season) => (
                                <button
                                    key={season.id}
                                    onClick={() => setSelectedSeasonId(season.id)}
                                    className={`p-4 rounded-lg border transition-all ${selectedSeasonId === season.id
                                        ? 'bg-purple-500 text-white border-purple-500 shadow-lg'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:shadow-md'
                                        }`}
                                >
                                    <div className="font-semibold">{season.name}</div>
                                    <div className="text-sm opacity-75">
                                        {new Date(season.created_at).toLocaleDateString('zh-CN')}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {selectedSeasonId && (
                    <>
                        {/* 创建队伍表单 */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                                {editingTeam ? `编辑队伍: ${editingTeam.name}` : '创建新队伍'}
                            </h2>

                            {!editingTeam && (
                                <form onSubmit={handleCreateTeam} className="mb-6">
                                    <div className="flex gap-4 mb-4">
                                        <input
                                            type="text"
                                            placeholder="请输入队伍名称"
                                            value={teamName}
                                            onChange={(e) => setTeamName(e.target.value)}
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            disabled={loading}
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading || !teamName.trim()}
                                            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                                        >
                                            {loading ? '创建中...' : '创建队伍'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* 选择球员 */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                    选择球员 ({selectedPlayerIds.length} 名)
                                </h3>

                                {players.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>还没有球员，请先创建球员</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 mb-4">
                                        {players.map((player) => {
                                            const isSelectedInOtherTeam = selectedPlayerIdsInOtherTeams.includes(player.id);
                                            const isSelected = selectedPlayerIds.includes(player.id);
                                            if (isSelectedInOtherTeam && !isSelected) {
                                                return null;
                                            }
                                            return (
                                                <button
                                                    key={player.id}
                                                    onClick={() => handlePlayerToggle(player.id)}
                                                    disabled={isSelectedInOtherTeam && !isSelected}
                                                    className={`p-2 sm:p-3 rounded-lg border text-center transition-all text-sm sm:text-base font-medium truncate ${isSelected
                                                        ? 'bg-purple-100 border-purple-300 text-purple-800'
                                                        : isSelectedInOtherTeam
                                                            ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
                                                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                                                        }`}
                                                    title={player.name} // 添加 tooltip 以防文字被截断
                                                >
                                                    {player.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {editingTeam && (
                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleUpdateTeamPlayers}
                                            disabled={loading}
                                            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                                        >
                                            {loading ? '更新中...' : '更新球员'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingTeam(null);
                                                setSelectedPlayerIds([]);
                                            }}
                                            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                                        >
                                            取消
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 队伍列表 */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold text-gray-800">队伍列表</h2>
                                <div className="text-sm text-gray-500">
                                    共 {teams.length} 支队伍
                                </div>
                            </div>

                            {teams.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <div className="text-6xl mb-4">🏀</div>
                                    <p className="text-lg">当前赛季还没有队伍</p>
                                    <p className="text-sm">创建第一支队伍吧！</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {teams.map((team) => (
                                        <div
                                            key={team.id}
                                            className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-xl font-semibold text-gray-800">
                                                    {team.name}
                                                </h3>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditTeam(team)}
                                                        className="text-purple-500 hover:text-purple-700 transition-colors p-1"
                                                        title="编辑队伍"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleHideTeam(team.id, team.name)}
                                                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                                                        title="隐藏队伍"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <div className="text-sm text-gray-600 mb-2">
                                                    球员数量: {(team.team_player || []).length} 人
                                                </div>
                                                {(team.team_player || []).length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {team.team_player.map(tp => (
                                                            <span
                                                                key={tp.player_id}
                                                                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                                                            >
                                                                {tp.player?.name || '未知球员'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-500 text-sm">暂无球员</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}