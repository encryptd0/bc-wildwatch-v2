const Incident = require('../models/Incident');
const { connectDB } = require('../lib/db');

exports.adminPage = (req, res) => {
  res.render('admin', { title: 'Admin Dashboard - BC WildWatch' });
};

exports.getAllIncidents = async (req, res) => {
  try {
    await connectDB();

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.animalType) filter.animalType = req.query.animalType;
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.location) filter.location = req.query.location;

    const sortField = req.query.sort || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    const incidents = await Incident.find(filter).sort({ [sortField]: sortOrder });

    const [total, pending, inProgress, resolved] = await Promise.all([
      Incident.countDocuments(),
      Incident.countDocuments({ status: 'Pending' }),
      Incident.countDocuments({ status: 'In Progress' }),
      Incident.countDocuments({ status: 'Resolved' })
    ]);

    res.json({
      success: true,
      incidents,
      stats: { total, pending, inProgress, resolved }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { status } = req.body;

    const update = { status };
    if (status === 'Resolved') update.resolvedAt = new Date();

    const incident = await Incident.findByIdAndUpdate(id, update, { new: true });
    if (!incident) return res.status(404).json({ success: false, error: 'Incident not found' });

    res.json({ success: true, incident });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.updateNotes = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { adminNotes } = req.body;

    const incident = await Incident.findByIdAndUpdate(id, { adminNotes }, { new: true });
    if (!incident) return res.status(404).json({ success: false, error: 'Incident not found' });

    res.json({ success: true, incident });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    await connectDB();
    const incidents = await Incident.find().sort({ createdAt: -1 });

    const headers = ['ID', 'Animal Type', 'Location', 'Severity', 'Status', 'Reporter Name', 'Reporter Email', 'Description', 'Admin Notes', 'Created At', 'Resolved At'];
    const rows = incidents.map(i => [
      i._id.toString(),
      i.animalType,
      i.location,
      i.severity,
      i.status,
      i.reporterName,
      i.reporterEmail,
      `"${(i.description || '').replace(/"/g, '""')}"`,
      `"${(i.adminNotes || '').replace(/"/g, '""')}"`,
      i.createdAt ? i.createdAt.toISOString() : '',
      i.resolvedAt ? i.resolvedAt.toISOString() : ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=wildwatch-incidents.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.bulkResolve = async (req, res) => {
  try {
    await connectDB();
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ success: false, error: 'IDs array required' });

    await Incident.updateMany(
      { _id: { $in: ids } },
      { status: 'Resolved', resolvedAt: new Date() }
    );

    res.json({ success: true, message: `${ids.length} incidents resolved` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
