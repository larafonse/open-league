import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  People,
  LocationOn,
  Edit,
  Delete,
} from '@mui/icons-material';
import { teamsApi, authApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Team } from '../types';

const Teams: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [coachSearchQuery, setCoachSearchQuery] = useState('');
  const [coachOptions, setCoachOptions] = useState<Array<{ _id: string; firstName: string; lastName: string; email: string }>>([]);
  const [selectedCoach, setSelectedCoach] = useState<{ _id: string; firstName: string; lastName: string; email: string } | null>(null);

  // Search for users when coach search query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (coachSearchQuery.length >= 2) {
        try {
          const users = await authApi.searchUsers(coachSearchQuery);
          setCoachOptions(users);
        } catch (error) {
          console.error('Error searching users:', error);
          setCoachOptions([]);
        }
      } else {
        setCoachOptions([]);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [coachSearchQuery]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const teamsData = await teamsApi.getAll();
      setTeams(teamsData);
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
        founded: formData.founded ? parseInt(formData.founded) : undefined,
        coach: selectedCoach?._id || undefined
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
      setSelectedCoach(null);
      setCoachSearchQuery('');
      setCoachOptions([]);
      fetchData();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };


  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await teamsApi.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting team:', error);
      }
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
              Teams
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Manage your league teams
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateForm(true)}
            size="large"
          >
            Add Team
          </Button>
        </Box>
      </Box>

      {/* Create Team Dialog */}
      <Dialog open={showCreateForm} onClose={() => setShowCreateForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Team</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Team Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="City"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Founded Year"
                  type="number"
                  value={formData.founded}
                  onChange={(e) => setFormData({ ...formData, founded: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Autocomplete
                  options={coachOptions}
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                  value={selectedCoach}
                  onInputChange={(_, newValue) => {
                    setCoachSearchQuery(newValue);
                  }}
                  onChange={(_, newValue) => {
                    setSelectedCoach(newValue);
                    if (newValue) {
                      setFormData({ ...formData, coach: newValue._id });
                    } else {
                      setFormData({ ...formData, coach: '' });
                    }
                  }}
                  renderInput={(params) => (
                <TextField
                      {...params}
                      label="Coach/Manager"
                      placeholder={user ? `Default: ${user.firstName} ${user.lastName} (you)` : 'Search users...'}
                      helperText={!selectedCoach && user ? `Will default to ${user.firstName} ${user.lastName} if not specified` : ''}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option._id}>
                      <Box>
                        <Typography variant="body1">{option.firstName} {option.lastName}</Typography>
                        <Typography variant="body2" color="textSecondary">{option.email}</Typography>
                      </Box>
                    </Box>
                  )}
                  noOptionsText={coachSearchQuery.length < 2 ? 'Type at least 2 characters to search' : 'No users found'}
                  loading={false}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Primary Color"
                  type="color"
                  value={formData.colors.primary}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, primary: e.target.value }
                  })}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Secondary Color"
                  type="color"
                  value={formData.colors.secondary}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    colors: { ...formData.colors, secondary: e.target.value }
                  })}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Create Team
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Teams Table */}
      {teams.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Team</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Coach</TableCell>
                <TableCell>Founded</TableCell>
                <TableCell>Record</TableCell>
                <TableCell>Win %</TableCell>
                <TableCell>Players</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.map((team) => (
                <TableRow 
                  key={team._id} 
                  hover
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                  onClick={() => navigate(`/teams/${team._id}`)}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: team.colors.primary,
                          color: team.colors.secondary,
                          mr: 2,
                          width: 40,
                          height: 40,
                        }}
                      >
                        {team.name.charAt(0)}
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {team.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
                      {team.city}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {team.coach && typeof team.coach === 'object' 
                      ? `${team.coach.firstName} ${team.coach.lastName}`
                      : team.coach || '-'}
                  </TableCell>
                  <TableCell>{team.founded || '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {team.wins}-{team.losses}-{team.ties}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {(team.winPercentage * 100).toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {Array.isArray(team.players) ? team.players.length : 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      <IconButton
                        component={Link}
                        to={`/teams/${team._id}`}
                        size="small"
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(team._id);
                        }}
                        size="small"
                        color="error"
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
          <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No teams yet
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Get started by creating your first team.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateForm(true)}
          >
            Create Team
          </Button>
        </Paper>
      )}

    </Container>
  );
};

export default Teams;
