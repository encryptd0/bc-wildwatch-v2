const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/feedController');

router.get('/',              requireAuth, controller.feedPage);
router.get('/posts',         controller.getPosts);
router.post('/posts',        requireAuth, controller.createPost);
router.post('/posts/:id/reply', requireAuth, controller.addReply);

module.exports = router;
