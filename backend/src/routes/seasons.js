const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Season = require('../models/Season');
const Team = require('../models/Team');
const Game = require('../models/Game');
const League = require('../models/League');
const authenticate = require('../middleware/auth');

// Helper function to safely serialize a season with virtuals
function safeSerializeSeason(populatedSeason) {
  // Convert to object without virtuals to avoid issues with undefined arrays
  const seasonData = populatedSeason.toObject ? populatedSeason.toObject({ virtuals: false }) : populatedSeason;

  // Ensure all arrays exist
  const safeSeason = {
    ...seasonData,
    teams: Array.isArray(seasonData.teams) ? seasonData.teams : [],
    standings: Array.isArray(seasonData.standings) ? seasonData.standings : [],
    weeks: Array.isArray(seasonData.weeks) ? seasonData.weeks : [],
  };

  // Manually calculate virtuals with defensive checks
  const weeksArray = safeSeason.weeks || [];
  safeSeason.totalWeeks = Array.isArray(weeksArray) ? weeksArray.length : 0;
  safeSeason.completedWeeks = Array.isArray(weeksArray)
    ? weeksArray.filter(w => w && typeof w === 'object' && w.isCompleted === true).length
    : 0;
  safeSeason.progressPercentage = safeSeason.totalWeeks > 0
    ? Math.round((safeSeason.completedWeeks / safeSeason.totalWeeks) * 100)
    : 0;

  // Calculate isActive
  if (safeSeason.status === 'active' && safeSeason.startDate && safeSeason.endDate) {
    const now = new Date();
    const startDate = new Date(safeSeason.startDate);
    const endDate = new Date(safeSeason.endDate);
    safeSeason.isActive = now >= startDate && now <= endDate;
  } else {
    safeSeason.isActive = false;
  }

  return safeSeason;
}

// GET /api/seasons - Get all seasons (filtered by user's leagues and public leagues)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, league } = req.query;
    const userId = req.user._id;

    // Get leagues user belongs to
    const userLeagues = await League.find({
      $or: [
        { owner: userId },
        { members: userId }
      ]
    }).select('_id');

    // Get all public leagues
    const publicLeagues = await League.find({ isPublic: true }).select('_id');

    // Combine user leagues and public leagues
    const allLeagueIds = [
      ...userLeagues.map(l => l._id),
      ...publicLeagues.map(l => l._id)
    ];

    // Remove duplicates
    const uniqueLeagueIds = [...new Set(allLeagueIds.map(id => id.toString()))];

    // If no leagues found, return empty array
    if (uniqueLeagueIds.length === 0) {
      return res.json([]);
    }

    let query = { league: { $in: uniqueLeagueIds } };

    if (status) query.status = status;
    if (league) query.league = league;

    const seasons = await Season.find(query)
      .populate('league', 'name')
      .populate('teams', 'name city colors')
      .populate('standings.team', 'name city colors')
      .sort({ createdAt: -1 });
    
    // Ensure teams and standings arrays exist and handle virtuals safely
    const safeSeasons = seasons.map(season => {
      try {
        // Get the raw season data first without virtuals to avoid issues
        const seasonData = season.toObject ? season.toObject({ virtuals: false }) : (season || {});
        
        // Ensure seasonData exists and has required fields
        if (!seasonData || typeof seasonData !== 'object') {
          throw new Error('Invalid season data');
        }
        
        // Ensure all arrays exist before accessing them
        const teams = Array.isArray(seasonData.teams) ? seasonData.teams : (season.teams ? (Array.isArray(season.teams) ? season.teams : []) : []);
        const standings = Array.isArray(seasonData.standings) ? seasonData.standings : (season.standings ? (Array.isArray(season.standings) ? season.standings : []) : []);
        const weeks = Array.isArray(seasonData.weeks) ? seasonData.weeks : (season.weeks ? (Array.isArray(season.weeks) ? season.weeks : []) : []);
        
        // Build safe season object
        const safeSeason = {
          ...seasonData,
          teams: teams,
          standings: standings,
          weeks: weeks,
        };
        
        // Ensure standings array items have team field
        if (Array.isArray(safeSeason.standings)) {
          safeSeason.standings = safeSeason.standings.map((standing) => {
            if (!standing || typeof standing !== 'object') {
              return { team: null, gamesPlayed: 0, wins: 0, losses: 0, ties: 0, points: 0 };
            }
            if (!standing.team) standing.team = null;
            return standing;
          });
        }
        
        // Safely calculate virtuals manually
        const weeksArray = safeSeason.weeks || [];
        safeSeason.totalWeeks = Array.isArray(weeksArray) ? weeksArray.length : 0;
        safeSeason.completedWeeks = Array.isArray(weeksArray) 
          ? weeksArray.filter(w => w && typeof w === 'object' && w.isCompleted === true).length 
          : 0;
        safeSeason.progressPercentage = safeSeason.totalWeeks > 0 
          ? Math.round((safeSeason.completedWeeks / safeSeason.totalWeeks) * 100) 
          : 0;
        
        // Calculate isActive
        if (safeSeason.status === 'active' && safeSeason.startDate && safeSeason.endDate) {
          try {
            const now = new Date();
            const startDate = new Date(safeSeason.startDate);
            const endDate = new Date(safeSeason.endDate);
            safeSeason.isActive = now >= startDate && now <= endDate;
          } catch (dateError) {
            safeSeason.isActive = false;
          }
        } else {
          safeSeason.isActive = false;
        }
        
        // Ensure league is populated
        if (!safeSeason.league) {
          safeSeason.league = season.league || null;
        }
        
        return safeSeason;
      } catch (error) {
        console.error('Error processing season:', season?._id || season?.id, error.message, error.stack);
        // Return a safe default object
        return {
          _id: season?._id || season?.id || 'unknown',
          name: season?.name || 'Unknown',
          description: season?.description || '',
          teams: [],
          standings: [],
          weeks: [],
          totalWeeks: 0,
          completedWeeks: 0,
          progressPercentage: 0,
          isActive: false,
          status: season?.status || 'draft',
          startDate: season?.startDate || new Date(),
          endDate: season?.endDate || new Date(),
          league: season?.league || null,
          settings: season?.settings || {},
        };
      }
    });
    
    res.json(safeSeasons);
  } catch (error) {
    console.error('Error in GET /api/seasons:', error);
    res.status(500).json({ message: 'Error fetching seasons', error: error.message });
  }
});

