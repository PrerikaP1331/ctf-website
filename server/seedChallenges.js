require('dotenv').config();
const mongoose = require('mongoose');
const Challenge = require('./models/Challenge.js');

const challengesToCreate = [
  {
    challengeId: 1,
    name:'Initiation Rite',
    description: 'Erno has linked up with Nisbot\'s command center. Before we can proceed, we need to bring you, our third teammate, online. Run the initiation program to establish the link.',
    category: 'General',
    difficulty: 'Welcome',
    points: 0,
    flag: 'flag{w3lc0me_t0_th3_r3scu3_m1ss10n}',
    downloadFile:'initiate',
    hint:'Don\'t worry!We\'ll walk you through this challenge!',
    position: { top: '35%', left: '60%' }
  },
  {
    challengeId: 2,
    name: 'Ghost in the Drive',
    description: 'BB82 wiped the ship\'s logs to cover its tracks! The data might still be lingering on this damaged drive image. Find the deleted log file to uncover BB82\'s next move.',
    category: 'Forensics',
    difficulty: 'Easy',
    points: 50,
    flag: 'flag{d3l3t3d_d4t4_n3v3r_d13s}',
    downloadFile:'usb_drive.dd.vhd',
    hint:'You may forget the past but not erase it',
    position: { top: '48%', left: '65%' } 
  },
  {
    challengeId: 3,
    name: 'Unfiltered Ping',
    description: 'The logs point to this basic Network Diagnostic Tool. It\'s our only way into BB82\'s command server. It looks simple... maybe too simple.',
    category: 'Web Exploitation',
    difficulty: 'Medium',
    points: 100,
    flag: 'flag{n3v3r_tru5t_u53r_1nput}',
    downloadFile:'',
    hint:'This server eavesdrops both ways! Inject commands and it may reveal what you\'re seeking.',
    position: { top: '42%', left: '38%' }
  },
  {
    challengeId: 4,
    name: 'The Cookie Jar',
    description: 'While exploring the server, you found a secondary login portal. Access is controlled by a session cookie. BB82 seems to think nobody would check what\'s inside the cookie jar.',
    category: 'Web Exploitation',
    difficulty: 'Medium',
    points: 100,
    flag: 'flag{cl13nt_s1de_c0ntr0ls_4re_n0t_s3cure}',
    downloadFile:'',
    hint:'Some cookie eating sessions are reserved for the creator alone. But you could always change and pretend to be one yourself to snag a fortune. Huh, is this what they mean when they say fortune cookies?',
    position: { top: '38%', left: '26%' }
  },

  
  {
    challengeId: 5,
    name: 'The Arecibo Anomaly',
    description: 'The secure data archive Erno unlocked contains two files: a strange visual data transmission from the island\'s creators (arecibo.png) and an encrypted log file (log.txt). The file notes simply say, \'The transmission holds the key to the log.\'',
    category: 'Steganography, Cryptography',
    difficulty: 'Easy',
    points: 50,
    flag: 'flag{v1g3n3r3_c1ph3r_1s_cl4ss1c}',
    downloadFile:'arecibo_anomaly.zip',
    hint: 'Images have hidden descriptions. Tug at one string and it comes undone. It\'s the start that brings it to a close.',
    position: { top: '53%', left: '24%' }
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
    hint:'Follow the chef\'s instructions carefully.',
    position: { top: '80%', left: '46%' }
  },
  {
    challengeId: 8,
    name: 'Not everything is what it looks like',
    description: 'An asset viewer hides the Master Schematic behind a file-reading endpoint. Inspect the page source and discover how it chooses which file to serve. Can you reach a backup outside its public folder?',
    category: 'Forensics, Web exploitation',
    difficulty: 'Hard',
    points: 150,
      flag: 'flag{d1r3ctory_tr4v3rs4l_ftw}',
    downloadFile:'',
    hint:'Try a relative path that moves up from the public folder with ../ and points into the backups directory.',
    position: { top: '85%', left: '34%' }
  },
  {
    challengeId: 9,
    name: 'Echoes in the Void',
    description: 'We\'ve arrived at the Repair Bay and downloaded the schematic, but the file is... empty. It has a file size, but no visible content. How can a message be carried by nothing?',
    category: 'Miscellaneous',
    difficulty: 'Easy',
    points: 50,
      flag: 'flag{wh1t3sp4c3_c0d3_1s_st1ll_c0d3}',
    downloadFile:'echoes_in_the_void.ws',
    hint: 'Even that which is written in whitespaces can speak volumes.',
    position: { top: '70%', left: '18%' }
  },
  {
    challengeId: 10,
    name: 'Those who remember everything are called Fools.',
    description: 'The repair algorithm requires a legacy API key. It\'s not on the server now, but this system was built using Git, and BB82 forgot to secure the repository. A developer might have made a mistake in the past..',
    category: 'Miscellaneous',
    difficulty: 'Hard',
    points: 150,
    flag: 'flag{g1t_h1st0ry_1s_f0r3v3r}',
    downloadFile:'leaky_repo.zip',
    hint:'A wise fool checks out his mistakes committed previously and learns from them.',
    position: { top: '73%', left: '30%' }
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