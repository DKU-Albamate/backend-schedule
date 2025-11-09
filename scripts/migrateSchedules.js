// migrateSchedules.js
// MongoDB의 schedule_posts 컬렉션을 Supabase의 schedule_posts 테이블로 이전합니다.
// 사용법:
//   cd backend-schedule
//   node scripts/migrateSchedules.js
// 필요 환경변수 (또는 backend/config/supabaseClient.js 사용):
//   MONGODB_URL, MONGODB_DB_NAME, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const { MongoClient } = require('mongodb');
require('dotenv').config();

let supabaseClient;
// 우선 backend/config/supabaseClient.js가 존재하면 재사용 시도
try {
  // 상대경로: scripts 폴더에서 ../../backend/config 경로
  // (repo 구조에 따라 경로가 달라질 수 있으므로 실패 시 env에서 생성)
  // eslint-disable-next-line import/no-unresolved, global-require
  const { supabase } = require('../../backend/config/supabaseClient');
  supabaseClient = supabase;
  console.log('Using existing backend/config/supabaseClient.js');
} catch (err) {
  console.log('No existing backend supabase client found, creating client from env');
  const { createClient } = require('@supabase/supabase-js');
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables.');
    process.exit(1);
  }
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

const MONGODB_URL = process.env.MONGODB_URL;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

if (!MONGODB_URL || !MONGODB_DB_NAME) {
  console.error('Missing MONGODB_URL or MONGODB_DB_NAME env variables.');
  process.exit(1);
}

const BATCH_SIZE = Number(process.env.MIGRATE_BATCH_SIZE) || 200;

async function transformDoc(doc) {
  return {
    id: doc._id.toString(),
    group_id: String(doc.groupId || ''),
    title: doc.title || null,
    description: doc.description || null,
    year: doc.year ?? null,
    month: doc.month ?? null,
    owner_uid: doc.ownerUid || null,
    status: doc.status || null,
    created_at: doc.createdAt ? new Date(doc.createdAt) : null,
    confirmed_at: doc.confirmedAt ? new Date(doc.confirmedAt) : null,
    confirmed_title: doc.confirmedTitle || null,
    unavailable: doc.unavailable || {},
    assignments: doc.assignments || {},
  };
}

async function migrateBatch(batch) {
  if (!batch.length) return;
  // upsert: id를 PK로 사용
  const { data, error } = await supabaseClient
    .from('schedule_posts')
    .upsert(batch, { onConflict: ['id'] });

  if (error) {
    console.error('Supabase upsert error:', error);
    throw error;
  }
  return data;
}

async function run() {
  const client = new MongoClient(MONGODB_URL);
  await client.connect();
  const db = client.db(MONGODB_DB_NAME);

  const total = await db.collection('schedule_posts').countDocuments();
  console.log(`Total documents to migrate: ${total}`);

  const cursor = db.collection('schedule_posts').find({});
  let batch = [];
  let migrated = 0;

  try {
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      batch.push(await transformDoc(doc));

      if (batch.length >= BATCH_SIZE) {
        await migrateBatch(batch);
        migrated += batch.length;
        console.log(`Migrated ${migrated}/${total}`);
        batch = [];
      }
    }

    if (batch.length) {
      await migrateBatch(batch);
      migrated += batch.length;
      console.log(`Migrated ${migrated}/${total}`);
    }

    console.log('Migration finished successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };
