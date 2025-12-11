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

// Sample data - coach will be assigned from users array
const teamData = [
  {
    name: 'Thunder Bolts',
    city: 'Seattle',
    colors: { primary: '#1E3A8A', secondary: '#F59E0B' },
    founded: 1995
  },
  {
    name: 'Fire Hawks',
    city: 'Phoenix',
    colors: { primary: '#DC2626', secondary: '#F97316' },
    founded: 1988
  },
  {
    name: 'Storm Riders',
    city: 'Miami',
    colors: { primary: '#059669', secondary: '#0EA5E9' },
    founded: 2001
  },
  {
    name: 'Iron Wolves',
    city: 'Chicago',
    colors: { primary: '#374151', secondary: '#F3F4F6' },
    founded: 1992
  },
  {
    name: 'Golden Eagles',
    city: 'Denver',
    colors: { primary: '#FCD34D', secondary: '#1F2937' },
    founded: 1998
  },
  {
    name: 'Blue Sharks',
    city: 'San Diego',
    colors: { primary: '#0EA5E9', secondary: '#FFFFFF' },
    founded: 2003
  },
  {
    name: 'Crimson Lions',
    city: 'Boston',
    colors: { primary: '#B91C1C', secondary: '#FEF3C7' },
    founded: 1985
  },
  {
    name: 'Silver Strikers',
    city: 'Portland',
    colors: { primary: '#6B7280', secondary: '#10B981' },
    founded: 1999
  },
  {
    name: 'Green Vipers',
    city: 'Austin',
    colors: { primary: '#10B981', secondary: '#1F2937' },
    founded: 2005
  },
  {
    name: 'Purple Panthers',
    city: 'Nashville',
    colors: { primary: '#7C3AED', secondary: '#FBBF24' },
    founded: 1996
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
  { firstName: 'Robert', lastName: 'Martinez', position: 'Goalkeeper', jerseyNumber: 1 },
  { firstName: 'Patrick', lastName: 'O\'Brien', position: 'Defender', jerseyNumber: 4 },
  { firstName: 'Sean', lastName: 'Murphy', position: 'Defender', jerseyNumber: 5 },
  { firstName: 'Kevin', lastName: 'O\'Connor', position: 'Midfielder', jerseyNumber: 8 },
  { firstName: 'Brian', lastName: 'Kelly', position: 'Midfielder', jerseyNumber: 10 },
  { firstName: 'Daniel', lastName: 'Walsh', position: 'Forward', jerseyNumber: 9 },
  { firstName: 'Michael', lastName: 'Sullivan', position: 'Forward', jerseyNumber: 11 },
  { firstName: 'Timothy', lastName: 'Quinn', position: 'Defender', jerseyNumber: 3 },
  { firstName: 'Christopher', lastName: 'Doyle', position: 'Midfielder', jerseyNumber: 6 },
  { firstName: 'Matthew', lastName: 'Byrne', position: 'Forward', jerseyNumber: 7 },
  { firstName: 'Joseph', lastName: 'Reilly', position: 'Defender', jerseyNumber: 2 },
  
  // Blue Sharks players
  { firstName: 'Jordan', lastName: 'Mitchell', position: 'Goalkeeper', jerseyNumber: 1 },
  { firstName: 'Casey', lastName: 'Parker', position: 'Defender', jerseyNumber: 4 },
  { firstName: 'Morgan', lastName: 'Riley', position: 'Defender', jerseyNumber: 5 },
  { firstName: 'Avery', lastName: 'Sullivan', position: 'Midfielder', jerseyNumber: 8 },
  { firstName: 'Quinn', lastName: 'Bennett', position: 'Midfielder', jerseyNumber: 10 },
  { firstName: 'Riley', lastName: 'Foster', position: 'Forward', jerseyNumber: 9 },
  { firstName: 'Sage', lastName: 'Hayes', position: 'Forward', jerseyNumber: 11 },
  { firstName: 'Dakota', lastName: 'Bryant', position: 'Defender', jerseyNumber: 3 },
  { firstName: 'Skyler', lastName: 'Griffin', position: 'Midfielder', jerseyNumber: 6 },
  { firstName: 'Cameron', lastName: 'Dunn', position: 'Forward', jerseyNumber: 7 },
  { firstName: 'Blake', lastName: 'Perry', position: 'Defender', jerseyNumber: 2 },
  
  // Crimson Lions players
  { firstName: 'Oliver', lastName: 'Stewart', position: 'Goalkeeper', jerseyNumber: 1 },
  { firstName: 'George', lastName: 'Campbell', position: 'Defender', jerseyNumber: 4 },
  { firstName: 'Arthur', lastName: 'Mitchell', position: 'Defender', jerseyNumber: 5 },
  { firstName: 'Edward', lastName: 'Roberts', position: 'Midfielder', jerseyNumber: 8 },
  { firstName: 'Charles', lastName: 'Turner', position: 'Midfielder', jerseyNumber: 10 },
  { firstName: 'Harold', lastName: 'Phillips', position: 'Forward', jerseyNumber: 9 },
  { firstName: 'Walter', lastName: 'Campbell', position: 'Forward', jerseyNumber: 11 },
  { firstName: 'Frank', lastName: 'Parker', position: 'Defender', jerseyNumber: 3 },
  { firstName: 'Albert', lastName: 'Evans', position: 'Midfielder', jerseyNumber: 6 },
  { firstName: 'Raymond', lastName: 'Edwards', position: 'Forward', jerseyNumber: 7 },
  { firstName: 'Louis', lastName: 'Collins', position: 'Defender', jerseyNumber: 2 },
  
  // Silver Strikers players
  { firstName: 'Zachary', lastName: 'Bennett', position: 'Goalkeeper', jerseyNumber: 1 },
  { firstName: 'Evan', lastName: 'Wood', position: 'Defender', jerseyNumber: 4 },
  { firstName: 'Gavin', lastName: 'Ross', position: 'Defender', jerseyNumber: 5 },
  { firstName: 'Brayden', lastName: 'Henderson', position: 'Midfielder', jerseyNumber: 8 },
  { firstName: 'Colton', lastName: 'Coleman', position: 'Midfielder', jerseyNumber: 10 },
  { firstName: 'Parker', lastName: 'Jenkins', position: 'Forward', jerseyNumber: 9 },
  { firstName: 'Tristan', lastName: 'Powell', position: 'Forward', jerseyNumber: 11 },
  { firstName: 'Bryce', lastName: 'Long', position: 'Defender', jerseyNumber: 3 },
  { firstName: 'Carson', lastName: 'Patterson', position: 'Midfielder', jerseyNumber: 6 },
  { firstName: 'Cooper', lastName: 'Hughes', position: 'Forward', jerseyNumber: 7 },
  { firstName: 'Easton', lastName: 'Flores', position: 'Defender', jerseyNumber: 2 },
  
  // Green Vipers players
  { firstName: 'Aiden', lastName: 'Rivera', position: 'Goalkeeper', jerseyNumber: 1 },
  { firstName: 'Caden', lastName: 'Reed', position: 'Defender', jerseyNumber: 4 },
  { firstName: 'Jaden', lastName: 'Bailey', position: 'Defender', jerseyNumber: 5 },
  { firstName: 'Kaden', lastName: 'Cooper', position: 'Midfielder', jerseyNumber: 8 },
  { firstName: 'Landon', lastName: 'Richardson', position: 'Midfielder', jerseyNumber: 10 },
  { firstName: 'Logan', lastName: 'Cox', position: 'Forward', jerseyNumber: 9 },
  { firstName: 'Mason', lastName: 'Howard', position: 'Forward', jerseyNumber: 11 },
  { firstName: 'Nolan', lastName: 'Ward', position: 'Defender', jerseyNumber: 3 },
  { firstName: 'Owen', lastName: 'Torres', position: 'Midfielder', jerseyNumber: 6 },
  { firstName: 'Preston', lastName: 'Peterson', position: 'Forward', jerseyNumber: 7 },
  { firstName: 'Quinn', lastName: 'Gray', position: 'Defender', jerseyNumber: 2 },
  
  // Purple Panthers players
  { firstName: 'Riley', lastName: 'Ramirez', position: 'Goalkeeper', jerseyNumber: 1 },
  { firstName: 'Sawyer', lastName: 'James', position: 'Defender', jerseyNumber: 4 },
  { firstName: 'Tyler', lastName: 'Watson', position: 'Defender', jerseyNumber: 5 },
  { firstName: 'Wyatt', lastName: 'Brooks', position: 'Midfielder', jerseyNumber: 8 },
  { firstName: 'Xavier', lastName: 'Kelly', position: 'Midfielder', jerseyNumber: 10 },
  { firstName: 'Zane', lastName: 'Sanders', position: 'Forward', jerseyNumber: 9 },
  { firstName: 'Zion', lastName: 'Price', position: 'Forward', jerseyNumber: 11 },
  { firstName: 'Asher', lastName: 'Bennett', position: 'Defender', jerseyNumber: 3 },
  { firstName: 'Bentley', lastName: 'Wood', position: 'Midfielder', jerseyNumber: 6 },
  { firstName: 'Carter', lastName: 'Barnes', position: 'Forward', jerseyNumber: 7 },
  { firstName: 'Dylan', lastName: 'Ross', position: 'Defender', jerseyNumber: 2 }
];

const venues = [
  { name: 'Thunder Stadium', address: '123 Thunder Way, Seattle, WA', capacity: 25000 },
  { name: 'Fire Arena', address: '456 Phoenix Blvd, Phoenix, AZ', capacity: 30000 },
  { name: 'Storm Center', address: '789 Miami Drive, Miami, FL', capacity: 22000 },
  { name: 'Iron Field', address: '321 Chicago Ave, Chicago, IL', capacity: 28000 },
  { name: 'Eagle Park', address: '555 Mountain View, Denver, CO', capacity: 24000 },
  { name: 'Shark Bay', address: '777 Ocean Drive, San Diego, CA', capacity: 26000 },
  { name: 'Lion\'s Den', address: '888 Beacon St, Boston, MA', capacity: 27000 },
  { name: 'Striker Grounds', address: '999 Rose Quarter, Portland, OR', capacity: 23000 },
  { name: 'Viper Venue', address: '111 Music Lane, Austin, TX', capacity: 25000 },
  { name: 'Panther Stadium', address: '222 Broadway, Nashville, TN', capacity: 29000 }
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
    
    // Create demo users (no associated data)
    console.log('\n=== CREATING DEMO USERS ===');
    const demoUsers = [];
    
    // 1. League Manager (Tier 2 - can create 3 leagues)
    let leagueManager = await User.findOne({ email: 'league.manager@demo.com' });
    if (!leagueManager) {
      leagueManager = new User({
        email: 'league.manager@demo.com',
        password: 'password123',
        firstName: 'League',
        lastName: 'Manager',
        role: 'user',
        userType: 'league_admin',
        tier: 2
      });
      await leagueManager.save();
      console.log('Created demo user: league.manager@demo.com / password123 (League Manager - Tier 2)');
    } else {
      // Update existing user if needed
      if (leagueManager.userType !== 'league_admin' || leagueManager.tier !== 2) {
        leagueManager.userType = 'league_admin';
        leagueManager.tier = 2;
        await leagueManager.save();
      }
      console.log('Using existing demo user: league.manager@demo.com');
    }
    demoUsers.push(leagueManager);
    
    // 2. Team Coach (coach/player type)
    let teamCoach = await User.findOne({ email: 'team.coach@demo.com' });
    if (!teamCoach) {
      teamCoach = new User({
        email: 'team.coach@demo.com',
        password: 'password123',
        firstName: 'Team',
        lastName: 'Coach',
        role: 'user',
        userType: 'coach_player',
        tier: 1
      });
      await teamCoach.save();
      console.log('Created demo user: team.coach@demo.com / password123 (Team Coach)');
    } else {
      // Update existing user if needed
      if (teamCoach.userType !== 'coach_player') {
        teamCoach.userType = 'coach_player';
        teamCoach.tier = 1;
        await teamCoach.save();
      }
      console.log('Using existing demo user: team.coach@demo.com');
    }
    demoUsers.push(teamCoach);
    
    // 3. Player (coach/player type)
    let player = await User.findOne({ email: 'player@demo.com' });
    if (!player) {
      player = new User({
        email: 'player@demo.com',
        password: 'password123',
        firstName: 'Demo',
        lastName: 'Player',
        role: 'user',
        userType: 'coach_player',
        tier: 1
      });
      await player.save();
      console.log('Created demo user: player@demo.com / password123 (Player)');
    } else {
      // Update existing user if needed
      if (player.userType !== 'coach_player') {
        player.userType = 'coach_player';
        player.tier = 1;
        await player.save();
      }
      console.log('Using existing demo user: player@demo.com');
    }
    demoUsers.push(player);
    
    // Create or get admin user for seeding data
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
      console.log('Created admin user: admin@archsuite.com / password123');
    } else {
      console.log('Using existing admin user: admin@archsuite.com');
    }
    
    // Create additional random users for seeding data
    console.log('\n=== CREATING SEED DATA USERS ===');
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
        console.log(`Created seed user: ${email} / password123`);
      } else {
        console.log(`Using existing seed user: ${email}`);
      }
      users.push(user);
    }
    
    // Create teams
    const teams = [];
    for (let i = 0; i < teamData.length; i++) {
      const teamInfo = teamData[i];
      // Assign a coach from the users array (skip admin user, use regular users)
      // Use modulo to cycle through users if there are more teams than users
      const coachIndex = (i % (users.length - 1)) + 1; // +1 to skip admin user
      const coach = users[coachIndex];
      
      const team = new Team({
        ...teamInfo,
        coach: coach._id
      });
      await team.save();
      teams.push(team);
      console.log(`Created team: ${team.name} with coach: ${coach.firstName} ${coach.lastName}`);
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
    
    // Create leagues
    console.log('\n=== CREATING LEAGUES ===');
    const leagues = [];
    const leagueData = [
      {
        name: 'Premier Soccer League',
        description: 'The premier soccer league for competitive teams',
        isPublic: true,
        owner: testUser._id,
        members: [testUser._id, ...users.slice(1, 5).map(u => u._id)],
        settings: { maxTeams: 20, minTeams: 4 }
      },
      {
        name: 'Metro Soccer Association',
        description: 'Metropolitan area soccer league',
        isPublic: true,
        owner: users[1]._id,
        members: [users[1]._id, ...users.slice(2, 6).map(u => u._id)],
        settings: { maxTeams: 16, minTeams: 4 }
      },
      {
        name: 'Elite Football Conference',
        description: 'Elite competitive football conference',
        isPublic: false,
        owner: users[2]._id,
        members: [users[2]._id, ...users.slice(3, 7).map(u => u._id)],
        settings: { maxTeams: 12, minTeams: 4 }
      }
    ];
    
    for (const leagueInfo of leagueData) {
      const league = new League(leagueInfo);
      await league.save();
      leagues.push(league);
      console.log(`Created league: ${league.name}`);
    }
    
    // Create seasons
    console.log('\n=== CREATING SEASONS ===');
    const seasons = [];
    
    // Create a season for the first league
    const seasonStartDate = new Date();
    seasonStartDate.setMonth(seasonStartDate.getMonth() - 2); // 2 months ago
    const seasonEndDate = new Date();
    seasonEndDate.setMonth(seasonEndDate.getMonth() + 4); // 4 months from now
    
    const season1 = new Season({
      name: 'Spring 2024',
      description: 'Spring season 2024',
      league: leagues[0]._id,
      startDate: seasonStartDate,
      endDate: seasonEndDate,
      teams: teams.slice(0, 6).map(t => t._id), // First 6 teams
      status: 'active',
      settings: {
        gamesPerWeek: 1,
        playoffTeams: 4,
        regularSeasonWeeks: 10
      }
    });
    await season1.save();
    seasons.push(season1);
    console.log(`Created season: ${season1.name}`);
    
    // Create another season for the second league
    const season2StartDate = new Date();
    season2StartDate.setMonth(season2StartDate.getMonth() + 1);
    const season2EndDate = new Date();
    season2EndDate.setMonth(season2EndDate.getMonth() + 5);
    
    const season2 = new Season({
      name: 'Summer 2024',
      description: 'Summer season 2024',
      league: leagues[1]._id,
      startDate: season2StartDate,
      endDate: season2EndDate,
      teams: teams.slice(4, 10).map(t => t._id), // Teams 5-10
      status: 'registration',
      settings: {
        gamesPerWeek: 1,
        playoffTeams: 4,
        regularSeasonWeeks: 12
      }
    });
    await season2.save();
    seasons.push(season2);
    console.log(`Created season: ${season2.name}`);
    
    // Add player registrations with payment status
    console.log('\n=== CREATING PLAYER REGISTRATIONS ===');
    
    // For season 1 (active season) - register players from first 6 teams
    for (let i = 0; i < 6; i++) {
      const team = teams[i];
      const teamPlayers = allPlayers.filter(p => p.team.toString() === team._id.toString());
      
      // Register all players from this team
      for (let j = 0; j < teamPlayers.length; j++) {
        const player = teamPlayers[j];
        // 70% of players have paid, 30% haven't
        const hasPaid = Math.random() > 0.3;
        const paymentDate = hasPaid 
          ? getRandomDate(seasonStartDate, new Date())
          : undefined;
        
        season1.playerRegistrations = season1.playerRegistrations || [];
        season1.playerRegistrations.push({
          player: player._id,
          team: team._id,
          hasPaid: hasPaid,
          paymentDate: paymentDate,
          registrationDate: getRandomDate(seasonStartDate, new Date())
        });
      }
    }
    await season1.save();
    console.log(`Registered ${season1.playerRegistrations.length} players for ${season1.name}`);
    
    // For season 2 (registration season) - register players from teams 5-10
    for (let i = 4; i < 10; i++) {
      const team = teams[i];
      const teamPlayers = allPlayers.filter(p => p.team.toString() === team._id.toString());
      
      // Register about 80% of players (some teams still registering)
      const playersToRegister = Math.floor(teamPlayers.length * 0.8);
      
      for (let j = 0; j < playersToRegister; j++) {
        const player = teamPlayers[j];
        // 60% of registered players have paid
        const hasPaid = Math.random() > 0.4;
        const paymentDate = hasPaid 
          ? getRandomDate(season2StartDate, new Date())
          : undefined;
        
        season2.playerRegistrations = season2.playerRegistrations || [];
        season2.playerRegistrations.push({
          player: player._id,
          team: team._id,
          hasPaid: hasPaid,
          paymentDate: paymentDate,
          registrationDate: getRandomDate(season2StartDate, new Date())
        });
      }
    }
    await season2.save();
    console.log(`Registered ${season2.playerRegistrations.length} players for ${season2.name}`);
    
    // Update games to be associated with season 1
    for (let i = 0; i < Math.min(games.length, 10); i++) {
      games[i].season = season1._id;
      await games[i].save();
    }
    
    console.log('\nDatabase seeding completed successfully!');
    console.log(`Created ${teams.length} teams`);
    console.log(`Created ${allPlayers.length} players`);
    console.log(`Created ${games.length} games`);
    console.log(`Created ${leagues.length} leagues`);
    console.log(`Created ${seasons.length} seasons`);
    
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
    
    // Display player registration summary
    console.log('\n=== PLAYER REGISTRATION SUMMARY ===');
    for (const season of seasons) {
      const paidCount = (season.playerRegistrations || []).filter(r => r.hasPaid).length;
      const unpaidCount = (season.playerRegistrations || []).filter(r => !r.hasPaid).length;
      console.log(`${season.name}: ${season.playerRegistrations?.length || 0} registered (${paidCount} paid, ${unpaidCount} unpaid)`);
    }
    
    console.log('\n=== SEEDING SUMMARY ===');
    console.log(`Created ${users.length} users`);
    console.log(`Created ${teams.length} teams`);
    console.log(`Created ${allPlayers.length} players`);
    console.log(`Created ${games.length} games`);
    console.log(`Created ${leagues.length} leagues`);
    console.log(`Created ${seasons.length} seasons`);
    console.log('\n=== DEMO USER CREDENTIALS ===');
    console.log('These users have NO associated data and are for demo purposes:');
    console.log('Password for all: password123');
    demoUsers.forEach(user => {
      console.log(`${user.firstName} ${user.lastName}: ${user.email}`);
    });
    
    console.log('\n=== SEED DATA USER CREDENTIALS ===');
    console.log('Admin: admin@archsuite.com / password123');
    console.log('Other seed users: password123');
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
