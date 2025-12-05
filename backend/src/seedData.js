const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Team = require('./models/Team');
const Player = require('./models/Player');
const Game = require('./models/Game');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arch-suite', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Sample data
const teamData = [
  {
    name: 'Thunder Bolts',
    city: 'Seattle',
    colors: { primary: '#1E3A8A', secondary: '#F59E0B' },
    founded: 1995,
    coach: 'Mike Johnson'
  },
  {
    name: 'Fire Hawks',
    city: 'Phoenix',
    colors: { primary: '#DC2626', secondary: '#F97316' },
    founded: 1988,
    coach: 'Sarah Williams'
  },
  {
    name: 'Storm Riders',
    city: 'Miami',
    colors: { primary: '#059669', secondary: '#0EA5E9' },
    founded: 2001,
    coach: 'Carlos Rodriguez'
  },
  {
    name: 'Iron Wolves',
    city: 'Chicago',
    colors: { primary: '#374151', secondary: '#F3F4F6' },
    founded: 1992,
    coach: 'David Chen'
  },
  {
    name: 'Golden Eagles',
    city: 'Denver',
    colors: { primary: '#7C3AED', secondary: '#FCD34D' },
    founded: 1998,
    coach: 'Lisa Thompson'
  },
  {
    name: 'Blue Sharks',
    city: 'San Diego',
    colors: { primary: '#1E40AF', secondary: '#06B6D4' },
    founded: 2005,
    coach: 'Robert Martinez'
  }
];

