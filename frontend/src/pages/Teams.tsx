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
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  Add,
  People,
  LocationOn,
  Edit,
  Delete,
} from '@mui/icons-material';
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
                <TextField
                  fullWidth
                  label="Coach"
                  value={formData.coach}
                  onChange={(e) => setFormData({ ...formData, coach: e.target.value })}
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
                <TableRow key={team._id} hover>
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
                  <TableCell>{team.coach || '-'}</TableCell>
                  <TableCell>{team.founded || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={`${team.wins}-${team.losses}-${team.ties}`} 
                      size="small" 
                      color="primary" 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {(team.winPercentage * 100).toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {team.players.length}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" gap={1}>
                      <IconButton
                        component={Link}
                        to={`/teams/${team._id}`}
                        size="small"
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(team._id)}
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
