require('dotenv').config();
const mongoose = require('mongoose');
const Challenge = require('./models/Challenge.js');

const challengesToCreate = [
  {
    challengeId: 1,
    name:'Initiation Rite',
    description: 'M2 has linked up with Nisbot\'s command center. Before we can proceed, we need to bring you, our third teammate, online. Run the initiation program to establish the link. In the webshell, run: curl http://host.docker.internal:5000/files/initiate -o initiate',
    category: 'General',
    difficulty: 'Welcome',
    points: 0,
    flag: 'flag{w3lc0me_t0_th3_r3scu3_m1ss10n}',
    downloadFile:'initiate',
    position: { top: '25%', left: '65%' } // Top right
  },
  {
    challengeId: 2,
    name: 'Ghost in the Drive',
    description: 'M1 wiped the ship\'s logs to cover its tracks! The data might still be lingering on this damaged drive image. Find the deleted log file to uncover M1\'s next move. In the webshell, use: curl http://host.docker.internal:5000/files/usb_drive.dd.vhd -o usb_drive.dd.vhd',
    category: 'Forensics',
    difficulty: 'Easy',
    points: 25,
    flag: 'flag{d3l3t3d_d4t4_n3v3r_d13s}',
    downloadFile:'usb_drive.dd.vhd',
    position: { top: '45%', left: '70%' } // Middle right
  },
  {
    challengeId: 3,
    name: 'The Captain\'s Log',
    description: 'The ship\'s captain left behind a password-protected log file. Can you get in?',
    category: 'Forensics',
    difficulty: 'Medium',
    points: 100,
    flag: 'flag{brut3_f0rc3_th3_w1n}',
    downloadFile:'',
    position: { top: '65%', left: '80%' } // Bottom right
  },
  {
    challengeId: 4,
    name: 'Message in a Bottle',
    description: 'The secure data archive M2 unlocked contains two files: a strange visual data transmission from the island\'s creators (arecibo.png) and an encrypted log file (log.txt). The file notes simply say, \'The transmission holds the key to the log.\'',
    category: 'Steganography',
    difficulty: 'Easy',
    points: 50,
    flag: 'flag{h1dd3n_1n_pl41n_s1ght}',
    downloadFile:'',
    position: { top: '80%', left: '72%' } // Far bottom right
  },

  // ----- Left Island (Caissa Superiore) -----
  {
    challengeId: 5,
    name: 'The Arecibo Anomaly',
    description: 'The secure data archive M2 unlocked contains two files: a strange visual data transmission from the island\'s creators (arecibo.png) and an encrypted log file (log.txt). The file notes simply say, \'The transmission holds the key to the log.\'',
    category: 'Steganography',
    difficulty: 'Easy',
    points: 50,
    flag: 'flag{v1g3n3r3_c1ph3r_1s_cl4ss1c}',
    downloadFile:'arecibo_anomaly.zip',
    position: { top: '15%', left: '30%' } // Top left
  },
  {
    challengeId: 6,
    name: 'A Strange Contraption',
    description: 'We found a bizarre executable file. Can you reverse engineer it to find the secret key?',
    category: 'Reverse Engineering',
    difficulty: 'Hard',
    points: 150,
    flag: 'flag{r3v3rs1ng_1s_fun_r1ght?}',
    downloadFile:'',
    position: { top: '35%', left: '45%' } // Top-middle left
  },
  {
    challengeId: 7,
    name: 'Ghost in the Shell',
    description: 'Connect to our service and prove you are a true hacker.',
    category: 'Pwn',
    difficulty: 'Hard',
    points: 150,
    flag: 'flag{buff3r_0v3rfl0w_pwnz}',
    downloadFile:'',
    position: { top: '20%', left: '15%' } // Far top left
  },
  {
    challengeId: 8,
    name: 'The Oracle\'s Chant',
    description: 'We intercepted a strange audio file. Is it just noise, or is there a hidden message within the frequencies?',
    category: 'Steganography',
    difficulty: 'Medium',
    points: 100,
    flag: 'flag{sp3ctr0gr4m_s3cr3ts}',
    downloadFile:'',
    position: { top: '60%', left: '20%' } // Middle-left
  },
  {
    challengeId: 9,
    name: 'The Busy Beaver',
    description: 'This script is doing something odd. Can you analyze its behavior and find the flag?',
    category: 'Scripting',
    difficulty: 'Easy',
    points: 50,
    flag: 'flag{scr1pt_k1dd13_n0_m0r3}',
    downloadFile:'',
    position: { top: '80%', left: '35%' } // Bottom left
  },
  {
    challengeId: 10,
    name: 'The Locksmith\'s Puzzle',
    description: 'A series of cryptographic locks protect the treasure. Each one is harder than the last.',
    category: 'Cryptography',
    difficulty: 'Medium',
    points: 100,
    flag: 'flag{c43s4r_w4s_h3r3_2}',
    downloadFile:'',
    position: { top: '55%', left: '40%' } // Bottom-middle left
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected for challenge seeding.");

    await Challenge.deleteMany({});
    console.log("Existing challenges cleared.");

    await Challenge.insertMany(challengesToCreate);
    console.log(`${challengesToCreate.length} challenges have been successfully created!`);

  } catch (error) {
    console.error("Error during challenge seeding:", error);
  } finally {
    mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
};

seedDatabase();