const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authenticate = require('../middlewares/auth');

router.post('/create', authenticate, scheduleController.createSchedulePost);

module.exports = router;
