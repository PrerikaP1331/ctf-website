// const express = require('express');
// const path = require('path');
// const fs = require('fs');
// const app = express();
// const PORT = 80;

// // This correctly serves index.html and the GIF from the public root.
// app.use(express.static(path.join(__dirname, 'public')));

// // --- THE VULNERABLE ROUTE ---
// app.get('/file', (req, res) => {
//   const userPath = req.query.name;

//   if (!userPath) {
//     return res.status(400).send('File parameter "name" is missing.');
//   }

//   // THE FIX:
//   // We start from the 'public' directory as our known-good base.
//   const basePath = path.join(__dirname, 'public');
  
//   // We then use path.resolve to apply the user's traversal.
//   // path.resolve('/usr/src/app/public', '../backups/config.bak.txt')
//   // WILL CORRECTLY RESOLVE TO: '/usr/src/app/backups/config.bak.txt'
//   const vulnerablePath = path.resolve(basePath, userPath);
  
//   console.log(`Attempting to serve vulnerable path: ${vulnerablePath}`);

//   fs.readFile(vulnerablePath, (err, data) => {
//     if (err) {
//       console.error(err);
//       return res.status(404).send('File not found');
//     }
//     res.setHeader('Content-Type', 'text/html');
//     res.setHeader('Content-Disposition', 'inline');
//     res.send(data);
//   });
// });

// app.listen(PORT, () => {
//   console.log(`Vulnerable server on port ${PORT}`);
// });
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 80;

// This correctly serves index.html and the GIF from the public root.
app.use(express.static(path.join(__dirname, 'public')));

// --- THE VULNERABLE ROUTE ---
app.get('/file', (req, res) => {
  const userPath = req.query.name;

  if (!userPath) {
    return res.status(400).send('File parameter "name" is missing.');
  }

  const vulnerablePath = path.resolve(path.join(__dirname, 'public'), userPath);

  console.log(`Attempting to read file from: ${vulnerablePath}`);

  // THE FIX:
  // We read the file and explicitly tell Node.js to encode it as a 'utf8' string.
  fs.readFile(vulnerablePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(404).send('File not found');
    }
    
    // When Express receives a string that starts with '<html>',
    // it automatically sets the Content-Type to text/html and tells the browser
    // to render it. This is the most reliable method.
    res.send(data);
  });
});

app.listen(PORT, () => {
  console.log(`Vulnerable server on port ${PORT}`);
});