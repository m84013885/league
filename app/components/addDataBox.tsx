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
    teamName,
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
    const startY = useRef<number | null>(null);
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
        startY.current = e.touches[0].clientY;
        currentPressButton.current = { type, isSuccess } as any;
        const timer = setTimeout(() => {
            setIsPressing(true);
        }, 500); // 500ms长按阈值
        setPressTimer(timer);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isPressing || !startY.current || !currentPressButton.current) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (diff > 50) { // 下滑50px触发删除
            if (currentPressButton.current.type === 'foul' || currentPressButton.current.type === 'flagrant') {
                onFoulDelete?.(currentPressButton.current.type === 'flagrant');
            } else {
                onDeleteLastScore?.(
                    currentPressButton.current.type as ShotType,
                    currentPressButton.current.isSuccess
                );
            }
            setIsPressing(false);
            if (pressTimer) clearTimeout(pressTimer);
        }
    };

    const handleTouchEnd = () => {
        if (pressTimer) clearTimeout(pressTimer);
        setIsPressing(false);
        startY.current = null;
        currentPressButton.current = null;
    };

    const renderShotTypeSection = (type: ShotType, label: string) => {
        const shotStats = stats?.attempts[type] || { made: 0, total: 0 };
        return (
            <>
                <div className="col-span-2 flex justify-between items-center mb-1">
                    <span className="text-base font-medium">{label}</span>
                    <span className={`text-sm ${isTeam1 ? 'text-yellow-600' : 'text-purple-600'}`}>
                        {shotStats.made}/{shotStats.total}
                    </span>
                </div>
                <button
                    className={`btn btn-success h-16 select-none ${isPressing && currentPressButton.current?.type === type && currentPressButton.current?.isSuccess ? 'opacity-50' : ''}`}
                    onClick={() => onScoreAdd?.(type, true)}
                    onTouchStart={(e) => handleTouchStart(e, type, true)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <span className="text-lg select-none">命中</span>
                </button>
                <button
                    className={`btn btn-error h-16 select-none ${isPressing && currentPressButton.current?.type === type && !currentPressButton.current?.isSuccess ? 'opacity-50' : ''}`}
                    onClick={() => onScoreAdd?.(type, false)}
                    onTouchStart={(e) => handleTouchStart(e, type, false)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <span className="text-lg select-none">不中</span>
                </button>
            </>
        );
    };

    const renderFoulSection = () => {
        return (
            <>
                <div className="col-span-2 flex justify-between items-center mb-1">
                    <span className="text-base font-medium">犯规</span>
                    <div className="flex gap-3">
                        <span className={`text-sm ${isTeam1 ? 'text-yellow-600' : 'text-purple-600'}`}>
                            普通：{stats?.fouls || 0}
                        </span>
                        <span className={`text-sm ${isTeam1 ? 'text-yellow-600' : 'text-purple-600'}`}>
                            恶意：{stats?.flagrantFouls || 0}
                        </span>
                    </div>
                </div>
                <button
                    className={`btn btn-warning h-16 select-none ${isPressing && currentPressButton.current?.type === 'foul' ? 'opacity-50' : ''}`}
                    onClick={() => onFoulAdd?.(false)}
                    onTouchStart={(e) => handleTouchStart(e, 'foul', true)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <span className="text-lg select-none">普通犯规</span>
                </button>
                <button
                    className={`btn btn-error h-16 select-none ${isPressing && currentPressButton.current?.type === 'flagrant' ? 'opacity-50' : ''}`}
                    onClick={() => onFoulAdd?.(true)}
                    onTouchStart={(e) => handleTouchStart(e, 'flagrant', true)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <span className="text-lg select-none">恶意犯规</span>
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
            />
            <div className="drawer-side z-50">
                <label
                    htmlFor="add-data-drawer"
                    aria-label="close sidebar"
                    className="drawer-overlay"
                    onClick={handleClose}
                ></label>
                <div 
                    className={`menu p-4 w-full max-w-md h-screen ${isTeam1 ? 'bg-yellow-50' : 'bg-purple-50'} relative flex flex-col transition-transform duration-200`}
                    style={{ transform: `translateX(${drawerTranslate}px)` }}
                    onTouchStart={handleDrawerTouchStart}
                    onTouchMove={handleDrawerTouchMove}
                    onTouchEnd={handleDrawerTouchEnd}
                >
                    {/* 关闭按钮 */}
                    <button
                        onClick={handleClose}
                        className={`absolute top-2 right-2 btn btn-circle btn-sm ${isTeam1 ? 'btn-warning' : 'btn-secondary'} hover:opacity-80`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* 头部信息 */}
                    <div className="text-center mb-4 mt-2">
                        <p className={`text-lg ${isTeam1 ? 'text-yellow-700' : 'text-purple-700'} select-none flex items-center justify-center gap-2`}>
                            <span>{player}</span>
                            <span className="opacity-80">({stats?.totalScore || 0}分)</span>
                        </p>
                    </div>

                    {/* 计分按钮组 */}
                    <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto">
                        {renderShotTypeSection('2p', '2分球')}
                        {renderShotTypeSection('3p', '3分球')}
                        {renderShotTypeSection('ft', '罚球')}
                        {renderFoulSection()}
                    </div>

                    {/* 长按提示 */}
                    <div className="text-center mt-2 mb-safe pb-12 text-xs text-gray-500 select-none">
                        长按按钮并下滑可删除对应类型的最后一次记录
                        <br />
                        向左滑动可关闭面板
                    </div>
                </div>
            </div>
        </div>
    )
}