const playerNames = [
  // Thunder Bolts players
  { firstName: 'Alex', lastName: 'Thompson', position: 'Goalkeeper', jerseyNumber: 1 },
  { firstName: 'Marcus', lastName: 'Johnson', position: 'Defender', jerseyNumber: 4 },
  { firstName: 'Ryan', lastName: 'Davis', position: 'Defender', jerseyNumber: 5 },
  { firstName: 'Kevin', lastName: 'Wilson', position: 'Midfielder', jerseyNumber: 8 },
  { firstName: 'Jake', lastName: 'Brown', position: 'Midfielder', jerseyNumber: 10 },
  { firstName: 'Tyler', lastName: 'Miller', position: 'Forward', jerseyNumber: 9 },
  { firstName: 'Brandon', lastName: 'Taylor', position: 'Forward', jerseyNumber: 11 },
  { firstName: 'Chris', lastName: 'Anderson', position: 'Defender', jerseyNumber: 3 },
  { firstName: 'Mike', lastName: 'Garcia', position: 'Midfielder', jerseyNumber: 6 },
  { firstName: 'Sam', lastName: 'Lee', position: 'Forward', jerseyNumber: 7 },
  { firstName: 'Tom', lastName: 'White', position: 'Defender', jerseyNumber: 2 },
  
  // Fire Hawks players
  { firstName: 'Diego', lastName: 'Rodriguez', position: 'Goalkeeper', jerseyNumber: 1 },
  { firstName: 'Luis', lastName: 'Martinez', position: 'Defender', jerseyNumber: 4 },
  { firstName: 'Carlos', lastName: 'Lopez', position: 'Defender', jerseyNumber: 5 },
  { firstName: 'Miguel', lastName: 'Gonzalez', position: 'Midfielder', jerseyNumber: 8 },
  { firstName: 'Antonio', lastName: 'Hernandez', position: 'Midfielder', jerseyNumber: 10 },
  { firstName: 'Jose', lastName: 'Perez', position: 'Forward', jerseyNumber: 9 },
  { firstName: 'Fernando', lastName: 'Sanchez', position: 'Forward', jerseyNumber: 11 },
  { firstName: 'Rafael', lastName: 'Ramirez', position: 'Defender', jerseyNumber: 3 },
  { firstName: 'Eduardo', lastName: 'Torres', position: 'Midfielder', jerseyNumber: 6 },
  { firstName: 'Sergio', lastName: 'Flores', position: 'Forward', jerseyNumber: 7 },
  { firstName: 'Manuel', lastName: 'Vargas', position: 'Defender', jerseyNumber: 2 },
  
  // Storm Riders players
  { firstName: 'James', lastName: 'Smith', position: 'Goalkeeper', jerseyNumber: 1 },
  { firstName: 'William', lastName: 'Jones', position: 'Defender', jerseyNumber: 4 },
  { firstName: 'Benjamin', lastName: 'Williams', position: 'Defender', jerseyNumber: 5 },
  { firstName: 'Lucas', lastName: 'Brown', position: 'Midfielder', jerseyNumber: 8 },
  { firstName: 'Henry', lastName: 'Davis', position: 'Midfielder', jerseyNumber: 10 },
  { firstName: 'Alexander', lastName: 'Miller', position: 'Forward', jerseyNumber: 9 },
  { firstName: 'Mason', lastName: 'Wilson', position: 'Forward', jerseyNumber: 11 },
  { firstName: 'Michael', lastName: 'Moore', position: 'Defender', jerseyNumber: 3 },
  { firstName: 'Ethan', lastName: 'Taylor', position: 'Midfielder', jerseyNumber: 6 },
  { firstName: 'Daniel', lastName: 'Anderson', position: 'Forward', jerseyNumber: 7 },
  { firstName: 'Jacob', lastName: 'Thomas', position: 'Defender', jerseyNumber: 2 },
  
  // Iron Wolves players
  { firstName: 'Noah', lastName: 'Jackson', position: 'Goalkeeper', jerseyNumber: 1 },
  { firstName: 'Liam', lastName: 'White', position: 'Defender', jerseyNumber: 4 },
  { firstName: 'Owen', lastName: 'Harris', position: 'Defender', jerseyNumber: 5 },
  { firstName: 'Caleb', lastName: 'Martin', position: 'Midfielder', jerseyNumber: 8 },
  { firstName: 'Ryan', lastName: 'Thompson', position: 'Midfielder', jerseyNumber: 10 },
  { firstName: 'Nathan', lastName: 'Garcia', position: 'Forward', jerseyNumber: 9 },
  { firstName: 'Isaac', lastName: 'Martinez', position: 'Forward', jerseyNumber: 11 },
  { firstName: 'Luke', lastName: 'Robinson', position: 'Defender', jerseyNumber: 3 },
  { firstName: 'Jack', lastName: 'Clark', position: 'Midfielder', jerseyNumber: 6 },
  { firstName: 'Connor', lastName: 'Rodriguez', position: 'Forward', jerseyNumber: 7 },
  { firstName: 'Hunter', lastName: 'Lewis', position: 'Defender', jerseyNumber: 2 },
  
  // Golden Eagles players
  { firstName: 'Eli', lastName: 'Lee', position: 'Goalkeeper', jerseyNumber: 1 },
  { firstName: 'Aaron', lastName: 'Walker', position: 'Defender', jerseyNumber: 4 },
  { firstName: 'Adam', lastName: 'Hall', position: 'Defender', jerseyNumber: 5 },
  { firstName: 'Andrew', lastName: 'Allen', position: 'Midfielder', jerseyNumber: 8 },
  { firstName: 'Anthony', lastName: 'Young', position: 'Midfielder', jerseyNumber: 10 },
  { firstName: 'Austin', lastName: 'King', position: 'Forward', jerseyNumber: 9 },
  { firstName: 'Blake', lastName: 'Wright', position: 'Forward', jerseyNumber: 11 },
  { firstName: 'Cameron', lastName: 'Lopez', position: 'Defender', jerseyNumber: 3 },
  { firstName: 'Chase', lastName: 'Hill', position: 'Midfielder', jerseyNumber: 6 },
  { firstName: 'Cole', lastName: 'Scott', position: 'Forward', jerseyNumber: 7 },
  { firstName: 'Dylan', lastName: 'Green', position: 'Defender', jerseyNumber: 2 },
  
  // Blue Sharks players
  { firstName: 'Gabriel', lastName: 'Adams', position: 'Goalkeeper', jerseyNumber: 1 },
  { firstName: 'Gavin', lastName: 'Baker', position: 'Defender', jerseyNumber: 4 },
  { firstName: 'Ian', lastName: 'Nelson', position: 'Defender', jerseyNumber: 5 },
  { firstName: 'Jaxon', lastName: 'Carter', position: 'Midfielder', jerseyNumber: 8 },
  { firstName: 'Jeremy', lastName: 'Mitchell', position: 'Midfielder', jerseyNumber: 10 },
  { firstName: 'Jordan', lastName: 'Perez', position: 'Forward', jerseyNumber: 9 },
  { firstName: 'Joshua', lastName: 'Roberts', position: 'Forward', jerseyNumber: 11 },
  { firstName: 'Julian', lastName: 'Turner', position: 'Defender', jerseyNumber: 3 },
  { firstName: 'Kaden', lastName: 'Phillips', position: 'Midfielder', jerseyNumber: 6 },
  { firstName: 'Kai', lastName: 'Campbell', position: 'Forward', jerseyNumber: 7 },
  { firstName: 'Kaleb', lastName: 'Parker', position: 'Defender', jerseyNumber: 2 }
];

