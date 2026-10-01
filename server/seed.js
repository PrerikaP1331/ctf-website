require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Team = require('./models/Team.js');

const teamsToCreate = [
  ...Array.from({ length: 30 }, (_, index) => ({
    username: `team${index + 1}`,
    password: `pass${index + 1}`
  })),
  ...Array.from({ length: 5 }, (_, index) => ({
    username: `test${index + 1}`,
    password: `test${index + 1}`
  }))
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected for seeding.");

    let created = 0;
    let updated = 0;
    for (coamData of teamsToCreate) {
      const hashedPassword = await bcrypt.hash(teamData.password, 10);
      const team = await Team.findOne({ username: teamData.username });
      if (team) {
        team.password = hashedPassword;
        await team.save();
        updated += 1;
      } else {
        await Team.create({ username: teamData.username, password: hashedPassword });
        created += 1;
      }
    }

    console.log(`Provisioned ${created + updated} accounts (${created} created, ${updated} passwords refreshed); existing unrelated teams were preserved.`);

  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
};

seedDatabase();