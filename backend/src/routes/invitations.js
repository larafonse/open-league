const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Invitation = require('../models/Invitation');
const Team = require('../models/Team');
const League = require('../models/League');
const User = require('../models/User');
const Player = require('../models/Player');
const authenticate = require('../middleware/auth');

// POST /api/invitations/teams/:id - Invite a player to a team by email
router.post('/teams/:id', authenticate, [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Verify user has permission to invite (coach of team or league admin)
    if (req.user.userType === 'coach_player') {
      const teamCoachId = team.coach ? (typeof team.coach === 'object' ? team.coach._id.toString() : team.coach.toString()) : null;
      if (teamCoachId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only invite players to teams that you coach' });
      }
    }
    // League admins can invite to any team

    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });

    // Check for existing pending invitation
    const existingInvitation = await Invitation.findOne({
      email: normalizedEmail,
      type: 'team',
      team: req.params.id,
      status: 'pending'
    });

    if (existingInvitation) {
      return res.status(400).json({ message: 'An invitation has already been sent to this email for this team' });
    }

    // Create invitation
    const invitation = new Invitation({
      email: normalizedEmail,
      type: 'team',
      team: req.params.id,
      invitedBy: req.user._id,
      user: existingUser ? existingUser._id : null
    });

    await invitation.save();
    await invitation.populate('team', 'name city colors');
    await invitation.populate('invitedBy', 'firstName lastName email');

    // Convert to object to avoid virtual issues
    const invitationObj = invitation.toObject();
    res.status(201).json(invitationObj);
  } catch (error) {
    console.error('Error creating team invitation:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An invitation has already been sent to this email for this team' });
    }
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => err.message).join(', ');
      return res.status(400).json({ message: `Validation error: ${validationErrors}` });
    }
    res.status(500).json({ message: error.message || 'Error creating invitation' });
  }
});

// POST /api/invitations/leagues/:id - Invite a coach to a league by email
router.post('/leagues/:id', authenticate, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('seasonId').optional().isMongoId().withMessage('Valid season ID is required if provided')
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

    // Verify user is the league owner or a league admin
    if (league.owner.toString() !== req.user._id.toString() && req.user.userType !== 'league_admin') {
      return res.status(403).json({ message: 'Only league owners can invite coaches' });
    }

    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });

    // Check for existing pending invitation
    const existingInvitation = await Invitation.findOne({
      email: normalizedEmail,
      type: 'league',
      league: req.params.id,
      status: 'pending'
    });

    if (existingInvitation) {
      return res.status(400).json({ message: 'An invitation has already been sent to this email for this league' });
    }

    // Validate season if provided
    let season = null;
    if (req.body.seasonId) {
      const Season = require('../models/Season');
      season = await Season.findById(req.body.seasonId);
      if (!season) {
        return res.status(404).json({ message: 'Season not found' });
      }
      // Verify season belongs to this league
      if (season.league.toString() !== req.params.id) {
        return res.status(400).json({ message: 'Season does not belong to this league' });
      }
    }

    // Create invitation
    const invitation = new Invitation({
      email: normalizedEmail,
      type: 'league',
      league: req.params.id,
      season: req.body.seasonId || null,
      invitedBy: req.user._id,
      user: existingUser ? existingUser._id : null
    });

    await invitation.save();
    
    // Populate league and season without virtuals to avoid errors
    await invitation.populate({
      path: 'league',
      select: 'name description owner members isPublic settings',
      options: { lean: false }
    });
    if (invitation.season) {
      await invitation.populate({
        path: 'season',
        select: 'name status startDate endDate',
        options: { lean: false }
      });
    }
    await invitation.populate('invitedBy', 'firstName lastName email');

    // Convert to object and handle virtuals safely
    const invitationObj = invitation.toObject();
    res.status(201).json(invitationObj);
  } catch (error) {
    console.error('Error creating league invitation:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An invitation has already been sent to this email for this league' });
    }
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => err.message).join(', ');
      return res.status(400).json({ message: `Validation error: ${validationErrors}` });
    }
    res.status(500).json({ message: error.message || 'Error creating invitation' });
  }
});

// GET /api/invitations - Get current user's pending invitations
router.get('/', authenticate, async (req, res) => {
  try {
    const invitations = await Invitation.find({
      $or: [
        { user: req.user._id, status: 'pending' },
        { email: req.user.email, status: 'pending' }
      ]
    })
      .populate('team', 'name city colors')
      .populate('league', 'name description')
      .populate('invitedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invitations', error: error.message });
  }
});

// GET /api/invitations/pending-by-email/:email - Get pending invitations by email (for signup)
router.get('/pending-by-email/:email', async (req, res) => {
  try {
    const normalizedEmail = req.params.email.toLowerCase().trim();
    const invitations = await Invitation.find({
      email: normalizedEmail,
      status: 'pending'
    })
      .populate('team', 'name city colors')
      .populate('league', 'name description')
      .populate('invitedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invitations', error: error.message });
  }
});

// POST /api/invitations/:id/accept - Accept an invitation
router.post('/:id/accept', authenticate, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Verify the invitation is for this user
    const userEmail = req.user.email.toLowerCase().trim();
    if (invitation.email !== userEmail && invitation.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'This invitation is not for you' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'This invitation has already been ' + invitation.status });
    }

    // Update invitation
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    invitation.user = req.user._id;
    await invitation.save();

    if (invitation.type === 'team') {
      const team = await Team.findById(invitation.team);
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      // Check if user already has a player profile
      let player = await Player.findOne({ email: req.user.email });
      
      if (!player) {
        // Create player profile
        player = new Player({
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          email: req.user.email,
          dateOfBirth: new Date(), // Default, user can update later
          position: 'Midfielder', // Default, user can update later
          team: team._id
        });
        await player.save();
      } else {
        // Update existing player profile
        if (player.team) {
          return res.status(400).json({ message: 'You are already on a team' });
        }
        player.team = team._id;
        await player.save();
      }

      // Add player to team if not already added
      if (!team.players.includes(player._id)) {
        team.players.push(player._id);
        await team.save();
      }

      await invitation.populate('team', 'name city colors');
      await invitation.populate('invitedBy', 'firstName lastName email');

      res.json({
        message: 'Invitation accepted successfully',
        invitation,
        player
      });
    } else if (invitation.type === 'league') {
      const league = await League.findById(invitation.league);
      if (!league) {
        return res.status(404).json({ message: 'League not found' });
      }

      // Add user as a member of the league
      if (!league.isMember(req.user._id)) {
        league.addMember(req.user._id);
        await league.save();
      }

      await invitation.populate('league', 'name description');
      await invitation.populate('invitedBy', 'firstName lastName email');

      res.json({
        message: 'Invitation accepted successfully. You can now create a team for this league.',
        invitation,
        league
      });
    } else {
      return res.status(400).json({ message: 'Invalid invitation type' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error accepting invitation', error: error.message });
  }
});

// POST /api/invitations/:id/decline - Decline an invitation
router.post('/:id/decline', authenticate, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Verify the invitation is for this user
    const userEmail = req.user.email.toLowerCase().trim();
    if (invitation.email !== userEmail && invitation.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'This invitation is not for you' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'This invitation has already been ' + invitation.status });
    }

    invitation.status = 'declined';
    invitation.declinedAt = new Date();
    invitation.user = req.user._id;
    await invitation.save();

    res.json({ message: 'Invitation declined', invitation });
  } catch (error) {
    res.status(500).json({ message: 'Error declining invitation', error: error.message });
  }
});

module.exports = router;

