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
  Chip,
  InputAdornment,
  FormControlLabel,
  Switch,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
} from '@mui/material';
import {
  Add,
  Search,
  Groups,
  Person,
  Public,
  Lock,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { leaguesApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { League } from '../types';

const Leagues: React.FC = () => {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [publicOnly, setPublicOnly] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
  });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  // Calculate remaining league slots for league admins
  const userLeagues = user?.userType === 'league_admin' 
    ? leagues.filter(l => l.owner._id === user._id)
    : [];
  const remainingLeagues = user?.userType === 'league_admin' && user.leagueLimit !== undefined
    ? Math.max(0, user.leagueLimit - userLeagues.length)
    : null;

  useEffect(() => {
    fetchLeagues();
  }, [searchQuery, publicOnly]);

  const fetchLeagues = async () => {
    try {
      setLoading(true);
      const params: { search?: string; publicOnly?: boolean } = {};
      if (searchQuery) params.search = searchQuery;
      if (publicOnly) params.publicOnly = true;
      const data = await leaguesApi.getAll(params);
      setLeagues(data);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      
      // Create the league
      const leagueData = {
        name: formData.name,
        description: formData.description,
        isPublic: formData.isPublic,
      };
      const newLeague = await leaguesApi.create(leagueData);
      
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        isPublic: true,
      });
      setCreating(false);
      fetchLeagues();
      
      // Navigate to the new league
      navigate(`/leagues/${newLeague._id}`);
    } catch (error: any) {
      console.error('Error creating league:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create league. Please try again.';
      alert(errorMessage);
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this league? This will also delete all seasons in this league.')) {
      try {
        await leaguesApi.delete(id);
        fetchLeagues();
      } catch (error) {
        console.error('Error deleting league:', error);
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
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Leagues
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Create and manage leagues for organizing seasons
          </Typography>
          {user?.userType === 'league_admin' && user.leagueLimit !== undefined && (
            <Box mt={1} display="flex" gap={1} alignItems="center">
              <Chip 
                label={`Tier ${user.tier || 1}`}
                color="primary"
                size="small"
              />
              <Typography variant="body2" color="textSecondary">
                {remainingLeagues !== null && remainingLeagues > 0
                  ? `${remainingLeagues} league${remainingLeagues > 1 ? 's' : ''} remaining`
                  : remainingLeagues === 0
                  ? 'League limit reached'
                  : 'Unlimited leagues'}
              </Typography>
            </Box>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowCreateForm(true)}
          disabled={user?.userType !== 'league_admin' || (remainingLeagues !== null && remainingLeagues === 0)}
        >
          Create League
        </Button>
      </Box>

      {/* Search and Filter */}
      <Box mb={3} display="flex" gap={2} alignItems="center">
        <TextField
          fullWidth
          placeholder="Search leagues..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={publicOnly}
              onChange={(e) => setPublicOnly(e.target.checked)}
            />
          }
          label="Public Only"
        />
      </Box>

      {/* Leagues Table */}
      {leagues.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>League</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Visibility</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Members</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
          {leagues.map((league) => (
                <TableRow 
                  key={league._id} 
                  hover
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                  onClick={() => navigate(`/leagues/${league._id}`)}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          mr: 2,
                          width: 40,
                          height: 40,
                        }}
                      >
                        <Groups />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight="medium">
                      {league.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {league.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                    {league.isPublic ? (
                        <>
                          <Public fontSize="small" color="action" sx={{ mr: 0.5 }} />
                          <Typography variant="body2">Public</Typography>
                        </>
                    ) : (
                        <>
                          <Lock fontSize="small" color="action" sx={{ mr: 0.5 }} />
                          <Typography variant="body2">Private</Typography>
                        </>
                    )}
                  </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Person fontSize="small" color="action" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">
                        {league.owner.firstName} {league.owner.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {league.memberCount} member{league.memberCount !== 1 ? 's' : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={league.isMember ? 'Member' : 'Not a member'}
                      color={league.isMember ? 'primary' : 'default'}
                      size="small"
                    />
                    {league.isOwner && (
                      <Chip label="Owner" color="secondary" size="small" />
                    )}
                  </Box>
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      <IconButton
                    component={Link}
                    to={`/leagues/${league._id}`}
                        size="small"
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                      {league.isOwner && (
                        <>
                          <IconButton
                            component={Link}
                            to={`/leagues/${league._id}`}
                            size="small"
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                      <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(league._id);
                            }}
                        size="small"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </>
                  )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Groups sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            {searchQuery ? 'No leagues found' : 'No leagues yet'}
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            {searchQuery ? 'No leagues found matching your search.' : 'Get started by creating your first league.'}
          </Typography>
          {!searchQuery && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreateForm(true)}
            >
              Create League
            </Button>
          )}
        </Paper>
      )}

      {/* Create League Dialog */}
      <Dialog open={showCreateForm} onClose={() => setShowCreateForm(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Create New League</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="League Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              margin="normal"
              autoFocus
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                />
              }
              label="Public League"
              sx={{ mt: 2 }}
            />
            <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
              Public leagues can be discovered by other users
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateForm(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={creating}>
              {creating ? <CircularProgress size={20} /> : 'Create League'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Leagues;
