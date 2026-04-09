const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, controller.adminPage);
router.get('/incidents', requireAdmin, controller.getAllIncidents);
router.patch('/incidents/:id/status', requireAdmin, controller.updateStatus);
router.patch('/incidents/:id/notes', requireAdmin, controller.updateNotes);
router.post('/incidents/bulk-resolve', requireAdmin, controller.bulkResolve);
router.get('/export/csv', requireAdmin, controller.exportCSV);

module.exports = router;
