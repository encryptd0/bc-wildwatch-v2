const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/authController');

router.get('/',         controller.loginPage);
router.post('/begin',   controller.beginLogin);
router.post('/verify',  controller.verifyLogin);
router.post('/logout',  controller.logout);

module.exports = router;
