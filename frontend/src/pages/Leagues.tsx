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
  Card,
  CardContent,
  CardActions,
  Chip,
  Grid,
  InputAdornment,
  FormControlLabel,
  Switch,
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
import type { League } from '../types';

const Leagues: React.FC = () => {
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
    } catch (error) {
      console.error('Error creating league:', error);
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
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowCreateForm(true)}
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

      {/* Leagues Grid */}
      {leagues.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="textSecondary" align="center">
              {searchQuery ? 'No leagues found matching your search.' : 'No leagues found. Create your first league to get started!'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {leagues.map((league) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={league._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Groups sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                      {league.name}
                    </Typography>
                    {league.isPublic ? (
                      <Public fontSize="small" color="action" />
                    ) : (
                      <Lock fontSize="small" color="action" />
                    )}
                  </Box>
                  
                  {league.description && (
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {league.description}
                    </Typography>
                  )}

                  <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                    <Chip
                      label={league.isMember ? 'Member' : 'Not a member'}
                      color={league.isMember ? 'primary' : 'default'}
                      size="small"
                    />
                    {league.isOwner && (
                      <Chip label="Owner" color="secondary" size="small" />
                    )}
                    <Chip
                      label={`${league.memberCount} member${league.memberCount !== 1 ? 's' : ''}`}
                      size="small"
                    />
                  </Box>

                  <Box display="flex" alignItems="center" color="text.secondary">
                    <Person fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="caption">
                      Owner: {league.owner.firstName} {league.owner.lastName}
                    </Typography>
                  </Box>
                </CardContent>
                
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    component={Link}
                    to={`/leagues/${league._id}`}
                  >
                    View
                  </Button>
                  {league.isOwner && (
                    <>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/leagues/${league._id}`)}
                      >
                        Edit
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(league._id)}
                      >
                        <Delete />
                      </IconButton>
                    </>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
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
