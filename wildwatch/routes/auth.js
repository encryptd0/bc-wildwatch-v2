const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/authController');

router.get('/',                controller.loginPage);
router.post('/begin',          controller.beginLogin);
router.post('/verify',         controller.verifyLogin);
router.post('/logout',         controller.logout);
router.get('/student',         controller.studentLoginPage);
router.post('/student',        controller.studentLogin);

module.exports = router;
