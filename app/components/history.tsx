// 定义数据库明细类型
interface GameDetailMainRow {
  id: number;
  player_id: number;
  score?: number;
  fouls?: number;
  flagrant_fouls?: number;
  '2p_made'?: number;
  '2p_attempts'?: number;
  '3p_made'?: number;
  '3p_attempts'?: number;
  'ft_made'?: number;
  'ft_attempts'?: number;
  created_at: string;
}

// 定义数据库统计数据明细类型
interface GameDetailDataRow {
  id: number;
  player_id: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  turnovers?: number;
  blocks?: number;
  created_at: string;
}

interface HistoryProps {
    gameDetails?: GameDetailMainRow[];
    gameDataDetails?: GameDetailDataRow[];
    players?: { id: number, name: string }[];
    team1Name?: string;
    team2Name?: string;
    team1List?: string[];
    onClose?: () => void;
}

export default function History({
    gameDetails = [],
    gameDataDetails = [],
    players = [],
    team1Name,
    team2Name,
    team1List = [],
    onClose
}: HistoryProps) {
    const getActionText = (record: GameDetailMainRow) => {
        // 判断是否为犯规记录
        if (record.fouls === 1) {
            return '犯规';
        } else if (record.flagrant_fouls === 1) {
            return '恶意犯规';
        } else {
            // 判断投篮类型
            if (record['2p_attempts'] === 1) {
                return `2分球${record['2p_made'] === 1 ? '命中' : '不中'}`;
            } else if (record['3p_attempts'] === 1) {
                return `3分球${record['3p_made'] === 1 ? '命中' : '不中'}`;
            } else if (record['ft_attempts'] === 1) {
                return `罚球${record['ft_made'] === 1 ? '命中' : '不中'}`;
            }
            return '未知操作';
        }
    };

    // 将game_detail_main数据转换为历史记录格式
    const scoreHistory = gameDetails
        .map(record => {
            const player = players.find(p => p.id === record.player_id);
            if (!player) return null;
            
            // 判断球员属于哪个队伍
            const isTeam1 = team1List.includes(player.name);
            
            return {
                id: record.id,
                player: player.name,
                action: getActionText(record),
                created_at: record.created_at,
                score: record.score || 0,
                isTeam1,
                recordType: 'score' as const
            };
        })
        .filter((record): record is NonNullable<typeof record> => record !== null);

    // 将game_detail_data数据转换为历史记录格式
    const getStatActionText = (record: GameDetailDataRow) => {
        if (record.rebounds === 1) return '篮板';
        if (record.assists === 1) return '助攻';
        if (record.steals === 1) return '抢断';
        if (record.turnovers === 1) return '失误';
        if (record.blocks === 1) return '盖帽';
        return '未知操作';
    };

    const dataHistory = gameDataDetails
        .map(record => {
            const player = players.find(p => p.id === record.player_id);
            if (!player) return null;
            
            // 判断球员属于哪个队伍
            const isTeam1 = team1List.includes(player.name);
            
            return {
                id: record.id,
                player: player.name,
                action: getStatActionText(record),
                created_at: record.created_at,
                score: 0,
                isTeam1,
                recordType: 'data' as const
            };
        })
        .filter((record): record is NonNullable<typeof record> => record !== null);

    // 合并所有历史记录并按时间排序
    const allHistory = [...scoreHistory, ...dataHistory]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
                        {allHistory.length === 0 ? (
                            <div className="text-center text-gray-500 mt-8">
                                暂无记录
                            </div>
                        ) : (
                            <div className="space-y-3 px-1">
                                {allHistory.map((record, index) => (
                                    <div
                                        key={record.id || index}
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
                                                {/* 记录类型标识 */}
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    record.recordType === 'score' 
                                                        ? 'bg-blue-50 text-blue-600' 
                                                        : 'bg-green-50 text-green-600'
                                                }`}>
                                                    {record.recordType === 'score' ? '得分' : '数据'}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600 mt-2">
                                                {record.action}
                                            </div>
                                            {record.score > 0 && (
                                                <div className="text-xs text-green-600 mt-1">
                                                    +{record.score}分
                                                </div>
                                            )}
                                            <div className="text-xs text-gray-400 mt-1">
                                                {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </div>
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