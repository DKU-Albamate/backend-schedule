const scheduleService = require('../services/scheduleService');
// 사장님 스케줄 게시글 생성
exports.createSchedulePost = async (req, res) => {
  try {
    const ownerUid = req.user.uid;
    const { groupId, title, description, year, month } = req.body;

    const data = await scheduleService.createSchedulePost({
      groupId,
      title,
      description,
      year,
      month,
      ownerUid,
    });

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('스케줄 생성 실패:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 자신의 그룹의 스케줄 게시글 확인인
exports.getSchedulesByGroup = async (req, res) => {
  try {
    const groupId = req.query.groupId;
    console.log('🔍 Controller received groupId:', groupId); 

    if (!groupId) {
      return res.status(400).json({ success: false, message: 'groupId가 필요합니다.' });
    }

    const schedules = await scheduleService.getSchedulesByGroup(groupId);
    res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    console.error('스케줄 목록 조회 실패:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
// 알바생이 안되는 날짜 선택택
exports.submitUnavailableDates = async (req, res) => {
  try {
    const userUid = req.user.uid;
    const { scheduleId } = req.params;
    const { dates } = req.body; // ✅ 예: ["2025-06-01", "2025-06-03"]

    if (!Array.isArray(dates)) {
      return res.status(400).json({ success: false, message: '날짜 리스트가 필요합니다.' });
    }

    const result = await scheduleService.saveUnavailableDates({
      scheduleId,
      userUid,
      dates,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('❌ 불가 날짜 제출 실패:', error.message);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};
// 알바생이 자신이 선택한 날짜 조회
exports.getUnavailableDatesByUser = async (req, res) => {
  try {
    const userUid = req.user.uid;
    const { scheduleId } = req.params;

    const dates = await scheduleService.getUnavailableDatesByUser({
      scheduleId,
      userUid,
    });

    res.status(200).json({ success: true, data: dates });
  } catch (error) {
    console.error('❌ 불가 날짜 조회 실패:', error.message);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};

// 사장님이 알바생 스케줄 신청 확인

exports.getUnavailableByScheduleId = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    if (!scheduleId) {
      return res.status(400).json({ success: false, message: 'scheduleId가 필요합니다.' });
    }

    const unavailableData = await scheduleService.getUnavailableByScheduleId(scheduleId);

    res.status(200).json({ success: true, data: unavailableData }); // ❗ 여기서 전체 데이터 반환
  } catch (error) {
    console.error('❌ 알바생 불가능 날짜 조회 실패:', error.message);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};