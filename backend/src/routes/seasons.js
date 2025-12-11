const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Season = require('../models/Season');
const Team = require('../models/Team');
const Game = require('../models/Game');
const League = require('../models/League');
const Player = require('../models/Player');
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

    // For coach/player users, verify they are the coach of the team
    if (req.user.userType === 'coach_player') {
      const teamCoachId = team.coach ? (typeof team.coach === 'object' ? team.coach._id.toString() : team.coach.toString()) : null;
      if (teamCoachId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only register teams that you coach' });
      }
    }
    // League admins can register any team

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
    
    // Get teams already registered to this season
    const registeredTeamIds = (season.teams || []).map((t) => {
      if (typeof t === 'string') return t;
      if (t && t.toString) return t.toString();
      if (t && t._id) return t._id.toString();
      return t;
    });

    // For coach/player users, only show teams they coach
    // For league admins, show all teams
    let query = {};
    if (req.user.userType === 'coach_player') {
      query.coach = req.user._id;
    }
    
    const allTeams = await Team.find(query)
      .populate('coach', 'firstName lastName email')
      .select('name city colors players captain coach');

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
      .populate('playerRegistrations.player', 'firstName lastName email jerseyNumber position')
      .populate('playerRegistrations.team', 'name city colors')
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
  body('teams').optional({ nullable: true, checkFalsy: true }).isArray().withMessage('Teams must be an array')
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

    // Validate teams exist (if provided)
    const teamsArray = req.body.teams || [];
    if (teamsArray.length > 0) {
      const teams = await Team.find({ _id: { $in: teamsArray } });
      if (teams.length !== teamsArray.length) {
        return res.status(400).json({ message: 'One or more teams not found' });
      }
    }

    // Create season with registration status by default
    const seasonData = {
      ...req.body,
      teams: teamsArray,
      status: req.body.status || 'registration'
    };

    const season = new Season(seasonData);
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
  body('status').optional().isIn(['draft', 'registration', 'active', 'completed', 'cancelled'])
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

// GET /api/seasons/:id/player-registrations - Get all player registrations for a season
router.get('/:id/player-registrations', authenticate, async (req, res) => {
  try {
    const season = await Season.findById(req.params.id)
      .populate('playerRegistrations.player', 'firstName lastName email jerseyNumber position')
      .populate('playerRegistrations.team', 'name city colors');
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Check if user has access to the league
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isPublic && !league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to view player registrations' });
    }

    res.json(season.playerRegistrations || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching player registrations', error: error.message });
  }
});

// POST /api/seasons/:id/register-player - Register a player for a season
router.post('/:id/register-player', authenticate, [
  body('playerId').isMongoId().withMessage('Valid player ID is required'),
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

    // Check if user has access to the league
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isPublic && !league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to register players' });
    }

    const { playerId, teamId } = req.body;

    // Verify player and team exist
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Verify team is registered for this season
    const teamIds = (season.teams || []).map((t) => {
      if (typeof t === 'string') return t;
      if (t && t.toString) return t.toString();
      if (t && t._id) return t._id.toString();
      return t;
    });
    if (!teamIds.includes(teamId)) {
      return res.status(400).json({ message: 'Team is not registered for this season' });
    }

    // Check if player is already registered
    const existingRegistration = (season.playerRegistrations || []).find(
      reg => reg.player.toString() === playerId && reg.team.toString() === teamId
    );
    if (existingRegistration) {
      return res.status(400).json({ message: 'Player is already registered for this season with this team' });
    }

    // Add player registration
    season.playerRegistrations = season.playerRegistrations || [];
    season.playerRegistrations.push({
      player: playerId,
      team: teamId,
      hasPaid: false,
      registrationDate: new Date()
    });
    await season.save();

    const populatedSeason = await Season.findById(season._id)
      .populate('playerRegistrations.player', 'firstName lastName email jerseyNumber position')
      .populate('playerRegistrations.team', 'name city colors');

    const newRegistration = populatedSeason.playerRegistrations[populatedSeason.playerRegistrations.length - 1];
    res.status(201).json(newRegistration);
  } catch (error) {
    res.status(500).json({ message: 'Error registering player', error: error.message });
  }
});

