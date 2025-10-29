import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, User, Calendar, Trophy, TrendingUp, Activity } from 'lucide-react';
import { teamsApi, playersApi, gamesApi, standingsApi } from '../services/api';
import { Team, Player, Game, Standing } from '../types';

const Dashboard: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsData, playersData, gamesData, standingsData] = await Promise.all([
          teamsApi.getAll(),
          playersApi.getAll(),
          gamesApi.getAll(),
          standingsApi.getAll(),
        ]);

        setTeams(teamsData);
        setPlayers(playersData);
        setGames(gamesData);
        setStandings(standingsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const recentGames = games
    .filter(game => game.status === 'completed')
    .sort((a, b) => new Date(b.actualDate || b.scheduledDate).getTime() - new Date(a.actualDate || a.scheduledDate).getTime())
    .slice(0, 5);

  const upcomingGames = games
    .filter(game => game.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 5);

  const topTeams = standings.slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to your sports league management system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Teams</p>
              <p className="text-2xl font-semibold text-gray-900">{teams.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Players</p>
              <p className="text-2xl font-semibold text-gray-900">{players.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Games</p>
              <p className="text-2xl font-semibold text-gray-900">{games.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <Trophy className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Games</p>
              <p className="text-2xl font-semibold text-gray-900">
                {games.filter(game => game.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Teams */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">League Leaders</h2>
            <Link to="/standings" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {topTeams.map((standing, index) => (
              <div key={standing.team._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary-600 text-white rounded-full text-sm font-semibold mr-3">
                    {standing.position}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{standing.team.name}</p>
                    <p className="text-sm text-gray-600">{standing.team.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{standing.points} pts</p>
                  <p className="text-sm text-gray-600">{standing.wins}-{standing.losses}-{standing.ties}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Games */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Results</h2>
            <Link to="/games" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentGames.length > 0 ? (
              recentGames.map((game) => (
                <div key={game._id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {game.homeTeam.name} vs {game.awayTeam.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(game.actualDate || game.scheduledDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {game.score.homeTeam} - {game.score.awayTeam}
                      </p>
                      <p className="text-sm text-gray-600">{game.status}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent games</p>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Games */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Games</h2>
          <Link to="/games" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {upcomingGames.length > 0 ? (
            upcomingGames.map((game) => (
              <div key={game._id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {game.homeTeam.name} vs {game.awayTeam.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {game.venue.name} • {new Date(game.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {new Date(game.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {game.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No upcoming games</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
