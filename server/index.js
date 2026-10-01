require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Docker = require('dockerode');
const crypto = require('crypto');
const httpProxy = require('http-proxy');
const path = require('path');

const docker = new Docker();
const app = express();
const PORT = process.env.PORT || 5000;
const MAX_SESSION_SECONDS = 60 * 60;

const Team = require('./models/Team');
const Challenge = require('./models/Challenge');
const webshellProxy = httpProxy.createProxyServer({ changeOrigin: true });

function verifySessionToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!Number.isInteger(decoded.iat) || !Number.isInteger(decoded.exp) || decoded.exp - decoded.iat > MAX_SESSION_SECONDS) {
    throw new Error('Session exceeds the one-hour limit.');
  }
  return decoded;
}

app.use(express.json());

app.use('/files', express.static(path.join(__dirname, 'public','files')));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/healthz', (req, res) => {
  const isReady = mongoose.connection.readyState === 1;
  res.status(isReady ? 200 : 503).json({ status: isReady ? 'ok' : 'starting' });
});

// === AUTH ===
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const team = await Team.findOne({ username });
    if (!team) return res.status(401).json({ success: false, message: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, team.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid username or password' });

    const payload = { teamId: team._id, username: team.username };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ success: true, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const decoded = verifySessionToken(authHeader.slice(7));
    if (decoded.username !== process.env.LEADERBOARD_ADMIN_USERNAME) {
      return res.status(403).json({ success: false, message: 'Organizer access required' });
    }

    const leaderboard = await Team.find({})
      .select('username score solvedChallenges')
      .sort({ score: -1, 'solvedChallenges.timestamp': 1 });
    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired session' });
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
    const decoded = verifySessionToken(token);
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
    const decoded = verifySessionToken(token);

    const team = await Team.findById(decoded.teamId);
    const challenge = await Challenge.findOne({ challengeId }).select('+flag');
    if (!team || !challenge) {
      return res.status(404).json({ success: false, message: 'Team or Challenge not found' });
    }

    const submission = team.submissions.find(s => s.challenge.equals(challenge._id));
    if (submission) {
      submission.count += 1;
    } else {
      team.submissions.push({ challenge: challenge._id, count: 1 });
    }

    const alreadySolved = team.solvedChallenges.some(s => s.challenge.equals(challenge._id));
    if (alreadySolved) {
      await team.save();
      return res.json({ success: true, message: 'Already solved!' });
    }

    if (flag === challenge.flag) {
      // ✅ directly add points & store timestamp in DB
      team.score += challenge.points;
      team.solvedChallenges.push({ challenge: challenge._id, timestamp: new Date() });
      await team.save();
      return res.json({ success: true, message: 'Flag Captured!' });
    }

    await team.save();

    res.json({ success: false, message: 'Incorrect Flag!' });
  } catch (err) {
    console.error('Flag submit error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// === DOCKER WEB SHELL ===
const activeContainers = new Map();
const terminalSessions = new Map();
const terminalSessionCookie = 'ctf_terminal';
const terminalSessionLifetime = 60 * 60 * 1000;

function getCookieValue(header, name) {
  const prefix = `${name}=`;
  const cookie = (header || '').split(';').map(value => value.trim()).find(value => value.startsWith(prefix));
  if (!cookie) return null;
  try {
    return decodeURIComponent(cookie.slice(prefix.length));
  } catch {
    return null;
  }
}

function getTerminalSession(req) {
  const ticket = getCookieValue(req.headers.cookie, terminalSessionCookie);
  const teamId = ticket && terminalSessions.get(ticket);
  const session = teamId && activeContainers.get(teamId);
  if (!session || session.expiresAt <= Date.now()) return null;
  return session;
}

function proxyTerminalRequest(req, res) {
  const session = getTerminalSession(req);
  if (!session) return res.status(401).send('Terminal session expired.');

  req.url = req.originalUrl || req.url;
  webshellProxy.web(req, res, {
    target: `http://127.0.0.1:${session.hostPort}`,
    auth: `ctfadmin:${session.password}`
  });
}

webshellProxy.on('error', (error, req, res) => {
  console.error('Terminal proxy error:', error.message);
  if (res && typeof res.writeHead === 'function') {
    if (!res.headersSent) res.writeHead(502);
    res.end('Terminal unavailable.');
  } else if (res && typeof res.destroy === 'function') {
    res.destroy();
  }
});

app.use('/terminal', proxyTerminalRequest);

app.post('/api/webshell/start', async (req, res) => {
  if (process.env.WEBSHELL_ENABLED !== 'true') {
    return res.status(503).json({ error: 'Webshell is disabled.' });
  }
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  try {
    const token = authHeader.split(' ')[1];
    const { teamId: decodedTeamId } = verifySessionToken(token);
    const teamId = String(decodedTeamId);

    if (activeContainers.has(teamId)) {
      await stopWebshell(teamId);
    }

    const password = crypto.randomBytes(24).toString('base64url');
    const ticket = crypto.randomBytes(32).toString('hex');
    const container = await docker.createContainer({
      Image: 'kali-ctf-webshell',
      Tty: false,
      Cmd: [
        'ttyd', '-p', '8080',
        '-b', '/terminal',
        '-c', `ctfadmin:${password}`,
        '--client-option', 'rendererType=webgl',
        '--client-option', 'scrollback=5000',
        '-i', '0.0.0.0', '-W',
        '-t', 'titleFixed=Kali Linux Terminal', 'zsh'
      ],
      Labels: { 'ctf.webshell': 'true', 'ctf.team': teamId },
      HostConfig: {
        PortBindings: { '8080/tcp': [{ HostIp: '127.0.0.1', HostPort: '' }] },
        Memory: 512 * 1024 * 1024,
        NanoCpus: 500000000,
        PidsLimit: 128,
        CapDrop: ['ALL'],
        CapAdd: ['NET_RAW'],
        SecurityOpt: ['no-new-privileges:true']
      }
    });

    try {
      await container.start();
      const details = await container.inspect();
      const binding = details.NetworkSettings.Ports['8080/tcp']?.[0];
      if (!binding || binding.HostIp !== '127.0.0.1') {
        throw new Error('Terminal port was not bound to loopback.');
      }

      const session = {
        id: container.id,
        hostPort: binding.HostPort,
        password,
        ticket,
        expiresAt: Date.now() + terminalSessionLifetime
      };
      activeContainers.set(teamId, session);
      terminalSessions.set(ticket, teamId);
      setTimeout(() => {
        if (activeContainers.get(teamId) === session) stopWebshell(teamId);
      }, terminalSessionLifetime).unref();

      res.cookie(terminalSessionCookie, ticket, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/terminal',
        maxAge: terminalSessionLifetime
      });
      res.json({ url: '/terminal/' });
    } catch (error) {
      await container.remove({ force: true }).catch(() => {});
      throw error;
    }
  } catch (err) {
    console.error('Webshell start error:', err);
    res.status(500).json({ error: 'Failed to create terminal.' });
  }
});

app.post('/api/webshell/stop', async (req, res) => {
  if (process.env.WEBSHELL_ENABLED !== 'true') {
    return res.json({ success: true, message: 'Webshell is disabled.' });
  }
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  try {
    const token = authHeader.split(' ')[1];
    const { teamId: decodedTeamId } = verifySessionToken(token);
    const teamId = String(decodedTeamId);

    await stopWebshell(teamId);
    res.clearCookie(terminalSessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/terminal'
    });
    res.json({ success: true, message: 'Terminal stopped.' });
  } catch (err) {
    console.error('Webshell stop error:', err);
    res.status(500).json({ error: 'Failed to stop terminal.' });
  }
});

async function stopWebshell(teamId) {
  const session = activeContainers.get(teamId);
  if (!session) return;
  activeContainers.delete(teamId);
  terminalSessions.delete(session.ticket);
  await docker.getContainer(session.id).remove({ force: true }).catch(() => {});
}

const server = app.listen(PORT, '127.0.0.1', () => console.log(`Server running at http://localhost:${PORT}`));
server.on('upgrade', (req, socket, head) => {
  const requestPath = (req.url || '').split('?')[0];
  if (!requestPath.startsWith('/terminal/')) {
    socket.destroy();
    return;
  }

  const session = getTerminalSession(req);
  if (!session) {
    socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
    socket.destroy();
    return;
  }

  webshellProxy.ws(req, socket, head, {
    target: `http://127.0.0.1:${session.hostPort}`,
    auth: `ctfadmin:${session.password}`
  });
});
