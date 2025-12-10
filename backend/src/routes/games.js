const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Game = require('../models/Game');
const Team = require('../models/Team');
const Player = require('../models/Player');

// Debug endpoint to check all games
router.get('/debug', async (req, res) => {
  try {
    console.log('Debug endpoint called');
    console.log('Game model:', Game);
    console.log('Game model type:', typeof Game);
    
    // Test if Game model has find method
    if (typeof Game.find !== 'function') {
      return res.status(500).json({ 
        message: 'Game model does not have find method', 
        gameModel: Game 
      });
    }
    
    const allGames = await Game.find({});
    console.log('Raw games:', allGames);
    console.log('Raw games count:', allGames ? allGames.length : 'undefined');
    
    // Test populate
    console.log('Testing populate...');
    const populatedGames = await Game.find({}).populate('homeTeam', 'name');
    console.log('Populated games:', populatedGames);
    console.log('First populated game:', populatedGames[0]);
    
    // Test if Team model works
    console.log('Testing Team model...');
    const team = await Team.findById('69017cf48f0f2b5e2b32fafa');
    console.log('Team found:', team);
    
    res.json({ 
      count: allGames ? allGames.length : 0, 
      games: allGames || [],
      populatedGames: populatedGames || [],
      message: 'Debug successful'
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ message: 'Error fetching games', error: error.message });
  }
});

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

    console.log('Games API query:', query);
    
    // Get games without populate first
    const rawGames = await Game.find(query).sort({ scheduledDate: 1 });
    console.log(`Found ${rawGames.length} raw games`);
    
    // Manually populate games since populate is not working
    console.log('Manually populating games...');
    const manuallyPopulatedGames = await Promise.all(rawGames.map(async (game) => {
      const homeTeam = await Team.findById(game.homeTeam);
      const awayTeam = await Team.findById(game.awayTeam);
      let season = null;
      if (game.season) {
        season = await require('../models/Season').findById(game.season);
        if (!season) {
          console.log(`Warning: Game ${game._id} has season ID ${game.season} but season not found`);
        }
      } else {
        console.log(`Warning: Game ${game._id} has no season field`);
      }
      
      // Populate events.player and events.team
      const populatedEvents = await Promise.all((game.events || []).map(async (event) => {
        let player = null;
        let team = null;
        
        if (event.player) {
          player = await Player.findById(event.player);
        }
        if (event.team) {
          team = await Team.findById(event.team);
        }
        
        return {
          ...event.toObject ? event.toObject() : event,
          player: player ? { 
            _id: player._id, 
            firstName: player.firstName, 
            lastName: player.lastName, 
            jerseyNumber: player.jerseyNumber 
          } : event.player,
          team: team ? { 
            _id: team._id, 
            name: team.name, 
            city: team.city 
          } : event.team
        };
      }));
      
      return {
        ...game.toObject(),
        homeTeam: homeTeam ? { _id: homeTeam._id, name: homeTeam.name, city: homeTeam.city, colors: homeTeam.colors } : null,
        awayTeam: awayTeam ? { _id: awayTeam._id, name: awayTeam.name, city: awayTeam.city, colors: awayTeam.colors } : null,
        season: season ? { _id: season._id, name: season.name, status: season.status } : (game.season ? { _id: game.season } : null),
        events: populatedEvents
      };
    }));
    
    console.log('Manually populated games:', manuallyPopulatedGames.length);
    console.log('First manually populated game:', manuallyPopulatedGames[0] ? {
      homeTeam: manuallyPopulatedGames[0].homeTeam,
      awayTeam: manuallyPopulatedGames[0].awayTeam,
      season: manuallyPopulatedGames[0].season
    } : 'No games');
    
    res.json(manuallyPopulatedGames);
  } catch (error) {
    console.error('Games API error:', error);
    res.status(500).json({ message: 'Error fetching games', error: error.message });
  }
});

