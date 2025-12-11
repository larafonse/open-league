const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  userType: {
    type: String,
    enum: ['league_admin', 'coach_player'],
    default: 'coach_player'
  },
  tier: {
    type: Number,
    enum: [1, 2, 3],
    default: 1
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for league limit based on tier
userSchema.virtual('leagueLimit').get(function() {
  if (this.userType !== 'league_admin') return 0;
  switch (this.tier) {
    case 1: return 1;
    case 2: return 3;
    case 3: return Infinity; // Unlimited
    default: return 0;
  }
});

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject({ virtuals: true });
  delete user.password;
  return user;
};

userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);

