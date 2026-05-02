const express = require('express');
const { handleScheduleRequest } = require('../controllers/schedulerController');

const router = express.Router();

router.post('/schedule', handleScheduleRequest);

module.exports = router;