// GET /api/games/:id - Get game by ID
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('homeTeam', 'name city colors')
      .populate('awayTeam', 'name city colors')
      .populate('events.player', 'firstName lastName jerseyNumber')
      .populate('events.team', 'name city');
    
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
      .populate('awayTeam', 'name city colors')
      .populate('season', 'name status');
    
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
  body('status').optional().isIn(['pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'])
    .withMessage('Valid status is required'),
  body('score.homeTeam').optional().isInt({ min: 0 }).withMessage('Home team score must be non-negative'),
  body('score.awayTeam').optional().isInt({ min: 0 }).withMessage('Away team score must be non-negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get the old game to check previous status
    const oldGame = await Game.findById(req.params.id);
    
    const game = await Game.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // If game is pending and venue/time are set, automatically change to scheduled
    if (game.status === 'pending' && game.venue && game.venue.name && game.venue.name !== 'TBD' && game.scheduledDate) {
      game.status = 'scheduled';
      await game.save();
    }

    // If game is completed and wasn't completed before, update team and player statistics
    if (game.status === 'completed' && (!oldGame || oldGame.status !== 'completed')) {
      await updateTeamStats(game);
      await updatePlayerStats(game);
    }
    
    const populatedGame = await Game.findById(game._id)
      .populate('homeTeam', 'name city colors')
      .populate('awayTeam', 'name city colors')
      .populate('season', 'name status');
    
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

    const game = await Game.findById(req.params.id)
      .populate('homeTeam', 'name city')
      .populate('awayTeam', 'name city');
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (game.status !== 'in_progress' && game.status !== 'completed') {
      return res.status(400).json({ message: 'Can only add events to games in progress or completed' });
    }

    const eventType = req.body.type;
    const playerId = req.body.player;
    const teamId = req.body.team.toString();
    const isHomeTeam = game.homeTeam._id.toString() === teamId;

    // Check for yellow card auto-conversion to red card
    if (eventType === 'yellow_card') {
      // Count existing yellow cards for this player in this game
      const yellowCardCount = game.events.filter(e => 
        e.type === 'yellow_card' && 
        e.player.toString() === playerId.toString()
      ).length;

      // If player already has 1 yellow card, convert to red card instead
      if (yellowCardCount >= 1) {
        // Add red card event instead
        game.events.push({
          ...req.body,
          type: 'red_card',
          description: req.body.description || 'Second yellow card (automatic red card)'
        });
      } else {
        // Add yellow card normally
        game.events.push(req.body);
      }
    } else {
      // Add other events normally
      game.events.push(req.body);
    }

    // Update score for goal events
    if (eventType === 'goal' || eventType === 'own_goal') {
      if (eventType === 'goal') {
        // Regular goal: increment the scoring team's score
        if (isHomeTeam) {
          game.score.homeTeam = (game.score.homeTeam || 0) + 1;
        } else {
          game.score.awayTeam = (game.score.awayTeam || 0) + 1;
        }
      } else {
        // Own goal: increment the opposing team's score
        if (isHomeTeam) {
          game.score.awayTeam = (game.score.awayTeam || 0) + 1;
        } else {
          game.score.homeTeam = (game.score.homeTeam || 0) + 1;
        }
      }
    }

    await game.save();

    // Update player stats when event is added (if game is completed)
    if (game.status === 'completed') {
      await updatePlayerStatsForEvent(game, eventType, playerId);
    }

    // Return updated game with populated events
    const updatedGame = await Game.findById(game._id)
      .populate('homeTeam', 'name city colors')
      .populate('awayTeam', 'name city colors')
      .populate('season', 'name status')
      .populate('events.player', 'firstName lastName jerseyNumber')
      .populate('events.team', 'name city');

    res.json({ 
      message: 'Event added successfully', 
      game: updatedGame 
    });
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

// Helper function to update player statistics based on game events
// This processes all events in the game when it's marked as completed
async function updatePlayerStats(game) {
  if (!game.events || game.events.length === 0) return;

  // Get all unique players who participated in this game
  const playerIds = new Set();
  const eventStats = new Map(); // Track stats per player to batch updates

  // Process all events and aggregate stats
  for (const event of game.events) {
    if (!event.player) continue;
    
    const playerId = event.player.toString();
    playerIds.add(playerId);

    if (!eventStats.has(playerId)) {
      eventStats.set(playerId, {
        gamesPlayed: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0
      });
    }

    const stats = eventStats.get(playerId);
    
    switch (event.type) {
      case 'goal':
        stats.goals += 1;
        break;
      case 'assist':
        stats.assists += 1;
        break;
      case 'yellow_card':
        stats.yellowCards += 1;
        break;
      case 'red_card':
        stats.redCards += 1;
        break;
    }
  }

  // Update all players who participated (increment gamesPlayed once per player)
  for (const playerId of playerIds) {
    const player = await Player.findById(playerId);
    if (!player) continue;

    const stats = eventStats.get(playerId);
    
    // Initialize stats if they don't exist
    if (!player.stats) {
      player.stats = {
        gamesPlayed: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0
      };
    }

    // Increment gamesPlayed (once per player per game)
    player.stats.gamesPlayed = (player.stats.gamesPlayed || 0) + 1;
    
    // Update event-based stats
    player.stats.goals = (player.stats.goals || 0) + stats.goals;
    player.stats.assists = (player.stats.assists || 0) + stats.assists;
    player.stats.yellowCards = (player.stats.yellowCards || 0) + stats.yellowCards;
    player.stats.redCards = (player.stats.redCards || 0) + stats.redCards;
    
    await player.save();
  }
}

// Helper function to update player stats for a single event (when event is added to completed game)
async function updatePlayerStatsForEvent(game, eventType, playerId) {
  const player = await Player.findById(playerId);
  if (!player) return;

  // Update gamesPlayed if this is the first event for this player in this game
  const playerEventsInGame = game.events.filter(e => 
    e.player && e.player.toString() === playerId.toString()
  );
  
  // If this is the first event for this player, increment gamesPlayed
  if (playerEventsInGame.length === 1) {
    player.stats.gamesPlayed = (player.stats.gamesPlayed || 0) + 1;
  }

  // Update stats based on event type
  switch (eventType) {
    case 'goal':
      player.stats.goals = (player.stats.goals || 0) + 1;
      break;
    case 'assist':
      player.stats.assists = (player.stats.assists || 0) + 1;
      break;
    case 'yellow_card':
      player.stats.yellowCards = (player.stats.yellowCards || 0) + 1;
      break;
    case 'red_card':
      player.stats.redCards = (player.stats.redCards || 0) + 1;
      break;
  }
  
  await player.save();
}

module.exports = router;
