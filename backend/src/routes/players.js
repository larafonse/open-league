const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Player = require('../models/Player');
const Team = require('../models/Team');

// GET /api/players - Get all players
router.get('/', async (req, res) => {
  try {
    const { team, position, isActive } = req.query;
    let query = {};

    if (team) query.team = team;
    if (position) query.position = position;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const players = await Player.find(query)
      .populate('team', 'name city')
      .sort({ lastName: 1, firstName: 1 });
    
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching players', error: error.message });
  }
});

// GET /api/players/:id - Get player by ID
router.get('/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id)
      .populate('team', 'name city colors');
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    res.json(player);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching player', error: error.message });
  }
});

// POST /api/players - Create new player
router.post('/', [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('position').isIn(['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Coach', 'Manager'])
    .withMessage('Valid position is required'),
  body('jerseyNumber').optional().isInt({ min: 1, max: 99 }).withMessage('Jersey number must be between 1 and 99')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const player = new Player(req.body);
    await player.save();
    
    res.status(201).json(player);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Error creating player', error: error.message });
    }
  }
});

// PUT /api/players/:id - Update player
router.put('/:id', [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth is required'),
  body('position').optional().isIn(['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Coach', 'Manager'])
    .withMessage('Valid position is required'),
  body('jerseyNumber').optional().isInt({ min: 1, max: 99 }).withMessage('Jersey number must be between 1 and 99')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const player = await Player.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    res.json(player);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Error updating player', error: error.message });
    }
  }
});

// DELETE /api/players/:id - Delete player
router.delete('/:id', async (req, res) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Remove player from team if they were on one
    if (player.team) {
      await Team.findByIdAndUpdate(
        player.team,
        { 
          $pull: { players: player._id },
          $unset: { captain: player.isCaptain ? 1 : 0 }
        }
      );
    }
    
    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting player', error: error.message });
  }
});

// PUT /api/players/:id/captain - Set player as team captain
router.put('/:id/captain', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    if (!player.team) {
      return res.status(400).json({ message: 'Player must be on a team to be captain' });
    }

    // Remove captain status from current captain
    await Player.updateOne(
      { team: player.team, isCaptain: true },
      { isCaptain: false }
    );

    // Set new captain
    player.isCaptain = true;
    await player.save();

    // Update team captain reference
    await Team.findByIdAndUpdate(player.team, { captain: player._id });

    res.json({ message: 'Player set as captain successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error setting captain', error: error.message });
  }
});

module.exports = router;
