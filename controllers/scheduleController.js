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
