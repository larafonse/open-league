import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Chip,
  Paper,
  Grid } from '@mui/material';
import {
  Add,
  CalendarToday,
  LocationOn,
  AccessTime,
  Edit,
  Delete,
} from '@mui/icons-material';
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
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'scheduled': return 'warning';
      case 'cancelled': return 'error';
      case 'postponed': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              Games
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Manage league games and schedules
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateForm(true)}
            size="large"
          >
            Schedule Game
          </Button>
        </Box>
      </Box>

      {/* Create Game Dialog */}
      <Dialog open={showCreateForm} onClose={() => setShowCreateForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>Schedule New Game</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Home Team</InputLabel>
                  <Select
                    value={formData.homeTeam}
                    label="Home Team"
                    onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                  >
                    {teams.map(team => (
                      <MenuItem key={team._id} value={team._id}>{team.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Away Team</InputLabel>
                  <Select
                    value={formData.awayTeam}
                    label="Away Team"
                    onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
                  >
                    {teams.map(team => (
                      <MenuItem key={team._id} value={team._id}>{team.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Scheduled Date & Time"
                  type="datetime-local"
                  required
                  InputLabelProps={{ shrink: true }}
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Venue Name"
                  required
                  value={formData.venue.name}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    venue: { ...formData.venue, name: e.target.value }
                  })}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Venue Address"
                  value={formData.venue.address}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    venue: { ...formData.venue, address: e.target.value }
                  })}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Venue Capacity"
                  type="number"
                  value={formData.venue.capacity}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    venue: { ...formData.venue, capacity: e.target.value }
                  })}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Referee Name"
                  value={formData.referee.name}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    referee: { ...formData.referee, name: e.target.value }
                  })}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Referee Phone"
                  type="tel"
                  value={formData.referee.phone}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    referee: { ...formData.referee, phone: e.target.value }
                  })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Schedule Game
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Games List */}
      {games.length > 0 ? (
        <Box>
          {games.map((game) => (
            <Card key={game._id} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" component="h3">
                        {game.homeTeam.name} vs {game.awayTeam.name}
                      </Typography>
                      <Chip 
                        label={game.status.replace('_', ' ')} 
                        color={getStatusColor(game.status) as any}
                        size="small"
                      />
                    </Box>
                    <Box display="flex" alignItems="center" gap={3} mb={1}>
                      <Box display="flex" alignItems="center">
                        <CalendarToday fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="textSecondary">
                          {new Date(game.scheduledDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <AccessTime fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="textSecondary">
                          {new Date(game.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="textSecondary">
                          {game.venue.name}
                        </Typography>
                      </Box>
                    </Box>
                    {game.status === 'completed' && (
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {game.score.homeTeam} - {game.score.awayTeam}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <IconButton
                      component={Link}
                      to={`/games/${game._id}`}
                      size="small"
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(game._id)}
                      size="small"
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <CalendarToday sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No games scheduled
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Get started by scheduling your first game.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateForm(true)}
          >
            Schedule Game
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default Games;
