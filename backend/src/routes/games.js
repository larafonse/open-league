const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Game = require('../models/Game');
const Team = require('../models/Team');

// GET /api/games - Get all games
router.get('/', async (req, res) => {
  try {
    const { status, team, date } = req.query;
    let query = {};

    if (status) query.status = status;
    if (team) {
      query.$or = [
        { homeTeam: team },
        { awayTeam: team }
      ];
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.scheduledDate = { $gte: startDate, $lt: endDate };
    }

    const games = await Game.find(query)
      .populate('homeTeam', 'name city colors')
      .populate('awayTeam', 'name city colors')
      .sort({ scheduledDate: 1 });
    
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching games', error: error.message });
  }
});

// GET /api/games/:id - Get game by ID
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('homeTeam', 'name city colors')
      .populate('awayTeam', 'name city colors')
      .populate('events.player', 'firstName lastName');
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching game', error: error.message });
  }
});

// POST /api/games - Create new game
router.post('/', [
  body('homeTeam').isMongoId().withMessage('Valid home team ID is required'),
  body('awayTeam').isMongoId().withMessage('Valid away team ID is required'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('venue.name').notEmpty().withMessage('Venue name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if teams exist
    const homeTeam = await Team.findById(req.body.homeTeam);
    const awayTeam = await Team.findById(req.body.awayTeam);

    if (!homeTeam || !awayTeam) {
      return res.status(400).json({ message: 'One or both teams not found' });
    }

    if (homeTeam._id.toString() === awayTeam._id.toString()) {
      return res.status(400).json({ message: 'Home and away teams cannot be the same' });
    }

    const game = new Game(req.body);
    await game.save();
    
    const populatedGame = await Game.findById(game._id)
      .populate('homeTeam', 'name city colors')
      .populate('awayTeam', 'name city colors');
    
    res.status(201).json(populatedGame);
  } catch (error) {
    res.status(500).json({ message: 'Error creating game', error: error.message });
  }
});

// PUT /api/games/:id - Update game
router.put('/:id', [
  body('homeTeam').optional().isMongoId().withMessage('Valid home team ID is required'),
  body('awayTeam').optional().isMongoId().withMessage('Valid away team ID is required'),
  body('scheduledDate').optional().isISO8601().withMessage('Valid scheduled date is required'),
  body('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'])
    .withMessage('Valid status is required'),
  body('score.homeTeam').optional().isInt({ min: 0 }).withMessage('Home team score must be non-negative'),
  body('score.awayTeam').optional().isInt({ min: 0 }).withMessage('Away team score must be non-negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const game = await Game.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // If game is completed, update team statistics
    if (game.status === 'completed') {
      await updateTeamStats(game);
    }
    
    const populatedGame = await Game.findById(game._id)
      .populate('homeTeam', 'name city colors')
      .populate('awayTeam', 'name city colors');
    
    res.json(populatedGame);
  } catch (error) {
    res.status(500).json({ message: 'Error updating game', error: error.message });
  }
});

// DELETE /api/games/:id - Delete game
router.delete('/:id', async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting game', error: error.message });
  }
});

// POST /api/games/:id/events - Add event to game
router.post('/:id/events', [
  body('type').isIn(['goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'penalty', 'own_goal'])
    .withMessage('Valid event type is required'),
  body('player').isMongoId().withMessage('Valid player ID is required'),
  body('team').isMongoId().withMessage('Valid team ID is required'),
  body('minute').isInt({ min: 0, max: 120 }).withMessage('Minute must be between 0 and 120')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (game.status !== 'in_progress' && game.status !== 'completed') {
      return res.status(400).json({ message: 'Can only add events to games in progress or completed' });
    }

    game.events.push(req.body);
    await game.save();

    res.json({ message: 'Event added successfully', event: req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error adding event', error: error.message });
  }
});

// Helper function to update team statistics
async function updateTeamStats(game) {
  const homeTeam = await Team.findById(game.homeTeam);
  const awayTeam = await Team.findById(game.awayTeam);

  if (!homeTeam || !awayTeam) return;

  const homeScore = game.score.homeTeam;
  const awayScore = game.score.awayTeam;

  // Update home team stats
  homeTeam.pointsFor += homeScore;
  homeTeam.pointsAgainst += awayScore;
  
  if (homeScore > awayScore) {
    homeTeam.wins += 1;
  } else if (homeScore < awayScore) {
    homeTeam.losses += 1;
  } else {
    homeTeam.ties += 1;
  }
  await homeTeam.save();

  // Update away team stats
  awayTeam.pointsFor += awayScore;
  awayTeam.pointsAgainst += homeScore;
  
  if (awayScore > homeScore) {
    awayTeam.wins += 1;
  } else if (awayScore < homeScore) {
    awayTeam.losses += 1;
  } else {
    awayTeam.ties += 1;
  }
  await awayTeam.save();
}

module.exports = router;
