/*  Supabase 기반으로 변환된 scheduleService
    - backend/config/supabaseClient.js를 재사용하려 시도하고, 없으면 env로 생성
    - JSONB 필드(unavailable, assignments)를 전체 교체 방식으로 업데이트(충돌 가능성 낮음)
*/
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

let supabase;
try {
  // 기존 backend 프로젝트의 supabaseClient 재사용 시도
  const client = require('../../backend/config/supabaseClient');
  supabase = client.supabase;
} catch (err) {
  const { createClient } = require('@supabase/supabase-js');
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase 설정을 찾을 수 없습니다. SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

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
