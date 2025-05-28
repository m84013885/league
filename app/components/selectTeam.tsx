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
            // 第一队 - 浅黄色背景
            return "btn btn-lg w-full text-lg font-semibold bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200";
        } else if (index === 1) {
            // 第二队 - 浅紫色背景
            return "btn btn-lg w-full text-lg font-semibold bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200";
        } else {
            // 未选择
            return "btn btn-outline btn-lg w-full text-lg font-semibold hover:btn-primary transition-all duration-200";
        }
    };

    const getTeamLabel = (team: { name: string, list: string[] }) => {
        const index = selectedTeams.findIndex(t => t.name === team.name);
        if (index === 0) {
            return `${team.name}`;
        } else if (index === 1) {
            return `${team.name}`;
        } else {
            return team.name;
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
                <div className="menu p-6 w-2/3 sm:w-2/3 md:w-1/2 min-h-full bg-base-200 text-base-content">
                    <h2 className="text-2xl font-bold mb-4 text-center">选择对战队伍</h2>
                    <p className="text-center text-sm text-gray-600 mb-6">
                        请选择两个队伍进行对战 ({selectedTeams.length}/2)
                    </p>

                    <div className="space-y-4 mb-6">
                        {CURRENT_TEAM_LIST.map((team) => (
                            <button
                                key={team.name}
                                className={getButtonStyle(team)}
                                onClick={() => handleTeamSelect(team)}
                                disabled={selectedTeams.length === 2 && !selectedTeams.some(t => t.name === team.name)}
                            >
                                {getTeamLabel(team)}
                            </button>
                        ))}
                    </div>

                    {/* 选择状态显示 */}
                    {selectedTeams.length > 0 && (
                        <div className="mb-6 p-4 bg-base-100 rounded-lg">
                            <h3 className="font-semibold mb-2">已选择队伍：</h3>
                            {selectedTeams[0] && (
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-4 h-4 bg-yellow-300 rounded"></div>
                                    <span>队伍一：{selectedTeams[0].name}</span>
                                </div>
                            )}
                            {selectedTeams[1] && (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-purple-300 rounded"></div>
                                    <span>队伍二：{selectedTeams[1].name}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 确定按钮 */}
                    <button
                        className={`btn btn-primary btn-lg w-full ${selectedTeams.length === 2
                            ? 'btn-primary'
                            : 'btn-disabled'
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