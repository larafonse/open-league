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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Avatar,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
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
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="First Name"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  required
                  InputLabelProps={{ shrink: true }}
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
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
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Jersey Number"
                  type="number"
                  inputProps={{ min: 1, max: 99 }}
                  value={formData.jerseyNumber}
                  onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                />
              </Box>
            </Box>
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

      {/* Players Table */}
      {players.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Jersey #</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Team</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player._id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 40, height: 40 }}>
                        <Person />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {player.fullName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={player.position} size="small" color="primary" />
                  </TableCell>
                  <TableCell>
                    {player.jerseyNumber ? (
                      <Typography variant="body2" fontWeight="medium">
                        #{player.jerseyNumber}
                      </Typography>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Email fontSize="small" color="action" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">
                        {player.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {player.phone ? (
                      <Box display="flex" alignItems="center">
                        <Phone fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">
                          {player.phone}
                        </Typography>
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <CalendarToday fontSize="small" color="action" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">
                        {player.age}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {player.team ? (
                      <Typography variant="body2" fontWeight="medium">
                        {player.team.name}
                      </Typography>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" gap={1}>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
