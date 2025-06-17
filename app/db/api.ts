import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yrjvtdkbeklbdxeofkgp.supabase.co';   
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyanZ0ZGtiZWtsYmR4ZW9ma2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MTE4ODYsImV4cCI6MjA2NTE4Nzg4Nn0.9E0SeEDgcBqzBJEB2crKRImU199ZqwoqvYwwsZXeFF0';  
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// season 
    // id
    // name
    // created_at
    // hidden
// player
    // id
    // name
    // total_score
    // total_2p_made
    // total_2p_attempts
    // total_3p_made
    // total_3p_attempts
    // total_ft_made
    // total_ft_attempts
    // total_fouls
    // total_flagrant_fouls
    // total_rebounds
    // total_assists
    // total_steals
    // total_turnovers
    // total_blocks
    // season_ids
    // created_at
    // hidden
// team
    // id
    // name
    // player_ids
    // season_id
    // hidden
// game
    // id
    // season_id
    // team1_id
    // team2_id
    // team1_score
    // team2_score
    // end_time
    // created_at
// game_detail_main
    // id
    // game_id
    // player_id
    // team_id
    // score
    // 2p_made
    // 2p_attempts
    // 3p_made
    // 3p_attempts
    // ft_made
    // ft_attempts
    // fouls
    // flagrant_fouls
    // updated_at
// game_detail_data
    // id
    // game_id
    // player_id
    // team_id
    // rebounds
    // assists
    // steals
    // turnovers
    // blocks
    // updated_at

// 球员相关API
export async function createPlayer(name: string) {
    const { data, error } = await supabase
        .from('player')
        .insert([{
            name,
            total_score: 0,
            total_2p_made: 0,
            total_2p_attempts: 0,
            total_3p_made: 0,
            total_3p_attempts: 0,
            total_ft_made: 0,
            total_ft_attempts: 0,
            total_fouls: 0,
            total_flagrant_fouls: 0,
            total_rebounds: 0,
            total_assists: 0,
            total_steals: 0,
            total_turnovers: 0,
            total_blocks: 0,
            season_ids: [],
            hidden: false
        }])
        .select();
    
    if (error) {
        console.error('创建球员失败:', error);
        throw error;
    }
    return data;
}

export async function getPlayers() {
    const { data, error } = await supabase
        .from('player')  
        .select('*')
        .eq('hidden', false)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('查询球员失败:', error);
        throw error;
    }
    return data;
}

export async function hidePlayer(id: number) {
    const { data, error } = await supabase
        .from('player')
        .update({ hidden: true })
        .eq('id', id);
    
    if (error) {
        console.error('隐藏球员失败:', error);
        throw error;
    }
    return data;
}

// 赛季相关API
export async function createSeason(name: string) {
    const { data, error } = await supabase
        .from('season')
        .insert([{ 
            name,
            hidden: false 
        }])
        .select();
    
    if (error) {
        console.error('创建赛季失败:', error);
        throw error;
    }
    return data;
}

export async function getSeasons() {
    const { data, error } = await supabase
        .from('season')
        .select('*')
        .eq('hidden', false)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('查询赛季失败:', error);
        throw error;
    }
    return data;
}

export async function hideSeason(id: number) {
    const { data, error } = await supabase
        .from('season')
        .update({ hidden: true })
        .eq('id', id);
    
    if (error) {
        console.error('隐藏赛季失败:', error);
        throw error;
    }
    return data;
}

// 队伍相关API
export async function createTeam(name: string, seasonId: number) {
    const { data, error } = await supabase
        .from('team')
        .insert([{ name, season_id: seasonId, hidden: false }])
        .select();
    if (error) {
        console.error('创建队伍失败:', error);
        throw error;
    }
    return data && data[0];
}

// 新增：为队伍批量添加球员
export async function addPlayersToTeam(teamId: number, playerIds: number[]) {
    const inserts = playerIds.map(playerId => ({
        team_id: teamId,
        player_id: playerId
    }));
    const { data, error } = await supabase
        .from('team_player')
        .insert(inserts);
    if (error) throw error;
    return data;
}

export async function getTeams(seasonId?: number) {
    let query = supabase
        .from('team')
        .select('*, season(name), team_player(player_id, player(name))')
        .eq('hidden', false)
        .order('id', { ascending: false });
    if (seasonId) {
        query = query.eq('season_id', seasonId);
    }
    const { data, error } = await query;
    if (error) {
        console.error('查询队伍失败:', error);
        throw error;
    }
    console.log('team1Full', data[0].team_player);
    console.log('team2Full', data[1].team_player);
    return data;
}

