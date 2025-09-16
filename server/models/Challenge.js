const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChallengeSchema = new Schema({
  challengeId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Welcome', 'Warm-up', 'Easy', 'Medium', 'Hard'], 
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  flag: {
    type: String,
    required: true,
    select: false
  },
  downloadFile: {
    type: String,
    required: false // It's not required for every challenge
  },
  position: {
    top: { type: String, required: true }, 
    left: { type: String, required: true } 
  }
});

module.exports = mongoose.model('Challenge', ChallengeSchema);