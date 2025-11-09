-- create_tables.sql
-- Supabase (Postgres) 테이블 생성 스크립트 for schedule_posts

CREATE TABLE IF NOT EXISTS public.schedule_posts (
  id TEXT PRIMARY KEY,                -- MongoDB ObjectId 문자열을 그대로 보존
  group_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  year INTEGER,
  month INTEGER,
  owner_uid TEXT,
  status TEXT,
  created_at timestamptz,
  confirmed_at timestamptz,
  confirmed_title TEXT,
  unavailable JSONB DEFAULT '{}'::jsonb,
  assignments JSONB DEFAULT '{}'::jsonb
);

-- 인덱스: 그룹별/상태별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_schedule_group_status ON public.schedule_posts (group_id, status);
CREATE INDEX IF NOT EXISTS idx_schedule_confirmed_at ON public.schedule_posts (confirmed_at DESC);

-- 권장: 필요한 경우 owner_uid, group_id 등을 참조키로 분리하여 FK 추가 가능
