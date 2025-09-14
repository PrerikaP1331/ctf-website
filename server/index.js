require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const Docker = require('dockerode');
const path = require('path');
const net = require('net'); 

const app = express();
const docker = new Docker();
const PORT = process.env.PORT || 5000;

const Team = require('./models/Team'); 
const Challenge = require('./models/Challenge'); 

app.use(cors());
app.use(express.json());
app.use('/files', express.static(path.join(__dirname, 'public/files')));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully."))
  .catch(err => console.error("MongoDB connection error:", err));

//test route
app.get('/api', (req, res) => {
  res.json({ message: "Hello from the CTF backend!" });
});

// Auth Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const team = await Team.findOne({ username });

    if (!team) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, team.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const payload = {
    teamId: team._id, 
    username: team.username
  };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3h' });

    res.status(200).json({ success: true, token: token });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/map-data', async (req, res) => {
  let team = null; 

  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      const challenges = await Challenge.find({}).select('-flag');
      return res.status(200).json({ success: true, challenges, solvedChallengeIds: [], attemptsMap: {} });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const teamId = decoded.teamId;

    const challenges = await Challenge.find({}).select('-flag');
    
    team = await Team.findById(teamId).populate('solvedChallenges.challenge');

    const solvedChallengeIds = team ? team.solvedChallenges.map(solved => solved.challenge.challengeId) : [];
    
    const attemptsMap = {};
    if (team && team.submissions) {
      const allChallenges = await Challenge.find({});
      team.submissions.forEach(sub => {
        const challengeDoc = allChallenges.find(c => c._id.equals(sub.challenge));
        if (challengeDoc) {
          attemptsMap[challengeDoc.challengeId] = sub.count;
        }
      });
    }

    res.status(200).json({ success: true, challenges, solvedChallengeIds, attemptsMap });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      const challenges = await Challenge.find({}).select('-flag');
      return res.status(200).json({ success: true, challenges, solvedChallengeIds: [], attemptsMap: {} });
    }
    console.error("Error fetching map data:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/challenge/:challengeId', async (req, res) => {
  try {
    const challengeId = req.params.challengeId;

    const challenge = await Challenge.findOne({ challengeId: challengeId }).select('-flag');

    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    res.status(200).json({ 
      success: true, 
      challenge, 
      publicApiUrl: process.env.PUBLIC_API_URL 
    });

  } catch (error) {
    console.error("Error fetching single challenge data:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/challenge/submit', async (req, res) => {
  try {
    const { challengeId, flag } = req.body;
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const teamId = decoded.teamId;

    const team = await Team.findById(teamId);
    const challenge = await Challenge.findOne({ challengeId: challengeId }).select('+flag'); 
    if (!team || !challenge) {
      return res.status(404).json({ success: false, message: 'Team or Challenge not found' });
    }

    const alreadySolved = team.solvedChallenges.some(solved => solved.challenge.equals(challenge._id));
    if (alreadySolved) {
      return res.status(200).json({ success: true, message: 'Already solved!' });
    }

    if (flag === challenge.flag) {
      team.score += challenge.points;
      team.solvedChallenges.push({ challenge: challenge._id });
      await team.save(); 
      res.status(200).json({ success: true, message: 'Flag Captured!' });
    } else {
     
      const submission = team.submissions.find(sub => sub.challenge.equals(challenge._id));

      if (submission) {
        submission.count++;
      } else {
        team.submissions.push({ challenge: challenge._id, count: 1 });
      }

      await team.save();

      res.status(200).json({ success: false, message: 'Incorrect Flag!' });
    }

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    console.error("Flag submission error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const teams = await Team.find({})
      .select('username score')
      .sort({ score: -1 });

    res.status(200).json({ success: true, leaderboard: teams });

  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const activeContainers = new Map();// For the findFreePort helper

// === WEBSHELL START ENDPOINT ===
app.post('/api/webshell/start', async (req, res) => {
  // Authenticate the user first
  console.log("Received a request to /api/webshell/start");
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

   
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const teamId = decoded.teamId; // Get the unique ID for the team

    // If this team already has a container, destroy it first
    if (activeContainers.has(teamId)) {
      console.log(`Removing old container for team: ${teamId}`);
      const oldContainer = docker.getContainer(activeContainers.get(teamId));
      await oldContainer.remove({ force: true }).catch(err => console.error(`Silent remove error: ${err.message}`));
    }

    const hostPort = await findFreePort();

    console.log(`Attempting to start container on host port: ${hostPort}`);
    const container = await docker.createContainer({
      Image: 'kali-ctf-webshell', // Our custom image name
      Tty: false,
      HostConfig: {
        PortBindings: { '8080/tcp': [{ HostPort: String(hostPort) }] },
        // AutoRemove: true, // Automatically remove container when it exits
        Memory: 512 * 1024 * 1024, // 512MB RAM limit
        CpuShares: 512, // Relative CPU weight
      },
    });

    await container.start();
    activeContainers.set(teamId, container.id);
    console.log(`Started container ${container.id} for team ${teamId} on port ${hostPort}`);

    // Wait a moment for ttyd to initialize
    setTimeout(() => {
      res.json({ url: `http://localhost:${hostPort}` });
    }, 1000);

  } catch (err) {
    console.error("Webshell start error:", err);
    res.status(500).json({ error: 'Failed to create terminal.' });
  }
});

// === WEBSHELL STOP ENDPOINT ===
app.post('/api/webshell/stop', async (req, res) => {

  console.log("Received a request to /api/webshell/stop");
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const teamId = decoded.teamId;

    if (activeContainers.has(teamId)) {
      const containerId = activeContainers.get(teamId);
      console.log(`Stopping container ${containerId} for team ${teamId}`);
      const container = docker.getContainer(containerId);
      await container.remove({ force: true });
      activeContainers.delete(teamId);
      res.json({ success: true, message: 'Terminal stopped.' });
    } else {
      res.json({ success: true, message: 'No active terminal to stop.' });
    }
  } catch (err) {
    console.error("Webshell stop error:", err);
    res.status(500).json({ error: 'Failed to stop terminal.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

function findFreePort() {
  return new Promise(res => {
    const server = net.createServer();
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => res(port));
    });
  });
}
