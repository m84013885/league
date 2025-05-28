"use client";

import { useState } from 'react';
import { CURRENT_TEAM_LIST } from '../config'

interface SelectTeamProps {
    onTeamsConfirm?: (team1: { name: string, list: string[] }, team2: { name: string, list: string[] }) => void;
}

export default function SelectTeam({ onTeamsConfirm }: SelectTeamProps) {
    const [selectedTeams, setSelectedTeams] = useState<{ name: string, list: string[] }[]>([]);

    const handleTeamSelect = (team: { name: string, list: string[] }) => {
        if (selectedTeams.some(t => t.name === team.name)) {
            // 如果已选择，则取消选择
            setSelectedTeams(selectedTeams.filter(t => t.name !== team.name));
        } else if (selectedTeams.length < 2) {
            // 如果未选择且少于2个队伍，则添加
            setSelectedTeams([...selectedTeams, team]);
        }
    };

    const handleConfirm = () => {
        if (selectedTeams.length === 2) {
            // 关闭抽屉
            const drawer = document.getElementById('select-team-drawer') as HTMLInputElement;
            if (drawer) {
                drawer.checked = false;
            }

            // 调用回调函数
            if (onTeamsConfirm) {
                onTeamsConfirm(selectedTeams[0], selectedTeams[1]);
            }

            // 重置选择
            setSelectedTeams([]);
        }
    };

    const getButtonStyle = (team: { name: string, list: string[] }) => {
        const index = selectedTeams.findIndex(t => t.name === team.name);
        if (index === 0) {
            return "relative overflow-hidden px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 \
                bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 \
                hover:from-yellow-200 hover:to-yellow-300 shadow-md hover:shadow-lg \
                border border-yellow-300/50";
        } else if (index === 1) {
            return "relative overflow-hidden px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 \
                bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 \
                hover:from-purple-200 hover:to-purple-300 shadow-md hover:shadow-lg \
                border border-purple-300/50";
        } else {
            return "relative overflow-hidden px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 \
                bg-white/80 hover:bg-white/90 text-gray-700 shadow-md hover:shadow-lg \
                border border-gray-200/50 hover:border-blue-200/50 hover:text-blue-600";
        }
    };

    return (
        <div className="drawer">
            <input
                id="select-team-drawer"
                type="checkbox"
                className="drawer-toggle"
            />
            <div className="drawer-side z-50">
                <label
                    htmlFor="select-team-drawer"
                    aria-label="close sidebar"
                    className="drawer-overlay"
                ></label>
                <div className="menu p-8 w-2/3 sm:w-2/3 md:w-1/2 min-h-full bg-base-200/95 backdrop-blur-xl text-base-content">
                    <div className="flex flex-col items-center mb-8">
                        <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 
                            text-transparent bg-clip-text">选择对战队伍</h2>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-base-100/50 backdrop-blur-sm">
                            <span className="text-sm text-gray-600">已选择</span>
                            <span className="text-lg font-semibold text-blue-600">{selectedTeams.length}</span>
                            <span className="text-sm text-gray-600">/ 2</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-8">
                        {CURRENT_TEAM_LIST.map((team) => (
                            <button
                                key={team.name}
                                className={getButtonStyle(team)}
                                onClick={() => handleTeamSelect(team)}
                                disabled={selectedTeams.length === 2 && !selectedTeams.some(t => t.name === team.name)}
                            >
                                {team.name}
                            </button>
                        ))}
                    </div>

                    {/* 选择状态显示 */}
                    {selectedTeams.length > 0 && (
                        <div className="mb-8 p-6 bg-base-100/70 backdrop-blur-sm rounded-2xl shadow-lg 
                            border border-white/20">
                            <h3 className="font-semibold mb-4 text-gray-700">已选择队伍</h3>
                            <div className="space-y-3">
                                {selectedTeams[0] && (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-50/50 
                                        border border-yellow-200/50">
                                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500"></div>
                                        <span className="font-medium text-yellow-800">队伍一：{selectedTeams[0].name}</span>
                                    </div>
                                )}
                                {selectedTeams[1] && (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/50 
                                        border border-purple-200/50">
                                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-500"></div>
                                        <span className="font-medium text-purple-800">队伍二：{selectedTeams[1].name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 确定按钮 */}
                    <button
                        className={`w-full px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-300
                            ${selectedTeams.length === 2
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 \
                                    text-white shadow-lg hover:shadow-xl \
                                    transform hover:-translate-y-0.5'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        onClick={handleConfirm}
                        disabled={selectedTeams.length !== 2}
                    >
                        确定开始对战
                    </button>
                </div>
            </div>
        </div>
    )
}