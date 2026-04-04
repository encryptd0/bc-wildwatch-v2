const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  reporterName: {
    type: String,
    required: [true, 'Reporter name is required'],
    trim: true
  },
  reporterEmail: {
    type: String,
    required: [true, 'Reporter email is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return v.endsWith('@belgiumcampus.ac.za');
      },
      message: 'Email must be a Belgium Campus address (@belgiumcampus.ac.za)'
    }
  },
  animalType: {
    type: String,
    required: true,
    enum: ['Snake', 'Bees/Wasps', 'Ants', 'Lizard', 'Cockroaches', 'Stray Dog', 'Stray Cat', 'Spider', 'Rat/Mouse', 'Other']
  },
  otherAnimalDescription: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: true,
    enum: ['Main Building', 'Library', 'Cafeteria', 'Parking Lot', 'Sports Fields', 'Residence', 'IT Labs', 'Admin Block', 'Garden Area', 'Other']
  },
  description: {
    type: String,
    required: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  severity: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Critical']
  },
  photoUrl: {
    type: String
  },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Reviewed', 'In Progress', 'Resolved']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  },
  adminNotes: {
    type: String
  }
});

// ── Indexes ──────────────────────────────────────────────────
// Feed & admin default sort
incidentSchema.index({ createdAt: -1 });
// My-reports lookup (email + newest first)
incidentSchema.index({ reporterEmail: 1, createdAt: -1 });
// Admin filters
incidentSchema.index({ status: 1, createdAt: -1 });
incidentSchema.index({ animalType: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ location: 1 });
// "Resolved this week" stat query
incidentSchema.index({ status: 1, resolvedAt: 1 });

module.exports = mongoose.model('Incident', incidentSchema);