// POST /api/seasons/:id/open-registration - Open season for team registration
router.post('/:id/open-registration', authenticate, async (req, res) => {
  console.log('POST /api/seasons/:id/open-registration hit with id:', req.params.id);
  try {
    const season = await Season.findById(req.params.id);

    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Check if user is a member of the league
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to open registration' });
    }

    if (season.status !== 'draft') {
      return res.status(400).json({ message: 'Can only open registration for draft seasons' });
    }

    season.status = 'registration';
    await season.save();

    const populatedSeason = await Season.findById(season._id)
      .populate('league', 'name')
      .populate('teams', 'name city colors')
      .populate('standings.team', 'name city colors');

    res.json(safeSerializeSeason(populatedSeason));
  } catch (error) {
    res.status(500).json({ message: 'Error opening registration', error: error.message });
  }
});

// POST /api/seasons/:id/register-team - Register a team for a season
router.post('/:id/register-team', authenticate, [
  body('teamId').isMongoId().withMessage('Valid team ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const season = await Season.findById(req.params.id);

    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Check if season is open for registration
    if (season.status !== 'registration') {
      return res.status(400).json({ message: 'Season is not open for registration' });
    }

    // Check if user has access to the league (public or member)
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isPublic && !league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to register teams' });
    }

    const { teamId } = req.body;

    // Verify team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if team is already registered
    const teamIds = (season.teams || []).map((t) => {
      if (typeof t === 'string') return t;
      if (t && t.toString) return t.toString();
      if (t && t._id) return t._id.toString();
      return t;
    });
    if (teamIds.includes(teamId)) {
      return res.status(400).json({ message: 'Team is already registered for this season' });
    }

    // Add team to season
    season.teams = season.teams || [];
    season.teams.push(teamId);
    await season.save();

    const populatedSeason = await Season.findById(season._id)
      .populate('league', 'name')
      .populate('teams', 'name city colors')
      .populate('standings.team', 'name city colors');

    res.json(safeSerializeSeason(populatedSeason));
  } catch (error) {
    res.status(500).json({ message: 'Error registering team', error: error.message });
  }
});

// GET /api/seasons/:id/available-teams - Get teams available for registration
router.get('/:id/available-teams', authenticate, async (req, res) => {
  try {
    const season = await Season.findById(req.params.id);
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Check if user has access to the league (public or member)
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isPublic && !league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to view available teams' });
    }

    // Get all teams
    const allTeams = await Team.find().select('name city colors players captain');
    
    // Get teams already registered to this season
    const registeredTeamIds = (season.teams || []).map((t) => {
      if (typeof t === 'string') return t;
      if (t && t.toString) return t.toString();
      if (t && t._id) return t._id.toString();
      return t;
    });

    // Filter out teams that are already registered
    const availableTeams = allTeams.filter(team => {
      const teamId = team._id.toString();
      return !registeredTeamIds.includes(teamId);
    });

    res.json(availableTeams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available teams', error: error.message });
  }
});

