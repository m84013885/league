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
                onImportData(JSON.stringify(decompressedData));
                setImportValue('');
                setMessage('数据导入成功');
                setHeaderVisible(false);
                return;
            }

            // 如果不是压缩格式，尝试解析为JSON
            const jsonData = JSON.parse(importValue);
            if (jsonData && jsonData.team1 && jsonData.team2) {
                onImportData(importValue);
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
            const compressedData = compressGameData(jsonData);

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

            // 准备第一队数据
            const team1Header = { ...headerRow, 队伍: jsonData.team1.name };
            const team1Players = (jsonData.team1.list || []).map((playerName: string) => {
                const stats = jsonData.playerStats[playerName] || {};
                const attempts = stats.attempts || {};
                return {
                    队伍: '',
                    球员: playerName || '未知球员',
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
                };
            });

            // 添加空行
            const emptyRow = { ...headerRow };

            // 准备第二队数据
            const team2Header = { ...headerRow, 队伍: jsonData.team2.name };
            const team2Players = (jsonData.team2.list || []).map((playerName: string) => {
                const stats = jsonData.playerStats[playerName] || {};
                const attempts = stats.attempts || {};
                return {
                    队伍: '',
                    球员: playerName || '未知球员',
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
                };
            });

            // 合并所有数据，按顺序排列
            const allPlayers = [
                team1Header,
                ...team1Players,
                emptyRow,
                team2Header,
                ...team2Players
            ];

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
                    className="fixed inset-0 bg-black/50 transition-opacity duration-300 z-[5]"
                    onClick={() => setHeaderVisible(false)}
                />
            )}
            <header className={`fixed top-0 left-0 right-0 flex flex-col sm:flex-row items-center justify-center gap-6 p-6 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-lg z-10 transition-all duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto mt-14">
                        <input
                            type="text"
                            value={importValue}
                            onChange={(e) => setImportValue(e.target.value)}
                            placeholder="粘贴比赛数据"
                            className="w-full sm:w-72 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                        />
                        <button
                            onClick={handleImportData}
                            className="w-full sm:w-auto px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            导入数据
                        </button>
                    </div>
                </div>
                {isTeamSelected && (
                    <>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={handleExportData}
                                    className="w-full sm:w-auto px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    复制数据
                                </button>
                                <button
                                    onClick={handleExportExcel}
                                    className="w-full sm:w-auto px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    下载excel表格
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => {
                                    if (confirm('清除数据前请确保保留的数据！确定要清除所有数据吗？此操作不可恢复。')) {
                                        setHeaderVisible(false);
                                        onClearData();
                                        setMessage('所有数据已清除');
                                    }
                                }}
                                className="w-full sm:w-auto px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                清除数据
                            </button>
                        </div>
                    </>
                )}
            </header>
        </>
    );
};