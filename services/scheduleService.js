/*  Supabase 기반으로 변환된 scheduleService
    - 중앙화된 utils/supabaseClient.js를 사용하도록 변경
*/
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const { supabase } = require('../utils/supabaseClient');

const TABLE = 'schedule_posts';

exports.createSchedulePost = async ({ groupId, title, description, year, month, ownerUid }) => {
  const id = uuidv4();
  const newPost = {
    id,
    group_id: String(groupId || ''),
    title: title || null,
    description: description || null,
    year: year ?? null,
    month: month ?? null,
    owner_uid: ownerUid || null,
    status: 'draft',
    created_at: new Date().toISOString(),
    unavailable: {},
    assignments: {},
  };

  const { error } = await supabase.from(TABLE).insert(newPost);
  if (error) {
    console.error('createSchedulePost supabase error:', error);
    throw error;
  }

  return { scheduleId: id };
};

exports.getSchedulesByGroup = async (groupId) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('group_id', String(groupId))
    .eq('status', 'draft')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getSchedulesByGroup error:', error);
    throw error;
  }
  return data || [];
};

exports.saveUnavailableDates = async ({ scheduleId, userUid, dates }) => {
  // 안전을 위해 현재 unavailable 객체를 읽고 userUid 키를 업데이트한 뒤 저장
  const { data: rows, error: fetchErr } = await supabase.from(TABLE).select('unavailable').eq('id', scheduleId).single();
  if (fetchErr) {
    console.error('saveUnavailableDates fetch error:', fetchErr);
    throw fetchErr;
  }

  const existing = rows?.unavailable || {};
  existing[userUid] = dates;

  const { error: updateErr } = await supabase.from(TABLE).update({ unavailable: existing }).eq('id', scheduleId);
  if (updateErr) {
    console.error('saveUnavailableDates update error:', updateErr);
    throw updateErr;
  }
  return { ok: true };
};

exports.getUnavailableDatesByUser = async ({ scheduleId, userUid }) => {
  const { data: row, error } = await supabase.from(TABLE).select('unavailable').eq('id', scheduleId).single();
  if (error) {
    console.error('getUnavailableDatesByUser error:', error);
    throw error;
  }
  return (row?.unavailable?.[userUid]) || [];
};

exports.getUnavailableByScheduleId = async (scheduleId) => {
  const { data: row, error } = await supabase.from(TABLE).select('unavailable').eq('id', scheduleId).single();
  if (error) {
    console.error('getUnavailableByScheduleId error:', error);
    throw error;
  }
  if (!row) throw new Error('스케줄을 찾을 수 없습니다.');
  return row.unavailable || {};
};

exports.confirmSchedule = async ({ scheduleId, scheduleMap, confirmedTitle }) => {
  const payload = {
    assignments: scheduleMap,
    confirmed_title: confirmedTitle || null,
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
  };

  const { error } = await supabase.from(TABLE).update(payload).eq('id', scheduleId);
  if (error) {
    console.error('confirmSchedule error:', error);
    throw error;
  }
  return true;
};

exports.getConfirmedSchedulesByGroup = async (groupId) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, confirmed_title, confirmed_at, assignments')
    .eq('group_id', groupId)
    .eq('status', 'confirmed')
    .order('confirmed_at', { ascending: false });
  if (error) {
    console.error('getConfirmedSchedulesByGroup error:', error);
    throw error;
  }
  return data || [];
};

exports.getTodayWorkers = async (groupId) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    // 가장 최근에 확정된 스케줄
    const { data: rows, error: fetchErr } = await supabase
      .from(TABLE)
      .select('assignments')
      .eq('group_id', String(groupId))
      .eq('status', 'confirmed')
      .order('confirmed_at', { ascending: false })
      .limit(1);

    if (fetchErr) {
      console.error('getTodayWorkers fetch error:', fetchErr);
      throw fetchErr;
    }

    const latest = rows && rows.length ? rows[0] : null;
    if (!latest || !latest.assignments || !latest.assignments[today]) {
      return { workers: [], message: '오늘 근무자가 없습니다.' };
    }

    const todayAssignments = latest.assignments[today];
    const workers = todayAssignments.map((workerName) => ({ worker_name: workerName || '알 수 없음' }))
      .sort((a, b) => a.worker_name.localeCompare(b.worker_name));

    return { workers, message: '오늘 근무자 정보를 성공적으로 가져왔습니다.' };
  } catch (err) {
    console.error('getTodayWorkers error:', err);
    throw new Error('근무자 정보를 가져오는 중 오류가 발생했습니다.');
  }
};
