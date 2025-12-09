const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'League name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  settings: {
    maxTeams: {
      type: Number,
      default: 20,
      min: 2
    },
    minTeams: {
      type: Number,
      default: 2,
      min: 2
    }
  }
}, {
  timestamps: true
});

// Index for search functionality
leagueSchema.index({ name: 'text', description: 'text' });

// Virtual for member count
leagueSchema.virtual('memberCount').get(function() {
  return this.members.length + 1; // +1 for owner
});

// Method to check if user is a member
leagueSchema.methods.isMember = function(userId) {
  return this.owner.toString() === userId.toString() || 
         this.members.some(member => member.toString() === userId.toString());
};

// Method to add member
leagueSchema.methods.addMember = function(userId) {
  if (!this.isMember(userId)) {
    this.members.push(userId);
    return true;
  }
  return false;
};

// Method to remove member
leagueSchema.methods.removeMember = function(userId) {
  if (this.owner.toString() === userId.toString()) {
    return false; // Cannot remove owner
  }
  this.members = this.members.filter(
    member => member.toString() !== userId.toString()
  );
  return true;
};

leagueSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('League', leagueSchema);

