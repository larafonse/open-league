import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  CalendarToday,
  PlayArrow,
  Stop,
  Schedule,
  Delete,
  Visibility,
  SportsSoccer,
  PersonAdd,
  HowToReg
} from '@mui/icons-material';
import { seasonsApi, teamsApi } from '../services/api';
import type { Season, Team, CreateSeasonData } from '../types';

const Seasons: React.FC = () => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateSeasonData>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    teams: [],
    settings: {
      gamesPerWeek: 1,
      playoffTeams: 4,
      regularSeasonWeeks: 10
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [seasonsData, teamsData] = await Promise.all([
        seasonsApi.getAll(),
        teamsApi.getAll()
      ]);
      setSeasons(seasonsData);
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
      await seasonsApi.create(formData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        teams: [],
        settings: {
          gamesPerWeek: 1,
          playoffTeams: 4,
          regularSeasonWeeks: 10
        }
      });
      fetchData();
    } catch (error) {
      console.error('Error creating season:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this season?')) {
      try {
        await seasonsApi.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting season:', error);
      }
    }
  };

  const handleGenerateSchedule = async (id: string) => {
    try {
      const updatedSeason = await seasonsApi.generateSchedule(id);
      console.log(`Generated schedule for ${updatedSeason.name}:`, updatedSeason.weeks.length, 'weeks');
      const totalGames = updatedSeason.weeks.reduce((total, week) => total + week.games.length, 0);
      console.log(`Total games created: ${totalGames}`);
      fetchData();
    } catch (error) {
      console.error('Error generating schedule:', error);
    }
  };

  const handleStartSeason = async (id: string) => {
    try {
      await seasonsApi.start(id);
      fetchData();
    } catch (error) {
      console.error('Error starting season:', error);
    }
  };

  const handleCompleteSeason = async (id: string) => {
    try {
      await seasonsApi.complete(id);
      fetchData();
    } catch (error) {
      console.error('Error completing season:', error);
    }
  };

  const handleOpenRegistration = async (id: string) => {
    try {
      await seasonsApi.openRegistration(id);
      fetchData();
    } catch (error) {
      console.error('Error opening registration:', error);
    }
  };

  const handleRegisterTeam = async (seasonId: string, teamId: string) => {
    try {
      await seasonsApi.registerTeam(seasonId, teamId);
      fetchData();
    } catch (error) {
      console.error('Error registering team:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'draft': return 'warning';
      case 'registration': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const handleTeamToggle = (teamId: string) => {
    setFormData(prev => ({
      ...prev,
      teams: prev.teams.includes(teamId)
        ? prev.teams.filter(id => id !== teamId)
        : [...prev.teams, teamId]
    }));
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
              Seasons
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Manage league seasons and schedules
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateForm(true)}
            size="large"
          >
            Create Season
          </Button>
        </Box>
      </Box>

      {/* Create Season Dialog */}
      <Dialog open={showCreateForm} onClose={() => setShowCreateForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Season</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Season Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  required
                  InputLabelProps={{ shrink: true }}
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  required
                  InputLabelProps={{ shrink: true }}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Games Per Week"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={formData.settings?.gamesPerWeek || 1}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    settings: { ...formData.settings!, gamesPerWeek: parseInt(e.target.value) }
                  })}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Playoff Teams"
                  type="number"
                  inputProps={{ min: 2 }}
                  value={formData.settings?.playoffTeams || 4}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    settings: { ...formData.settings!, playoffTeams: parseInt(e.target.value) }
                  })}
                />
              </Box>
            </Box>
            
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                Select Teams ({formData.teams.length} selected)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {teams.map((team) => (
                  <FormControlLabel
                    key={team._id}
                    control={
                      <Checkbox
                        checked={formData.teams.includes(team._id)}
                        onChange={() => handleTeamToggle(team._id)}
                      />
                    }
                    label={team.name}
                  />
                ))}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={formData.teams.length < 2}>
              Create Season
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Seasons Table */}
      {seasons.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Season</TableCell>
                <TableCell>Teams</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {seasons.map((season) => (
                <TableRow key={season._id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {season.name}
                      </Typography>
                      {season.description && (
                        <Typography variant="body2" color="textSecondary">
                          {season.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {season.teams.length} teams
                      </Typography>
                      {season.weeks.length > 0 && (
                        <Typography variant="body2" color="textSecondary">
                          {season.weeks.reduce((total, week) => total + week.games.length, 0)} games
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <CalendarToday fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">
                          {new Date(season.startDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        to {new Date(season.endDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {season.completedWeeks}/{season.totalWeeks} weeks
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {season.progressPercentage}% complete
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={season.status.replace('_', ' ')} 
                      color={getStatusColor(season.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <IconButton
                        component={Link}
                        to={`/seasons/${season._id}`}
                        size="small"
                        color="primary"
                        title="View Details"
                      >
                        <Visibility />
                      </IconButton>
                      {season.status === 'draft' && (
                        <IconButton
                          onClick={() => handleOpenRegistration(season._id)}
                          size="small"
                          color="primary"
                          title="Open Registration"
                        >
                          <PersonAdd />
                        </IconButton>
                      )}
                      {season.status === 'registration' && season.weeks.length === 0 && (
                        <IconButton
                          onClick={() => handleGenerateSchedule(season._id)}
                          size="small"
                          color="info"
                          title="Generate Schedule"
                        >
                          <Schedule />
                        </IconButton>
                      )}
                      {season.status === 'registration' && season.weeks.length > 0 && (
                        <IconButton
                          onClick={() => handleStartSeason(season._id)}
                          size="small"
                          color="success"
                          title="Start Season"
                        >
                          <PlayArrow />
                        </IconButton>
                      )}
                      {season.status === 'draft' && season.weeks.length > 0 && (
                        <IconButton
                          onClick={() => handleStartSeason(season._id)}
                          size="small"
                          color="success"
                          title="Start Season"
                        >
                          <PlayArrow />
                        </IconButton>
                      )}
                      {season.status === 'active' && (
                        <IconButton
                          onClick={() => handleCompleteSeason(season._id)}
                          size="small"
                          color="warning"
                          title="Complete Season"
                        >
                          <Stop />
                        </IconButton>
                      )}
                      <IconButton
                        onClick={() => handleDelete(season._id)}
                        size="small"
                        color="error"
                        disabled={season.status === 'active'}
                        title="Delete Season"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <SportsSoccer sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No seasons yet
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Get started by creating your first season.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateForm(true)}
          >
            Create Season
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default Seasons;
