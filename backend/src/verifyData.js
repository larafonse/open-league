const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Team = require('./models/Team');
const Player = require('./models/Player');
const Game = require('./models/Game');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/open-league', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyData() {
  try {
    console.log('=== DATABASE VERIFICATION ===\n');
    
    // Count documents
    const teamCount = await Team.countDocuments();
    const playerCount = await Player.countDocuments();
    const gameCount = await Game.countDocuments();
    
    console.log(`📊 Database Summary:`);
    console.log(`   Teams: ${teamCount}`);
    console.log(`   Players: ${playerCount}`);
    console.log(`   Games: ${gameCount}\n`);
    
    // Show sample teams
    console.log('🏆 Sample Teams:');
    const teams = await Team.find().populate('captain', 'firstName lastName').limit(3);
    teams.forEach(team => {
      console.log(`   ${team.name} (${team.city})`);
      console.log(`   Coach: ${team.coach}`);
      console.log(`   Captain: ${team.captain ? team.captain.firstName + ' ' + team.captain.lastName : 'None'}`);
      console.log(`   Record: ${team.wins}W-${team.losses}L-${team.ties}T`);
      console.log(`   Colors: ${team.colors.primary} / ${team.colors.secondary}\n`);
    });
    
    // Show sample players
    console.log('⚽ Sample Players:');
    const players = await Player.find().populate('team', 'name').limit(5);
    players.forEach(player => {
      console.log(`   ${player.firstName} ${player.lastName} (#${player.jerseyNumber})`);
      console.log(`   Position: ${player.position}`);
      console.log(`   Team: ${player.team ? player.team.name : 'Free Agent'}`);
      console.log(`   Stats: ${player.stats.goals}G ${player.stats.assists}A ${player.stats.gamesPlayed}GP`);
      console.log(`   Email: ${player.email}\n`);
    });
    
    // Show sample games
    console.log('🎮 Sample Games:');
    const games = await Game.find()
      .populate('homeTeam', 'name')
      .populate('awayTeam', 'name')
      .limit(3);
    
    games.forEach(game => {
      console.log(`   ${game.homeTeam.name} vs ${game.awayTeam.name}`);
      console.log(`   Date: ${game.scheduledDate.toLocaleDateString()}`);
      console.log(`   Venue: ${game.venue.name}`);
      console.log(`   Status: ${game.status}`);
      if (game.status === 'completed') {
        console.log(`   Score: ${game.score.homeTeam} - ${game.score.awayTeam}`);
        console.log(`   Events: ${game.events.length} events recorded`);
      }
      console.log('');
    });
    
    // Show standings
    console.log('📈 Current Standings:');
    const standings = await Team.find().sort({ wins: -1, ties: -1 });
    standings.forEach((team, index) => {
      const points = team.wins * 3 + team.ties;
      console.log(`   ${index + 1}. ${team.name} - ${points} pts (${team.wins}W-${team.losses}L-${team.ties}T)`);
    });
    
    console.log('\n✅ Database verification complete!');
    
  } catch (error) {
    console.error('❌ Error verifying database:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run verification
verifyData();
