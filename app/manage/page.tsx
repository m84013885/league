"use client";

import { useRouter } from 'next/navigation';

export default function ManagePage() {
    const router = useRouter();

    const handleNavigation = (path: string) => {
        router.push(path);
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">管理中心</h1>
                <p className="text-gray-600">选择要管理的功能模块</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 数据统计 */}
                <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <div className="card-body">
                        <div className="text-center">
                            <div className="text-4xl mb-4">📊</div>
                            <h2 className="card-title justify-center text-xl">数据统计</h2>
                            <p className="text-base-content/70 mb-4">查看统计数据分析</p>
                            <div className="card-actions justify-center">
                                <button 
                                    className="btn btn-info"
                                    onClick={() => handleNavigation('/manage/stats')}
                                >
                                    进入查看
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* 赛季管理 */}
                <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <div className="card-body">
                        <div className="text-center">
                            <div className="text-4xl mb-4">🏆</div>
                            <h2 className="card-title justify-center text-xl">赛季管理</h2>
                            <p className="text-base-content/70 mb-4">管理联赛赛季信息</p>
                            <div className="card-actions justify-center">
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => handleNavigation('/manage/season')}
                                >
                                    进入管理
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* 球队管理 */}
                <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <div className="card-body">
                        <div className="text-center">
                            <div className="text-4xl mb-4">🏀</div>
                            <h2 className="card-title justify-center text-xl">球队管理</h2>
                            <p className="text-base-content/70 mb-4">管理联赛球队信息</p>
                            <div className="card-actions justify-center">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => handleNavigation('/manage/team')}
                                >
                                    进入管理
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* 球员管理 */}
                <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <div className="card-body">
                        <div className="text-center">
                            <div className="text-4xl mb-4">🏃‍♂️</div>
                            <h2 className="card-title justify-center text-xl">球员管理</h2>
                            <p className="text-base-content/70 mb-4">管理球员档案信息</p>
                            <div className="card-actions justify-center">
                                <button 
                                    className="btn btn-accent"
                                    onClick={() => handleNavigation('/manage/player')}
                                >
                                    进入管理
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
