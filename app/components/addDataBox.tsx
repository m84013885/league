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
            case 'rebound': return 'bg-blue-500 hover:bg-blue-600';
            case 'assist': return 'bg-green-500 hover:bg-green-600';
            case 'steal': return 'bg-orange-500 hover:bg-orange-600';
            case 'turnover': return 'bg-red-500 hover:bg-red-600';
            case 'block': return 'bg-indigo-500 hover:bg-indigo-600';
            default: return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    const renderStatButton = (type: StatType) => {
        const value = getStatValue(type);
        const label = getStatLabel(type);
        const colorClass = getStatColor(type);
        
        return (
            <div key={type} className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <span className="text-base font-semibold">{label}</span>
                    <span className={`text-sm font-medium px-3 py-1 rounded-full 
                        ${isTeam1 
                            ? 'bg-yellow-100/80 text-yellow-800' 
                            : 'bg-purple-100/80 text-purple-800'}`}>
                        {value}
                    </span>
                </div>
                <button
                    className={`btn h-16 select-none shadow-md hover:shadow-lg transition-all duration-200
                        ${colorClass} border-none text-white
                        ${isPressing && currentPressButton.current?.type === type ? 'opacity-50' : ''}`}
                    onClick={handleClick(() => onStatAdd?.(type))}
                    onTouchStart={(e) => handleTouchStart(e, type)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <span className="text-lg select-none font-medium">+1 {label}</span>
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
                    className={`menu p-4 w-full max-w-md h-screen ${isTeam1 ? 'bg-yellow-50/95' : 'bg-purple-50/95'} 
                        backdrop-blur-xl relative flex flex-col transition-transform duration-200`}
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
                        className={`absolute top-4 right-4 btn btn-circle btn-sm bg-white/80 hover:bg-white/90 border-none
                            shadow-lg hover:shadow-xl transition-all duration-200`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* 头部信息 */}
                    <div className="text-center mb-6 mt-4">
                        <p className={`text-xl ${isTeam1 ? 'text-yellow-800' : 'text-purple-800'} 
                            select-none flex items-center justify-center gap-3 font-semibold`}>
                            <span>{player}</span>
                            <span className="opacity-80 text-lg">数据统计</span>
                        </p>
                    </div>

                    {/* 统计按钮组 */}
                    <div className="flex flex-col gap-4 flex-1 overflow-y-auto px-2">
                        {renderStatButton('rebound')}
                        {renderStatButton('assist')}
                        {renderStatButton('steal')}
                        {renderStatButton('turnover')}
                        {renderStatButton('block')}
                    </div>

                    {/* 长按提示 */}
                    <div className="text-center mt-4 mb-safe pb-12 text-sm text-gray-500 select-none bg-white/50 
                        backdrop-blur-sm py-4 rounded-xl">
                        长按按钮可删除对应类型的最后一次记录
                        <br />
                        向左滑动可关闭面板
                    </div>
                </div>
            </div>
        </div>
    );
} 