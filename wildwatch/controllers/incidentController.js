const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const cloudinary = require('cloudinary').v2;

// Configure cloudinary if env vars present
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'optional') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

exports.homePage = async (req, res) => {
  if (!isDbConnected()) {
    return res.render('index', {
      title: 'BC WildWatch - Campus Animal Safety',
      feed: [],
      stats: { todayCount: 0, resolvedWeek: 0, topAnimal: 'N/A' },
      dbOffline: true
    });
  }

  try {
    const feed = await Incident.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('animalType location createdAt severity');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [todayCount, resolvedWeek, topAnimalResult] = await Promise.all([
      Incident.countDocuments({ createdAt: { $gte: today } }),
      Incident.countDocuments({ status: 'Resolved', resolvedAt: { $gte: weekAgo } }),
      Incident.aggregate([
        { $group: { _id: '$animalType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ])
    ]);

    const topAnimal = topAnimalResult.length > 0 ? topAnimalResult[0]._id : 'N/A';

    res.render('index', {
      title: 'BC WildWatch - Campus Animal Safety',
      feed,
      stats: { todayCount, resolvedWeek, topAnimal },
      dbOffline: false
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500', { title: 'Error', error: err.message });
  }
};

exports.reportPage = (req, res) => {
  res.render('report', { title: 'Report a Sighting - BC WildWatch' });
};

exports.submitIncident = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ success: false, error: 'Database not connected. Please set MONGODB_URI in .env and restart.' });
  }

  try {
    const { reporterName, reporterEmail, animalType, otherAnimalDescription, location, description, severity } = req.body;
    let photoUrl = '';

    if (req.file && req.file.path) {
      photoUrl = req.file.path;
    }

    const incident = new Incident({
      reporterName,
      reporterEmail,
      animalType,
      otherAnimalDescription: animalType === 'Other' ? otherAnimalDescription : undefined,
      location,
      description,
      severity,
      photoUrl
    });

    await incident.save();

    res.json({ success: true, incidentId: incident._id.toString().slice(-8).toUpperCase() });
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
};

exports.myReportsPage = (req, res) => {
  res.render('my-reports', { title: 'My Reports - BC WildWatch' });
};

exports.getMyReports = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ success: false, error: 'Database not connected.' });
  }

  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

    const incidents = await Incident.find({ reporterEmail: email.toLowerCase() })
      .sort({ createdAt: -1 });

    res.json({ success: true, incidents });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getFeed = async (req, res) => {
  if (!isDbConnected()) {
    return res.json({ success: true, feed: [] });
  }

  try {
    const feed = await Incident.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('animalType location createdAt severity status');
    res.json({ success: true, feed });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getStats = async (req, res) => {
  if (!isDbConnected()) {
    return res.json({ success: true, today: 0, resolvedThisWeek: 0, topAnimal: 'N/A' });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [todayCount, resolvedWeek, topAnimalResult] = await Promise.all([
      Incident.countDocuments({ createdAt: { $gte: today } }),
      Incident.countDocuments({ status: 'Resolved', resolvedAt: { $gte: weekAgo } }),
      Incident.aggregate([
        { $group: { _id: '$animalType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ])
    ]);

    res.json({
      success: true,
      today: todayCount,
      resolvedThisWeek: resolvedWeek,
      topAnimal: topAnimalResult.length > 0 ? topAnimalResult[0]._id : 'N/A'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