// PUT /api/seasons/:id/player-registrations/:playerId - Update player registration payment status
router.put('/:id/player-registrations/:playerId', authenticate, [
  body('hasPaid').isBoolean().withMessage('hasPaid must be a boolean'),
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

    // Check if user has access to the league
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isPublic && !league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to update player registrations' });
    }

    const { playerId } = req.params;
    const { teamId, hasPaid, notes } = req.body;

    // Find the registration
    const registration = (season.playerRegistrations || []).find(
      reg => reg.player.toString() === playerId && reg.team.toString() === teamId
    );
    if (!registration) {
      return res.status(404).json({ message: 'Player registration not found' });
    }

    // Update payment status
    registration.hasPaid = hasPaid;
    if (hasPaid && !registration.paymentDate) {
      registration.paymentDate = new Date();
    } else if (!hasPaid) {
      registration.paymentDate = undefined;
    }
    if (notes !== undefined) {
      registration.notes = notes;
    }
    await season.save();

    const populatedSeason = await Season.findById(season._id)
      .populate('playerRegistrations.player', 'firstName lastName email jerseyNumber position')
      .populate('playerRegistrations.team', 'name city colors');

    const updatedRegistration = populatedSeason.playerRegistrations.find(
      reg => reg.player._id.toString() === playerId && reg.team._id.toString() === teamId
    );
    res.json(updatedRegistration);
  } catch (error) {
    res.status(500).json({ message: 'Error updating player registration', error: error.message });
  }
});

// DELETE /api/seasons/:id/player-registrations/:playerId - Remove player registration
router.delete('/:id/player-registrations/:playerId', authenticate, [
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

    // Check if user has access to the league
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isPublic && !league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to remove player registrations' });
    }

    const { playerId } = req.params;
    const { teamId } = req.body;

    // Remove the registration
    season.playerRegistrations = (season.playerRegistrations || []).filter(
      reg => !(reg.player.toString() === playerId && reg.team.toString() === teamId)
    );
    await season.save();

    res.json({ message: 'Player registration removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing player registration', error: error.message });
  }
});

