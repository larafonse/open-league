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
  Avatar,
  Chip,
  Paper,Grid } from '@mui/material';
import {
  Add,
  Person,
  Email,
  Phone,
  CalendarToday,
  Edit,
  Delete,
} from '@mui/icons-material';
import { playersApi } from '../services/api';
import type { Player } from '../types';

const Players: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    position: 'Midfielder' as const,
    jerseyNumber: ''
  });

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const data = await playersApi.getAll();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const playerData = {
        ...formData,
        jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : undefined
      };
      await playersApi.create(playerData);
      setShowCreateForm(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        position: 'Midfielder',
        jerseyNumber: ''
      });
      fetchPlayers();
    } catch (error) {
      console.error('Error creating player:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        await playersApi.delete(id);
        fetchPlayers();
      } catch (error) {
        console.error('Error deleting player:', error);
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
              Players
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Manage league players
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateForm(true)}
            size="large"
          >
            Add Player
          </Button>
        </Box>
      </Box>

      {/* Create Player Dialog */}
      <Dialog open={showCreateForm} onClose={() => setShowCreateForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>Register New Player</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  required
                  InputLabelProps={{ shrink: true }}
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Position</InputLabel>
                  <Select
                    value={formData.position}
                    label="Position"
                    onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
                  >
                    <MenuItem value="Goalkeeper">Goalkeeper</MenuItem>
                    <MenuItem value="Defender">Defender</MenuItem>
                    <MenuItem value="Midfielder">Midfielder</MenuItem>
                    <MenuItem value="Forward">Forward</MenuItem>
                    <MenuItem value="Coach">Coach</MenuItem>
                    <MenuItem value="Manager">Manager</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Jersey Number"
                  type="number"
                  inputProps={{ min: 1, max: 99 }}
                  value={formData.jerseyNumber}
                  onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Register Player
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Players Grid */}
      {players.length > 0 ? (
        <Grid container spacing={3}>
          {players.map((player) => (
            <Grid xs={12} sm={6} md={4} key={player._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 48, height: 48 }}>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="h3">
                          {player.fullName}
                        </Typography>
                        <Chip label={player.position} size="small" color="primary" />
                      </Box>
                    </Box>
                    <Box>
                      <IconButton
                        component={Link}
                        to={`/players/${player._id}`}
                        size="small"
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(player._id)}
                        size="small"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Email fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        {player.email}
                      </Typography>
                    </Box>
                    {player.phone && (
                      <Box display="flex" alignItems="center" mb={1}>
                        <Phone fontSize="small" color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="textSecondary">
                          {player.phone}
                        </Typography>
                      </Box>
                    )}
                    <Box display="flex" alignItems="center" mb={1}>
                      <CalendarToday fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        Age {player.age}
                      </Typography>
                    </Box>
                    {player.jerseyNumber && (
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="textSecondary">
                          Jersey #
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {player.jerseyNumber}
                        </Typography>
                      </Box>
                    )}
                    {player.team && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="textSecondary">
                          Team
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {player.team.name}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
                <Box p={2} pt={0}>
                  <Button
                    component={Link}
                    to={`/players/${player._id}`}
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
          <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No players yet
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Get started by registering your first player.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateForm(true)}
          >
            Register Player
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default Players;