export async function updateTeamPlayers(teamId: number, playerIds: number[]) {
    // 先删除原有
    await supabase.from('team_player').delete().eq('team_id', teamId);
    // 再插入新关系
    return await addPlayersToTeam(teamId, playerIds);
}

export async function hideTeam(id: number) {
    const { data, error } = await supabase
        .from('team')
        .update({ hidden: true })
        .eq('id', id);
    if (error) {
        console.error('隐藏队伍失败:', error);
        throw error;
    }
    return data;
}

// 插
export async function insertData() {
    const { data, error } = await supabase
        .from('tasks')          // 替换为你的表名
        .insert([{ title: '买菜', completed: false }]);
    if (error) console.error('插入失败:', error);
    else console.log('新增任务:', data);
}

// 查
export async function selectData() {
    const { data, error } = await supabase
        .from('tasks')
        .select('id, title')   // 指定返回字段
        .eq('completed', false) // 条件筛选：未完成的任务
        .order('created_at', { ascending: false });
    if (error) console.error('查询失败:', error);
    else console.log('查询结果:', data);
}

// 改
export async function updateData() {
    const { data, error } = await supabase
        .from('tasks')
        .update({ title: '买菜' })
        .eq('id', 1);
    if (error) console.error('更新失败:', error);
    else console.log('更新结果:', data);
}

// 删
export async function deleteData() {
    const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', 1);
    if (error) console.error('删除失败:', error);
    else console.log('删除结果:', data);
}

// 获取最新赛季的所有队伍
export async function getLatestSeasonTeams() {
    // 1. 获取最新赛季
    const seasons = await getSeasons();
    if (!seasons || seasons.length === 0) return [];
    const latestSeason = seasons[0]; // created_at 降序

    // 2. 获取该赛季下所有队伍
    const teams = await getTeams(latestSeason.id);
    return teams || [];
}

// 新增：创建比赛
export async function createGame({ season_id, team1_id, team2_id }: { season_id: number, team1_id: number, team2_id: number }) {
    const { data, error } = await supabase
        .from('game')
        .insert([{ season_id, team1_id, team2_id }])
        .select();
    if (error) throw error;
    return data && data[0];
}

// 新增：插入一条分数/投篮/犯规记录
export async function createGameDetailMain(detail: {
    game_id: number,
    player_id: number,
    team_id: number,
    score?: number,
    '2p_made'?: number,
    '2p_attempts'?: number,
    '3p_made'?: number,
    '3p_attempts'?: number,
    'ft_made'?: number,
    'ft_attempts'?: number,
    fouls?: number,
    flagrant_fouls?: number
}) {
    const { data, error } = await supabase
        .from('game_detail_main')
        .insert([detail])
        .select();
    if (error) throw error;
    return data && data[0];
}

// 新增：删除一条分数/投篮/犯规记录
export async function deleteGameDetailMain(id: number) {
    const { error } = await supabase
        .from('game_detail_main')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// 新增：插入一条数据统计记录
export async function createGameDetailData(detail: {
    game_id: number,
    player_id: number,
    team_id: number,
    rebounds?: number,
    assists?: number,
    steals?: number,
    turnovers?: number,
    blocks?: number
}) {
    const { data, error } = await supabase
        .from('game_detail_data')
        .insert([detail])
        .select();
    if (error) throw error;
    return data && data[0];
}

// 新增：删除一条数据统计记录
export async function deleteGameDetailData(id: number) {
    const { error } = await supabase
        .from('game_detail_data')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// 新增：拉取某场比赛所有明细，聚合为前端结构
export async function getGameDetails(game_id: number) {
    // 拉取 main
    const { data: main, error: mainError } = await supabase
        .from('game_detail_main')
        .select('*')
        .eq('game_id', game_id);
    if (mainError) throw mainError;
    // 拉取 data
    const { data: dataRows, error: dataError } = await supabase
        .from('game_detail_data')
        .select('*')
        .eq('game_id', game_id);
    if (dataError) throw dataError;
    return { main, data: dataRows };
}

// 新增：获取今天的所有比赛
export async function getTodayGames() {
    // 获取今天0点和明天0点
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    // 查询created_at在今天范围内的比赛
    const { data, error } = await supabase
        .from('game')
        .select('*')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}
