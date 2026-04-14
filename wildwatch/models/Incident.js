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
        const domain = (process.env.CAMPUS_DOMAIN || 'belgiumcampus.ac.za').trim();
        return v.endsWith('@student.' + domain);
      },
      message: 'Email must be a student campus address'
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
    enum: [
      // Classrooms
      'Classroom Alpha','Classroom Beta','Classroom Delta','Classroom Theta',
      'Classroom Eta','Classroom Tau','Classroom Gamma','Classroom Sigma',
      'Classroom Omega','Classroom Upsilon','Classroom Pi','Classroom Rho',
      'Classroom Lambda','Classroom Omikron',
      // Residences (Upper)
      'Residence Antwerp','Residence Hasselt','Residence Brussels',
      'Residence Leuven','Residence Genk',
      // Residences (Lower)
      'Residence Diepenbeek','Residence Mechelen','Residence Namur',
      'Residence Kortrijk','Residence Tienen','Residence Oostende',
      // Main Facilities
      'Library','Administration Office','Boardroom','Marketing',
      'Virtual Room','Lecturers','Printing','Server Room / Kappa','Gunsel Offices',
      // Dining & Social
      'Tuck Shop','Cafeteria','Botlhale Village',
      // Parking
      'Directors Parking','Staff Parking','Visitor Parking','Student Parking',
      // Recreational
      'Basketball Court','Chess Area','Sports Fields',
      // Other
      'Aeronautical Centre','Main Gate','Other'
    ]
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
