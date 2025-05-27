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
    .find({
      groupId: String(groupId),
      status: 'draft' // 확정된 스케줄은 스케줄 신청 게시판에서 삭제
    })
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

exports.confirmSchedule = async ({ scheduleId, scheduleMap, confirmedTitle }) => {
  const db = getDb();
  const schedulePosts = db.collection('schedule_posts');

  const result = await schedulePosts.updateOne(
    { _id: new ObjectId(scheduleId) },
    {
      $set: {
        assignments: scheduleMap,
        confirmedTitle,
        status: 'confirmed',
        confirmedAt: new Date(),
      },
    }
  );

  return result.matchedCount > 0;
};

exports.getConfirmedSchedulesByGroup = async (groupId) => {
  const db = getDb();
  const schedulePosts = db.collection('schedule_posts');

  const confirmed = await schedulePosts
    .find({ groupId, status: 'confirmed' })
    .project({
      _id: 1,
      confirmedTitle: 1,
      confirmedAt: 1,
      assignments: 1,
    })
    .sort({ confirmedAt: -1 }) // 최신순 정렬
    .toArray();

  return confirmed;
};

// 오늘 근무자 정보 조회
exports.getTodayWorkers = async (groupId) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식

  try {
    // 가장 최근에 확정된 스케줄 찾기
    const latestSchedule = await db
      .collection('schedule_posts')
      .findOne(
        { 
          groupId: String(groupId), 
          status: 'confirmed',
          [`assignments.${today}`]: { $exists: true }
        },
        { 
          projection: { 
            [`assignments.${today}`]: 1
          }
        }
      );

    if (!latestSchedule) {
      return {
        workers: [],
        message: '오늘 확정된 스케줄이 없습니다.'
      };
    }

    if (!latestSchedule.assignments || !latestSchedule.assignments[today]) {
      return {
        workers: [],
        message: '오늘 근무자가 없습니다.'
      };
    }

    // 근무자 이름만 배열로 변환하고 정렬
    const workers = Object.keys(latestSchedule.assignments[today])
      .map(workerId => ({
        worker_name: workerId
      }))
      .sort((a, b) => a.worker_name.localeCompare(b.worker_name));

    return {
      workers,
      message: '오늘 근무자 정보를 성공적으로 가져왔습니다.'
    };
  } catch (error) {
    console.error('근무자 정보 조회 중 오류:', error);
    throw new Error('근무자 정보를 가져오는 중 오류가 발생했습니다.');
  }
};