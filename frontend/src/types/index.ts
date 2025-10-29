// Base interfaces without circular dependencies
export interface BaseTeam {
  _id: string;
  name: string;
  city: string;
  colors: {
    primary: string;
    secondary: string;
  };
  logo?: string;
  founded?: number;
  coach?: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  winPercentage: number;
  pointDifferential: number;
  createdAt: string;
  updatedAt: string;
}

export interface BasePlayer {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  age: number;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward' | 'Coach' | 'Manager';
  jerseyNumber?: number;
  isCaptain: boolean;
  isActive: boolean;
  stats: {
    gamesPlayed: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BaseGame {
  _id: string;
  scheduledDate: string;
  actualDate?: string;
  venue: {
    name: string;
    address?: string;
    capacity?: number;
  };
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  score: {
    homeTeam: number;
    awayTeam: number;
  };
  referee?: {
    name: string;
    phone: string;
  };
  weather?: {
    condition: string;
    temperature: number;
    humidity: number;
  };
  notes?: string;
  events: BaseGameEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface BaseGameEvent {
  type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution' | 'penalty' | 'own_goal';
  minute: number;
  description?: string;
  timestamp: string;
}

export interface Standing {
  position: number;
  team: {
    _id: string;
    name: string;
    city: string;
  };
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  points: number;
  winPercentage: number;
}

// Extended interfaces with populated data
export interface Team extends BaseTeam {
  captain?: BasePlayer;
  players: BasePlayer[];
}

export interface Player extends BasePlayer {
  team?: BaseTeam;
}

export interface Game extends BaseGame {
  homeTeam: BaseTeam;
  awayTeam: BaseTeam;
  winner?: BaseTeam | 'tie';
  result?: {
    homeTeam: number;
    awayTeam: number;
    winner: BaseTeam | 'tie';
  };
}

export interface GameEvent extends BaseGameEvent {
  player: BasePlayer;
  team: BaseTeam;
}

// Create data interfaces
export interface CreateTeamData {
  name: string;
  city: string;
  colors: {
    primary: string;
    secondary: string;
  };
  founded?: number;
  coach?: string;
}

export interface CreatePlayerData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward' | 'Coach' | 'Manager';
  jerseyNumber?: number;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface CreateGameData {
  homeTeam: string;
  awayTeam: string;
  scheduledDate: string;
  venue: {
    name: string;
    address?: string;
    capacity?: number;
  };
  referee?: {
    name: string;
    phone: string;
  };
}