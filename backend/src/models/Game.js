const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  homeTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Home team is required']
  },
  awayTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Away team is required']
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  actualDate: {
    type: Date
  },
  venue: {
    name: {
      type: String,
      required: [true, 'Venue name is required']
    },
    address: String,
    capacity: Number
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  score: {
    homeTeam: {
      type: Number,
      default: 0,
      min: 0
    },
    awayTeam: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  referee: {
    name: String,
    phone: String
  },
  weather: {
    condition: String,
    temperature: Number,
    humidity: Number
  },
  notes: String,
  events: [{
    type: {
      type: String,
      enum: ['goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'penalty', 'own_goal']
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    minute: Number,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Virtual for winner
gameSchema.virtual('winner').get(function() {
  if (this.status !== 'completed') return null;
  
  if (this.score.homeTeam > this.score.awayTeam) {
    return this.homeTeam;
  } else if (this.score.awayTeam > this.score.homeTeam) {
    return this.awayTeam;
  } else {
    return 'tie';
  }
});

// Virtual for game result
gameSchema.virtual('result').get(function() {
  if (this.status !== 'completed') return null;
  
  return {
    homeTeam: this.score.homeTeam,
    awayTeam: this.score.awayTeam,
    winner: this.winner
  };
});

gameSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Game', gameSchema);