// GET /api/seasons/:id - Get season by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const season = await Season.findById(req.params.id)
      .populate('league', 'name owner members')
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

    // Check if user is a member of the league or league is public
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isPublic && !league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to view seasons' });
    }
    
    res.json(safeSerializeSeason(season));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching season', error: error.message });
  }
});

// POST /api/seasons - Create new season
router.post('/', authenticate, [
  body('name').notEmpty().withMessage('Season name is required'),
  body('league').notEmpty().withMessage('League is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('teams').isArray({ min: 2 }).withMessage('At least 2 teams are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Validate league exists and user is a member (can't create seasons in public leagues you're not a member of)
    const league = await League.findById(req.body.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to create seasons' });
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
      .populate('league', 'name')
      .populate('teams', 'name city colors')
      .populate('standings.team', 'name city colors');
    
    res.status(201).json(safeSerializeSeason(populatedSeason));
  } catch (error) {
    res.status(500).json({ message: 'Error creating season', error: error.message });
  }
});

// PUT /api/seasons/:id - Update season
router.put('/:id', authenticate, [
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

    const season = await Season.findById(req.params.id);
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Check if user is a member of the league (can't update seasons in leagues you're not a member of)
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to update seasons' });
    }

    Object.assign(season, req.body);
    await season.save();
    
    const populatedSeason = await Season.findById(season._id)
      .populate('league', 'name')
      .populate('teams', 'name city colors')
      .populate('standings.team', 'name city colors');
    
    res.json(safeSerializeSeason(populatedSeason));
  } catch (error) {
    res.status(500).json({ message: 'Error updating season', error: error.message });
  }
});

// POST /api/seasons/:id/generate-schedule - Generate season schedule
router.post('/:id/generate-schedule', authenticate, async (req, res) => {
  try {
    const season = await Season.findById(req.params.id);
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Check if user is a member of the league (can't generate schedules in leagues you're not a member of)
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to generate schedules' });
    }

    if (season.status !== 'draft' && season.status !== 'registration') {
      return res.status(400).json({ message: 'Can only generate schedule for draft or registration seasons' });
    }

    if (!season.teams || season.teams.length < 2) {
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
          scheduledDate: new Date(weekStart.getTime() + (12 * 60 * 60 * 1000)), // 12 PM on week start (tentative)
          venue: {
            name: 'TBD',
            address: '',
            capacity: 0
          },
          status: 'pending'
        });
        
        await game.save();
        console.log(`Created game: ${game._id} for season ${season._id} (${season.name}) - ${matchup.home.name} vs ${matchup.away.name} on ${game.scheduledDate}`);
        console.log(`Game season field: ${game.season}, type: ${typeof game.season}`);
        
        // Add the game ID to the week's games array
        week.games.push(game._id);
      }
      
      currentWeekStart = new Date(weekEnd.getTime() + 1);
    }

    // Clear the temporary schedule data
    delete season._scheduleData;
    await season.save();
    
    // Log the created games for debugging
    const totalGames = season.weeks.reduce((total, week) => total + (week.games?.length || 0), 0);
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
    
    res.json(safeSerializeSeason(populatedSeason));
  } catch (error) {
    res.status(500).json({ message: 'Error generating schedule', error: error.message });
  }
});

// POST /api/seasons/:id/regenerate-schedule - Regenerate season schedule (delete existing games and regenerate)
router.post('/:id/regenerate-schedule', authenticate, async (req, res) => {
  try {
    const season = await Season.findById(req.params.id);
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Check if user is the owner of the league
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (league.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the league owner can regenerate schedules' });
    }

    if (season.status === 'active') {
      return res.status(400).json({ message: 'Cannot regenerate schedule for active season' });
    }

    if (!season.teams || season.teams.length < 2) {
      return res.status(400).json({ message: 'At least 2 teams are required to generate schedule' });
    }

    // Delete all existing games for this season
    await Game.deleteMany({ season: season._id });

    // Clear existing weeks
    season.weeks = [];

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
          scheduledDate: new Date(weekStart.getTime() + (12 * 60 * 60 * 1000)), // 12 PM on week start (tentative)
          venue: {
            name: 'TBD',
            address: '',
            capacity: 0
          },
          status: 'pending'
        });
        
        await game.save();
        
        // Add the game ID to the week's games array
        week.games.push(game._id);
      }
      
      currentWeekStart = new Date(weekEnd.getTime() + 1);
    }

    // Clear the temporary schedule data
    delete season._scheduleData;
    await season.save();
    
    // Log the created games for debugging
    const totalGames = season.weeks.reduce((total, week) => total + (week.games?.length || 0), 0);
    console.log(`Regenerated ${totalGames} games for season ${season.name}`);
    
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
    
    res.json(safeSerializeSeason(populatedSeason));
  } catch (error) {
    res.status(500).json({ message: 'Error regenerating schedule', error: error.message });
  }
});

