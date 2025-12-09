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
import { leaguesApi, teamsApi, seasonsApi } from '../services/api';
import type { League, CreateTeamData } from '../types';

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
    createTeams: false,
    teamCount: 4,
    seasonName: '',
    seasonStartDate: '',
    seasonEndDate: '',
  });
  const [creatingTeams, setCreatingTeams] = useState(false);
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
      setCreatingTeams(true);
      
      // Create the league first
      const leagueData = {
        name: formData.name,
        description: formData.description,
        isPublic: formData.isPublic,
      };
      const newLeague = await leaguesApi.create(leagueData);
      
      // Create teams if requested
      if (formData.createTeams && formData.teamCount > 0) {
        const teamNames = [
          'Thunder', 'Lightning', 'Storm', 'Fire', 'Ice', 'Wind', 'Eagle', 'Lion',
          'Tiger', 'Wolf', 'Shark', 'Dragon', 'Phoenix', 'Falcon', 'Hawk', 'Bear',
          'Panther', 'Cobra', 'Viper', 'Stallion'
        ];
        const cities = [
          'Seattle', 'Portland', 'San Francisco', 'Los Angeles', 'San Diego',
          'Phoenix', 'Denver', 'Chicago', 'Boston', 'New York', 'Miami', 'Atlanta',
          'Dallas', 'Houston', 'Austin', 'Nashville', 'Detroit', 'Philadelphia', 'Baltimore', 'Washington'
        ];
        const colorPalettes = [
          { primary: '#1E3A8A', secondary: '#F59E0B' }, // Blue & Orange
          { primary: '#DC2626', secondary: '#F97316' }, // Red & Orange
          { primary: '#059669', secondary: '#0EA5E9' }, // Green & Blue
          { primary: '#374151', secondary: '#F3F4F6' }, // Gray & White
          { primary: '#7C3AED', secondary: '#FCD34D' }, // Purple & Yellow
          { primary: '#1E40AF', secondary: '#06B6D4' }, // Blue & Cyan
          { primary: '#B91C1C', secondary: '#FBBF24' }, // Red & Yellow
          { primary: '#047857', secondary: '#10B981' }, // Green & Light Green
        ];
        
        const shuffledNames = [...teamNames].sort(() => 0.5 - Math.random());
        const shuffledCities = [...cities].sort(() => 0.5 - Math.random());
        const leagueId = newLeague._id.toString().slice(-6); // Use last 6 chars of league ID for uniqueness
        const randomId = Math.random().toString(36).substring(2, 6).toUpperCase(); // Additional random ID
        
        // Create teams one by one to handle errors better
        const createdTeams = [];
        for (let i = 0; i < formData.teamCount; i++) {
          const baseName = shuffledNames[i % shuffledNames.length];
          const city = shuffledCities[i % shuffledCities.length];
          // Make name unique by adding a short unique identifier to avoid conflicts
          // Format: "Thunder Seattle" with a subtle unique suffix
          const uniqueName = `${baseName} ${city} (${leagueId}${randomId}${i})`;
          
          const teamData: CreateTeamData = {
            name: uniqueName,
            city: city,
            colors: colorPalettes[i % colorPalettes.length]
          };
          
          try {
            const team = await teamsApi.create(teamData);
            createdTeams.push(team);
          } catch (error: any) {
            // If it's a duplicate name error, try with an even more unique name
            if (error.response?.data?.message?.includes('already exists')) {
              const timestamp = Date.now().toString(36).slice(-4);
              const retryData: CreateTeamData = {
                ...teamData,
                name: `${baseName} ${city} (${timestamp}-${i})`
              };
              try {
                const team = await teamsApi.create(retryData);
                createdTeams.push(team);
              } catch (retryError) {
                console.error('Error creating team after retry:', retryError);
                throw new Error(`Failed to create team: ${retryError}`);
              }
            } else {
              throw error;
            }
          }
        }
        
        // Add teams to the league
        const teamIds = createdTeams.map(team => team._id);
        await leaguesApi.addTeams(newLeague._id, teamIds);
        
        // Always create a season with the teams
        const now = new Date();
        // Default to tomorrow for start date, 3 months from now for end date
        const defaultStart = new Date(now);
        defaultStart.setDate(defaultStart.getDate() + 1);
        const defaultEnd = new Date(now);
        defaultEnd.setMonth(defaultEnd.getMonth() + 3);
        
        const startDate = formData.seasonStartDate 
          ? new Date(formData.seasonStartDate).toISOString()
          : defaultStart.toISOString();
        const endDate = formData.seasonEndDate 
          ? new Date(formData.seasonEndDate).toISOString()
          : defaultEnd.toISOString();
        
        const seasonName = formData.seasonName || `${formData.name} - Season 1`;
        
        await seasonsApi.create({
          name: seasonName,
          league: newLeague._id,
          startDate: startDate,
          endDate: endDate,
          teams: teamIds,
        });
      }
      
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        isPublic: true,
        createTeams: false,
        teamCount: 4,
        seasonName: '',
        seasonStartDate: '',
        seasonEndDate: '',
      });
      setCreatingTeams(false);
      fetchLeagues();
      
      // Navigate to the new league
      navigate(`/leagues/${newLeague._id}`);
    } catch (error) {
      console.error('Error creating league:', error);
      setCreatingTeams(false);
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
            
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.createTeams}
                    onChange={(e) => setFormData({ ...formData, createTeams: e.target.checked })}
                  />
                }
                label="Create Teams Now"
              />
              <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5, mb: 2 }}>
                You can create teams now or add them later
              </Typography>
              
              {formData.createTeams && (
                <>
                  <TextField
                    fullWidth
                    label="Number of Teams"
                    type="number"
                    value={formData.teamCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, teamCount: Math.max(2, Math.min(20, count)) });
                    }}
                    inputProps={{ min: 2, max: 20 }}
                    helperText={`${formData.teamCount} teams will be created with unique names and colors. You can edit them later.`}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                  
                  <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                    Season Settings
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                    A season will be automatically created with these teams
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Season Name"
                    value={formData.seasonName}
                    onChange={(e) => setFormData({ ...formData, seasonName: e.target.value })}
                    placeholder={`${formData.name} - Season 1`}
                    helperText="Leave empty to use default name"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                  <Box display="flex" gap={2} sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      value={formData.seasonStartDate}
                      onChange={(e) => setFormData({ ...formData, seasonStartDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      helperText="Optional - defaults to tomorrow"
                      size="small"
                    />
                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      value={formData.seasonEndDate}
                      onChange={(e) => setFormData({ ...formData, seasonEndDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      helperText="Optional - defaults to 3 months"
                      size="small"
                    />
                  </Box>
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateForm(false)} disabled={creatingTeams}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={creatingTeams}>
              {creatingTeams ? <CircularProgress size={20} /> : 'Create League'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Leagues;
