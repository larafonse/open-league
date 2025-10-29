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
  IconButton,
  TextField,
  Typography,
  Avatar,
  Paper,Grid } from '@mui/material';
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
            <Grid container spacing={2}>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Team Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Founded Year"
                  type="number"
                  value={formData.founded}
                  onChange={(e) => setFormData({ ...formData, founded: e.target.value })}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Coach"
                  value={formData.coach}
                  onChange={(e) => setFormData({ ...formData, coach: e.target.value })}
                />
              </Grid>
              <Grid xs={12} sm={6}>
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
              </Grid>
              <Grid xs={12} sm={6}>
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
              </Grid>
            </Grid>
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

      {/* Teams Grid */}
      {teams.length > 0 ? (
        <Grid container spacing={3}>
          {teams.map((team) => (
            <Grid xs={12} sm={6} md={4} key={team._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: team.colors.primary,
                          color: team.colors.secondary,
                          mr: 2,
                          width: 48,
                          height: 48,
                        }}
                      >
                        {team.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="h3">
                          {team.name}
                        </Typography>
                        <Box display="flex" alignItems="center">
                          <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
                          <Typography variant="body2" color="textSecondary">
                            {team.city}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box>
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
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="textSecondary">
                        Players
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {team.players.length}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="textSecondary">
                        Record
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {team.wins}-{team.losses}-{team.ties}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="textSecondary">
                        Win %
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {(team.winPercentage * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    {team.coach && (
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="textSecondary">
                          Coach
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {team.coach}
                        </Typography>
                      </Box>
                    )}
                    {team.founded && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="textSecondary">
                          Founded
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {team.founded}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
                <Box p={2} pt={0}>
                  <Button
                    component={Link}
                    to={`/teams/${team._id}`}
                    variant="contained"
                    fullWidth
                  >
                    View Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
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
