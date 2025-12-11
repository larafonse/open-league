const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    unique: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  colors: {
    primary: {
      type: String,
      required: true,
      default: '#000000'
    },
    secondary: {
      type: String,
      required: true,
      default: '#FFFFFF'
    }
  },
  logo: {
    type: String,
    default: null
  },
  founded: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear()
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  ties: {
    type: Number,
    default: 0
  },
  pointsFor: {
    type: Number,
    default: 0
  },
  pointsAgainst: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual for win percentage
teamSchema.virtual('winPercentage').get(function() {
  const totalGames = this.wins + this.losses + this.ties;
  if (totalGames === 0) return 0;
  return ((this.wins + this.ties * 0.5) / totalGames).toFixed(3);
});

// Virtual for point differential
teamSchema.virtual('pointDifferential').get(function() {
  return this.pointsFor - this.pointsAgainst;
});

teamSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Team', teamSchema);
