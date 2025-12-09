const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const League = require('../models/League');
const Season = require('../models/Season');
const authenticate = require('../middleware/auth');

// GET /api/standings - Get standings for leagues user belongs to
router.get('/', authenticate, async (req, res) => {
  try {
    const { league } = req.query;
    const userId = req.user._id;

    // Get leagues user belongs to
    const userLeagues = await League.find({
      $or: [
        { owner: userId },
        { members: userId }
      ]
    });

    if (userLeagues.length === 0) {
      return res.json([]);
    }

    const leagueIds = userLeagues.map(l => l._id);
    let leagueFilter = { $in: leagueIds };

    // If specific league requested, filter to that league
    if (league) {
      const requestedLeague = userLeagues.find(l => l._id.toString() === league);
      if (!requestedLeague) {
        return res.status(403).json({ message: 'You must be a member of this league to view standings' });
      }
      leagueFilter = league;
    }

    // Get all seasons for user's leagues
    const seasons = await Season.find({ league: leagueFilter })
      .populate('standings.team', 'name city colors');

    // Aggregate standings from all seasons
    const standingsMap = new Map();

    seasons.forEach(season => {
      season.standings.forEach(standing => {
        const teamId = standing.team._id.toString();
        if (!standingsMap.has(teamId)) {
          standingsMap.set(teamId, {
            team: standing.team,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            ties: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            points: 0
          });
        }

        const agg = standingsMap.get(teamId);
        agg.gamesPlayed += standing.gamesPlayed;
        agg.wins += standing.wins;
        agg.losses += standing.losses;
        agg.ties += standing.ties;
        agg.pointsFor += standing.pointsFor;
        agg.pointsAgainst += standing.pointsAgainst;
        agg.points += standing.points;
      });
    });

    // Convert to array and calculate win percentage and point differential
    const standings = Array.from(standingsMap.values()).map(standing => {
      const totalGames = standing.gamesPlayed;
      const winPercentage = totalGames > 0 ? ((standing.wins + standing.ties * 0.5) / totalGames) : 0;
      const pointDifferential = standing.pointsFor - standing.pointsAgainst;

      return {
        ...standing,
        pointDifferential,
        winPercentage: parseFloat(winPercentage.toFixed(3))
      };
    });

    // Sort by points (descending), then by win percentage, then by point differential
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
      return b.pointDifferential - a.pointDifferential;
    });

    // Add position
    standings.forEach((standing, index) => {
      standing.position = index + 1;
    });

    res.json(standings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching standings', error: error.message });
  }
});

// GET /api/standings/:teamId - Get specific team's standing
router.get('/:teamId', authenticate, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .select('name city wins losses ties pointsFor pointsAgainst');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const totalGames = team.wins + team.losses + team.ties;
    const winPercentage = totalGames > 0 ? ((team.wins + team.ties * 0.5) / totalGames) : 0;
    const points = team.wins * 3 + team.ties * 1;
    const pointDifferential = team.pointsFor - team.pointsAgainst;

    const standing = {
      team: {
        _id: team._id,
        name: team.name,
        city: team.city
      },
      gamesPlayed: totalGames,
      wins: team.wins,
      losses: team.losses,
      ties: team.ties,
      pointsFor: team.pointsFor,
      pointsAgainst: team.pointsAgainst,
      pointDifferential,
      points,
      winPercentage: parseFloat(winPercentage.toFixed(3))
    };

    res.json(standing);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team standing', error: error.message });
  }
});

module.exports = router;
