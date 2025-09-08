const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TeamSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  solvedChallenges: [{
    challenge: {
      type: Schema.Types.ObjectId,
      ref: 'Challenge' 
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

    submissions: [{
    challenge: {
      type: Schema.Types.ObjectId,
      ref: 'Challenge'
    },
    count: {
      type: Number,
      default: 0
    }
  }]
});

module.exports = mongoose.model('Team', TeamSchema);
