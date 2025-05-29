import { ScoreHistory } from '../types';

interface HistoryProps {
    scoreHistory: ScoreHistory[];
    team1Name?: string;
    team2Name?: string;
    onClose?: () => void;
}

export default function History({
    scoreHistory,
    team1Name,
    team2Name,
    onClose
}: HistoryProps) {
    const getActionText = (record: ScoreHistory) => {
        if (record.type === 'foul') {
            return '犯规';
        } else if (record.type === 'flagrant') {
            return '恶意犯规';
        } else {
            const typeText = record.type === '2p' ? '2分球' : record.type === '3p' ? '3分球' : '罚球';
            return `${typeText}${record.isSuccess ? '命中' : '不中'}`;
        }
    };

    // 反转历史记录数组，这样最新的记录会显示在最上面
    const reversedHistory = [...scoreHistory].reverse();

    return (
        <div className="drawer">
            <input
                id="history-drawer"
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
                    htmlFor="history-drawer"
                    aria-label="close sidebar"
                    className="drawer-overlay"
                ></label>
                <div className="menu p-4 w-full max-w-md min-h-screen bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-xl 
                    text-base-content relative flex flex-col">
                    {/* 关闭按钮 */}
                    <button
                        onClick={() => {
                            const drawer = document.getElementById('history-drawer') as HTMLInputElement;
                            if (drawer) {
                                drawer.checked = false;
                            }
                        }}
                        className="absolute top-6 right-6 btn btn-circle btn-sm bg-white hover:bg-gray-50 
                            border-none shadow-md hover:shadow-lg transition-all duration-300"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* 标题 */}
                    <div className="text-center mb-8 mt-6">
                        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900">历史记录</h3>
                    </div>

                    {/* 历史记录列表 */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {scoreHistory.length === 0 ? (
                            <div className="text-center text-gray-500 mt-8">
                                暂无记录
                            </div>
                        ) : (
                            <div className="space-y-3 px-1">
                                {reversedHistory.map((record, index) => (
                                    <div
                                        key={index}
                                        className="p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 
                                            flex items-center gap-3 border border-gray-100"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                    record.isTeam1 
                                                        ? 'bg-yellow-50 text-yellow-700' 
                                                        : 'bg-purple-50 text-purple-700'
                                                }`}>
                                                    {record.isTeam1 ? team1Name : team2Name}
                                                </span>
                                                <span className="font-semibold">{record.player}</span>
                                            </div>
                                            <div className="text-sm text-gray-600 mt-2">{getActionText(record)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 