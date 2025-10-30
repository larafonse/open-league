import axios from 'axios';
import type { Team, Player, Game, Standing, Season, CreateTeamData, CreatePlayerData, CreateGameData, CreateSeasonData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  getAll: (): Promise<Standing[]> => api.get('/standings').then(res => res.data),
  getByTeam: (teamId: string): Promise<Standing> => api.get(`/standings/${teamId}`).then(res => res.data),
};

// Seasons API
export const seasonsApi = {
  getAll: (params?: { status?: string }): Promise<Season[]> => 
    api.get('/seasons', { params }).then(res => res.data),
  getById: (id: string): Promise<Season> => api.get(`/seasons/${id}`).then(res => res.data),
  create: (data: CreateSeasonData): Promise<Season> => api.post('/seasons', data).then(res => res.data),
  update: (id: string, data: Partial<CreateSeasonData & { status?: string }>): Promise<Season> => 
    api.put(`/seasons/${id}`, data).then(res => res.data),
  delete: (id: string): Promise<void> => api.delete(`/seasons/${id}`).then(() => undefined),
  generateSchedule: (id: string): Promise<Season> => 
    api.post(`/seasons/${id}/generate-schedule`).then(res => res.data),
  start: (id: string): Promise<Season> => 
    api.post(`/seasons/${id}/start`).then(res => res.data),
  complete: (id: string): Promise<Season> => 
    api.post(`/seasons/${id}/complete`).then(res => res.data),
  getStandings: (id: string): Promise<any[]> => 
    api.get(`/seasons/${id}/standings`).then(res => res.data),
};

export default api;
