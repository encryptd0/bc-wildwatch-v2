const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/chatbotController');

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many messages. Please wait a few minutes.' }
});

router.get('/', controller.chatbotPage);
router.post('/message', chatLimiter, controller.sendMessage);

module.exports = router;
