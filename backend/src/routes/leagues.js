const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const League = require('../models/League');
const Season = require('../models/Season');
const User = require('../models/User');
const authenticate = require('../middleware/auth');

// GET /api/leagues - Get all leagues (with search)
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, publicOnly } = req.query;
    const userId = req.user._id;

    let query = {};

    // If publicOnly is true, only show public leagues
    if (publicOnly === 'true') {
      query.isPublic = true;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const leagues = await League.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Add membership status for each league
    const leaguesWithMembership = leagues.map(league => {
      const leagueObj = league.toObject();
      leagueObj.isMember = league.isMember(userId);
      leagueObj.isOwner = league.owner._id.toString() === userId.toString();
      return leagueObj;
    });

    res.json(leaguesWithMembership);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leagues', error: error.message });
  }
});

// GET /api/leagues/my-leagues - Get leagues user belongs to
router.get('/my-leagues', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const leagues = await League.find({
      $or: [
        { owner: userId },
        { members: userId }
      ]
    })
      .populate('owner', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const leaguesWithMembership = leagues.map(league => {
      const leagueObj = league.toObject();
      leagueObj.isMember = true;
      leagueObj.isOwner = league.owner._id.toString() === userId.toString();
      return leagueObj;
    });

    res.json(leaguesWithMembership);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user leagues', error: error.message });
  }
});

// GET /api/leagues/:id - Get league by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const league = await League.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('members', 'firstName lastName email');

    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    const leagueObj = league.toObject();
    leagueObj.isMember = league.isMember(req.user._id);
    leagueObj.isOwner = league.owner._id.toString() === req.user._id.toString();
    leagueObj.canView = league.isPublic || leagueObj.isMember; // Can view if public or member

    res.json(leagueObj);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching league', error: error.message });
  }
});

// POST /api/leagues - Create new league
router.post('/', authenticate, [
  body('name').notEmpty().withMessage('League name is required'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is a league admin
    if (req.user.userType !== 'league_admin') {
      return res.status(403).json({ message: 'Only league admins can create leagues' });
    }

    // Check tier limit
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Count existing leagues owned by this user
    const existingLeaguesCount = await League.countDocuments({ owner: req.user._id });
    
    // Check if user has reached their tier limit
    if (user.leagueLimit !== Infinity && existingLeaguesCount >= user.leagueLimit) {
      const tierName = user.tier === 1 ? 'Tier 1' : user.tier === 2 ? 'Tier 2' : 'Tier 3';
      return res.status(403).json({ 
        message: `You have reached your league limit (${user.leagueLimit} league${user.leagueLimit > 1 ? 's' : ''} for ${tierName}). Please upgrade your tier to create more leagues.` 
      });
    }

    const league = new League({
      ...req.body,
      owner: req.user._id,
      members: [] // Owner is not in members array
    });

    await league.save();
    await league.populate('owner', 'firstName lastName email');

    const leagueObj = league.toObject();
    leagueObj.isMember = true;
    leagueObj.isOwner = true;

    res.status(201).json(leagueObj);
  } catch (error) {
    res.status(500).json({ message: 'Error creating league', error: error.message });
  }
});

// PUT /api/leagues/:id - Update league
router.put('/:id', authenticate, [
  body('name').optional().notEmpty().withMessage('League name cannot be empty'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const league = await League.findById(req.params.id);

    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    // Only owner can update
    if (league.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the league owner can update the league' });
    }

    Object.assign(league, req.body);
    await league.save();
    await league.populate('owner', 'firstName lastName email');
    await league.populate('members', 'firstName lastName email');

    const leagueObj = league.toObject();
    leagueObj.isMember = true;
    leagueObj.isOwner = true;

    res.json(leagueObj);
  } catch (error) {
    res.status(500).json({ message: 'Error updating league', error: error.message });
  }
});

// DELETE /api/leagues/:id - Delete league
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);

    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    // Only owner can delete
    if (league.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the league owner can delete the league' });
    }

    // Delete all seasons in this league
    await Season.deleteMany({ league: league._id });

    await League.findByIdAndDelete(req.params.id);

    res.json({ message: 'League deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting league', error: error.message });
  }
});

// POST /api/leagues/:id/members - Add member to league
router.post('/:id/members', authenticate, [
  body('userId').notEmpty().withMessage('User ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const league = await League.findById(req.params.id);

    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    // Only owner can add members
    if (league.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the league owner can add members' });
    }

    const { userId } = req.body;

    if (league.owner.toString() === userId) {
      return res.status(400).json({ message: 'Owner is already a member' });
    }

    const added = league.addMember(userId);
    if (!added) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    await league.save();
    await league.populate('owner', 'firstName lastName email');
    await league.populate('members', 'firstName lastName email');

    const leagueObj = league.toObject();
    leagueObj.isMember = true;
    leagueObj.isOwner = true;

    res.json(leagueObj);
  } catch (error) {
    res.status(500).json({ message: 'Error adding member', error: error.message });
  }
});

