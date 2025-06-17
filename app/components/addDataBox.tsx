"use client";

import { useState, useRef } from 'react';
import { StatType } from '../types';

interface AddDataBoxProps {
    player?: string;
    teamName?: string;
    isTeam1?: boolean;
    onClose?: () => void;
    onStatAdd?: (type: StatType) => void;
    onStatDelete?: (type: StatType) => void;
    stats?: {
        stats: {
            rebounds: number;
            assists: number;
            steals: number;
            turnovers: number;
            blocks: number;
        };
        totalScore?: number;
    };
}

export default function AddDataBox({
    player,
    isTeam1,
    onClose,
    onStatAdd,
    onStatDelete,
    stats
}: AddDataBoxProps) {
    const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
    const [isPressing, setIsPressing] = useState(false);
    const startX = useRef<number | null>(null);
    const currentPressButton = useRef<{ type: StatType } | null>(null);
    const [drawerTranslate, setDrawerTranslate] = useState(0);
    const isDrawerDragging = useRef(false);
    const hasDeletedRef = useRef(false);

    const handleClose = () => {
        const drawer = document.getElementById('add-stat-drawer') as HTMLInputElement;
        if (drawer) {
            drawer.checked = false;
        }
        onClose?.();
    };

    const handleDrawerTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            startX.current = e.touches[0].clientX;
            isDrawerDragging.current = true;
        }
    };

    const handleDrawerTouchMove = (e: React.TouchEvent) => {
        if (!startX.current || !isDrawerDragging.current) return;

        const currentX = e.touches[0].clientX;
        const diff = currentX - startX.current;
        
        // 只允许向左滑动（负值）
        if (diff < 0) {
            setDrawerTranslate(diff);
        }
    };

    const handleDrawerTouchEnd = () => {
        if (!isDrawerDragging.current) return;

        isDrawerDragging.current = false;
        
        // 如果滑动距离超过100px，关闭抽屉
        if (drawerTranslate < -100) {
            handleClose();
        }
        
        // 重置位置
        setDrawerTranslate(0);
        startX.current = null;
    };

    const handleTouchStart = (e: React.TouchEvent, type: StatType) => {
        hasDeletedRef.current = false;
        currentPressButton.current = { type };

        // 检查是否有可删除的记录
        const statValue = getStatValue(type);
        if (!statValue || statValue <= 0) {
            return; // 如果没有记录，不启动长按计时器
        }

        const timer = setTimeout(() => {
            if (!currentPressButton.current) return;
            
            onStatDelete?.(currentPressButton.current.type);
            hasDeletedRef.current = true;
            setIsPressing(true);
        }, 800);
        setPressTimer(timer);
    };

    const handleTouchMove = () => {
        // 如果手指移动，取消长按
        if (pressTimer) {
            clearTimeout(pressTimer);
            setPressTimer(null);
        }
    };

    const handleTouchEnd = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            setPressTimer(null);
        }
        setIsPressing(false);
        currentPressButton.current = null;
    };

    const handleClick = (callback?: () => void) => (e: React.MouseEvent) => {
        if (hasDeletedRef.current) {
            e.preventDefault();
            e.stopPropagation();
            hasDeletedRef.current = false;
            return;
        }
        callback?.();
    };

    const getStatValue = (type: StatType): number => {
        if (!stats?.stats) return 0;
        switch (type) {
            case 'rebound': return stats.stats.rebounds;
            case 'assist': return stats.stats.assists;
            case 'steal': return stats.stats.steals;
            case 'turnover': return stats.stats.turnovers;
            case 'block': return stats.stats.blocks;
            default: return 0;
        }
    };

    const getStatLabel = (type: StatType): string => {
        switch (type) {
            case 'rebound': return '篮板';
            case 'assist': return '助攻';
            case 'steal': return '抢断';
            case 'turnover': return '失误';
            case 'block': return '盖帽';
            default: return '';
        }
    };

    const getStatColor = (type: StatType): string => {
        switch (type) {
            case 'rebound': return 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700';
            case 'assist': return 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700';
            case 'steal': return 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700';
            case 'turnover': return 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700';
            case 'block': return 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700';
            default: return 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700';
        }
    };

    const renderStatButton = (type: StatType) => {
        const value = getStatValue(type);
        const label = getStatLabel(type);
        const colorClass = getStatColor(type);
        
        return (
            <div key={type} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center px-1">
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm
                        ${isTeam1 
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 shadow-yellow-200/50' 
                            : 'bg-gradient-to-r from-purple-400 to-purple-500 text-purple-900 shadow-purple-200/50'}`}>
                        {value}
                    </span>
                </div>
                <button
                    className={`h-12 select-none transition-all duration-300 ease-out transform hover:scale-[1.02] active:scale-[0.98]
                        bg-gradient-to-r ${colorClass} border-none text-white font-semibold
                        shadow-lg hover:shadow-xl rounded-xl
                        ${isPressing && currentPressButton.current?.type === type ? 'opacity-60 scale-95' : ''}`}
                    onClick={handleClick(() => onStatAdd?.(type))}
                    onTouchStart={(e) => handleTouchStart(e, type)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <span className="text-base select-none font-semibold tracking-wide">+1 {label}</span>
                </button>
            </div>
        );
    };

    return (
        <div className="drawer">
            <input
                id="add-stat-drawer"
                type="checkbox"
                className="drawer-toggle"
                onChange={(e) => {
                    if (!e.target.checked) {
                        onClose?.();
                    }
                }}
            />
            <div className="drawer-side z-50">
                <label
                    htmlFor="add-stat-drawer"
                    aria-label="close sidebar"
                    className="drawer-overlay"
                ></label>
                <div 
                    className={`menu p-4 w-full max-w-md h-screen relative flex flex-col transition-transform duration-200
                        ${isTeam1 
                            ? 'bg-gradient-to-br from-yellow-50 via-yellow-50/90 to-orange-50/80' 
                            : 'bg-gradient-to-br from-purple-50 via-purple-50/90 to-indigo-50/80'} 
                        backdrop-blur-xl`}
                    style={{ transform: `translateX(${drawerTranslate}px)` }}
                    onTouchStart={handleDrawerTouchStart}
                    onTouchMove={handleDrawerTouchMove}
                    onTouchEnd={handleDrawerTouchEnd}
                >
                    {/* 关闭按钮 */}
                    <button
                        onClick={() => {
                            const drawer = document.getElementById('add-stat-drawer') as HTMLInputElement;
                            if (drawer) {
                                drawer.checked = false;
                            }
                        }}
                        className={`absolute top-4 right-4 btn btn-circle btn-sm bg-white/90 hover:bg-white border-none
                            shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110
                            ${isTeam1 ? 'text-yellow-600 hover:text-yellow-700' : 'text-purple-600 hover:text-purple-700'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* 头部信息 */}
                    <div className="text-center mb-5 mt-3">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-sm
                            ${isTeam1 
                                ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800' 
                                : 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800'}`}>
                            <span className="text-lg font-bold">{player}</span>
                            <span className="opacity-80 text-sm font-medium">数据统计</span>
                        </div>
                    </div>

                    {/* 统计按钮组 */}
                    <div className="flex flex-col gap-3 flex-1 px-2">
                        {renderStatButton('rebound')}
                        {renderStatButton('assist')}
                        {renderStatButton('steal')}
                        {renderStatButton('turnover')}
                        {renderStatButton('block')}
                    </div>

                    {/* 长按提示 */}
                    <div className={`text-center mt-4 mb-safe pb-8 text-xs text-gray-600 select-none 
                        bg-white/70 backdrop-blur-sm py-3 rounded-2xl shadow-sm border border-white/50
                        ${isTeam1 ? 'shadow-yellow-100/30' : 'shadow-purple-100/30'}`}>
                        <div className="font-medium mb-1">💡 操作提示</div>
                        <div className="text-gray-500">
                            长按按钮可删除对应类型的最后一次记录
                            <br />
                            向左滑动可关闭面板
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 