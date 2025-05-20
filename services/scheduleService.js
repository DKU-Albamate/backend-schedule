const { ObjectId } = require('mongodb');
const { getDb } = require('../utils/mongoClient');

exports.createSchedulePost = async ({
  groupId,
  title,
  description,
  year,
  month,
  ownerUid,
}) => {
  const db = getDb();
  const schedulePosts = db.collection('schedule_posts');



  const newPost = {
    groupId,
    title,
    description,
    year,
    month,
    ownerUid,
    createdAt: new Date(),
    status: 'draft',       // 추후: 확정됨(confirm), 작성 중(draft)
    unavailable: {},       // 알바 불가능 날짜 추후 저장 예정
    assignments: {},       // 알바 배정 결과 추후 저장 예정
  };

  const result = await schedulePosts.insertOne(newPost);
  return { scheduleId: result.insertedId };
};



exports.getSchedulesByGroup = async (groupId) => {
  const db = getDb();

  const schedules = await db
    .collection('schedule_posts')
    .find({ groupId: String(groupId) })
    .sort({ createdAt: -1 })
    .toArray();

  return schedules;
};



exports.saveUnavailableDates = async ({ scheduleId, userUid, dates }) => {
  const db = getDb();
  const schedulePosts = db.collection('schedule_posts');

  const result = await schedulePosts.updateOne(
    { _id: new ObjectId(scheduleId) },
    {
      $set: {
        [`unavailable.${userUid}`]: dates,
      },
    }
  );

  return result;
};


exports.getUnavailableDatesByUser = async ({ scheduleId, userUid }) => {
  const db = getDb();
  const schedulePosts = db.collection('schedule_posts');

  const post = await schedulePosts.findOne(
    { _id: new ObjectId(scheduleId) },
    { projection: { [`unavailable.${userUid}`]: 1 } }
  );

  return post?.unavailable?.[userUid] ?? []; // 없으면 빈 배열
};

// 사장님이 알바생 신청 내역 조회
exports.getUnavailableByScheduleId = async (scheduleId) => {
  const db = getDb();
  const schedule = await db.collection('schedule_posts').findOne(
    { _id: new ObjectId(scheduleId) },
    { projection: { unavailable: 1 } }
  );

  console.log('📦 [Service] schedule 문서 전체:', schedule);

  if (!schedule) throw new Error('스케줄을 찾을 수 없습니다.');
  return schedule.unavailable || {};
};
