const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Invitation = require('../models/Invitation');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// GET /api/auth/check-invitations/:email - Check for pending invitations by email (before signup)
router.get('/check-invitations/:email', async (req, res) => {
  try {
    const normalizedEmail = req.params.email.toLowerCase().trim();
    const invitations = await Invitation.find({
      email: normalizedEmail,
      status: 'pending'
    })
      .populate('team', 'name city colors')
      .populate('invitedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Error checking invitations', error: error.message });
  }
});

// POST /api/auth/signup - Register new user
router.post('/signup', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('userType').isIn(['league_admin', 'coach_player']).withMessage('User type must be league_admin or coach_player'),
  body('tier').optional().isInt({ min: 1, max: 3 }).withMessage('Tier must be 1, 2, or 3')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, userType, tier } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Validate tier for league_admin
    let finalTier = tier || 1;
    if (userType === 'league_admin') {
      // League admins must have a tier
      if (!tier || tier < 1 || tier > 3) {
        return res.status(400).json({ message: 'League admins must have a tier (1, 2, or 3)' });
      }
      finalTier = tier;
    } else {
      // Coach/player users default to tier 1 (but it doesn't matter for them)
      finalTier = 1;
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      userType: userType || 'coach_player',
      tier: finalTier
    });

    await user.save();

    // Check for pending invitations for this email
    const normalizedEmail = email.toLowerCase().trim();
    const pendingInvitations = await Invitation.find({
      email: normalizedEmail,
      status: 'pending'
    })
      .populate('team', 'name city colors')
      .populate('league', 'name description')
      .populate('invitedBy', 'firstName lastName email');

    // Update invitations to link to user
    if (pendingInvitations.length > 0) {
      await Invitation.updateMany(
        { email: normalizedEmail, status: 'pending' },
        { $set: { user: user._id } }
      );
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        userType: user.userType,
        tier: user.tier,
        leagueLimit: user.leagueLimit
      },
      pendingInvitations: pendingInvitations.length > 0 ? pendingInvitations : undefined
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// POST /api/auth/login - Login user
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        userType: user.userType,
        tier: user.tier,
        leagueLimit: user.leagueLimit
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// GET /api/auth/me - Get current user (protected route)
router.get('/me', async (req, res) => {
  try {
    // This will be protected by auth middleware
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        userType: user.userType,
        tier: user.tier,
        leagueLimit: user.leagueLimit
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// GET /api/auth/users/search - Search users (for manager assignment)
router.get('/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const searchRegex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ]
    })
      .select('firstName lastName email')
      .limit(20)
      .sort({ firstName: 1, lastName: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
});

module.exports = router;

