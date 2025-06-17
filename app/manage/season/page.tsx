"use client";

import { useState, useEffect } from 'react';
import { createSeason, getSeasons, hideSeason } from '../../db/api';

interface Season {
    id: number;
    name: string;
    created_at: string;
}

export default function SeasonManagePage() {
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [seasonName, setSeasonName] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);

    useEffect(() => {
        fetchSeasons();
    }, []);

    const fetchSeasons = async () => {
        try {
            setFetchLoading(true);
            const data = await getSeasons();
            setSeasons(data || []);
        } catch (error) {
            console.error('获取赛季列表失败:', error);
            alert('获取赛季列表失败');
        } finally {
            setFetchLoading(false);
        }
    };

    const handleCreateSeason = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!seasonName.trim()) {
            alert('请输入赛季名称');
            return;
        }

        try {
            setLoading(true);
            await createSeason(seasonName.trim());
            setSeasonName('');
            await fetchSeasons();
            alert('赛季创建成功！');
        } catch (error) {
            console.error('创建赛季失败:', error);
            alert('创建赛季失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const handleHideSeason = async (id: number, name: string) => {
        if (!confirm(`确定要隐藏赛季 "${name}" 吗？隐藏后将不再显示，但数据仍会保留。`)) {
            return;
        }

        try {
            await hideSeason(id);
            await fetchSeasons();
            alert('赛季隐藏成功！');
        } catch (error) {
            console.error('隐藏赛季失败:', error);
            alert('隐藏赛季失败，请重试');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
            <div className="max-w-4xl mx-auto">
                {/* 页面标题 */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">赛季管理</h1>
                    <p className="text-gray-600">创建和管理赛季信息</p>
                </div>

                {/* 创建赛季表单 */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">创建新赛季</h2>
                    <form onSubmit={handleCreateSeason} className="flex gap-4">
                        <input
                            type="text"
                            placeholder="请输入赛季名称（如：2024春季赛）"
                            value={seasonName}
                            onChange={(e) => setSeasonName(e.target.value)}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !seasonName.trim()}
                            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                        >
                            {loading ? '创建中...' : '创建赛季'}
                        </button>
                    </form>
                </div>

                {/* 赛季列表 */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800">赛季列表</h2>
                        <div className="text-sm text-gray-500">
                            共 {seasons.length} 个赛季
                        </div>
                    </div>

                    {fetchLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                            <span className="ml-2 text-gray-600">加载中...</span>
                        </div>
                    ) : seasons.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <div className="text-6xl mb-4">🏆</div>
                            <p className="text-lg">还没有赛季</p>
                            <p className="text-sm">创建第一个赛季吧！</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {seasons.map((season, index) => (
                                <div
                                    key={season.id}
                                    className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-800 mb-1">
                                                    {season.name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    创建时间: {new Date(season.created_at).toLocaleDateString('zh-CN')} {new Date(season.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleHideSeason(season.id, season.name)}
                                            className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                            title="隐藏赛季"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
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