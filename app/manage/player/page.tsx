"use client";

import { useState, useEffect } from 'react';
import { createPlayer, getPlayers, hidePlayer } from '../../db/api';

interface Player {
    id: number;
    name: string;
    total_score: number;
    total_2p_made: number;
    total_2p_attempts: number;
    total_3p_made: number;
    total_3p_attempts: number;
    total_ft_made: number;
    total_ft_attempts: number;
    total_fouls: number;
    total_flagrant_fouls: number;
    total_rebounds: number;
    total_assists: number;
    total_steals: number;
    total_turnovers: number;
    total_blocks: number;
    season_ids: number[];
    created_at: string;
}

export default function PlayerManagePage() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [playerName, setPlayerName] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        try {
            setFetchLoading(true);
            const data = await getPlayers();
            setPlayers(data || []);
        } catch (error) {
            console.error('获取球员列表失败:', error);
            alert('获取球员列表失败');
        } finally {
            setFetchLoading(false);
        }
    };

    const handleCreatePlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!playerName.trim()) {
            alert('请输入球员姓名');
            return;
        }

        try {
            setLoading(true);
            await createPlayer(playerName.trim());
            setPlayerName('');
            await fetchPlayers();
            alert('球员创建成功！');
        } catch (error) {
            console.error('创建球员失败:', error);
            alert('创建球员失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const handleHidePlayer = async (id: number, name: string) => {
        if (!confirm(`确定要隐藏球员 "${name}" 吗？隐藏后将不再显示，但数据仍会保留。`)) {
            return;
        }

        try {
            await hidePlayer(id);
            await fetchPlayers();
            alert('球员隐藏成功！');
        } catch (error) {
            console.error('隐藏球员失败:', error);
            alert('隐藏球员失败，请重试');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-6xl mx-auto">
                {/* 页面标题 */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">球员管理</h1>
                    <p className="text-gray-600">创建和管理球员信息</p>
                </div>

                {/* 创建球员表单 */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">创建新球员</h2>
                    <form onSubmit={handleCreatePlayer} className="flex gap-4">
                        <input
                            type="text"
                            placeholder="请输入球员姓名"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !playerName.trim()}
                            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                        >
                            {loading ? '创建中...' : '创建球员'}
                        </button>
                    </form>
                </div>

                {/* 球员列表 */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800">球员列表</h2>
                        <div className="text-sm text-gray-500">
                            共 {players.length} 名球员
                        </div>
                    </div>

                    {fetchLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-2 text-gray-600">加载中...</span>
                        </div>
                    ) : players.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <div className="text-6xl mb-4">🏀</div>
                            <p className="text-lg">还没有球员</p>
                            <p className="text-sm">创建第一个球员吧！</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {players.map((player) => (
                                <div
                                    key={player.id}
                                    className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-xl font-semibold text-gray-800">
                                            {player.name}
                                        </h3>
                                        <button
                                            onClick={() => handleHidePlayer(player.id, player.name)}
                                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                                            title="隐藏球员"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">总得分:</span>
                                            <span className="font-medium">{player.total_score}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">篮板:</span>
                                            <span className="font-medium">{player.total_rebounds}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">助攻:</span>
                                            <span className="font-medium">{player.total_assists}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">抢断:</span>
                                            <span className="font-medium">{player.total_steals}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">失误:</span>
                                            <span className="font-medium">{player.total_turnovers}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">盖帽:</span>
                                            <span className="font-medium">{player.total_blocks}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3 pt-3 border-t border-blue-200">
                                        <div className="text-xs text-gray-500">
                                            创建时间: {new Date(player.created_at).toLocaleDateString('zh-CN')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}