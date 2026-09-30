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
const PORT = process.env.PORT || 80;

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
  fs.stat(vulnerablePath, (statError, stats) => {
    if (statError) {
      console.error(statError);
      return res.status(404).send('File not found');
    }

    if (stats.isDirectory()) {
      return fs.readdir(vulnerablePath, (readError, entries) => {
        if (readError) {
          console.error(readError);
          return res.status(500).send('Unable to list directory');
        }

        const basePath = path.join(__dirname, 'public');
        const relativePath = path.relative(basePath, vulnerablePath);
        const links = entries.map((entry) => {
          const entryPath = path.join(relativePath, entry).split(path.sep).join('/');
          return `<li><a href="/file?name=${encodeURIComponent(entryPath)}">${entry}</a></li>`;
        }).join('');

        return res.type('html').send(`<h1>Index of /${relativePath}</h1><ul>${links}</ul>`);
      });
    }

    fs.readFile(vulnerablePath, 'utf8', (readError, data) => {
      if (readError) {
        console.error(readError);
        return res.status(404).send('File not found');
      }

      res.type('html').send(data);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Vulnerable server on port ${PORT}`);
});