const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Season name is required'],
    trim: true
  },
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: [true, 'League is required']
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  }],
  weeks: [{
    weekNumber: {
      type: Number,
      required: true,
      min: 1
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    games: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game'
    }],
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'registration', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  venues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  }],
  settings: {
    gamesPerWeek: {
      type: Number,
      default: 1,
      min: 1
    },
    playoffTeams: {
      type: Number,
      default: 4,
      min: 2
    },
    regularSeasonWeeks: {
      type: Number,
      default: 10,
      min: 1
    }
  },
  standings: [{
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    gamesPlayed: {
      type: Number,
      default: 0
    },
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
    },
    points: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});

// Virtual for total weeks
seasonSchema.virtual('totalWeeks').get(function() {
  return this.weeks ? this.weeks.length : 0;
});

// Virtual for completed weeks
seasonSchema.virtual('completedWeeks').get(function() {
  return this.weeks ? this.weeks.filter(week => week.isCompleted).length : 0;
});

// Virtual for progress percentage
seasonSchema.virtual('progressPercentage').get(function() {
  if (!this.weeks || this.weeks.length === 0) return 0;
  return Math.round((this.completedWeeks / this.totalWeeks) * 100);
});

// Virtual for is active
seasonSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now <= this.endDate;
});

// Pre-save middleware to validate dates
seasonSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  
  // Validate week dates
  for (let week of this.weeks) {
    if (week.endDate <= week.startDate) {
      return next(new Error(`Week ${week.weekNumber} end date must be after start date`));
    }
  }
  
  next();
});

// Method to generate season schedule
seasonSchema.methods.generateSchedule = function() {
  const teams = this.teams || [];
  const totalTeams = teams.length;
  
  if (totalTeams < 2) {
    throw new Error('At least 2 teams are required to generate a schedule');
  }
  
  // Clear existing weeks
  this.weeks = [];
  
  // Calculate number of weeks needed for round-robin
  const weeksNeeded = totalTeams % 2 === 0 ? totalTeams - 1 : totalTeams;
  
  // Generate schedule using round-robin algorithm
  const schedule = this.generateRoundRobinSchedule(teams, weeksNeeded);
  
  // Create weeks (without games initially)
  const weekDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  let currentWeekStart = new Date(this.startDate);
  
  schedule.forEach((weekMatchups, weekIndex) => {
    const weekStart = new Date(currentWeekStart);
    const weekEnd = new Date(currentWeekStart.getTime() + weekDuration - 1);
    
    const week = {
      weekNumber: weekIndex + 1,
      startDate: weekStart,
      endDate: weekEnd,
      games: [], // Empty array - games will be added by the route
      isCompleted: false
    };
    
    this.weeks.push(week);
    currentWeekStart = new Date(weekEnd.getTime() + 1);
  });
  
  // Initialize standings
  this.standings = teams.map(team => ({
    team: team,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    points: 0
  }));
  
  // Store the schedule data for the route to use
  this._scheduleData = schedule;
};

// Round-robin schedule generation algorithm
seasonSchema.methods.generateRoundRobinSchedule = function(teams, weeks) {
  const schedule = [];
  const teamCount = teams.length;
  
  // If odd number of teams, add a "bye" team
  const teamsWithBye = teamCount % 2 === 1 ? [...teams, null] : teams;
  const n = teamsWithBye.length;
  
  for (let week = 0; week < weeks; week++) {
    const weekMatchups = [];
    
    for (let i = 0; i < n / 2; i++) {
      const home = teamsWithBye[i];
      const away = teamsWithBye[n - 1 - i];
      
      // Skip if either team is null (bye)
      if (home && away) {
        weekMatchups.push({ home, away });
      }
    }
    
    schedule.push(weekMatchups);
    
    // Rotate teams (except the first one)
    const first = teamsWithBye[0];
    const last = teamsWithBye[n - 1];
    const middle = teamsWithBye.slice(1, n - 1);
    
    teamsWithBye[0] = first;
    teamsWithBye[1] = last;
    teamsWithBye.slice(2).forEach((team, index) => {
      teamsWithBye[index + 2] = middle[index];
    });
  }
  
  return schedule;
};

// Method to update standings after a game
seasonSchema.methods.updateStandings = async function(game) {
  if (game.status !== 'completed') return;
  
  const homeStanding = this.standings.find(s => s.team.toString() === game.homeTeam.toString());
  const awayStanding = this.standings.find(s => s.team.toString() === game.awayTeam.toString());
  
  if (!homeStanding || !awayStanding) return;
  
  // Update games played
  homeStanding.gamesPlayed++;
  awayStanding.gamesPlayed++;
  
  // Update points for/against
  homeStanding.pointsFor += game.score.homeTeam;
  homeStanding.pointsAgainst += game.score.awayTeam;
  awayStanding.pointsFor += game.score.awayTeam;
  awayStanding.pointsAgainst += game.score.homeTeam;
  
  // Update wins/losses/ties and points
  if (game.score.homeTeam > game.score.awayTeam) {
    homeStanding.wins++;
    awayStanding.losses++;
    homeStanding.points += 3; // 3 points for win
  } else if (game.score.awayTeam > game.score.homeTeam) {
    awayStanding.wins++;
    homeStanding.losses++;
    awayStanding.points += 3; // 3 points for win
  } else {
    homeStanding.ties++;
    awayStanding.ties++;
    homeStanding.points += 1; // 1 point for tie
    awayStanding.points += 1; // 1 point for tie
  }
  
  await this.save();
};

seasonSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Season', seasonSchema);
