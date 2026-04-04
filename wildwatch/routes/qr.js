const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');

router.get('/', (req, res) => {
  res.render('qr', { title: 'QR Code - BC WildWatch', appUrl: process.env.APP_URL || 'http://localhost:3000' });
});

router.get('/image', async (req, res) => {
  try {
    const url = process.env.APP_URL || 'http://localhost:3000';
    const qrBuffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 400,
      margin: 2,
      color: { dark: '#1F3864', light: '#FFFFFF' }
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename=wildwatch-qr.png');
    res.send(qrBuffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

module.exports = router;
