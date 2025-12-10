import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  CircularProgress,
  Chip,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Public,
  Lock,
  Edit,
  Delete,
  Add,
  CalendarToday,
  PersonAdd,
  HowToReg,
} from '@mui/icons-material';
import { leaguesApi, seasonsApi, teamsApi, playersApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { League, Season, Team, Player, CreateTeamData, CreatePlayerData } from '../types';

const LeagueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [league, setLeague] = useState<League | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [registeredTeams, setRegisteredTeams] = useState<Team[]>([]);
  const [registerMode, setRegisterMode] = useState<'team' | 'player'>('team');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);
  const [showCreatePlayerForm, setShowCreatePlayerForm] = useState(false);
  const [userPlayer, setUserPlayer] = useState<Player | null>(null);
  const { user } = useAuth();
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
  });
  const [newTeamData, setNewTeamData] = useState<CreateTeamData>({
    name: '',
    city: '',
    colors: {
      primary: '#000000',
      secondary: '#FFFFFF',
    },
  });
  const [newPlayerData, setNewPlayerData] = useState<CreatePlayerData>({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    position: 'Midfielder',
  });

  useEffect(() => {
    if (id) {
      fetchLeague();
      fetchSeasons();
      fetchTeams();
    }
  }, [id]);

  const fetchLeague = async () => {
    try {
      const data = await leaguesApi.getById(id!);
      setLeague(data);
      setEditFormData({
        name: data.name,
        description: data.description || '',
        isPublic: data.isPublic,
      });
    } catch (error) {
      console.error('Error fetching league:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeasons = async () => {
    try {
      if (id) {
        const data = await leaguesApi.getSeasons(id);
        setSeasons(data);
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      if (id) {
        const data = await leaguesApi.getTeams(id);
        setTeams(data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      if (id) {
        await leaguesApi.update(id, editFormData);
        await fetchLeague();
        setShowEditDialog(false);
      }
    } catch (error) {
      console.error('Error updating league:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this league? This will also delete all seasons in this league.')) {
      try {
        if (id) {
          await leaguesApi.delete(id);
          navigate('/leagues');
        }
      } catch (error) {
        console.error('Error deleting league:', error);
      }
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        if (id) {
          await leaguesApi.removeMember(id, userId);
          await fetchLeague();
        }
      } catch (error) {
        console.error('Error removing member:', error);
      }
    }
  };

  const handleOpenRegistration = async (seasonId: string) => {
    try {
      await seasonsApi.openRegistration(seasonId);
      await fetchSeasons();
    } catch (error) {
      console.error('Error opening registration:', error);
    }
  };

  const handleOpenRegisterDialog = async (season: Season) => {
    setSelectedSeason(season);
    setRegisterMode('team');
    setShowRegisterDialog(true);
    
    try {
      // Fetch available teams
      const available = await seasonsApi.getAvailableTeams(season._id);
      setAvailableTeams(available);
      
      // Get registered teams from the season
      const registered = season.teams || [];
      setRegisteredTeams(registered as Team[]);
      
      // Check if user has a player profile
      if (user) {
        try {
          const players = await playersApi.getAll({});
          const player = players.find(p => p.email === user.email);
          setUserPlayer(player || null);
        } catch (error) {
          console.error('Error fetching player profile:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching registration data:', error);
    }
  };

  const handleRegisterTeam = async () => {
    if (!selectedSeason || !selectedTeam) return;
    
    try {
      await seasonsApi.registerTeam(selectedSeason._id, selectedTeam);
      await fetchSeasons();
      setShowRegisterDialog(false);
      setSelectedTeam('');
    } catch (error) {
      console.error('Error registering team:', error);
      alert('Error registering team. Please try again.');
    }
  };

  const handleCreateTeamAndRegister = async () => {
    if (!selectedSeason) return;
    
    try {
      // Create team
      const newTeam = await teamsApi.create(newTeamData);
      
      // Register team to season
      await seasonsApi.registerTeam(selectedSeason._id, newTeam._id);
      
      await fetchSeasons();
      await fetchTeams();
      setShowRegisterDialog(false);
      setShowCreateTeamForm(false);
      setNewTeamData({
        name: '',
        city: '',
        colors: {
          primary: '#000000',
          secondary: '#FFFFFF',
        },
      });
    } catch (error: any) {
      console.error('Error creating team:', error);
      alert(error.response?.data?.message || 'Error creating team. Please try again.');
    }
  };

  const handleCreatePlayerAndJoinTeam = async () => {
    if (!selectedTeam || !user) return;
    
    try {
      // Create player profile
      const playerData: CreatePlayerData = {
        ...newPlayerData,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      const newPlayer = await playersApi.create(playerData);
      
      // Add player to team
      await teamsApi.addPlayer(selectedTeam, newPlayer._id);
      
      setShowRegisterDialog(false);
      setShowCreatePlayerForm(false);
      setSelectedTeam('');
      setNewPlayerData({
        firstName: '',
        lastName: '',
        email: '',
        dateOfBirth: '',
        position: 'Midfielder',
      });
      await fetchTeams();
    } catch (error: any) {
      console.error('Error creating player:', error);
      alert(error.response?.data?.message || 'Error creating player. Please try again.');
    }
  };

  const handleJoinTeam = async () => {
    if (!selectedTeam || !userPlayer) return;
    
    try {
      await teamsApi.addPlayer(selectedTeam, userPlayer._id);
      setShowRegisterDialog(false);
      setSelectedTeam('');
      await fetchTeams();
    } catch (error: any) {
      console.error('Error joining team:', error);
      alert(error.response?.data?.message || 'Error joining team. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!league) {
    return (
      <Container maxWidth="xl">
        <Typography variant="h6" color="error">
          League not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="h3" component="h1">
              {league.name}
            </Typography>
            {league.isPublic ? (
              <Public fontSize="small" color="action" />
            ) : (
              <Lock fontSize="small" color="action" />
            )}
          </Box>
          {league.description && (
            <Typography variant="body1" color="textSecondary">
              {league.description}
            </Typography>
          )}
          <Box display="flex" gap={1} mt={2} flexWrap="wrap">
            <Chip
              label={league.isMember ? 'Member' : 'Not a member'}
              color={league.isMember ? 'primary' : 'default'}
            />
            {league.isOwner && (
              <Chip label="Owner" color="secondary" />
            )}
            <Chip
              label={`${league.memberCount} member${league.memberCount !== 1 ? 's' : ''}`}
            />
            <Chip
              label={`${seasons.length} season${seasons.length !== 1 ? 's' : ''}`}
            />
          </Box>
        </Box>
        {league.isOwner && (
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setShowEditDialog(true)}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Box>
        )}
      </Box>

      <Card sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
          <Tab label="Teams" />
          <Tab label="Seasons" />
          <Tab label="Members" />
        </Tabs>
      </Card>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  League Information
                </Typography>
                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary">
                    Owner
                  </Typography>
                  <Typography variant="body1">
                    {league.owner.firstName} {league.owner.lastName}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {league.owner.email}
                  </Typography>
                </Box>
                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {new Date(league.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary">
                    Visibility
                  </Typography>
                  <Typography variant="body1">
                    {league.isPublic ? 'Public' : 'Private'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Seasons
                </Typography>
                {seasons.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    No seasons yet. Create a season to get started!
                  </Typography>
                ) : (
                  <List>
                    {seasons.slice(0, 5).map((season, index) => (
                      <React.Fragment key={season._id}>
                        <ListItem
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'action.hover' }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar>
                              <CalendarToday />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography 
                                  component={Link}
                                  to={`/seasons/${season._id}`}
                                  variant="body1"
                                  sx={{ 
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    '&:hover': { textDecoration: 'underline' }
                                  }}
                                >
                                  {season.name}
                                </Typography>
                                <Chip 
                                  label={season.status} 
                                  size="small"
                                  color={
                                    season.status === 'active' ? 'success' :
                                    season.status === 'registration' ? 'primary' :
                                    season.status === 'completed' ? 'default' :
                                    'warning'
                                  }
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="textSecondary">
                                  {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                                </Typography>
                                {season.status === 'draft' && league.isOwner && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<PersonAdd />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenRegistration(season._id);
                                    }}
                                    sx={{ mt: 1 }}
                                  >
                                    Open Registration
                                  </Button>
                                )}
                                {season.status === 'registration' && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    startIcon={<HowToReg />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenRegisterDialog(season);
                                    }}
                                    sx={{ mt: 1 }}
                                  >
                                    Register
                                  </Button>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < Math.min(seasons.length, 5) - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
                {seasons.length > 5 && (
                  <Box mt={2}>
                    <Button
                      component={Link}
                      to={`/seasons?league=${league._id}`}
                      fullWidth
                    >
                      View All Seasons
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Teams ({teams.length})</Typography>
              {league.isOwner && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  component={Link}
                  to="/teams"
                >
                  Add Team
                </Button>
              )}
            </Box>
            {teams.length === 0 ? (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                No teams in this league yet. Teams are added when you create seasons.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {teams.map((team) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={team._id}>
                    <Card
                      component={Link}
                      to={`/teams/${team._id}`}
                      sx={{ 
                        textDecoration: 'none', 
                        height: '100%', 
                        '&:hover': { boxShadow: 3 },
                        borderLeft: `4px solid ${team.colors.primary}`
                      }}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2} mb={1}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              backgroundColor: team.colors.primary,
                              border: `2px solid ${team.colors.secondary}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: team.colors.secondary,
                              fontWeight: 'bold',
                              fontSize: '1.2rem'
                            }}
                          >
                            {team.name.charAt(0)}
                          </Box>
                          <Box flex={1}>
                            <Typography variant="h6" gutterBottom>
                              {team.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {team.city}
                            </Typography>
                          </Box>
                        </Box>
                        <Box mt={2}>
                          <Typography variant="body2" color="textSecondary">
                            Players: {Array.isArray(team.players) ? team.players.length : 0}
                          </Typography>
                          {team.captain && (
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                              Captain: {team.captain.firstName} {team.captain.lastName}
                            </Typography>
                          )}
                          {(team.wins > 0 || team.losses > 0 || team.ties > 0) && (
                            <Box mt={1}>
                              <Typography variant="caption" color="textSecondary">
                                Record: {team.wins}-{team.losses}-{team.ties}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Seasons</Typography>
              {league.isOwner && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  component={Link}
                  to={`/seasons?league=${league._id}`}
                >
                  Create Season
                </Button>
              )}
            </Box>
            {seasons.length === 0 ? (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                No seasons in this league yet.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {seasons.map((season) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={season._id}>
                    <Card
                      component={Link}
                      to={`/seasons/${season._id}`}
                      sx={{ textDecoration: 'none', height: '100%', '&:hover': { boxShadow: 3 } }}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {season.name}
                        </Typography>
                        <Chip
                          label={season.status}
                          size="small"
                          color={
                            season.status === 'active'
                              ? 'success'
                              : season.status === 'completed'
                              ? 'default'
                              : 'primary'
                          }
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" color="textSecondary">
                          {new Date(season.startDate).toLocaleDateString()} -{' '}
                          {new Date(season.endDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          {Array.isArray(season.teams) ? season.teams.length : 0} teams
                        </Typography>
                        {season.status === 'completed' && season.standings && season.standings.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              Winner: {season.standings[0]?.team?.name || 'N/A'}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 3 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Members ({league.memberCount})</Typography>
              {league.isOwner && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowAddMemberDialog(true)}
                >
                  Add Member
                </Button>
              )}
            </Box>
            <List>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    {league.owner.firstName[0]}{league.owner.lastName[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${league.owner.firstName} ${league.owner.lastName}`}
                  secondary={league.owner.email}
                />
                <Chip label="Owner" color="secondary" size="small" />
              </ListItem>
              {league.members && league.members.length > 0 && <Divider sx={{ my: 1 }} />}
              {league.members && league.members.length > 0 ? (
                league.members.map((member, index) => (
                  <React.Fragment key={member._id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${member.firstName} ${member.lastName}`}
                        secondary={member.email}
                      />
                      {league.isOwner && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveMember(member._id)}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </ListItem>
                    {index < league.members.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary="No additional members"
                    secondary="Only the owner is a member of this league"
                    sx={{ textAlign: 'center', py: 2 }}
                  />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit League</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="League Name"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            required
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={editFormData.description}
            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <Box mt={2}>
            <Typography variant="body2" color="textSecondary">
              Visibility: {editFormData.isPublic ? 'Public' : 'Private'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onClose={() => setShowAddMemberDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Member</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Note: Member management by email will require backend support. For now, you can add members by user ID through the API.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddMemberDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Registration Dialog */}
      <Dialog 
        open={showRegisterDialog} 
        onClose={() => {
          setShowRegisterDialog(false);
          setShowCreateTeamForm(false);
          setShowCreatePlayerForm(false);
          setRegisterMode('team');
          setSelectedTeam('');
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Register for {selectedSeason?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Button
              variant={registerMode === 'team' ? 'contained' : 'outlined'}
              onClick={() => setRegisterMode('team')}
              sx={{ mr: 1 }}
            >
              Register Team
            </Button>
            <Button
              variant={registerMode === 'player' ? 'contained' : 'outlined'}
              onClick={() => setRegisterMode('player')}
            >
              Join Team
            </Button>
          </Box>

          {registerMode === 'team' && (
            <Box>
              {!showCreateTeamForm ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    Available Teams
                  </Typography>
                  {availableTeams.length === 0 ? (
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      No available teams. Create a new team to register.
                    </Typography>
                  ) : (
                    <List>
                      {availableTeams.map((team) => (
                        <ListItem key={team._id} disablePadding>
                          <ListItemButton
                            selected={selectedTeam === team._id}
                            onClick={() => setSelectedTeam(team._id)}
                          >
                            <ListItemText
                              primary={team.name}
                              secondary={team.city}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => setShowCreateTeamForm(true)}
                    sx={{ mt: 2 }}
                  >
                    Create New Team
                  </Button>
                </>
              ) : (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Create New Team
                  </Typography>
                  <TextField
                    fullWidth
                    label="Team Name"
                    value={newTeamData.name}
                    onChange={(e) => setNewTeamData({ ...newTeamData, name: e.target.value })}
                    margin="normal"
                    required
                  />
                  <TextField
                    fullWidth
                    label="City"
                    value={newTeamData.city}
                    onChange={(e) => setNewTeamData({ ...newTeamData, city: e.target.value })}
                    margin="normal"
                    required
                  />
                  <Box display="flex" gap={2} mt={2}>
                    <TextField
                      type="color"
                      label="Primary Color"
                      value={newTeamData.colors.primary}
                      onChange={(e) => setNewTeamData({
                        ...newTeamData,
                        colors: { ...newTeamData.colors, primary: e.target.value }
                      })}
                      margin="normal"
                    />
                    <TextField
                      type="color"
                      label="Secondary Color"
                      value={newTeamData.colors.secondary}
                      onChange={(e) => setNewTeamData({
                        ...newTeamData,
                        colors: { ...newTeamData.colors, secondary: e.target.value }
                      })}
                      margin="normal"
                    />
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={() => setShowCreateTeamForm(false)}
                    sx={{ mt: 2, mr: 1 }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {registerMode === 'player' && (
            <Box>
              {registeredTeams.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No teams registered yet. Register a team first.
                </Typography>
              ) : (
                <>
                  {!showCreatePlayerForm ? (
                    <>
                      <Typography variant="h6" gutterBottom>
                        Join a Team
                      </Typography>
                      <Typography variant="h6" gutterBottom>
                        Select a Team to Join
                      </Typography>
                      <List>
                        {registeredTeams.map((team) => (
                          <ListItem key={team._id} disablePadding>
                            <ListItemButton
                              selected={selectedTeam === team._id}
                              onClick={() => setSelectedTeam(team._id)}
                            >
                              <ListItemText
                                primary={team.name}
                                secondary={team.city}
                              />
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                      {!userPlayer && selectedTeam && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            You need to create a player profile to join this team.
                          </Typography>
                          <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => setShowCreatePlayerForm(true)}
                          >
                            Create Player Profile
                          </Button>
                        </Box>
                      )}
                    </>
                  ) : (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Create Player Profile
                      </Typography>
                      <TextField
                        fullWidth
                        label="Date of Birth"
                        type="date"
                        value={newPlayerData.dateOfBirth}
                        onChange={(e) => setNewPlayerData({ ...newPlayerData, dateOfBirth: e.target.value })}
                        margin="normal"
                        required
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        fullWidth
                        select
                        label="Position"
                        value={newPlayerData.position}
                        onChange={(e) => setNewPlayerData({ ...newPlayerData, position: e.target.value as any })}
                        margin="normal"
                        required
                        SelectProps={{ native: true }}
                      >
                        <option value="Goalkeeper">Goalkeeper</option>
                        <option value="Defender">Defender</option>
                        <option value="Midfielder">Midfielder</option>
                        <option value="Forward">Forward</option>
                        <option value="Coach">Coach</option>
                        <option value="Manager">Manager</option>
                      </TextField>
                      <TextField
                        fullWidth
                        label="Jersey Number"
                        type="number"
                        value={newPlayerData.jerseyNumber || ''}
                        onChange={(e) => setNewPlayerData({ 
                          ...newPlayerData, 
                          jerseyNumber: e.target.value ? parseInt(e.target.value) : undefined 
                        })}
                        margin="normal"
                        inputProps={{ min: 1, max: 99 }}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => setShowCreatePlayerForm(false)}
                        sx={{ mt: 2, mr: 1 }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowRegisterDialog(false);
              setShowCreateTeamForm(false);
              setShowCreatePlayerForm(false);
              setRegisterMode('team');
              setSelectedTeam('');
            }}
          >
            Cancel
          </Button>
          {registerMode === 'team' && !showCreateTeamForm && selectedTeam && (
            <Button onClick={handleRegisterTeam} variant="contained">
              Register Team
            </Button>
          )}
          {registerMode === 'team' && showCreateTeamForm && (
            <Button 
              onClick={handleCreateTeamAndRegister} 
              variant="contained"
              disabled={!newTeamData.name || !newTeamData.city}
            >
              Create & Register
            </Button>
          )}
          {registerMode === 'player' && !showCreatePlayerForm && selectedTeam && userPlayer && (
            <Button onClick={handleJoinTeam} variant="contained">
              Join Team
            </Button>
          )}
          {registerMode === 'player' && showCreatePlayerForm && (
            <Button 
              onClick={handleCreatePlayerAndJoinTeam} 
              variant="contained"
              disabled={!newPlayerData.dateOfBirth || !newPlayerData.position || !selectedTeam}
            >
              Create Profile & Join Team
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LeagueDetail;