const venues = [
  { name: 'Thunder Stadium', address: '123 Thunder Way, Seattle, WA', capacity: 25000 },
  { name: 'Fire Arena', address: '456 Phoenix Blvd, Phoenix, AZ', capacity: 30000 },
  { name: 'Storm Center', address: '789 Miami Drive, Miami, FL', capacity: 22000 },
  { name: 'Iron Field', address: '321 Chicago Ave, Chicago, IL', capacity: 28000 },
  { name: 'Golden Dome', address: '654 Denver St, Denver, CO', capacity: 26000 },
  { name: 'Blue Ocean Arena', address: '987 San Diego Blvd, San Diego, CA', capacity: 24000 }
];

// Helper function to generate random date
function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to generate random stats
function getRandomStats() {
  return {
    gamesPlayed: Math.floor(Math.random() * 15) + 5,
    goals: Math.floor(Math.random() * 8),
    assists: Math.floor(Math.random() * 6),
    yellowCards: Math.floor(Math.random() * 3),
    redCards: Math.floor(Math.random() * 2)
  };
}

// Helper function to generate emergency contact
function getEmergencyContact() {
  const names = ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson', 'David Brown'];
  const relationships = ['Father', 'Mother', 'Brother', 'Sister', 'Spouse'];
  
  return {
    name: names[Math.floor(Math.random() * names.length)],
    phone: `555-${Math.floor(Math.random() * 9000) + 1000}`,
    relationship: relationships[Math.floor(Math.random() * relationships.length)]
  };
}

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Clear existing data
    await Team.deleteMany({});
    await Player.deleteMany({});
    await Game.deleteMany({});
    console.log('Cleared existing data');
    
    // Create teams
    const teams = [];
    for (const teamInfo of teamData) {
      const team = new Team(teamInfo);
      await team.save();
      teams.push(team);
      console.log(`Created team: ${team.name}`);
    }
    
    // Create players for each team
    const allPlayers = [];
    let playerIndex = 0;
    
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      const teamPlayers = [];
      
      // Create 11 players for each team
      for (let j = 0; j < 11; j++) {
        const playerInfo = playerNames[playerIndex];
        const birthYear = 1990 + Math.floor(Math.random() * 15); // Ages 18-33
        const birthMonth = Math.floor(Math.random() * 12);
        const birthDay = Math.floor(Math.random() * 28) + 1;
        
        const player = new Player({
          ...playerInfo,
          email: `${playerInfo.firstName.toLowerCase()}.${playerInfo.lastName.toLowerCase()}@${team.name.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: `555-${Math.floor(Math.random() * 9000) + 1000}`,
          dateOfBirth: new Date(birthYear, birthMonth, birthDay),
          team: team._id,
          isCaptain: j === 0, // First player is captain
          stats: getRandomStats(),
          emergencyContact: getEmergencyContact()
        });
        
        await player.save();
        teamPlayers.push(player);
        allPlayers.push(player);
        playerIndex++;
      }
      
      // Update team with players and captain
      team.players = teamPlayers.map(p => p._id);
      team.captain = teamPlayers[0]._id;
      await team.save();
      
      console.log(`Created ${teamPlayers.length} players for ${team.name}`);
    }
    
    // Create games
    const games = [];
    const gameCount = 15; // Create 15 games
    
    for (let i = 0; i < gameCount; i++) {
      // Randomly select two different teams
      const homeTeamIndex = Math.floor(Math.random() * teams.length);
      let awayTeamIndex;
      do {
        awayTeamIndex = Math.floor(Math.random() * teams.length);
      } while (awayTeamIndex === homeTeamIndex);
      
      const homeTeam = teams[homeTeamIndex];
      const awayTeam = teams[awayTeamIndex];
      
      // Random venue (could be home team's venue or neutral)
      const venue = venues[Math.floor(Math.random() * venues.length)];
      
      // Random date in the past 3 months
      const scheduledDate = getRandomDate(
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // 30 days from now
      );
      
      const game = new Game({
        homeTeam: homeTeam._id,
        awayTeam: awayTeam._id,
        scheduledDate: scheduledDate,
        actualDate: scheduledDate,
        venue: venue,
        status: Math.random() > 0.3 ? 'completed' : 'scheduled', // 70% completed
        score: {
          homeTeam: Math.floor(Math.random() * 5),
          awayTeam: Math.floor(Math.random() * 5)
        },
        referee: {
          name: `Referee ${i + 1}`,
          phone: `555-${Math.floor(Math.random() * 9000) + 1000}`
        },
        weather: {
          condition: ['Sunny', 'Cloudy', 'Rainy', 'Windy'][Math.floor(Math.random() * 4)],
          temperature: Math.floor(Math.random() * 30) + 50, // 50-80°F
          humidity: Math.floor(Math.random() * 50) + 30 // 30-80%
        },
        notes: `Game ${i + 1} between ${homeTeam.name} and ${awayTeam.name}`,
        events: []
      });
      
      // Add some game events if completed
      if (game.status === 'completed') {
        const homeTeamPlayers = allPlayers.filter(p => p.team.toString() === homeTeam._id.toString());
        const awayTeamPlayers = allPlayers.filter(p => p.team.toString() === awayTeam._id.toString());
        
        // Add some random events
        const eventCount = Math.floor(Math.random() * 8) + 2; // 2-10 events
        for (let e = 0; e < eventCount; e++) {
          const isHomeTeam = Math.random() > 0.5;
          const players = isHomeTeam ? homeTeamPlayers : awayTeamPlayers;
          const player = players[Math.floor(Math.random() * players.length)];
          
          const eventTypes = ['goal', 'assist', 'yellow_card', 'substitution'];
          const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
          
          game.events.push({
            type: eventType,
            player: player._id,
            team: isHomeTeam ? homeTeam._id : awayTeam._id,
            minute: Math.floor(Math.random() * 90) + 1,
            description: `${eventType.replace('_', ' ')} by ${player.firstName} ${player.lastName}`,
            timestamp: new Date(scheduledDate.getTime() + (Math.floor(Math.random() * 5400) + 1) * 1000) // Random time during game
          });
        }
      }
      
      await game.save();
      games.push(game);
      console.log(`Created game: ${homeTeam.name} vs ${awayTeam.name}`);
    }
    
    // Update team statistics based on completed games
    for (const team of teams) {
      const teamGames = games.filter(g => 
        (g.homeTeam.toString() === team._id.toString() || g.awayTeam.toString() === team._id.toString()) 
        && g.status === 'completed'
      );
      
      let wins = 0, losses = 0, ties = 0, pointsFor = 0, pointsAgainst = 0;
      
      for (const game of teamGames) {
        const isHomeTeam = game.homeTeam.toString() === team._id.toString();
        const teamScore = isHomeTeam ? game.score.homeTeam : game.score.awayTeam;
        const opponentScore = isHomeTeam ? game.score.awayTeam : game.score.homeTeam;
        
        pointsFor += teamScore;
        pointsAgainst += opponentScore;
        
        if (teamScore > opponentScore) {
          wins++;
        } else if (teamScore < opponentScore) {
          losses++;
        } else {
          ties++;
        }
      }
      
      team.wins = wins;
      team.losses = losses;
      team.ties = ties;
      team.pointsFor = pointsFor;
      team.pointsAgainst = pointsAgainst;
      
      await team.save();
    }
    
    console.log('\nDatabase seeding completed successfully!');
    console.log(`Created ${teams.length} teams`);
    console.log(`Created ${allPlayers.length} players`);
    console.log(`Created ${games.length} games`);
    
    // Display summary
    console.log('\n=== TEAM STANDINGS ===');
    const sortedTeams = teams.sort((a, b) => {
      const aPoints = a.wins * 3 + a.ties;
      const bPoints = b.wins * 3 + b.ties;
      return bPoints - aPoints;
    });
    
    sortedTeams.forEach((team, index) => {
      const points = team.wins * 3 + team.ties;
      console.log(`${index + 1}. ${team.name} (${team.city}) - ${points} pts (${team.wins}W-${team.losses}L-${team.ties}T)`);
    });
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding function
seedDatabase();
