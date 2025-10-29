# Sports League Management System

A comprehensive web application for managing sports leagues, built with Node.js, Express, React, and TypeScript.

## Features

### 🏆 Core Functionality
- **Team Management**: Create, edit, and manage teams with custom colors and logos
- **Player Registration**: Register players with detailed information and statistics
- **Game Scheduling**: Schedule games with venue and referee information
- **Live Scoring**: Track game events and update scores in real-time
- **Standings**: Automatic calculation of league standings with win percentages
- **Statistics**: Comprehensive player and team statistics tracking

### 🎨 User Interface
- **Modern Design**: Clean, responsive interface built with Tailwind CSS
- **Mobile-First**: Fully responsive design that works on all devices
- **Intuitive Navigation**: Easy-to-use sidebar navigation
- **Real-time Updates**: Live data updates without page refreshes

### 🔧 Technical Features
- **RESTful API**: Well-structured API endpoints for all operations
- **Type Safety**: Full TypeScript implementation for both frontend and backend
- **Database Integration**: MongoDB with Mongoose for data persistence
- **Validation**: Comprehensive input validation and error handling
- **Modular Architecture**: Clean separation of concerns

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Express Validator** - Input validation
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sports-league-manager
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Start MongoDB**
   ```bash
   # On macOS with Homebrew
   brew services start mongodb/brew/mongodb-community
   
   # On other systems, start MongoDB service
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the backend directory:
   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/sports-league
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   ```

5. **Start the development servers**
   ```bash
   # Start both backend and frontend
   npm run dev
   
   # Or start them separately
   npm run dev:backend  # Backend on http://localhost:3001
   npm run dev:frontend # Frontend on http://localhost:5173
   ```

## Project Structure

```
sports-league-manager/
├── backend/
│   ├── src/
│   │   ├── models/          # Database models
│   │   │   ├── Team.js
│   │   │   ├── Player.js
│   │   │   └── Game.js
│   │   ├── routes/          # API routes
│   │   │   ├── teams.js
│   │   │   ├── players.js
│   │   │   ├── games.js
│   │   │   └── standings.js
│   │   └── server.js        # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   └── Layout.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Teams.tsx
│   │   │   ├── Players.tsx
│   │   │   ├── Games.tsx
│   │   │   └── Standings.tsx
│   │   ├── services/        # API services
│   │   │   └── api.ts
│   │   ├── types/           # TypeScript types
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── package.json
```

## API Endpoints

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID
- `POST /api/teams` - Create new team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/players` - Add player to team
- `DELETE /api/teams/:id/players/:playerId` - Remove player from team

### Players
- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get player by ID
- `POST /api/players` - Create new player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player
- `PUT /api/players/:id/captain` - Set player as captain

### Games
- `GET /api/games` - Get all games
- `GET /api/games/:id` - Get game by ID
- `POST /api/games` - Create new game
- `PUT /api/games/:id` - Update game
- `DELETE /api/games/:id` - Delete game
- `POST /api/games/:id/events` - Add event to game

### Standings
- `GET /api/standings` - Get league standings
- `GET /api/standings/:teamId` - Get team standing

## Usage

### Creating Teams
1. Navigate to the Teams page
2. Click "Add Team" button
3. Fill in team details (name, city, colors, etc.)
4. Click "Create Team"

### Registering Players
1. Go to the Players page
2. Click "Add Player" button
3. Enter player information
4. Click "Register Player"

### Scheduling Games
1. Visit the Games page
2. Click "Schedule Game" button
3. Select teams, venue, and date/time
4. Click "Schedule Game"

### Viewing Standings
1. Navigate to the Standings page
2. View current league standings
3. See win percentages, points, and statistics

## Database Schema

### Team Model
- Basic info: name, city, colors, founded year, coach
- Statistics: wins, losses, ties, points for/against
- Relationships: players, captain

### Player Model
- Personal info: name, email, phone, date of birth
- Team info: position, jersey number, team assignment
- Statistics: games played, goals, assists, cards
- Emergency contact information

### Game Model
- Teams: home team, away team
- Scheduling: date, venue, referee
- Status: scheduled, in_progress, completed, etc.
- Scoring: home/away scores
- Events: goals, cards, substitutions, etc.

## Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Building for Production
```bash
npm run build
```

### Code Style
- ESLint for JavaScript/TypeScript linting
- Prettier for code formatting
- Consistent naming conventions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository or contact the development team.

---

Built with ❤️ for sports league management
