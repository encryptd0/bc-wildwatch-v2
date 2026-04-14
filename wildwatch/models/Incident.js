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
      // ── MAIN CAMPUS — Classrooms ──
      'Classroom Alpha','Classroom Beta','Classroom Delta','Classroom Theta',
      'Classroom Zeta','Classroom Gamma','Classroom Omega','Classroom Ypsilon',
      'Classroom Sigma','Classroom Pi','Classroom Roh','Classroom Lambda','Classroom Omnikron',
      // ── MAIN CAMPUS — Residences ──
      'Residence Antwerp','Residence Hasselt','Residence Brussels',
      'Residence Leuven','Residence Genk','Residence Eeklo',
      // ── MAIN CAMPUS — Buildings ──
      'Library','Virtual Room','Lecturers','Cottage','Reception',
      'Boardroom','Sales','Finance','Administrations',
      'CLC Office','Staff Room','Counsel Offices','Tuck Shop',
      // ── MAIN CAMPUS — Outdoor ──
      'Chess Area','Basketball Court','Staff Parking','Visitors Parking','Main Gate',
      // ── NORTH CAMPUS — Classrooms ──
      'Classroom Kappa 1','Classroom Kappa 2','Classroom Chi',
      'Classroom Phi','Classroom Iota','Classroom Psi',
      // ── NORTH CAMPUS — Residences ──
      'Residence Dinant','Residence Mechelen','Residence Namur',
      'Residence Tienen','Residence Turnhout','Residence Lier',
      'Residence Liege','Residence Diepenbeek','Residence Oostende',
      // ── NORTH CAMPUS — Buildings ──
      'IT Department','Procurement','Smart Cities','Learning Factory',
      'Cafeteria','Laundry',
      // ── NORTH CAMPUS — Outdoor ──
      'Student Parking','Sports Fields',
      // ── WEST CAMPUS — Residences ──
      'Residence West House 1','Residence West House 2','Residence Menen',
      'Residence Brugge','Residence Brugge Flat','Staff Residences',
      // ── WEST CAMPUS — Buildings ──
      'Gym & Study Room','Security','Storeroom',
      // ── WEST CAMPUS — Outdoor ──
      'Garden','Pool',
      // ── OTHER ──
      'Other'
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
