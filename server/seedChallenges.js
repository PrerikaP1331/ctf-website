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
    name: 'Unfiltered Ping',
    description: 'The logs point to this basic Network Diagnostic Tool. It\'s our only way into M1\'s command server. It looks simple... maybe too simple.',
    category: 'Web Security',
    difficulty: 'Medium',
    points: 100,
    flag: 'flag{n3v3r_tru5t_u53r_1nput}',
    downloadFile:'',
    position: { top: '65%', left: '80%' } // Bottom right
  },
  {
    challengeId: 4,
    name: 'The Cookie Jar',
    description: 'While exploring the server, you found a secondary login portal. Access is controlled by a session cookie. M1 seems to think nobody would check what\'s inside the cookie jar.',
    category: 'Web Security',
    difficulty: 'Medium',
    points: 100,
    flag: 'flag{h1dd3n_1n_pl41n_s1ght}',
    downloadFile:'',
    position: { top: '80%', left: '72%' } // Far bottom right
  },

  // ----- Left Island (Caissa Superiore) -----
  {
    challengeId: 5,
    name: 'The Arecibo Anomaly',
    description: 'The secure data archive M2 unlocked contains two files: a strange visual data transmission from the island\'s creators (arecibo.png) and an encrypted log file (log.txt). The file notes simply say, \'The transmission holds the key to the log.\' We need to decrypt the log to find our next location."',
    category: 'Steganography',
    difficulty: 'Easy',
    points: 50,
    flag: 'flag{v1g3n3r3_c1ph3r_1s_cl4ss1c}',
    downloadFile:'arecibo_anomaly.zip',
    position: { top: '15%', left: '30%' } // Top left
  },
  {
    challengeId: 6,
    name: 'The Tyrant\'s Portrait',
    description: 'Inside the Museum Room, you find this imposing portrait of M1 as a ruler. It feels... off. We suspect M1 hid something inside the image itself to mock us."',
    category: 'Steganography',
    difficulty: 'Easy',
    points: 50,
    flag: 'flag{m1x1ng_my_st3g0_t3chn1qu3s}',
    downloadFile:'',
    position: { top: '35%', left: '45%' } // Top-middle left
  },
  {
    challengeId: 7,
    name: 'The Sous-Chef\'s Secret',
    description: 'A cryptic message, believed to be the final note of a brilliant chef, was found within a peculiar data file. It is a layered masterpiece, but the instructions to unravel its secrets are nowhere to be found. Only by uncovering the correct method can you reveal the chef\'s final message',
    category: 'Cryptography',
    difficulty: 'Medium',
    points: 100,
    flag: 'flag{l4y3rs_up0n_l4y3rs_0f_s3cur1ty}',
    downloadFile:'sup3r_s3cr3t_r3c1p3.zip',
    position: { top: '20%', left: '15%' } // Far top left
  },
  {
    challengeId: 8,
    name: 'Not everything is what it looks like',
    description: 'The final museum artifact is this \'Master Schematic\' image. It\'s supposed to contain the location of the Repair Bay, but it\'s locked down tight. ',
    category: 'Mixed',
    difficulty: 'Hard',
    points: 150,
    flag: 'lag{d1r3ct0ry_tr4v3rs4l_f0r_th3_w1n}',
    downloadFile:'',
    position: { top: '60%', left: '20%' } // Middle-left
  },
  {
    challengeId: 9,
    name: 'Echoes in the Void',
    description: 'We\'ve arrived at the Repair Bay and downloaded the schematic, but the file is... empty. It has a file size, but no visible content. How can a message be carried by nothing?',
    category: 'Scripting',
    difficulty: 'Easy',
    points: 50,
    flag: 'flag{1nv1s1bl3_c0de_1s_st1ll_c0de}',
    downloadFile:'echoes_in_the_void.ws',
    position: { top: '80%', left: '35%' } // Bottom left
  },
  {
    challengeId: 10,
    name: 'A Ghost in the Commits',
    description: 'The repair algorithm requires a legacy API key. It\'s not on the server now, but this system was built using Git, and M1 forgot to secure the repository. A developer might have made a mistake in the past..',
    category: 'Miscellaneous',
    difficulty: 'Hard',
    points: 150,
    flag: 'flag{g1t_h1st0ry_1s_f0r3v3r}',
    downloadFile:'leaky_repo.zip',
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