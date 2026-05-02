const express = require('express');
const { handleSendNotification } = require('../controllers/notificationController');

const router = express.Router();

router.post('/send', handleSendNotification);

module.exports = router;
