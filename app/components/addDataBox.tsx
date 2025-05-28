"use client";

import { useState, useRef } from 'react';

type ShotType = '2p' | '3p' | 'ft';

interface AddDataBoxProps {
    player?: string;
    teamName?: string;
    isTeam1?: boolean;
    onClose?: () => void;
    onScoreAdd?: (type: ShotType, isSuccess: boolean) => void;
    onDeleteLastScore?: (type: ShotType, isSuccess: boolean) => void;
    onFoulAdd?: (isFlagrant: boolean) => void;
    onFoulDelete?: (isFlagrant: boolean) => void;
    stats?: {
        attempts: {
            '2p': { made: number; total: number; };
            '3p': { made: number; total: number; };
            'ft': { made: number; total: number; };
        };
        fouls: number;
        flagrantFouls: number;
        totalScore?: number;
    };
}

export default function AddDataBox({
    player,
    isTeam1,
    onClose,
    onScoreAdd,
    onDeleteLastScore,
    onFoulAdd,
    onFoulDelete,
    stats
}: AddDataBoxProps) {
    const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
    const [isPressing, setIsPressing] = useState(false);
    const startX = useRef<number | null>(null);
    const currentPressButton = useRef<{ type: ShotType | 'foul' | 'flagrant'; isSuccess: boolean } | null>(null);
    const [drawerTranslate, setDrawerTranslate] = useState(0);
    const isDrawerDragging = useRef(false);

    const handleClose = () => {
        const drawer = document.getElementById('add-data-drawer') as HTMLInputElement;
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

    const handleTouchStart = (e: React.TouchEvent, type: ShotType | 'foul' | 'flagrant', isSuccess: boolean) => {
        currentPressButton.current = { type, isSuccess };
        const timer = setTimeout(() => {
            if (!currentPressButton.current) return;
            
            if (currentPressButton.current.type === 'foul' || currentPressButton.current.type === 'flagrant') {
                onFoulDelete?.(currentPressButton.current.type === 'flagrant');
            } else {
                onDeleteLastScore?.(
                    currentPressButton.current.type as ShotType,
                    currentPressButton.current.isSuccess
                );
            }
            setIsPressing(true);
        }, 800); // 增加长按时间到800ms，使操作更加明确
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

    const renderShotTypeSection = (type: ShotType, label: string) => {
        const shotStats = stats?.attempts[type] || { made: 0, total: 0 };
        return (
            <>
                <div className="col-span-2 flex justify-between items-center mb-2">
                    <span className="text-base font-semibold">{label}</span>
                    <span className={`text-sm font-medium px-3 py-1 rounded-full 
                        ${isTeam1 
                            ? 'bg-yellow-100/80 text-yellow-800' 
                            : 'bg-purple-100/80 text-purple-800'}`}>
                        {shotStats.made}/{shotStats.total}
                    </span>
                </div>
                <button
                    className={`btn h-16 select-none shadow-md hover:shadow-lg transition-all duration-200
                        ${isTeam1 
                            ? 'bg-yellow-500 hover:bg-yellow-600 border-none text-white' 
                            : 'bg-purple-500 hover:bg-purple-600 border-none text-white'}
                        ${isPressing && currentPressButton.current?.type === type && currentPressButton.current?.isSuccess ? 'opacity-50' : ''}`}
                    onClick={() => onScoreAdd?.(type, true)}
                    onTouchStart={(e) => handleTouchStart(e, type, true)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <span className="text-lg select-none font-medium">命中</span>
                </button>
                <button
                    className={`btn h-16 select-none shadow-md hover:shadow-lg transition-all duration-200
                        bg-gray-100 hover:bg-gray-200 border-none text-gray-700
                        ${isPressing && currentPressButton.current?.type === type && !currentPressButton.current?.isSuccess ? 'opacity-50' : ''}`}
                    onClick={() => onScoreAdd?.(type, false)}
                    onTouchStart={(e) => handleTouchStart(e, type, false)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <span className="text-lg select-none font-medium">不中</span>
                </button>
            </>
        );
    };

    const renderFoulSection = () => {
        return (
            <>
                <div className="col-span-2 flex justify-between items-center mb-2">
                    <span className="text-base font-semibold">犯规</span>
                    <div className="flex gap-3">
                        <span className={`text-sm font-medium px-3 py-1 rounded-full 
                            ${isTeam1 
                                ? 'bg-yellow-100/80 text-yellow-800' 
                                : 'bg-purple-100/80 text-purple-800'}`}>
                            普通：{stats?.fouls || 0}
                        </span>
                        <span className="text-sm font-medium px-3 py-1 rounded-full bg-red-100/80 text-red-800">
                            恶意：{stats?.flagrantFouls || 0}
                        </span>
                    </div>
                </div>
                <button
                    className={`btn h-16 select-none shadow-md hover:shadow-lg transition-all duration-200
                        bg-amber-500 hover:bg-amber-600 border-none text-white
                        ${isPressing && currentPressButton.current?.type === 'foul' ? 'opacity-50' : ''}`}
                    onClick={() => onFoulAdd?.(false)}
                    onTouchStart={(e) => handleTouchStart(e, 'foul', true)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <span className="text-lg select-none font-medium">普通犯规</span>
                </button>
                <button
                    className={`btn h-16 select-none shadow-md hover:shadow-lg transition-all duration-200
                        bg-red-500 hover:bg-red-600 border-none text-white
                        ${isPressing && currentPressButton.current?.type === 'flagrant' ? 'opacity-50' : ''}`}
                    onClick={() => onFoulAdd?.(true)}
                    onTouchStart={(e) => handleTouchStart(e, 'flagrant', true)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <span className="text-lg select-none font-medium">恶意犯规</span>
                </button>
            </>
        );
    };

    return (
        <div className="drawer">
            <input
                id="add-data-drawer"
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
                    htmlFor="add-data-drawer"
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
                            const drawer = document.getElementById('add-data-drawer') as HTMLInputElement;
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
                            <span className="opacity-80 text-lg">({stats?.totalScore || 0}分)</span>
                        </p>
                    </div>

                    {/* 计分按钮组 */}
                    <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto px-2">
                        {renderShotTypeSection('2p', '2分球')}
                        {renderShotTypeSection('3p', '3分球')}
                        {renderShotTypeSection('ft', '罚球')}
                        {renderFoulSection()}
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
    )
}