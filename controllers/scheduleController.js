const scheduleService = require('../services/scheduleService');

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


exports.getSchedulesByGroup = async (req, res) => {
  try {
    const groupId = req.query.groupId;

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