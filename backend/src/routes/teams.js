const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Team = require('../models/Team');
const Player = require('../models/Player');
const User = require('../models/User');
const authenticate = require('../middleware/auth');

// GET /api/teams - Get all teams
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('players', 'firstName lastName position jerseyNumber')
      .populate('captain', 'firstName lastName')
      .populate('coach', 'firstName lastName email')
      .sort({ name: 1 });
    
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teams', error: error.message });
  }
});

// GET /api/teams/:id - Get team by ID
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('players', 'firstName lastName position jerseyNumber stats')
      .populate('captain', 'firstName lastName')
      .populate('coach', 'firstName lastName email');
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team', error: error.message });
  }
});

// POST /api/teams - Create new team
router.post('/', authenticate, [
  body('name').notEmpty().withMessage('Team name is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('colors.primary').isHexColor().withMessage('Primary color must be a valid hex color'),
  body('colors.secondary').isHexColor().withMessage('Secondary color must be a valid hex color'),
  body('coach').optional().isMongoId().withMessage('Coach must be a valid user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // If coach is provided, verify it exists
    let coachId = req.body.coach;
    if (coachId) {
      const coach = await User.findById(coachId);
      if (!coach) {
        return res.status(400).json({ message: 'Coach user not found' });
      }
    } else {
      // Default to the creator if no coach is specified
      coachId = req.user._id;
    }

    const teamData = {
      ...req.body,
      coach: coachId
    };

    const team = new Team(teamData);
    await team.save();
    
    // Populate coach before returning
    await team.populate('coach', 'firstName lastName email');
    
    res.status(201).json(team);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Team name already exists' });
    } else {
      res.status(500).json({ message: 'Error creating team', error: error.message });
    }
  }
});

// PUT /api/teams/:id - Update team
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Team name cannot be empty'),
  body('city').optional().notEmpty().withMessage('City cannot be empty'),
  body('colors.primary').optional().isHexColor().withMessage('Primary color must be a valid hex color'),
  body('colors.secondary').optional().isHexColor().withMessage('Secondary color must be a valid hex color'),
  body('coach').optional().isMongoId().withMessage('Coach must be a valid user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // If coach is being updated, verify it exists
    if (req.body.coach) {
      const coach = await User.findById(req.body.coach);
      if (!coach) {
        return res.status(400).json({ message: 'Coach user not found' });
      }
    }

    const team = await Team.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('coach', 'firstName lastName email');
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.json(team);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Team name already exists' });
    } else {
      res.status(500).json({ message: 'Error updating team', error: error.message });
    }
  }
});

// DELETE /api/teams/:id - Delete team
router.delete('/:id', async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Remove team reference from players
    await Player.updateMany(
      { team: req.params.id },
      { $unset: { team: 1 } }
    );
    
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting team', error: error.message });
  }
});

// POST /api/teams/:id/players - Add player to team
router.post('/:id/players', authenticate, [
  body('playerId').isMongoId().withMessage('Valid player ID is required')
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

    // For coach/player users, verify they are the coach of the team
    if (req.user.userType === 'coach_player') {
      const teamCoachId = team.coach ? (typeof team.coach === 'object' ? team.coach._id.toString() : team.coach.toString()) : null;
      if (teamCoachId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only add players to teams that you coach' });
      }
    }
    // League admins can add players to any team

    const player = await Player.findById(req.body.playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    if (player.team) {
      return res.status(400).json({ message: 'Player is already on a team' });
    }

    player.team = team._id;
    await player.save();

    team.players.push(player._id);
    await team.save();

    res.json({ message: 'Player added to team successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding player to team', error: error.message });
  }
});

// DELETE /api/teams/:id/players/:playerId - Remove player from team
router.delete('/:id/players/:playerId', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const player = await Player.findById(req.params.playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    player.team = null;
    player.isCaptain = false;
    await player.save();

    team.players = team.players.filter(p => p.toString() !== req.params.playerId);
    if (team.captain && team.captain.toString() === req.params.playerId) {
      team.captain = null;
    }
    await team.save();

    res.json({ message: 'Player removed from team successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing player from team', error: error.message });
  }
});

module.exports = router;