// GET /api/seasons/:id/statistics - Get season statistics (top scorers and standings)
router.get('/:id/statistics', authenticate, async (req, res) => {
  try {
    const season = await Season.findById(req.params.id)
      .populate('teams', 'name city colors');
    
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // Check if user has access to the league
    const league = await League.findById(season.league);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    if (!league.isPublic && !league.isMember(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this league to view statistics' });
    }

    // Get all completed games for this season with populated events
    const games = await Game.find({ 
      season: season._id,
      status: 'completed'
    })
      .populate('homeTeam', 'name city colors')
      .populate('awayTeam', 'name city colors')
      .populate('events.player', 'firstName lastName jerseyNumber')
      .populate('events.team', 'name city')
      .sort({ actualDate: -1, scheduledDate: -1 });

    // Calculate top scorers from game events
    const scorersMap = new Map();

    games.forEach((game) => {
      if (game.events && Array.isArray(game.events)) {
        game.events.forEach((event) => {
          // Only count 'goal' events, not 'own_goal'
          if (event.type === 'goal' && event.player) {
            const playerId = typeof event.player === 'object' && event.player._id 
              ? event.player._id.toString() 
              : String(event.player);
            
            if (!scorersMap.has(playerId)) {
              scorersMap.set(playerId, {
                player: typeof event.player === 'object' ? {
                  _id: event.player._id,
                  firstName: event.player.firstName,
                  lastName: event.player.lastName,
                  jerseyNumber: event.player.jerseyNumber
                } : null,
                goals: 0,
                team: typeof event.team === 'object' ? {
                  _id: event.team._id,
                  name: event.team.name,
                  city: event.team.city
                } : null,
              });
            }
            
            const scorer = scorersMap.get(playerId);
            if (scorer) {
              scorer.goals++;
              // Update team if not set
              if (!scorer.team && event.team) {
                scorer.team = typeof event.team === 'object' ? {
                  _id: event.team._id,
                  name: event.team.name,
                  city: event.team.city
                } : null;
              }
            }
          }
        });
      }
    });

    // Convert to array and sort by goals
    const topScorers = Array.from(scorersMap.values())
      .filter(s => s.player !== null && s.player !== undefined)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10); // Top 10 scorers

    // Calculate standings from games
    const standingsMap = new Map();

    // Initialize standings for all teams in the season
    if (season.teams && Array.isArray(season.teams)) {
      season.teams.forEach((team) => {
        const teamId = typeof team === 'object' && team._id ? team._id.toString() : String(team);
        standingsMap.set(teamId, {
          team: typeof team === 'object' ? {
            _id: team._id,
            name: team.name,
            city: team.city,
            colors: team.colors
          } : null,
          MP: 0,
          W: 0,
          D: 0,
          L: 0,
          GF: 0,
          GA: 0,
          GD: 0,
          Pts: 0,
          last5: [],
        });
      });
    }

    // Process completed games
    const completedGames = games
      .filter(game => game.status === 'completed' && game.score)
      .sort((a, b) => {
        const dateA = new Date(a.actualDate || a.scheduledDate).getTime();
        const dateB = new Date(b.actualDate || b.scheduledDate).getTime();
        return dateB - dateA; // Most recent first
      });

    completedGames.forEach((game) => {
      const homeTeamId = typeof game.homeTeam === 'object' && game.homeTeam._id 
        ? game.homeTeam._id.toString() 
        : String(game.homeTeam);
      const awayTeamId = typeof game.awayTeam === 'object' && game.awayTeam._id 
        ? game.awayTeam._id.toString() 
        : String(game.awayTeam);
      
      const homeStanding = standingsMap.get(homeTeamId);
      const awayStanding = standingsMap.get(awayTeamId);

      if (homeStanding && awayStanding && game.score) {
        const homeScore = game.score.homeTeam;
        const awayScore = game.score.awayTeam;

        // Update home team
        homeStanding.MP++;
        homeStanding.GF += homeScore;
        homeStanding.GA += awayScore;
        homeStanding.GD = homeStanding.GF - homeStanding.GA;

        // Update away team
        awayStanding.MP++;
        awayStanding.GF += awayScore;
        awayStanding.GA += homeScore;
        awayStanding.GD = awayStanding.GF - awayStanding.GA;

        // Determine result
        if (homeScore > awayScore) {
          homeStanding.W++;
          homeStanding.Pts += 3;
          awayStanding.L++;
          homeStanding.last5.unshift('W');
          awayStanding.last5.unshift('L');
        } else if (awayScore > homeScore) {
          awayStanding.W++;
          awayStanding.Pts += 3;
          homeStanding.L++;
          homeStanding.last5.unshift('L');
          awayStanding.last5.unshift('W');
        } else {
          homeStanding.D++;
          homeStanding.Pts += 1;
          awayStanding.D++;
          awayStanding.Pts += 1;
          homeStanding.last5.unshift('D');
          awayStanding.last5.unshift('D');
        }

        // Keep only last 5 matches
        if (homeStanding.last5.length > 5) homeStanding.last5 = homeStanding.last5.slice(0, 5);
        if (awayStanding.last5.length > 5) awayStanding.last5 = awayStanding.last5.slice(0, 5);
      }
    });

    // Convert to array and sort
    const standings = Array.from(standingsMap.values())
      .filter(s => s.team !== null && s.team !== undefined)
      .sort((a, b) => {
        // Sort by Points (desc), then GD (desc), then GF (desc)
        if (b.Pts !== a.Pts) return b.Pts - a.Pts;
        if (b.GD !== a.GD) return b.GD - a.GD;
        return b.GF - a.GF;
      });

    res.json({
      topScorers,
      standings
    });
  } catch (error) {
    console.error('Error fetching season statistics:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

module.exports = router;
