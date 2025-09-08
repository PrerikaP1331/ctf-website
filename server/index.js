require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

const Team = require('./models/Team'); 
const Challenge = require('./models/Challenge'); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully."))
  .catch(err => console.error("MongoDB connection error:", err));



//test route
app.get('/api', (req, res) => {
  res.json({ message: "Hello from the CTF backend!" });
});

// Real Login Route
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

    res.status(200).json({ success: true, challenge });

  } catch (error) {
    console.error("Error fetching single challenge data:", error);
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});