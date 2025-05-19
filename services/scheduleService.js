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

exports.getSchedulesByGroup = async (groupId, userUid) => {
  const db = getDb();

  // 사용자 권한 검증: 이 groupId에 속한 userUid인지 확인
  const member = await db.collection('group_members').findOne({
    group_id: groupId,
    user_uid: userUid,
  });

  if (!member) {
    throw new Error('이 그룹에 대한 접근 권한이 없습니다.');
  }

  const schedules = await db
    .collection('schedule_posts')
    .find({ groupId })
    .sort({ createdAt: -1 })
    .toArray();

  return schedules;
};