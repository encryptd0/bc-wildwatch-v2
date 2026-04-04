const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('../controllers/incidentController');

// Multer config — use memory storage if cloudinary not configured
let upload;
try {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'optional') {
    const cloudinary = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    const storage = new CloudinaryStorage({
      cloudinary,
      params: { folder: 'wildwatch', allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
    });
    upload = multer({ storage });
  } else {
    upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
  }
} catch (e) {
  upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
}

router.get('/home', controller.homePage);
router.get('/report', controller.reportPage);
router.get('/my-reports', controller.myReportsPage);

router.post('/incidents/submit', upload.single('photo'), controller.submitIncident);
router.get('/incidents/my-reports', controller.getMyReports);
router.get('/incidents/feed', controller.getFeed);
router.get('/incidents/stats', controller.getStats);

module.exports = router;
