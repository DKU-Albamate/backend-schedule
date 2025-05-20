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
  const sample = await db.collection('schedule_posts').findOne();
    console.log('🔥 저장된 스케줄:', sample);
  console.log('groupId typeof:', typeof sample.groupId);
  console.log('📌 groupId typeof:', typeof groupId, 'value:', groupId);

  // ✅ 더 이상 group_members 확인 안 함

  const schedules = await db
    .collection('schedule_posts')
    .find({ groupId: String(groupId) })
    .sort({ createdAt: -1 })
    .toArray();

  return schedules;
};

const { ObjectId } = require('mongodb');
const { getDb } = require('../utils/mongoClient');

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

