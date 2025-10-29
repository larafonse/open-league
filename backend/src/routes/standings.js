const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// GET /api/standings - Get league standings
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find({})
      .select('name city wins losses ties pointsFor pointsAgainst')
      .sort({ 
        wins: -1, 
        ties: -1, 
        losses: 1,
        pointsFor: -1 
      });

    // Calculate standings with points and win percentage
    const standings = teams.map(team => {
      const totalGames = team.wins + team.losses + team.ties;
      const winPercentage = totalGames > 0 ? ((team.wins + team.ties * 0.5) / totalGames) : 0;
      const points = team.wins * 3 + team.ties * 1; // 3 points for win, 1 for tie
      const pointDifferential = team.pointsFor - team.pointsAgainst;

      return {
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
router.get('/:teamId', async (req, res) => {
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
