const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  type: {
    type: String,
    enum: ['team', 'league'],
    required: [true, 'Invitation type is required'],
    default: 'team'
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: false
  },
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: false
  },
  season: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: false
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Inviter is required']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  acceptedAt: {
    type: Date
  },
  declinedAt: {
    type: Date
  },
  // If user exists, link to their account
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient lookups
invitationSchema.index({ email: 1, status: 1 });
invitationSchema.index({ user: 1, status: 1 });
invitationSchema.index({ team: 1, status: 1 });
invitationSchema.index({ league: 1, status: 1 });
invitationSchema.index({ season: 1, status: 1 });
invitationSchema.index({ type: 1, status: 1 });

// Prevent duplicate pending invitations
// For team invitations
invitationSchema.index({ email: 1, team: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending', type: 'team' } });
// For league invitations
invitationSchema.index({ email: 1, league: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending', type: 'league' } });

// Custom validation to ensure team or league is provided based on type
invitationSchema.pre('validate', function(next) {
  if (this.type === 'team' && !this.team) {
    return next(new Error('Team is required for team invitations'));
  }
  if (this.type === 'league' && !this.league) {
    return next(new Error('League is required for league invitations'));
  }
  next();
});

module.exports = mongoose.model('Invitation', invitationSchema);

