const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Season = require('../models/Season');
const Team = require('../models/Team');
const Game = require('../models/Game');

// GET /api/seasons - Get all seasons
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status) query.status = status;

    const seasons = await Season.find(query)
      .populate('teams', 'name city colors')
      .populate('standings.team', 'name city colors')
      .sort({ createdAt: -1 });
    
    res.json(seasons);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching seasons', error: error.message });
  }
});

// GET /api/seasons/:id - Get season by ID
router.get('/:id', async (req, res) => {
  try {
    const season = await Season.findById(req.params.id)
      .populate('teams', 'name city colors')
      .populate('standings.team', 'name city colors')
      .populate({
        path: 'weeks.games',
        populate: {
          path: 'homeTeam awayTeam',
          select: 'name city colors'
        }
      });
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }
    
    res.json(season);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching season', error: error.message });
  }
});

// POST /api/seasons - Create new season
router.post('/', [
  body('name').notEmpty().withMessage('Season name is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('teams').isArray({ min: 2 }).withMessage('At least 2 teams are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Validate dates
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    
    if (endDate <= startDate) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Validate teams exist
    const teams = await Team.find({ _id: { $in: req.body.teams } });
    if (teams.length !== req.body.teams.length) {
      return res.status(400).json({ message: 'One or more teams not found' });
    }

    const season = new Season(req.body);
    await season.save();
    
    const populatedSeason = await Season.findById(season._id)
      .populate('teams', 'name city colors')
      .populate('standings.team', 'name city colors');
    
    res.status(201).json(populatedSeason);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Season name already exists' });
    } else {
      res.status(500).json({ message: 'Error creating season', error: error.message });
    }
  }
});

// PUT /api/seasons/:id - Update season
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Season name cannot be empty'),
  body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  body('status').optional().isIn(['draft', 'active', 'completed', 'cancelled'])
    .withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const season = await Season.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }
    
    const populatedSeason = await Season.findById(season._id)
      .populate('teams', 'name city colors')
      .populate('standings.team', 'name city colors');
    
    res.json(populatedSeason);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Season name already exists' });
    } else {
      res.status(500).json({ message: 'Error updating season', error: error.message });
    }
  }
});

// POST /api/seasons/:id/generate-schedule - Generate season schedule
router.post('/:id/generate-schedule', async (req, res) => {
  try {
    const season = await Season.findById(req.params.id);
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    if (season.status !== 'draft') {
      return res.status(400).json({ message: 'Can only generate schedule for draft seasons' });
    }

    if (season.teams.length < 2) {
      return res.status(400).json({ message: 'At least 2 teams are required to generate schedule' });
    }

    // Generate the schedule
    season.generateSchedule();
    await season.save();

    // Create actual Game documents for each scheduled game
    const schedule = season._scheduleData;
    const weekDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    let currentWeekStart = new Date(season.startDate);

    for (let weekIndex = 0; weekIndex < schedule.length; weekIndex++) {
      const weekMatchups = schedule[weekIndex];
      const weekStart = new Date(currentWeekStart);
      const weekEnd = new Date(currentWeekStart.getTime() + weekDuration - 1);
      
      const week = season.weeks[weekIndex];
      
      for (let matchup of weekMatchups) {
        const game = new Game({
          season: season._id,
          homeTeam: matchup.home,
          awayTeam: matchup.away,
          scheduledDate: new Date(weekStart.getTime() + (12 * 60 * 60 * 1000)), // 12 PM on week start
          venue: {
            name: 'TBD',
            address: '',
            capacity: 0
          },
          status: 'scheduled'
        });
        
        await game.save();
        console.log(`Created game: ${matchup.home.name} vs ${matchup.away.name} on ${game.scheduledDate}`);
        
        // Add the game ID to the week's games array
        week.games.push(game._id);
      }
      
      currentWeekStart = new Date(weekEnd.getTime() + 1);
    }

    // Clear the temporary schedule data
    delete season._scheduleData;
    await season.save();
    
    // Log the created games for debugging
    const totalGames = season.weeks.reduce((total, week) => total + week.games.length, 0);
    console.log(`Created ${totalGames} games for season ${season.name}`);
    
    const populatedSeason = await Season.findById(season._id)
      .populate('teams', 'name city colors')
      .populate('standings.team', 'name city colors')
      .populate({
        path: 'weeks.games',
        populate: {
          path: 'homeTeam awayTeam',
          select: 'name city colors'
        }
      });
    
    res.json(populatedSeason);
  } catch (error) {
    res.status(500).json({ message: 'Error generating schedule', error: error.message });
  }
});

// POST /api/seasons/:id/start - Start the season
router.post('/:id/start', async (req, res) => {
  try {
    const season = await Season.findById(req.params.id);
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    if (season.status !== 'draft') {
      return res.status(400).json({ message: 'Can only start draft seasons' });
    }

    if (season.weeks.length === 0) {
      return res.status(400).json({ message: 'Must generate schedule before starting season' });
    }

    season.status = 'active';
    await season.save();
    
    const populatedSeason = await Season.findById(season._id)
      .populate('teams', 'name city colors')
      .populate('standings.team', 'name city colors');
    
    res.json(populatedSeason);
  } catch (error) {
    res.status(500).json({ message: 'Error starting season', error: error.message });
  }
});

// POST /api/seasons/:id/complete - Complete the season
router.post('/:id/complete', async (req, res) => {
  try {
    const season = await Season.findById(req.params.id);
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    if (season.status !== 'active') {
      return res.status(400).json({ message: 'Can only complete active seasons' });
    }

    season.status = 'completed';
    await season.save();
    
    const populatedSeason = await Season.findById(season._id)
      .populate('teams', 'name city colors')
      .populate('standings.team', 'name city colors');
    
    res.json(populatedSeason);
  } catch (error) {
    res.status(500).json({ message: 'Error completing season', error: error.message });
  }
});

// GET /api/seasons/:id/standings - Get season standings
router.get('/:id/standings', async (req, res) => {
  try {
    const season = await Season.findById(req.params.id)
      .populate('standings.team', 'name city colors');
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Sort standings by points (desc), then by point differential (desc), then by wins (desc)
    const sortedStandings = season.standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.pointsFor - b.pointsAgainst !== a.pointsFor - a.pointsAgainst) {
        return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
      }
      return b.wins - a.wins;
    });

    // Add position
    const standingsWithPosition = sortedStandings.map((standing, index) => ({
      ...standing.toObject(),
      position: index + 1
    }));
    
    res.json(standingsWithPosition);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching standings', error: error.message });
  }
});

// DELETE /api/seasons/:id - Delete season
router.delete('/:id', async (req, res) => {
  try {
    const season = await Season.findById(req.params.id);
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    if (season.status === 'active') {
      return res.status(400).json({ message: 'Cannot delete active season' });
    }

    // Delete all games associated with this season
    await Game.deleteMany({ season: season._id });

    await Season.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Season deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting season', error: error.message });
  }
});

module.exports = router;
