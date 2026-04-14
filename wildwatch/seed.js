require('dotenv').config();
const mongoose = require('mongoose');
const Incident = require('./models/Incident');

const animals = ['Snake', 'Bees/Wasps', 'Ants', 'Lizard', 'Cockroaches', 'Stray Dog', 'Stray Cat', 'Spider', 'Rat/Mouse', 'Other'];
const locations = [
  'Classroom Alpha','Classroom Beta','Classroom Delta','Classroom Theta','Classroom Eta','Classroom Tau',
  'Classroom Gamma','Classroom Sigma','Classroom Omega','Classroom Upsilon','Classroom Pi','Classroom Rho',
  'Classroom Lambda','Classroom Omikron',
  'Residence Antwerp','Residence Hasselt','Residence Brussels','Residence Leuven','Residence Genk',
  'Residence Diepenbeek','Residence Mechelen','Residence Namur','Residence Kortrijk','Residence Tienen','Residence Oostende',
  'Library','Administration Office','Boardroom','Marketing','Virtual Room','Lecturers','Printing','Server Room / Kappa','Gunsel Offices',
  'Tuck Shop','Cafeteria','Botlhale Village',
  'Directors Parking','Staff Parking','Visitor Parking','Student Parking',
  'Basketball Court','Chess Area','Sports Fields',
  'Aeronautical Centre','Main Gate'
];
const severities = ['Low', 'Medium', 'High', 'Critical'];
const statuses = ['Pending', 'Reviewed', 'In Progress', 'Resolved'];
const names = ['Thabo Mokoena', 'Priya Naidoo', 'James van der Berg', 'Nomsa Dlamini', 'Kyle Pretorius', 'Zanele Khumalo', 'Marco da Silva', 'Lerato Sithole', 'Ruan Botha', 'Ayesha Patel'];

const descriptions = [
  'Spotted a large brown snake near the entrance. It appeared to be a puff adder. Students are avoiding the area.',
  'Beehive discovered behind the library. About 20cm diameter hive with active bees. Several students nearly disturbed it.',
  'Large ant colony found in the cafeteria kitchen area. Appears to have infiltrated the food storage.',
  'Lizard spotted in the main lecture hall. It ran under the seats when lights were turned on.',
  'Multiple cockroaches found in the second floor bathroom. Possible infestation behind the walls.',
  'Aggressive stray dog near the parking lot entrance. Has been growling at students entering the campus.',
  'Small stray cat found in the library. Seems friendly but is wandering around the bookshelves.',
  'Large spider web with resident spider found in IT Lab 3. Students uncomfortable working near it.',
  'Rat droppings found in the residence kitchen. Evidence of at least one rat accessing the food storage area.',
  'Unknown reptile spotted in the garden. Blue-tongued, approximately 40cm long, unsure of species.',
  'Three snakes spotted near the sports fields changing rooms this morning. Possible breeding season.',
  'Wasp nest found under the admin block roof overhang. Wasps becoming aggressive when students walk underneath.',
  'Fire ants discovered on the sports field near goal posts. Several students have been bitten.',
  'Large monitor lizard spotted drinking from the drainage near the parking lot.',
  'Cockroach infestation in the cafeteria storage room. Health and safety concern for food preparation.',
  'Stray dog pack of 4 spotted roaming the residence area at night. Some appear mangy.',
  'Cat giving birth under the garden area benches. Kittens found this morning.',
  'Redback spider found in IT Labs equipment room. Highly venomous species identified.',
  'Mouse nest found in the library bookshelves. Chewed books and droppings visible.',
  'Large unidentified bird of prey nesting on the main building roof. Divebombing students who get too close.'
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wildwatch');
    console.log('Connected to MongoDB');

    await Incident.deleteMany({});
    console.log('Cleared existing incidents');

    const incidents = Array.from({ length: 20 }, (_, i) => {
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const name = names[i % names.length];
      const emailBase = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');

      return {
        reporterName: name,
        reporterEmail: `${emailBase}@belgiumcampus.ac.za`,
        animalType: animals[i % animals.length],
        location: locations[i % locations.length],
        description: descriptions[i % descriptions.length],
        severity: severities[Math.floor(Math.random() * severities.length)],
        status,
        createdAt,
        resolvedAt: status === 'Resolved' ? new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000) : undefined,
        adminNotes: status !== 'Pending' ? 'Campus security has been dispatched to investigate the reported sighting.' : ''
      };
    });

    await Incident.insertMany(incidents);
    console.log('✅ Seeded 20 incidents successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