// POST /api/seasons/:id/start - Start the season
router.post('/:id/start', authenticate, async (req, res) => {
  try {
    const season = await Season.findById(req.params.id);
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Check if user is a member of the league (can't start seasons in leagues you're not a member of)
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to start seasons' });
    }

    if (season.status !== 'draft' && season.status !== 'registration') {
      return res.status(400).json({ message: 'Can only start draft or registration seasons' });
    }

    if (!season.weeks || season.weeks.length === 0) {
      return res.status(400).json({ message: 'Must generate schedule before starting season' });
    }

    season.status = 'active';
    await season.save();
    
    const populatedSeason = await Season.findById(season._id)
      .populate('teams', 'name city colors')
      .populate('standings.team', 'name city colors');
    
    res.json(safeSerializeSeason(populatedSeason));
  } catch (error) {
    res.status(500).json({ message: 'Error starting season', error: error.message });
  }
});

// POST /api/seasons/:id/complete - Complete the season
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const season = await Season.findById(req.params.id);
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Check if user is a member of the league (can't complete seasons in leagues you're not a member of)
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to complete seasons' });
    }

    if (season.status !== 'active') {
      return res.status(400).json({ message: 'Can only complete active seasons' });
    }

    season.status = 'completed';
    await season.save();
    
    const populatedSeason = await Season.findById(season._id)
      .populate('teams', 'name city colors')
      .populate('standings.team', 'name city colors');
    
    res.json(safeSerializeSeason(populatedSeason));
  } catch (error) {
    res.status(500).json({ message: 'Error completing season', error: error.message });
  }
});

// GET /api/seasons/:id/standings - Get season standings
router.get('/:id/standings', authenticate, async (req, res) => {
  try {
    const season = await Season.findById(req.params.id)
      .populate('standings.team', 'name city colors');
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Check if user is a member of the league or league is public
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isPublic && !league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to view standings' });
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
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const season = await Season.findById(req.params.id);
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Check if user is a member of the league (can't delete seasons in leagues you're not a member of)
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to delete seasons' });
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

// GET /api/seasons/:id/venues - Get venues for a season
router.get('/:id/venues', authenticate, async (req, res) => {
  try {
    const season = await Season.findById(req.params.id)
      .populate('venues');
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Check if user has access to the league
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isPublic && !league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to view venues' });
    }

    res.json(season.venues || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching venues', error: error.message });
  }
});

// POST /api/seasons/:id/venues - Add venue to season
router.post('/:id/venues', authenticate, [
  body('venueId').isMongoId().withMessage('Valid venue ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const season = await Season.findById(req.params.id);
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Check if user is a member of the league
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to manage venues' });
    }

    const { venueId } = req.body;

    // Verify venue exists
    const Venue = require('../models/Venue');
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    // Check if venue is already added
    if (season.venues && season.venues.includes(venueId)) {
      return res.status(400).json({ message: 'Venue is already associated with this season' });
    }

    // Add venue to season
    season.venues = season.venues || [];
    season.venues.push(venueId);
    await season.save();

    const populatedSeason = await Season.findById(season._id)
      .populate('venues')
      .populate('league', 'name');

    res.json(populatedSeason.venues);
  } catch (error) {
    res.status(500).json({ message: 'Error adding venue to season', error: error.message });
  }
});

// DELETE /api/seasons/:id/venues/:venueId - Remove venue from season
router.delete('/:id/venues/:venueId', authenticate, async (req, res) => {
  try {
    const season = await Season.findById(req.params.id);
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Check if user is a member of the league
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to manage venues' });
    }

    const { venueId } = req.params;

    // Remove venue from season
    season.venues = (season.venues || []).filter(v => v.toString() !== venueId);
    await season.save();

    res.json({ message: 'Venue removed from season successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing venue from season', error: error.message });
  }
});

module.exports = router;
