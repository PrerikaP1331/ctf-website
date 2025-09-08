require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Team = require('./models/Team.js');

const teamsToCreate = [
  { username: 'team_alpha', password: 'password1' },
  { username: 'team_beta', password: 'password2' },
  { username: 'team_gamma', password: 'password3' },
 
];


const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected for seeding.");

    await Team.deleteMany({});
    console.log("Existing teams cleared.");

    const createdTeams = await Promise.all(
      teamsToCreate.map(async (teamData) => {
        const salt = await bcrypt.genSalt(10); 
        const hashedPassword = await bcrypt.hash(teamData.password, salt);
        return {
          username: teamData.username,
          password: hashedPassword 
        };
      })
    );

    await Team.insertMany(createdTeams);
    console.log(`${createdTeams.length} teams have been successfully created!`);

  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
};

seedDatabase();