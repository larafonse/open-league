import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, MapPin, Edit, Trash2 } from 'lucide-react';
import { teamsApi } from '../services/api';
import type { Team } from '../types';

const Teams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    colors: {
      primary: '#3B82F6',
      secondary: '#FFFFFF'
    },
    founded: '',
    coach: ''
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const data = await teamsApi.getAll();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const teamData = {
        ...formData,
        founded: formData.founded ? parseInt(formData.founded) : undefined
      };
      await teamsApi.create(teamData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        city: '',
        colors: {
          primary: '#3B82F6',
          secondary: '#FFFFFF'
        },
        founded: '',
        coach: ''
      });
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await teamsApi.delete(id);
        fetchTeams();
      } catch (error) {
        console.error('Error deleting team:', error);
      }
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
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="mt-2 text-gray-600">Manage your league teams</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Team
        </button>
      </div>

      {/* Create Team Form */}
      {showCreateForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Team</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Team Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">City</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Founded Year</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.founded}
                  onChange={(e) => setFormData({ ...formData, founded: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Coach</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.coach}
                  onChange={(e) => setFormData({ ...formData, coach: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Primary Color</label>
                <input
                  type="color"
                  className="form-input h-10"
                  value={formData.colors.primary}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, primary: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="form-label">Secondary Color</label>
                <input
                  type="color"
                  className="form-input h-10"
                  value={formData.colors.secondary}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, secondary: e.target.value }
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
                Create Team
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div key={team._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: team.colors.primary }}
                >
                  {team.name.charAt(0)}
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {team.city}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Link
                  to={`/teams/${team._id}`}
                  className="p-2 text-gray-400 hover:text-primary-600"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => handleDelete(team._id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Players</span>
                <span className="font-medium">{team.players.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Record</span>
                <span className="font-medium">{team.wins}-{team.losses}-{team.ties}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Win %</span>
                <span className="font-medium">{(team.winPercentage * 100).toFixed(1)}%</span>
              </div>
              {team.coach && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Coach</span>
                  <span className="font-medium">{team.coach}</span>
                </div>
              )}
              {team.founded && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Founded</span>
                  <span className="font-medium">{team.founded}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                to={`/teams/${team._id}`}
                className="w-full btn btn-primary text-center block"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first team.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            Create Team
          </button>
        </div>
      )}
    </div>
  );
};

export default Teams;
