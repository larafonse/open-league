import axios from 'axios';
import type { Team, Player, Game, Standing, Season, League, CreateTeamData, CreatePlayerData, CreateGameData, CreateSeasonData, CreateLeagueData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear it
      localStorage.removeItem('token');
      // Optionally redirect to login
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Teams API
export const teamsApi = {
  getAll: (): Promise<Team[]> => api.get('/teams').then(res => res.data),
  getById: (id: string): Promise<Team> => api.get(`/teams/${id}`).then(res => res.data),
  create: (data: CreateTeamData): Promise<Team> => api.post('/teams', data).then(res => res.data),
  update: (id: string, data: Partial<CreateTeamData>): Promise<Team> => 
    api.put(`/teams/${id}`, data).then(res => res.data),
  delete: (id: string): Promise<void> => api.delete(`/teams/${id}`).then(() => undefined),
  addPlayer: (teamId: string, playerId: string): Promise<void> => 
    api.post(`/teams/${teamId}/players`, { playerId }).then(() => undefined),
  removePlayer: (teamId: string, playerId: string): Promise<void> => 
    api.delete(`/teams/${teamId}/players/${playerId}`).then(() => undefined),
};

// Players API
export const playersApi = {
  getAll: (params?: { team?: string; position?: string; isActive?: boolean }): Promise<Player[]> => 
    api.get('/players', { params }).then(res => res.data),
  getById: (id: string): Promise<Player> => api.get(`/players/${id}`).then(res => res.data),
  create: (data: CreatePlayerData): Promise<Player> => api.post('/players', data).then(res => res.data),
  update: (id: string, data: Partial<CreatePlayerData>): Promise<Player> => 
    api.put(`/players/${id}`, data).then(res => res.data),
  delete: (id: string): Promise<void> => api.delete(`/players/${id}`).then(() => undefined),
  setCaptain: (id: string): Promise<void> => api.put(`/players/${id}/captain`).then(() => undefined),
};

// Games API
export const gamesApi = {
  getAll: (params?: { status?: string; team?: string; date?: string }): Promise<Game[]> => 
    api.get('/games', { params }).then(res => res.data),
  getById: (id: string): Promise<Game> => api.get(`/games/${id}`).then(res => res.data),
  create: (data: CreateGameData): Promise<Game> => api.post('/games', data).then(res => res.data),
  update: (id: string, data: Partial<CreateGameData & { status?: string; score?: { homeTeam: number; awayTeam: number } }>): Promise<Game> => 
    api.put(`/games/${id}`, data).then(res => res.data),
  delete: (id: string): Promise<void> => api.delete(`/games/${id}`).then(() => undefined),
  addEvent: (gameId: string, event: any): Promise<void> => 
    api.post(`/games/${gameId}/events`, event).then(() => undefined),
};

// Standings API
export const standingsApi = {
  getAll: (params?: { league?: string }): Promise<Standing[]> => 
    api.get('/standings', { params }).then(res => res.data),
  getByTeam: (teamId: string): Promise<Standing> => api.get(`/standings/${teamId}`).then(res => res.data),
};

// Leagues API
export const leaguesApi = {
  getAll: (params?: { search?: string; publicOnly?: boolean }): Promise<League[]> => 
    api.get('/leagues', { params }).then(res => res.data),
  getMyLeagues: (): Promise<League[]> => 
    api.get('/leagues/my-leagues').then(res => res.data),
  getById: (id: string): Promise<League> => 
    api.get(`/leagues/${id}`).then(res => res.data),
  create: (data: CreateLeagueData): Promise<League> => 
    api.post('/leagues', data).then(res => res.data),
  update: (id: string, data: Partial<CreateLeagueData>): Promise<League> => 
    api.put(`/leagues/${id}`, data).then(res => res.data),
  delete: (id: string): Promise<void> => 
    api.delete(`/leagues/${id}`).then(() => undefined),
  addMember: (leagueId: string, userId: string): Promise<League> => 
    api.post(`/leagues/${leagueId}/members`, { userId }).then(res => res.data),
  removeMember: (leagueId: string, userId: string): Promise<League> => 
    api.delete(`/leagues/${leagueId}/members/${userId}`).then(res => res.data),
  getSeasons: (leagueId: string): Promise<Season[]> => 
    api.get(`/leagues/${leagueId}/seasons`).then(res => res.data),
  getTeams: (leagueId: string): Promise<Team[]> => 
    api.get(`/leagues/${leagueId}/teams`).then(res => res.data),
  getPlayers: (leagueId: string): Promise<Player[]> => 
    api.get(`/leagues/${leagueId}/players`).then(res => res.data),
  addTeams: (leagueId: string, teamIds: string[]): Promise<League> => 
    api.post(`/leagues/${leagueId}/teams`, { teamIds }).then(res => res.data),
};

// Seasons API
export const seasonsApi = {
  getAll: (params?: { status?: string }): Promise<Season[]> => 
    api.get('/seasons', { params }).then(res => res.data),
  getById: (id: string): Promise<Season> => api.get(`/seasons/${id}`).then(res => res.data),
  create: (data: CreateSeasonData): Promise<Season> => api.post('/seasons', data).then(res => res.data),
  update: (id: string, data: Partial<CreateSeasonData & { status?: string }>): Promise<Season> => 
    api.put(`/seasons/${id}`, data).then(res => res.data),
  deleteSeason: (id: string): Promise<void> => api.delete(`/seasons/${id}`).then(() => undefined),
  generateSchedule: (id: string): Promise<Season> => 
    api.post(`/seasons/${id}/generate-schedule`).then(res => res.data),
  start: (id: string): Promise<Season> => 
    api.post(`/seasons/${id}/start`).then(res => res.data),
  complete: (id: string): Promise<Season> => 
    api.post(`/seasons/${id}/complete`).then(res => res.data),
  openRegistration: (id: string): Promise<Season> => 
    api.post(`/seasons/${id}/open-registration`).then(res => res.data),
  registerTeam: (id: string, teamId: string): Promise<Season> => 
    api.post(`/seasons/${id}/register-team`, { teamId }).then(res => res.data),
  getAvailableTeams: (id: string): Promise<Team[]> => 
    api.get(`/seasons/${id}/available-teams`).then(res => res.data),
  getVenues: (id: string): Promise<any[]> => 
    api.get(`/seasons/${id}/venues`).then(res => res.data),
  addVenue: (id: string, venueId: string): Promise<any[]> => 
    api.post(`/seasons/${id}/venues`, { venueId }).then(res => res.data),
  removeVenue: (id: string, venueId: string): Promise<void> => 
    api.delete(`/seasons/${id}/venues/${venueId}`).then(() => undefined),
  regenerateSchedule: (id: string): Promise<Season> => 
    api.post(`/seasons/${id}/regenerate-schedule`).then(res => res.data),
  getStandings: (id: string): Promise<any[]> => 
    api.get(`/seasons/${id}/standings`).then(res => res.data),
};

// Auth API
export interface LoginResponse {
  token: string;
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface SignupResponse extends LoginResponse {}

export const authApi = {
  login: (email: string, password: string): Promise<LoginResponse> =>
    api.post('/auth/login', { email, password }).then(res => res.data),
  signup: (email: string, password: string, firstName: string, lastName: string): Promise<SignupResponse> =>
    api.post('/auth/signup', { email, password, firstName, lastName }).then(res => res.data),
  getCurrentUser: (): Promise<{
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }> => api.get('/auth/me').then(res => res.data.user),
};

// Venues API
export const venuesApi = {
  getAll: (): Promise<any[]> => api.get('/venues').then(res => res.data),
  getById: (id: string): Promise<any> => api.get(`/venues/${id}`).then(res => res.data),
  create: (data: any): Promise<any> => api.post('/venues', data).then(res => res.data),
  update: (id: string, data: any): Promise<any> => 
    api.put(`/venues/${id}`, data).then(res => res.data),
  delete: (id: string): Promise<void> => api.delete(`/venues/${id}`).then(() => undefined),
};

export default api;
