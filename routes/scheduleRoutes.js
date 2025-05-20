const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authenticate = require('../middlewares/auth');

router.post('/create', authenticate, scheduleController.createSchedulePost);
// 🔹 특정 그룹의 스케줄 목록 조회
router.get('/', authenticate, scheduleController.getSchedulesByGroup);

router.put('/:scheduleId/unavailable', authenticate, scheduleController.submitUnavailableDates);

router.get('/:scheduleId/unavailable', authenticate, scheduleController.getUnavailableDatesByUser);

router.get('/:scheduleId/unavailable', authenticate, scheduleController.getUnavailableByScheduleId);

module.exports = router;
