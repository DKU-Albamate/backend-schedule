const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authenticate = require('../middlewares/auth');

router.post('/create', authenticate, scheduleController.createSchedulePost);
// 🔹 특정 그룹의 스케줄 목록 조회
router.get('/', authenticate, scheduleController.getSchedulesByGroup);

router.put('/:scheduleId/unavailable', authenticate, scheduleController.submitUnavailableDates);

router.get('/:scheduleId/unavailable', authenticate, scheduleController.getUnavailableDatesByUser);
router.get('/:scheduleId/unavailable', authenticate, (req, res, next) => {
  console.log('➡️ 요청 scheduleId:', req.params.scheduleId); // ✅ 요청 정확성 확인
  next();
}, scheduleController.getUnavailableByScheduleId);
module.exports = router;
