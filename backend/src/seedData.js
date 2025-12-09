const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Team = require('./models/Team');
const Player = require('./models/Player');
const Game = require('./models/Game');
const League = require('./models/League');
const Season = require('./models/Season');
const User = require('./models/User');

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
    await Season.deleteMany({});
    await League.deleteMany({});
    // Note: We'll create a test user if one doesn't exist, but won't delete existing users
    console.log('Cleared existing data');
    
    // Create or get test user
    let testUser = await User.findOne({ email: 'admin@archsuite.com' });
    if (!testUser) {
      testUser = new User({
        email: 'admin@archsuite.com',
        password: 'password123', // Will be hashed by pre-save hook
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      });
      await testUser.save();
      console.log('Created test user: admin@archsuite.com / password123');
    } else {
      console.log('Using existing test user: admin@archsuite.com');
    }
    
    // Create additional random users
    console.log('\n=== CREATING USERS ===');
    const users = [testUser];
    const userNames = [
      { firstName: 'John', lastName: 'Smith' },
      { firstName: 'Sarah', lastName: 'Johnson' },
      { firstName: 'Michael', lastName: 'Williams' },
      { firstName: 'Emily', lastName: 'Brown' },
      { firstName: 'David', lastName: 'Jones' },
      { firstName: 'Jessica', lastName: 'Garcia' },
      { firstName: 'Christopher', lastName: 'Miller' },
      { firstName: 'Amanda', lastName: 'Davis' },
      { firstName: 'Matthew', lastName: 'Rodriguez' },
      { firstName: 'Ashley', lastName: 'Martinez' },
      { firstName: 'James', lastName: 'Hernandez' },
      { firstName: 'Melissa', lastName: 'Lopez' }
    ];
    
    for (let i = 0; i < userNames.length; i++) {
      const name = userNames[i];
      const email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@example.com`;
      
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          email,
          password: 'password123', // Will be hashed by pre-save hook
          firstName: name.firstName,
          lastName: name.lastName,
          role: 'user'
        });
        await user.save();
        console.log(`Created user: ${email} / password123`);
      } else {
        console.log(`Using existing user: ${email}`);
      }
      users.push(user);
    }
    
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
    
    // Create leagues
    console.log('\n=== CREATING LEAGUES ===');
    const leagues = [];
    const leagueData = [
      {
        name: 'Premier Soccer League',
        description: 'The premier competitive soccer league featuring top teams from across the region.',
        isPublic: true,
        settings: { maxTeams: 20, minTeams: 4 }
      },
      {
        name: 'Metro Championship League',
        description: 'A competitive league for metropolitan area teams with a focus on community engagement.',
        isPublic: true,
        settings: { maxTeams: 16, minTeams: 4 }
      },
      {
        name: 'Coastal Conference',
        description: 'Regional league for teams along the coast, emphasizing fair play and sportsmanship.',
        isPublic: true,
        settings: { maxTeams: 12, minTeams: 4 }
      },
      {
        name: 'Elite Division',
        description: 'Exclusive league for elite teams with high-level competition.',
        isPublic: false,
        settings: { maxTeams: 10, minTeams: 4 }
      }
    ];
    
    for (let i = 0; i < leagueData.length; i++) {
      const leagueInfo = leagueData[i];
      // Distribute league ownership among users
      const owner = i === 0 ? testUser : users[Math.floor(Math.random() * (users.length - 1)) + 1];
      
      // Add random members to each league (3-6 members per league)
      // Users can be in multiple leagues, so we don't filter out users already in other leagues
      const memberCount = Math.floor(Math.random() * 4) + 3; // 3-6 members
      const availableUsers = users.filter(u => u._id.toString() !== owner._id.toString());
      const shuffled = [...availableUsers].sort(() => 0.5 - Math.random());
      const members = shuffled.slice(0, Math.min(memberCount, availableUsers.length));
      
      const league = new League({
        ...leagueInfo,
        owner: owner._id,
        members: members.map(u => u._id)
      });
      await league.save();
      leagues.push(league);
      console.log(`Created league: ${league.name} (Owner: ${owner.firstName} ${owner.lastName}, ${members.length} members)`);
      if (members.length > 0) {
        console.log(`  Members: ${members.map(u => `${u.firstName} ${u.lastName}`).join(', ')}`);
      }
    }
    
    // Distribute teams across leagues and create seasons
    console.log('\n=== CREATING SEASONS ===');
    const teamsPerLeague = Math.floor(teams.length / leagues.length);
    let teamIndex = 0;
    
    // Distribute teams to leagues
    const leagueTeamMap = new Map();
    for (let i = 0; i < leagues.length; i++) {
      const league = leagues[i];
      const leagueTeams = [];
      
      // Assign teams to this league (distribute evenly)
      for (let j = 0; j < teamsPerLeague && teamIndex < teams.length; j++) {
        leagueTeams.push(teams[teamIndex]);
        teamIndex++;
      }
      
      // If last league, add remaining teams
      if (i === leagues.length - 1) {
        while (teamIndex < teams.length) {
          leagueTeams.push(teams[teamIndex]);
          teamIndex++;
        }
      }
      
      leagueTeamMap.set(league._id.toString(), leagueTeams);
    }
    
    // Create seasons for each league
    const currentYear = new Date().getFullYear();
    
    for (let i = 0; i < leagues.length; i++) {
      const league = leagues[i];
      const leagueTeams = leagueTeamMap.get(league._id.toString());
      
      // Create previous seasons (completed)
      const previousSeasonsCount = i < 2 ? 2 : 1; // First 2 leagues get 2 previous seasons, others get 1
      
      for (let seasonNum = previousSeasonsCount; seasonNum >= 1; seasonNum--) {
        const year = currentYear - seasonNum;
        const seasonStartDate = new Date(year, 0, 1); // January 1st
        const seasonEndDate = new Date(year, 11, 31); // December 31st
        
        const season = new Season({
          name: `${league.name} - ${year} Season`,
          description: `${year} regular season for ${league.name}`,
          league: league._id,
          startDate: seasonStartDate,
          endDate: seasonEndDate,
          teams: leagueTeams.map(t => t._id),
          status: 'completed',
          settings: {
            gamesPerWeek: 1,
            playoffTeams: 4,
            regularSeasonWeeks: 12
          },
          standings: leagueTeams.map(team => ({
            team: team._id,
            gamesPlayed: Math.floor(Math.random() * 15) + 8, // 8-22 games
            wins: Math.floor(Math.random() * 10) + 3,
            losses: Math.floor(Math.random() * 8) + 2,
            ties: Math.floor(Math.random() * 5),
            pointsFor: Math.floor(Math.random() * 50) + 20,
            pointsAgainst: Math.floor(Math.random() * 40) + 15,
            points: 0
          })),
          weeks: []
        });
        
        // Calculate points for completed season
        season.standings.forEach(standing => {
          standing.points = standing.wins * 3 + standing.ties;
        });
        
        // Sort standings by points
        season.standings.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          const aDiff = a.pointsFor - a.pointsAgainst;
          const bDiff = b.pointsFor - b.pointsAgainst;
          return bDiff - aDiff;
        });
        
        await season.save();
        console.log(`Created completed season "${season.name}" for ${league.name}`);
      }
      
      // Create active season for first league, draft for others
      const isActiveLeague = i === 0; // First league gets active season
      const seasonStartDate = new Date();
      seasonStartDate.setMonth(seasonStartDate.getMonth() - 2); // Started 2 months ago
      const seasonEndDate = new Date(seasonStartDate);
      seasonEndDate.setMonth(seasonEndDate.getMonth() + 6); // 6 months duration
      
      const activeSeason = new Season({
        name: `${league.name} - ${currentYear} Season`,
        description: `${currentYear} regular season for ${league.name}`,
        league: league._id,
        startDate: seasonStartDate,
        endDate: seasonEndDate,
        teams: leagueTeams.map(t => t._id),
        status: isActiveLeague ? 'active' : 'draft',
        settings: {
          gamesPerWeek: 1,
          playoffTeams: 4,
          regularSeasonWeeks: 12
        },
        standings: leagueTeams.map(team => ({
          team: team._id,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          points: 0
        })),
        weeks: []
      });
      
      // If active season, add some game data
      if (isActiveLeague) {
        for (const game of games) {
          const homeTeam = leagueTeams.find(t => t._id.toString() === game.homeTeam.toString());
          const awayTeam = leagueTeams.find(t => t._id.toString() === game.awayTeam.toString());
          
          if (homeTeam && awayTeam && game.status === 'completed') {
            const homeStanding = activeSeason.standings.find(s => s.team.toString() === homeTeam._id.toString());
            const awayStanding = activeSeason.standings.find(s => s.team.toString() === awayTeam._id.toString());
            
            if (homeStanding && awayStanding) {
              homeStanding.gamesPlayed++;
              awayStanding.gamesPlayed++;
              
              homeStanding.pointsFor += game.score.homeTeam;
              homeStanding.pointsAgainst += game.score.awayTeam;
              awayStanding.pointsFor += game.score.awayTeam;
              awayStanding.pointsAgainst += game.score.homeTeam;
              
              if (game.score.homeTeam > game.score.awayTeam) {
                homeStanding.wins++;
                awayStanding.losses++;
                homeStanding.points += 3;
              } else if (game.score.awayTeam > game.score.homeTeam) {
                awayStanding.wins++;
                homeStanding.losses++;
                awayStanding.points += 3;
              } else {
                homeStanding.ties++;
                awayStanding.ties++;
                homeStanding.points += 1;
                awayStanding.points += 1;
              }
            }
          }
        }
      }
      
      await activeSeason.save();
      console.log(`Created ${isActiveLeague ? 'active' : 'draft'} season "${activeSeason.name}" for ${league.name} with ${leagueTeams.length} teams`);
    }
    
    console.log('\n=== SEEDING SUMMARY ===');
    const totalSeasons = await Season.countDocuments();
    const activeSeasons = await Season.countDocuments({ status: 'active' });
    const completedSeasons = await Season.countDocuments({ status: 'completed' });
    const draftSeasons = await Season.countDocuments({ status: 'draft' });
    
    console.log(`Created ${users.length} users`);
    console.log(`Created ${leagues.length} leagues`);
    console.log(`Created ${totalSeasons} seasons:`);
    console.log(`  - ${activeSeasons} active season(s)`);
    console.log(`  - ${completedSeasons} completed season(s)`);
    console.log(`  - ${draftSeasons} draft season(s)`);
    console.log(`Created ${teams.length} teams`);
    console.log(`Created ${allPlayers.length} players`);
    console.log(`Created ${games.length} games`);
    console.log('\n=== LEAGUE DETAILS ===');
    for (const league of leagues) {
      const leagueSeasons = await Season.find({ league: league._id });
      const populatedLeague = await League.findById(league._id).populate('owner members', 'firstName lastName email');
      const activeLeagueSeason = leagueSeasons.find(s => s.status === 'active');
      console.log(`${league.name}:`);
      console.log(`  - Owner: ${populatedLeague.owner.firstName} ${populatedLeague.owner.lastName}`);
      console.log(`  - Members: ${populatedLeague.members.length}`);
      console.log(`  - ${leagueSeasons.length} season(s) total`);
      if (activeLeagueSeason) {
        console.log(`  - Active: ${activeLeagueSeason.name}`);
      }
      const completedLeagueSeasons = leagueSeasons.filter(s => s.status === 'completed');
      if (completedLeagueSeasons.length > 0) {
        console.log(`  - Previous: ${completedLeagueSeasons.map(s => s.name).join(', ')}`);
      }
    }
    console.log('\n=== USER CREDENTIALS ===');
    console.log('All users have password: password123');
    console.log('Admin: admin@archsuite.com');
    users.slice(1).forEach(user => {
      console.log(`${user.firstName} ${user.lastName}: ${user.email}`);
    });
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding function
seedDatabase();
