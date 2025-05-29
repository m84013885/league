import { useState } from 'react';
import { copyToClipboard } from '../utils';
import { compressGameData, decompressGameData } from '../utils';
import * as XLSX from 'xlsx';

interface HeaderProps {
    isHeaderVisible: boolean;
    setHeaderVisible: (visible: boolean) => void;
    onImportData: (data: string) => void;
    onClearData: () => void;
    onExportData: () => string;
    isTeamSelected: boolean;
    setMessage: (message: string) => void;
}

export default function Header({
    isHeaderVisible,
    setHeaderVisible,
    onImportData,
    onClearData,
    onExportData,
    isTeamSelected,
    setMessage
}: HeaderProps) {
    const [importValue, setImportValue] = useState('');

    const handleImportData = () => {
        try {
            // 尝试解析为压缩格式
            const decompressedData = decompressGameData(importValue.trim());
            if (decompressedData) {
                // 确保历史记录被正确保留
                const existingData = JSON.parse(onExportData());
                const mergedData = {
                    ...decompressedData,
                    scoreHistory: [
                        ...(existingData.scoreHistory || []),
                        ...(decompressedData.scoreHistory || [])
                    ]
                };
                onImportData(JSON.stringify(mergedData));
                setImportValue('');
                setMessage('数据导入成功');
                setHeaderVisible(false);
                return;
            }

            // 如果不是压缩格式，尝试解析为JSON
            const jsonData = JSON.parse(importValue);
            if (jsonData && jsonData.team1 && jsonData.team2) {
                // 确保历史记录被正确保留
                const existingData = JSON.parse(onExportData());
                const mergedData = {
                    ...jsonData,
                    scoreHistory: [
                        ...(existingData.scoreHistory || []),
                        ...(jsonData.scoreHistory || [])
                    ]
                };
                onImportData(JSON.stringify(mergedData));
                setImportValue('');
                setMessage('数据导入成功');
                return;
            }

            setMessage('数据格式错误，请检查后重试');
        } catch (error) {
            console.error('导入数据失败:', error);
            setMessage('数据格式错误，请检查后重试');
        }
    };

    const handleExportData = async () => {
        try {
            const data = onExportData();
            const jsonData = JSON.parse(data);
            
            // 确保导出时包含完整的历史记录
            const compressedData = compressGameData({
                ...jsonData,
                scoreHistory: jsonData.scoreHistory || []
            });

            if (await copyToClipboard(compressedData)) {
                setMessage('数据已复制到剪贴板');
            } else {
                setMessage('复制失败，请手动复制数据');
            }
        } catch (err) {
            setMessage('导出失败，请稍后重试');
            console.error('导出失败:', err);
        }
    };

    const handleExportExcel = async () => {
        try {
            const data = onExportData();
            const jsonData = JSON.parse(data);

            // 检查数据结构是否完整
            if (!jsonData?.team1?.list || !jsonData?.team2?.list || !jsonData?.playerStats) {
                setMessage('数据格式不完整，请检查数据');
                return;
            }

            // 创建表头行
            const headerRow = {
                队伍: '',
                球员: '',
                得分: '',
                '2分命中率': '',
                '3分命中率': '',
                '罚球命中率': '',
                '犯规': '',
                '恶意犯规': ''
            };

            const rows = [];

            // 添加队伍1数据
            rows.push({
                队伍: jsonData.team1.name,
                球员: '总分',
                得分: jsonData.team1.totalScore,
                '2分命中率': '',
                '3分命中率': '',
                '罚球命中率': '',
                '犯规': '',
                '恶意犯规': ''
            });

            // 添加队伍1球员数据（按得分排序）
            [...jsonData.team1.list]
                .sort((a, b) => (jsonData.playerStats[b]?.totalScore || 0) - (jsonData.playerStats[a]?.totalScore || 0))
                .forEach(player => {
                    const stats = jsonData.playerStats[player] || {};
                    const attempts = stats.attempts || {};
                    rows.push({
                        队伍: '',
                        球员: player || '未知球员',
                        得分: stats.totalScore || 0,
                        '2分命中率': (() => {
                            const made = attempts['2p']?.made || 0;
                            const total = attempts['2p']?.total || 0;
                            return total > 0 ? `${Math.round((made / total) * 100)}%` : '0%';
                        })(),
                        '3分命中率': (() => {
                            const made = attempts['3p']?.made || 0;
                            const total = attempts['3p']?.total || 0;
                            return total > 0 ? `${Math.round((made / total) * 100)}%` : '0%';
                        })(),
                        '罚球命中率': (() => {
                            const made = attempts['ft']?.made || 0;
                            const total = attempts['ft']?.total || 0;
                            return total > 0 ? `${Math.round((made / total) * 100)}%` : '0%';
                        })(),
                        '犯规': stats.fouls || 0,
                        '恶意犯规': stats.flagrantFouls || 0
                    });
                });

            // 添加空行
            rows.push(headerRow);

            // 添加队伍2数据
            rows.push({
                队伍: jsonData.team2.name,
                球员: '总分',
                得分: jsonData.team2.totalScore,
                '2分命中率': '',
                '3分命中率': '',
                '罚球命中率': '',
                '犯规': '',
                '恶意犯规': ''
            });

            // 添加队伍2球员数据（按得分排序）
            [...jsonData.team2.list]
                .sort((a, b) => (jsonData.playerStats[b]?.totalScore || 0) - (jsonData.playerStats[a]?.totalScore || 0))
                .forEach(player => {
                    const stats = jsonData.playerStats[player] || {};
                    const attempts = stats.attempts || {};
                    rows.push({
                        队伍: '',
                        球员: player || '未知球员',
                        得分: stats.totalScore || 0,
                        '2分命中率': (() => {
                            const made = attempts['2p']?.made || 0;
                            const total = attempts['2p']?.total || 0;
                            return total > 0 ? `${Math.round((made / total) * 100)}%` : '0%';
                        })(),
                        '3分命中率': (() => {
                            const made = attempts['3p']?.made || 0;
                            const total = attempts['3p']?.total || 0;
                            return total > 0 ? `${Math.round((made / total) * 100)}%` : '0%';
                        })(),
                        '罚球命中率': (() => {
                            const made = attempts['ft']?.made || 0;
                            const total = attempts['ft']?.total || 0;
                            return total > 0 ? `${Math.round((made / total) * 100)}%` : '0%';
                        })(),
                        '犯规': stats.fouls || 0,
                        '恶意犯规': stats.flagrantFouls || 0
                    });
                });

            // 合并所有数据，按顺序排列
            const allPlayers = rows;

            // 创建工作簿和工作表
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(allPlayers);

            // 设置列宽
            const colWidths = [
                { wch: 15 }, // 队伍
                { wch: 10 }, // 球员
                { wch: 8 },  // 得分
                { wch: 12 }, // 2分命中率
                { wch: 12 }, // 3分命中率
                { wch: 12 }, // 罚球命中率
                { wch: 8 },  // 犯规
                { wch: 10 }  // 恶意犯规
            ];
            ws['!cols'] = colWidths;

            // 添加工作表到工作簿
            XLSX.utils.book_append_sheet(wb, ws, "比赛数据");

            // 生成文件名（使用当前时间）
            const now = new Date();
            const fileName = `比赛数据_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}.xlsx`;

            // 导出文件
            XLSX.writeFile(wb, fileName);
            setMessage('Excel文件已下载');
        } catch (err) {
            console.error('导出Excel失败:', err);
            setMessage('导出Excel失败，请稍后重试');
        }
    };

    return (
        <>
            {/* 遮罩层 */}
            {isHeaderVisible && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 z-[5]"
                    onClick={() => setHeaderVisible(false)}
                />
            )}
            <header className={`fixed top-0 left-0 right-0 flex flex-col items-center justify-center p-3 sm:p-6 
                bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg z-10 transition-all duration-300 
                ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
                
                <div className="w-full max-w-6xl flex flex-col items-center justify-between gap-3 sm:gap-4">
                    {/* 导入数据部分 */}
                    <div className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <input
                                type="text"
                                value={importValue}
                                onChange={(e) => setImportValue(e.target.value)}
                                placeholder="粘贴比赛数据"
                                className="w-full sm:flex-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 
                                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent 
                                    transition-all duration-200 shadow-sm placeholder:text-gray-400"
                            />
                            <button
                                onClick={handleImportData}
                                className="w-full sm:w-auto px-4 py-2.5 text-white bg-gradient-to-r from-blue-500 to-blue-600 
                                    rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 
                                    shadow-sm hover:shadow-md flex items-center justify-center gap-2 font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                导入数据
                            </button>
                        </div>
                    </div>

                    {isTeamSelected && (
                        <div className="w-full flex flex-col gap-2">
                            {/* 导出按钮组 */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleExportData}
                                    className="w-full px-4 py-2.5 text-white bg-gradient-to-r from-green-500 to-green-600 
                                        rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 
                                        shadow-sm hover:shadow-md flex items-center justify-center gap-2 font-medium"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    复制数据
                                </button>
                                <button
                                    onClick={handleExportExcel}
                                    className="w-full px-4 py-2.5 text-white bg-gradient-to-r from-green-500 to-green-600 
                                        rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 
                                        shadow-sm hover:shadow-md flex items-center justify-center gap-2 font-medium"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    下载excel
                                </button>
                            </div>

                            {/* 清除数据按钮 */}
                            <button
                                onClick={() => {
                                    if (confirm('清除数据前请确保保留的数据！确定要清除所有数据吗？此操作不可恢复。')) {
                                        setHeaderVisible(false);
                                        onClearData();
                                        const data = onExportData();
                                        const jsonData = JSON.parse(data);
                                        const compressedData = compressGameData(jsonData);
                                        copyToClipboard(compressedData);
                                        setMessage('所有数据已清除，已复制数据');
                                    }
                                }}
                                className="w-full px-4 py-2.5 text-white bg-gradient-to-r from-red-500 to-red-600 
                                    rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 
                                    shadow-sm hover:shadow-md flex items-center justify-center gap-2 font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                清除数据
                            </button>
                        </div>
                    )}
                </div>
            </header>
        </>
    );
};