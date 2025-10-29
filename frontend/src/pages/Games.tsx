import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, MapPin, Clock, Edit, Trash2 } from 'lucide-react';
import { gamesApi, teamsApi } from '../services/api';
import type { Game, Team } from '../types';

const Games: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    scheduledDate: '',
    venue: {
      name: '',
      address: '',
      capacity: ''
    },
    referee: {
      name: '',
      phone: ''
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gamesData, teamsData] = await Promise.all([
        gamesApi.getAll(),
        teamsApi.getAll()
      ]);
      setGames(gamesData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const gameData = {
        ...formData,
        venue: {
          ...formData.venue,
          capacity: formData.venue.capacity ? parseInt(formData.venue.capacity) : undefined
        }
      };
      await gamesApi.create(gameData);
      setShowCreateForm(false);
      setFormData({
        homeTeam: '',
        awayTeam: '',
        scheduledDate: '',
        venue: {
          name: '',
          address: '',
          capacity: ''
        },
        referee: {
          name: '',
          phone: ''
        }
      });
      fetchData();
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      try {
        await gamesApi.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting game:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'postponed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Games</h1>
          <p className="mt-2 text-gray-600">Manage league games and schedules</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Schedule Game
        </button>
      </div>

      {/* Create Game Form */}
      {showCreateForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule New Game</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Home Team</label>
                <select
                  required
                  className="form-input"
                  value={formData.homeTeam}
                  onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                >
                  <option value="">Select Home Team</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Away Team</label>
                <select
                  required
                  className="form-input"
                  value={formData.awayTeam}
                  onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
                >
                  <option value="">Select Away Team</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  className="form-input"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Venue Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.venue.name}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    venue: { ...formData.venue, name: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="form-label">Venue Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.venue.address}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    venue: { ...formData.venue, address: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="form-label">Venue Capacity</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.venue.capacity}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    venue: { ...formData.venue, capacity: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="form-label">Referee Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.referee.name}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    referee: { ...formData.referee, name: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="form-label">Referee Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.referee.phone}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    referee: { ...formData.referee, phone: e.target.value }
                  })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Schedule Game
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Games List */}
      <div className="space-y-4">
        {games.map((game) => (
          <div key={game._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {game.homeTeam.name} vs {game.awayTeam.name}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(game.status)}`}>
                    {game.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(game.scheduledDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(game.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {game.venue.name}
                  </div>
                </div>
                {game.status === 'completed' && (
                  <div className="mt-2 text-lg font-semibold text-gray-900">
                    {game.score.homeTeam} - {game.score.awayTeam}
                  </div>
                )}
              </div>
              <div className="flex space-x-2 ml-4">
                <Link
                  to={`/games/${game._id}`}
                  className="p-2 text-gray-400 hover:text-primary-600"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => handleDelete(game._id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {games.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No games scheduled</h3>
          <p className="text-gray-600 mb-4">Get started by scheduling your first game.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            Schedule Game
          </button>
        </div>
      )}
    </div>
  );
};

export default Games;
