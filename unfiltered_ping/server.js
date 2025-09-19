const express = require('express');
const { exec } = require('child_process');// Import the 'exec' function
const path = require('path'); 
const app = express();
const PORT = 80;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/ping', (req, res) => {
  const ip = req.query.ip;

  if (!ip) {
    return res.status(400).send('Error: "ip" parameter is missing.');
  }

  // --- THE VULNERABILITY IS HERE ---
  // The user-provided 'ip' variable is directly concatenated into the command string.
  // The server does not check for metacharacters like ';', '|', or '&&'.
  const command = `ping -c 3 ${ip}`;
  // -------------------------------

  console.log(`Executing command: ${command}`);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      // Send back the error message, which can also be useful to an attacker
      return res.status(500).send(`Error executing command: ${stderr}`);
    }
    // Send back the successful output of the command(s)
    res.send(`<pre>${stdout}</pre>`);
  });
});

app.listen(PORT, () => {
  console.log(`Ping challenge server running on port ${PORT}`);
});