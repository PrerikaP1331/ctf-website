require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Docker = require('dockerode');
const net = require('net');
const path = require('path');

const docker = new Docker();
const app = express();
const PORT = process.env.PORT || 5000;

const Team = require('./models/Team');
const Challenge = require('./models/Challenge');

app.use(cors());
app.use(express.json());

app.use('/files', express.static(path.join(__dirname, 'public','files')));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// === AUTH ===
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const team = await Team.findOne({ username });
    if (!team) return res.status(401).json({ success: false, message: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, team.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid username or password' });

    const payload = { teamId: team._id, username: team.username };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3h' });

    res.status(200).json({ success: true, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// === MAP DATA ===
app.get('/api/map-data', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const challenges = await Challenge.find({}).select('-flag');

    if (!authHeader) {
      return res.json({ success: true, challenges, solvedChallengeIds: [], attemptsMap: {} });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const team = await Team.findById(decoded.teamId).populate('solvedChallenges.challenge');

    const solvedChallengeIds = team
      ? team.solvedChallenges.map(s => s.challenge.challengeId)
      : [];
    const attemptsMap = {};
    if (team && team.submissions) {
      const allChallenges = await Challenge.find({});
      team.submissions.forEach(sub => {
        const ch = allChallenges.find(c => c._id.equals(sub.challenge));
        if (ch) attemptsMap[ch.challengeId] = sub.count;
      });
    }

    res.json({ success: true, challenges, solvedChallengeIds, attemptsMap });
  } catch (err) {
    console.error('Map data error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// === SINGLE CHALLENGE ===
app.get('/api/challenge/:challengeId', async (req, res) => {
  try {
    const challenge = await Challenge.findOne({ challengeId: req.params.challengeId }).select('-flag');
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
    res.json({ success: true, challenge, publicApiUrl: process.env.PUBLIC_API_URL });
  } catch (err) {
    console.error('Single challenge error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// === FLAG SUBMIT ===
// • adds points directly to Team.score
// • pushes solved challenge with timestamp
app.post('/api/challenge/submit', async (req, res) => {
  try {
    const { challengeId, flag } = req.body;
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const team = await Team.findById(decoded.teamId);
    const challenge = await Challenge.findOne({ challengeId }).select('+flag');
    if (!team || !challenge) {
      return res.status(404).json({ success: false, message: 'Team or Challenge not found' });
    }

    const alreadySolved = team.solvedChallenges.some(s => s.challenge.equals(challenge._id));
    if (alreadySolved) {
      return res.json({ success: true, message: 'Already solved!' });
    }

    if (flag === challenge.flag) {
      // ✅ directly add points & store timestamp in DB
      team.score += challenge.points;
      team.solvedChallenges.push({ challenge: challenge._id, timestamp: new Date() });
      await team.save();
      return res.json({ success: true, message: 'Flag Captured!' });
    }

    // record submission attempts
    const sub = team.submissions.find(s => s.challenge.equals(challenge._id));
    sub ? sub.count++ : team.submissions.push({ challenge: challenge._id, count: 1 });
    await team.save();

    res.json({ success: false, message: 'Incorrect Flag!' });
  } catch (err) {
    console.error('Flag submit error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// === DOCKER WEB SHELL ===
const activeContainers = new Map();
app.post('/api/webshell/start', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  try {
    const token = authHeader.split(' ')[1];
    const { teamId } = jwt.verify(token, process.env.JWT_SECRET);

    if (activeContainers.has(teamId)) {
      const old = docker.getContainer(activeContainers.get(teamId));
      await old.remove({ force: true }).catch(() => {});
    }

    const hostPort = await findFreePort();
    const container = await docker.createContainer({
      Image: 'kali-ctf-webshell',
      Tty: false,
      HostConfig: {
        PortBindings: { '8080/tcp': [{ HostPort: String(hostPort) }] },
        Memory: 512 * 1024 * 1024,
        CpuShares: 512
      }
    });

    await container.start();
    activeContainers.set(teamId, container.id);
    setTimeout(() => res.json({ url: `http://localhost:${hostPort}` }), 1000);
  } catch (err) {
    console.error('Webshell start error:', err);
    res.status(500).json({ error: 'Failed to create terminal.' });
  }
});

app.post('/api/webshell/stop', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  try {
    const token = authHeader.split(' ')[1];
    const { teamId } = jwt.verify(token, process.env.JWT_SECRET);

    if (activeContainers.has(teamId)) {
      const containerId = activeContainers.get(teamId);
      const container = docker.getContainer(containerId);
      await container.remove({ force: true });
      activeContainers.delete(teamId);
      return res.json({ success: true, message: 'Terminal stopped.' });
    }
    res.json({ success: true, message: 'No active terminal.' });
  } catch (err) {
    console.error('Webshell stop error:', err);
    res.status(500).json({ error: 'Failed to stop terminal.' });
  }
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

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