// DELETE /api/leagues/:id/members/:userId - Remove member from league
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);

    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    // Only owner can remove members
    if (league.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the league owner can remove members' });
    }

    const removed = league.removeMember(req.params.userId);
    if (!removed) {
      return res.status(400).json({ message: 'Cannot remove owner or user is not a member' });
    }

    await league.save();
    await league.populate('owner', 'firstName lastName email');
    await league.populate('members', 'firstName lastName email');

    const leagueObj = league.toObject();
    leagueObj.isMember = true;
    leagueObj.isOwner = true;

    res.json(leagueObj);
  } catch (error) {
    res.status(500).json({ message: 'Error removing member', error: error.message });
  }
});

// GET /api/leagues/:id/seasons - Get seasons for a league
router.get('/:id/seasons', authenticate, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);

    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    // Allow access if league is public OR user is a member
    if (!league.isPublic && !league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to view seasons' });
    }

    const seasons = await Season.find({ league: league._id })
      .populate('teams', 'name city colors')
      .sort({ createdAt: -1 });

    res.json(seasons);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching seasons', error: error.message });
  }
});

// POST /api/leagues/:id/teams - Add teams to a league
router.post('/:id/teams', authenticate, [
  body('teamIds').isArray().withMessage('teamIds must be an array'),
  body('teamIds.*').isMongoId().withMessage('Each team ID must be a valid MongoDB ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const league = await League.findById(req.params.id);

    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    // Only owner can add teams
    if (league.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the league owner can add teams' });
    }

    const { teamIds } = req.body;
    const Team = require('../models/Team');

    // Verify all teams exist
    const teams = await Team.find({ _id: { $in: teamIds } });
    if (teams.length !== teamIds.length) {
      return res.status(400).json({ message: 'One or more teams not found' });
    }

    // Add teams to league (avoid duplicates)
    teamIds.forEach(teamId => {
      if (!league.teams.some(t => t.toString() === teamId)) {
        league.teams.push(teamId);
      }
    });

    await league.save();
    await league.populate('owner', 'firstName lastName email');
    await league.populate('members', 'firstName lastName email');

    const leagueObj = league.toObject();
    leagueObj.isMember = true;
    leagueObj.isOwner = true;

    res.json(leagueObj);
  } catch (error) {
    res.status(500).json({ message: 'Error adding teams to league', error: error.message });
  }
});

// GET /api/leagues/:id/teams - Get teams for a league
router.get('/:id/teams', authenticate, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);

    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    // Allow access if league is public OR user is a member
    if (!league.isPublic && !league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to view teams' });
    }

    // Get all seasons for this league
    const seasons = await Season.find({ league: league._id }).select('teams');
    
    // Collect all unique team IDs from seasons
    const teamIds = new Set();
    seasons.forEach(season => {
      if (season.teams && Array.isArray(season.teams)) {
        season.teams.forEach(teamId => {
          teamIds.add(teamId.toString());
        });
      }
    });

    // Also add teams directly associated with the league
    if (league.teams && Array.isArray(league.teams)) {
      league.teams.forEach(teamId => {
        teamIds.add(teamId.toString());
      });
    }

    // Get all unique teams
    const Team = require('../models/Team');
    const teams = await Team.find({ _id: { $in: Array.from(teamIds) } })
      .populate('players', 'firstName lastName position jerseyNumber')
      .populate('captain', 'firstName lastName')
      .sort({ name: 1 });

    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teams', error: error.message });
  }
});

// GET /api/leagues/:id/players - Get all players from teams in a league
router.get('/:id/players', authenticate, async (req, res) => {
  try {
    const league = await League.findById(req.params.id);

    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    // Allow access if league is public OR user is a member
    if (!league.isPublic && !league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to view players' });
    }

    // Get all seasons for this league
    const seasons = await Season.find({ league: league._id }).select('teams');
    
    // Collect all unique team IDs from seasons
    const teamIds = new Set();
    seasons.forEach(season => {
      if (season.teams && Array.isArray(season.teams)) {
        season.teams.forEach(teamId => {
          teamIds.add(teamId.toString());
        });
      }
    });

    // Also add teams directly associated with the league
    if (league.teams && Array.isArray(league.teams)) {
      league.teams.forEach(teamId => {
        teamIds.add(teamId.toString());
      });
    }

    // Get all players from these teams
    const Player = require('../models/Player');
    const players = await Player.find({ team: { $in: Array.from(teamIds) } })
      .populate('team', 'name city')
      .sort({ lastName: 1, firstName: 1 });

    res.json(players);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching players', error: error.message });
  }
});

module.exports = router;

