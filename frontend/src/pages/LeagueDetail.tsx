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
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
  Tab,
  Tabs,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  PlayArrow,
} from '@mui/icons-material';
import { leaguesApi, seasonsApi, teamsApi, playersApi, gamesApi, venuesApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { League, Season, Team, Player, CreateTeamData, CreatePlayerData, Game } from '../types';

const LeagueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [league, setLeague] = useState<League | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [seasonWithWeeks, setSeasonWithWeeks] = useState<Season | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [allVenues, setAllVenues] = useState<any[]>([]);
  const [showAddVenueDialog, setShowAddVenueDialog] = useState(false);
  const [showCreateVenueDialog, setShowCreateVenueDialog] = useState(false);
  const [showCreateSeasonDialog, setShowCreateSeasonDialog] = useState(false);
  const [selectedVenueForAdd, setSelectedVenueForAdd] = useState<any | null>(null);
  const [showSetVenueDialog, setShowSetVenueDialog] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameVenueData, setGameVenueData] = useState({
    venueName: '',
    venueAddress: '',
    scheduledDate: '',
    scheduledTime: '',
  });
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<Player[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<Player[]>([]);
  const [newEventData, setNewEventData] = useState({
    type: 'goal' as 'goal' | 'yellow_card' | 'red_card' | 'own_goal',
    player: '',
    team: '',
    minute: 0,
    description: '',
  });
  const [newSeasonData, setNewSeasonData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const [newVenueData, setNewVenueData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    capacity: '',
    surface: 'Grass',
    amenities: [] as string[],
    contact: {
      name: '',
      phone: '',
      email: ''
    },
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
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
    }
  }, [id]);

  // Reset tab to Overview if we're on a hidden tab when seasons become empty
  useEffect(() => {
    // When no seasons: Overview(0), Members(1), Settings(2) are valid
    // When seasons exist: Overview(0), Teams(1), Games(2), Stats(3), Venues(4), Members(5), Settings(6) are valid
    // So when seasons.length === 0, only tabValue 0, 1, 2 are valid
    if (seasons.length === 0 && tabValue > 2) {
      setTabValue(0);
    }
  }, [seasons.length, tabValue]);

  // Fetch teams, games, and venues when selected season changes
  useEffect(() => {
    if (selectedSeason && id) {
      fetchTeams();
      fetchGames();
      fetchVenues();
    }
  }, [selectedSeason, id]);

  // Fetch all venues on mount
  useEffect(() => {
    const loadVenues = async () => {
      try {
        const data = await venuesApi.getAll();
        setAllVenues(data);
      } catch (error) {
        console.error('Error fetching all venues:', error);
      }
    };
    loadVenues();
  }, []);

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
        // Set the most recent active season as default, or most recent completed season, or most recent season
        if (data.length > 0) {
          const activeSeason = data.find(s => s.status === 'active');
          const completedSeasons = data.filter(s => s.status === 'completed');
          const mostRecentCompleted = completedSeasons.length > 0
            ? completedSeasons.sort((a, b) => 
                new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
              )[0]
            : null;
          const mostRecentSeason = data.sort((a, b) => 
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          )[0];
          const seasonToSelect = activeSeason || mostRecentCompleted || mostRecentSeason;
          setSelectedSeason(seasonToSelect);
          // Fetch full season data with weeks
          if (seasonToSelect) {
            try {
              const fullSeason = await seasonsApi.getById(seasonToSelect._id);
              setSeasonWithWeeks(fullSeason);
              // Set to first week if available
              if (fullSeason.weeks && fullSeason.weeks.length > 0) {
                setSelectedWeek(1);
              }
            } catch (error) {
              console.error('Error fetching season with weeks:', error);
            }
          }
        }
        // Fetch games, teams, and players after seasons are loaded
        await fetchGames();
        await fetchTeams();
        await fetchPlayers();
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      if (id) {
        // Get teams from the selected season
        if (selectedSeason) {
          // Fetch the season with populated teams
          const seasonData = await seasonsApi.getById(selectedSeason._id);
          if (seasonData && seasonData.teams) {
            setTeams(seasonData.teams as Team[]);
          } else {
            // Fallback to all league teams
            const data = await leaguesApi.getTeams(id);
            setTeams(data);
          }
        } else {
          // Fallback to all league teams
          const data = await leaguesApi.getTeams(id);
          setTeams(data);
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchPlayers = async () => {
    try {
      if (id) {
        const data = await leaguesApi.getPlayers(id);
        setPlayers(data);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchVenues = async () => {
    try {
      if (selectedSeason && id) {
        const data = await seasonsApi.getVenues(selectedSeason._id);
        setVenues(data);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    }
  };

  const handleAddVenue = async () => {
    if (!selectedSeason || !selectedVenueForAdd) return;
    try {
      await seasonsApi.addVenue(selectedSeason._id, selectedVenueForAdd._id);
      await fetchVenues();
      setShowAddVenueDialog(false);
      setSelectedVenueForAdd(null);
    } catch (error) {
      console.error('Error adding venue:', error);
      alert('Error adding venue. Please try again.');
    }
  };

  const handleRemoveVenue = async (venueId: string) => {
    if (!selectedSeason) return;
    if (!window.confirm('Remove this venue from the season?')) return;
    try {
      await seasonsApi.removeVenue(selectedSeason._id, venueId);
      await fetchVenues();
    } catch (error) {
      console.error('Error removing venue:', error);
      alert('Error removing venue. Please try again.');
    }
  };

  const handleCreateVenue = async () => {
    if (!selectedSeason) return;
    try {
      // Create the venue
      const venueData = {
        ...newVenueData,
        capacity: newVenueData.capacity ? parseInt(newVenueData.capacity.toString()) : undefined
      };
      const newVenue = await venuesApi.create(venueData);
      
      // Add it to the season
      await seasonsApi.addVenue(selectedSeason._id, newVenue._id);
      
      // Refresh venues and all venues list
      await fetchVenues();
      const updatedAllVenues = await venuesApi.getAll();
      setAllVenues(updatedAllVenues);
      
      // Reset form and close dialog
      setNewVenueData({
        name: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA'
        },
        capacity: '',
        surface: 'Grass',
        amenities: [],
        contact: {
          name: '',
          phone: '',
          email: ''
        },
        notes: ''
      });
      setShowCreateVenueDialog(false);
    } catch (error) {
      console.error('Error creating venue:', error);
      alert('Error creating venue. Please try again.');
    }
  };

  const fetchGames = async () => {
    try {
      if (id) {
        // Get all games and filter by selected season
        const allGames = await gamesApi.getAll();
        if (selectedSeason) {
          const seasonId = selectedSeason._id.toString();
          const seasonGames = allGames.filter(game => {
            // Handle both object and string season IDs
            let gameSeasonId = null;
            if (game.season) {
              if (typeof game.season === 'object' && game.season._id) {
                gameSeasonId = game.season._id.toString();
              } else if (typeof game.season === 'string') {
                gameSeasonId = game.season;
              }
            }
            return gameSeasonId === seasonId;
          });
          setGames(seasonGames);
        } else if (seasons.length > 0) {
          // Fallback: show games from all seasons in the league
          const seasonIds = seasons.map(s => s._id.toString());
          const leagueGames = allGames.filter(game => {
            let gameSeasonId = null;
            if (game.season) {
              if (typeof game.season === 'object' && game.season._id) {
                gameSeasonId = game.season._id.toString();
              } else if (typeof game.season === 'string') {
                gameSeasonId = game.season;
              }
            }
            return gameSeasonId && seasonIds.includes(gameSeasonId);
          });
          setGames(leagueGames);
        } else {
          setGames([]);
        }
      }
    } catch (error) {
      console.error('Error fetching games:', error);
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

  const handleStartSeason = async () => {
    if (!selectedSeason) return;
    try {
      // Check if schedule needs to be generated first
      if (!selectedSeason.weeks || selectedSeason.weeks.length === 0) {
        const confirmGenerate = window.confirm(
          'No schedule has been generated yet. Would you like to generate the schedule and start the season?'
        );
        if (confirmGenerate) {
          await seasonsApi.generateSchedule(selectedSeason._id);
          await fetchSeasons();
          // Refresh selected season
          const updatedSeason = await seasonsApi.getById(selectedSeason._id);
          setSelectedSeason(updatedSeason);
        } else {
          return;
        }
      }
      
      await seasonsApi.start(selectedSeason._id);
      await fetchSeasons();
      // Refresh selected season
      const updatedSeason = await seasonsApi.getById(selectedSeason._id);
      setSelectedSeason(updatedSeason);
      alert('Season started successfully! Registration is now closed.');
    } catch (error: any) {
      console.error('Error starting season:', error);
      alert(error.response?.data?.message || 'Error starting season. Please try again.');
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
      await fetchTeams();
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
      
      await fetchTeams();
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
    } catch (error: any) {
      console.error('Error creating player:', error);
      alert(error.response?.data?.message || 'Error creating player. Please try again.');
    }
  };

  const handleJoinTeam = async () => {
    if (!selectedTeam || !userPlayer) return;
    
    try {
      await teamsApi.addPlayer(selectedTeam, userPlayer._id);
      await fetchTeams();
      setShowRegisterDialog(false);
      setSelectedTeam('');
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
          <Box display="flex" gap={1} mt={2} flexWrap="wrap" alignItems="center">
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
            {seasons.length > 0 && (
              <Autocomplete
                options={seasons}
                getOptionLabel={(option) => option.name}
                value={selectedSeason}
                onChange={async (_, newValue) => {
                  setSelectedSeason(newValue);
                  // Fetch full season data with weeks
                  if (newValue) {
                    try {
                      const fullSeason = await seasonsApi.getById(newValue._id);
                      setSeasonWithWeeks(fullSeason);
                      // Set to first week if available
                      if (fullSeason.weeks && fullSeason.weeks.length > 0) {
                        setSelectedWeek(1);
                      } else {
                        setSelectedWeek(1);
                      }
                    } catch (error) {
                      console.error('Error fetching season with weeks:', error);
                    }
                  } else {
                    setSeasonWithWeeks(null);
                    setSelectedWeek(1);
                  }
                  // Refresh teams and games when season changes
                  await fetchTeams();
                  await fetchGames();
                  await fetchVenues();
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Season"
                    size="small"
                    sx={{ minWidth: 200 }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option._id}>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {new Date(option.startDate).toLocaleDateString()} - {new Date(option.endDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            )}
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          {league.isOwner && seasons.length === 0 && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreateSeasonDialog(true)}
            >
              New Season
            </Button>
          )}
          {selectedSeason && selectedSeason.status === 'registration' && league.isOwner && (
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayArrow />}
              onClick={handleStartSeason}
            >
              Start League
            </Button>
          )}
          {selectedSeason && selectedSeason.status === 'registration' && (league.isMember || league.isOwner) && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => {
                if (selectedSeason) {
                  handleOpenRegisterDialog(selectedSeason);
                }
              }}
            >
              Register
                  </Button>
                )}
              </Box>
      </Box>

          <Card sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
          {seasons.length > 0 && <Tab label="Teams" />}
          {seasons.length > 0 && <Tab label="Games" />}
          {seasons.length > 0 && <Tab label="Stats" />}
          {seasons.length > 0 && <Tab label="Venues" />}
          <Tab label="Members" />
          {league.isOwner && <Tab label="Settings" />}
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

      {tabValue === 1 && seasons.length > 0 && (
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Teams ({teams.length})</Typography>
            </Box>
            {teams.length === 0 ? (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                No teams in this league yet. Teams are added when you create seasons.
                </Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Team</TableCell>
                      <TableCell>City</TableCell>
                      <TableCell>Players</TableCell>
                      <TableCell>Captain</TableCell>
                      <TableCell>Record</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow
                        key={team._id}
                        component={Link}
                        to={`/teams/${team._id}`}
                        sx={{
                          textDecoration: 'none',
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' },
                          borderLeft: `4px solid ${team.colors.primary}`
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                backgroundColor: team.colors.primary,
                                border: `2px solid ${team.colors.secondary}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: team.colors.secondary,
                                fontWeight: 'bold',
                                fontSize: '0.9rem'
                              }}
                            >
                              {team.name.charAt(0)}
                            </Box>
                            <Typography variant="body1" fontWeight="medium">
                              {team.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{team.city}</TableCell>
                        <TableCell>{Array.isArray(team.players) ? team.players.length : 0}</TableCell>
                        <TableCell>
                          {team.captain
                            ? `${team.captain.firstName} ${team.captain.lastName}`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            if (!selectedSeason || !selectedSeason.standings) {
                              return '—';
                            }
                            const standing = selectedSeason.standings.find(
                              (s: any) => {
                                const teamId = typeof s.team === 'object' ? s.team._id : s.team;
                                return teamId === team._id;
                              }
                            );
                            if (standing && (standing.wins > 0 || standing.losses > 0 || standing.ties > 0)) {
                              return `${standing.wins}-${standing.losses}-${standing.ties}`;
                            }
                            return '—';
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && seasons.length > 0 && (
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                {seasonWithWeeks && seasonWithWeeks.weeks && seasonWithWeeks.weeks.length > 0
                  ? `Week ${selectedWeek} of ${seasonWithWeeks.weeks.length}`
                  : 'Games'}
                </Typography>
              {seasonWithWeeks && seasonWithWeeks.weeks && seasonWithWeeks.weeks.length > 0 && (
                <Box display="flex" gap={1} alignItems="center">
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={selectedWeek <= 1}
                    onClick={() => setSelectedWeek(prev => Math.max(1, prev - 1))}
                  >
                    Previous Week
                  </Button>
                  <Typography variant="body2" sx={{ minWidth: 100, textAlign: 'center' }}>
                    Week {selectedWeek} / {seasonWithWeeks.weeks.length}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={selectedWeek >= seasonWithWeeks.weeks.length}
                    onClick={() => setSelectedWeek(prev => Math.min(seasonWithWeeks.weeks.length, prev + 1))}
                  >
                    Next Week
                  </Button>
                </Box>
                )}
              </Box>
            {!selectedSeason ? (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                Please select a season to view games.
              </Typography>
            ) : !seasonWithWeeks || !seasonWithWeeks.weeks || seasonWithWeeks.weeks.length === 0 ? (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                No games scheduled yet. Generate a schedule for this season to see games.
              </Typography>
            ) : (() => {
              const currentWeek = seasonWithWeeks.weeks[selectedWeek - 1];
              if (!currentWeek) {
                return (
                  <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                    Week {selectedWeek} not found.
                  </Typography>
                );
              }
              
              const weekGames = currentWeek?.games || [];
              
              // Get full game details for the week
              // weekGames can be either an array of game IDs (strings) or populated game objects
              const weekGameDetails = games.filter((game: Game) => {
                if (Array.isArray(weekGames)) {
                  return weekGames.some((g: any) => {
                    if (typeof g === 'object' && g._id) {
                      // It's a populated game object
                      return g._id === game._id;
                    } else if (typeof g === 'string') {
                      // It's a game ID
                      return g === game._id;
                    }
                    return false;
                  });
                }
                return false;
              });
              
              // Also check if weekGames contains populated game objects directly
              const populatedGames = weekGames.filter((g: any) => 
                typeof g === 'object' && g._id && g.scheduledDate
              ) as Game[];
              
              // Combine both sources, removing duplicates
              const allWeekGames: Game[] = [
                ...weekGameDetails,
                ...populatedGames.filter((g: Game) => 
                  !weekGameDetails.some((wg: Game) => wg._id === g._id)
                )
              ];
              
              return allWeekGames.length === 0 ? (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                  No games scheduled for Week {selectedWeek}.
                </Typography>
              ) : (
                <>
                  {currentWeek && (
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary">
                        {new Date(currentWeek.startDate).toLocaleDateString()} - {new Date(currentWeek.endDate).toLocaleDateString()}
                      </Typography>
                      {currentWeek.isCompleted && (
                        <Chip label="Completed" size="small" color="success" sx={{ mt: 1 }} />
                      )}
                    </Box>
                  )}
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Home Team</TableCell>
                          <TableCell>Away Team</TableCell>
                          <TableCell>Venue</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Score</TableCell>
                          {(league.isMember || league.isOwner) && <TableCell>Actions</TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allWeekGames
                          .sort((a: Game, b: Game) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                          .map((game: Game) => (
                            <TableRow
                              key={game._id}
                              component={Link}
                              to={`/games/${game._id}`}
                              sx={{
                                textDecoration: 'none',
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: 'action.hover' }
                              }}
                            >
                              <TableCell>
                                {new Date(game.scheduledDate).toLocaleDateString()} {new Date(game.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </TableCell>
                              <TableCell>
                                {typeof game.homeTeam === 'object' ? game.homeTeam.name : '—'}
                              </TableCell>
                              <TableCell>
                                {typeof game.awayTeam === 'object' ? game.awayTeam.name : '—'}
                              </TableCell>
                              <TableCell>
                                {game.venue?.name || 'TBD'}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={game.status === 'pending' ? 'Pending' : game.status}
                                  size="small"
                                  color={
                                    game.status === 'completed'
                                      ? 'success'
                                      : game.status === 'in_progress'
                                      ? 'warning'
                                      : game.status === 'pending'
                                      ? 'info'
                                      : game.status === 'cancelled' || game.status === 'postponed'
                                      ? 'error'
                                      : 'default'
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                {game.score && (game.status === 'completed' || game.status === 'in_progress')
                                  ? `${game.score.homeTeam} - ${game.score.awayTeam}`
                                  : '—'}
                              </TableCell>
                              {(league.isMember || league.isOwner) && (
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Box display="flex" gap={1}>
                                    {game.status === 'pending' && (
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setSelectedGame(game);
                                          setGameVenueData({
                                            venueName: game.venue?.name || '',
                                            venueAddress: game.venue?.address || '',
                                            scheduledDate: game.scheduledDate ? new Date(game.scheduledDate).toISOString().split('T')[0] : '',
                                            scheduledTime: game.scheduledDate ? new Date(game.scheduledDate).toTimeString().slice(0, 5) : '',
                                          });
                                          setShowSetVenueDialog(true);
                                        }}
                                      >
                                        Set Venue & Time
                                      </Button>
                                    )}
                                    {game.status === 'scheduled' && (
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="success"
                                        startIcon={<PlayArrow />}
                                        onClick={async (e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          if (window.confirm(`Start the game between ${typeof game.homeTeam === 'object' ? game.homeTeam.name : 'Home'} and ${typeof game.awayTeam === 'object' ? game.awayTeam.name : 'Away'}?`)) {
                                            try {
                                              await gamesApi.update(game._id, { status: 'in_progress' });
                                              await fetchGames();
                                              alert('Game started successfully!');
                                            } catch (error) {
                                              console.error('Error starting game:', error);
                                              alert('Error starting game. Please try again.');
                                            }
                                          }
                                        }}
                                      >
                                        Start Game
                                      </Button>
                                    )}
                                    {game.status === 'in_progress' && (
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="warning"
                                        onClick={async (e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setSelectedGame(game);
                                          
                                          // Fetch players for both teams
                                          try {
                                            const homeTeamId = typeof game.homeTeam === 'object' ? game.homeTeam._id : game.homeTeam;
                                            const awayTeamId = typeof game.awayTeam === 'object' ? game.awayTeam._id : game.awayTeam;
                                            
                                            const [homePlayers, awayPlayers] = await Promise.all([
                                              playersApi.getAll({ team: homeTeamId }),
                                              playersApi.getAll({ team: awayTeamId }),
                                            ]);
                                            
                                            setHomeTeamPlayers(homePlayers);
                                            setAwayTeamPlayers(awayPlayers);
                                            
                                            // Set default team to home team
                                            setNewEventData({
                                              type: 'goal',
                                              player: '',
                                              team: homeTeamId,
                                              minute: 0,
                                              description: '',
                                            });
                                            
                                            setShowScoreDialog(true);
                                          } catch (error) {
                                            console.error('Error fetching players:', error);
                                            alert('Error loading players. Please try again.');
                                          }
                                        }}
                                      >
                                        Manage Game
                                      </Button>
                                    )}
                                  </Box>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {tabValue === 3 && seasons.length > 0 && (
        <Card>
          <CardContent>
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Standings
              </Typography>
              {selectedSeason && (
                <Typography variant="body2" color="textSecondary">
                  Season: {selectedSeason.name}
                </Typography>
              )}
            </Box>
            {selectedSeason ? (() => {
              // Calculate standings from games
              type StandingData = {
                team: any;
                MP: number;
                W: number;
                D: number;
                L: number;
                GF: number;
                GA: number;
                GD: number;
                Pts: number;
                last5: Array<'W' | 'D' | 'L'>;
              };
              const standingsMap = new Map<string, StandingData>();

              // Initialize standings for all teams in the season
              if (selectedSeason.teams && Array.isArray(selectedSeason.teams)) {
                selectedSeason.teams.forEach((team: any) => {
                  const teamId = typeof team === 'object' && team._id ? team._id.toString() : String(team);
                  standingsMap.set(teamId, {
                    team: typeof team === 'object' ? team : null,
                    MP: 0,
                    W: 0,
                    D: 0,
                    L: 0,
                    GF: 0,
                    GA: 0,
                    GD: 0,
                    Pts: 0,
                    last5: [],
                  });
                });
              }

              // Process completed games
              const completedGames = games
                .filter(game => game.status === 'completed' && game.score)
                .sort((a, b) => {
                  const dateA = new Date(a.actualDate || a.scheduledDate).getTime();
                  const dateB = new Date(b.actualDate || b.scheduledDate).getTime();
                  return dateB - dateA; // Most recent first
                });

              completedGames.forEach((game) => {
                const homeTeamId = typeof game.homeTeam === 'object' && game.homeTeam._id ? game.homeTeam._id.toString() : String(game.homeTeam);
                const awayTeamId = typeof game.awayTeam === 'object' && game.awayTeam._id ? game.awayTeam._id.toString() : String(game.awayTeam);
                
                const homeStanding = standingsMap.get(homeTeamId);
                const awayStanding = standingsMap.get(awayTeamId);

                if (homeStanding && awayStanding && game.score) {
                  const homeScore = game.score.homeTeam;
                  const awayScore = game.score.awayTeam;

                  // Update home team
                  homeStanding.MP++;
                  homeStanding.GF += homeScore;
                  homeStanding.GA += awayScore;
                  homeStanding.GD = homeStanding.GF - homeStanding.GA;

                  // Update away team
                  awayStanding.MP++;
                  awayStanding.GF += awayScore;
                  awayStanding.GA += homeScore;
                  awayStanding.GD = awayStanding.GF - awayStanding.GA;

                  // Determine result
                  if (homeScore > awayScore) {
                    homeStanding.W++;
                    homeStanding.Pts += 3;
                    awayStanding.L++;
                    homeStanding.last5.unshift('W');
                    awayStanding.last5.unshift('L');
                  } else if (awayScore > homeScore) {
                    awayStanding.W++;
                    awayStanding.Pts += 3;
                    homeStanding.L++;
                    homeStanding.last5.unshift('L');
                    awayStanding.last5.unshift('W');
                  } else {
                    homeStanding.D++;
                    homeStanding.Pts += 1;
                    awayStanding.D++;
                    awayStanding.Pts += 1;
                    homeStanding.last5.unshift('D');
                    awayStanding.last5.unshift('D');
                  }

                  // Keep only last 5 matches
                  if (homeStanding.last5.length > 5) homeStanding.last5 = homeStanding.last5.slice(0, 5);
                  if (awayStanding.last5.length > 5) awayStanding.last5 = awayStanding.last5.slice(0, 5);
                }
              });

              // Convert to array and sort
              const standings = Array.from(standingsMap.values())
                .filter(s => s.team !== null && s.team !== undefined)
                .sort((a, b) => {
                  // Sort by Points (desc), then GD (desc), then GF (desc)
                  if (b.Pts !== a.Pts) return b.Pts - a.Pts;
                  if (b.GD !== a.GD) return b.GD - a.GD;
                  return b.GF - a.GF;
                });

              return standings.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Club</TableCell>
                        <TableCell align="center">MP</TableCell>
                        <TableCell align="center">W</TableCell>
                        <TableCell align="center">D</TableCell>
                        <TableCell align="center">L</TableCell>
                        <TableCell align="center">GF</TableCell>
                        <TableCell align="center">GA</TableCell>
                        <TableCell align="center">GD</TableCell>
                        <TableCell align="center">Pts</TableCell>
                        <TableCell align="center">Last 5</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {standings.map((standing, index) => {
                        const team = standing.team;
                        if (!team) return null;
                        const teamId = typeof team === 'object' && team._id ? team._id : String(team);
                        return (
                          <TableRow key={teamId} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {index + 1}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {typeof team === 'object' ? team.name : '—'}
                            </Typography>
                            {typeof team === 'object' && team.city && (
                              <Typography variant="caption" color="textSecondary">
                                {team.city}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{standing.MP}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{standing.W}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{standing.D}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{standing.L}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{standing.GF}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{standing.GA}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color={standing.GD > 0 ? 'success.main' : standing.GD < 0 ? 'error.main' : 'text.secondary'}>
                              {standing.GD > 0 ? '+' : ''}{standing.GD}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="bold">
                              {standing.Pts}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" gap={0.5} justifyContent="center">
                              {standing.last5.length > 0 ? (
                                standing.last5.map((result, idx) => (
                                  <Chip
                                    key={idx}
                                    label={result}
                                    size="small"
                                    sx={{
                                      minWidth: 32,
                                      height: 24,
                                      fontSize: '0.7rem',
                                      bgcolor: result === 'W' ? 'success.main' : result === 'D' ? 'warning.main' : 'error.main',
                                      color: 'white',
                                    }}
                                  />
                                ))
                              ) : (
                                <Typography variant="caption" color="textSecondary">
                                  —
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="textSecondary">
                    No teams registered for this season.
                  </Typography>
                </Box>
              );
            })() : (
              <Box textAlign="center" py={4}>
                <Typography variant="body2" color="textSecondary">
                  Please select a season to view standings.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 4 && seasons.length > 0 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Venues {selectedSeason ? `for ${selectedSeason.name}` : ''}
              </Typography>
              {selectedSeason && (league.isMember || league.isOwner) ? (
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => setShowCreateVenueDialog(true)}
                  >
                    Create Venue
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setShowAddVenueDialog(true)}
                  >
                    Add Existing Venue
                  </Button>
                </Box>
              ) : selectedSeason ? (
                <Typography variant="body2" color="textSecondary">
                  Only league members can manage venues
                </Typography>
              ) : null}
            </Box>
            {!selectedSeason ? (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                Please select a season to view and manage venues.
              </Typography>
            ) : venues.length === 0 ? (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                No venues associated with this season.
              </Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Capacity</TableCell>
                      <TableCell>Surface</TableCell>
                      {(league.isMember || league.isOwner) && <TableCell>Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {venues.map((venue) => (
                      <TableRow key={venue._id}>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {venue.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {venue.fullAddress || (
                            <Box>
                              {venue.address?.street && (
                                <Typography variant="body2">{venue.address.street}</Typography>
                              )}
                              <Typography variant="body2" color="textSecondary">
                                {[
                                  venue.address?.city,
                                  venue.address?.state,
                                  venue.address?.zipCode
                                ].filter(Boolean).join(', ')}
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>{venue.capacity || '—'}</TableCell>
                        <TableCell>
                          {venue.surface && (
                            <Chip label={venue.surface} size="small" />
                          )}
                        </TableCell>
                        {(league.isMember || league.isOwner) && (
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveVenue(venue._id)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {((seasons.length === 0 && tabValue === 1) || (seasons.length > 0 && tabValue === 5)) && (
          <Card>
            <CardContent>
              {/* League Members Section */}
              <Box mb={4}>
                <Typography variant="h6" gutterBottom>League Members</Typography>
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
                {league.members && league.members.length > 0 && (
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
                )}
              </List>
              </Box>

              {/* Players from Teams Section */}
              <Box>
                <Typography variant="h6" gutterBottom>Players from Teams ({players.length})</Typography>
                {players.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                    No players found in teams for this league.
                  </Typography>
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Team</TableCell>
                          <TableCell>Position</TableCell>
                          <TableCell>Jersey #</TableCell>
                          <TableCell>Email</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {players.map((player) => (
                          <TableRow
                            key={player._id}
                            component={Link}
                            to={`/players/${player._id}`}
                            sx={{
                              textDecoration: 'none',
                              cursor: 'pointer',
                              '&:hover': { backgroundColor: 'action.hover' }
                            }}
                          >
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Avatar sx={{ width: 32, height: 32 }}>
                                  {player.firstName[0]}{player.lastName[0]}
                                </Avatar>
                                <Typography variant="body2">
                                  {player.firstName} {player.lastName}
                                </Typography>
                                {player.isCaptain && (
                                  <Chip label="C" size="small" color="primary" />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {typeof player.team === 'object' && player.team
                                ? `${player.team.name} (${player.team.city})`
                                : '—'}
                            </TableCell>
                            <TableCell>{player.position}</TableCell>
                            <TableCell>{player.jerseyNumber || '—'}</TableCell>
                            <TableCell>{player.email}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </CardContent>
          </Card>
      )}

      {((seasons.length === 0 && tabValue === 2) || (seasons.length > 0 && tabValue === 6)) && league.isOwner && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Settings
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Manage league and season settings. These actions are only available to league owners.
            </Typography>

            <Box display="flex" flexDirection="column" gap={2}>
              {/* Edit League */}
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Edit League
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Update league name, description, and visibility settings.
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => setShowEditDialog(true)}
                    >
                      Edit League
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Delete League */}
              <Card variant="outlined" sx={{ borderColor: 'error.main' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" gutterBottom color="error">
                        Delete League
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Permanently delete this league and all associated seasons and games. This action cannot be undone.
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<Delete />}
                      onClick={handleDelete}
                    >
                      Delete League
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Season Settings Section */}
              {selectedSeason && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Season Settings: {selectedSeason.name}
                  </Typography>
              {/* Reopen Registration */}
              {(selectedSeason.status === 'active' || selectedSeason.status === 'completed') && (
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Reopen Registration
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Reopen registration to allow teams to join or leave this season. The season status will change back to registration.
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<HowToReg />}
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to reopen registration for "${selectedSeason.name}"? This will change the season status back to registration.`)) {
                            try {
                              await seasonsApi.update(selectedSeason._id, { status: 'registration' });
                              await fetchSeasons();
                              // Refresh selected season
                              const updatedSeason = await seasonsApi.getById(selectedSeason._id);
                              setSelectedSeason(updatedSeason);
                              alert('Registration reopened successfully!');
                            } catch (error) {
                              console.error('Error reopening registration:', error);
                              alert('Error reopening registration. Please try again.');
                            }
                          }
                        }}
                      >
                        Reopen Registration
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Complete Season */}
              {selectedSeason.status === 'active' && (
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Complete Season
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Mark this season as completed. This will finalize standings and prevent further changes.
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to complete the season "${selectedSeason.name}"? This action cannot be undone.`)) {
                            try {
                              await seasonsApi.complete(selectedSeason._id);
                              await fetchSeasons();
                              alert('Season completed successfully!');
                            } catch (error) {
                              console.error('Error completing season:', error);
                              alert('Error completing season. Please try again.');
                            }
                          }
                        }}
                      >
                        Complete Season
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Regenerate Schedule */}
              {(selectedSeason.status === 'draft' || selectedSeason.status === 'registration') && (
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Regenerate Schedule
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Delete all existing games and regenerate the schedule. This will remove all current game assignments.
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        color="warning"
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to regenerate the schedule for "${selectedSeason.name}"? This will delete all existing games and create a new schedule. This action cannot be undone.`)) {
                            try {
                              await seasonsApi.regenerateSchedule(selectedSeason._id);
                              await fetchSeasons();
                              await fetchGames();
                              if (selectedSeason) {
                                const fullSeason = await seasonsApi.getById(selectedSeason._id);
                                setSeasonWithWeeks(fullSeason);
                                setSelectedWeek(1);
                              }
                              alert('Schedule regenerated successfully!');
                            } catch (error) {
                              console.error('Error regenerating schedule:', error);
                              alert('Error regenerating schedule. Please try again.');
                            }
                          }
                        }}
                      >
                        Regenerate Schedule
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Delete Season */}
              {selectedSeason.status !== 'active' && (
                <Card variant="outlined" sx={{ borderColor: 'error.main' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6" gutterBottom color="error">
                          Delete Season
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Permanently delete this season and all associated games. This action cannot be undone.
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={async () => {
                          const confirmMessage = `Are you absolutely sure you want to delete the season "${selectedSeason.name}"? This will permanently delete:\n\n- The season\n- All games associated with this season\n\nThis action CANNOT be undone.`;
                          if (window.confirm(confirmMessage)) {
                            const doubleConfirm = window.confirm('This is your last chance. Type "DELETE" to confirm (or click OK to proceed).');
                            if (doubleConfirm) {
                              try {
                                await seasonsApi.deleteSeason(selectedSeason._id);
                                await fetchSeasons();
                                // Clear selected season if it was deleted
                                if (seasons.length > 1) {
                                  const remainingSeasons = seasons.filter(s => s._id !== selectedSeason._id);
                                  if (remainingSeasons.length > 0) {
                                    setSelectedSeason(remainingSeasons[0]);
                                  } else {
                                    setSelectedSeason(null);
                                  }
                                } else {
                                  setSelectedSeason(null);
                                }
                                alert('Season deleted successfully!');
                              } catch (error) {
                                console.error('Error deleting season:', error);
                                alert('Error deleting season. Please try again.');
                              }
                            }
                          }
                        }}
                      >
                        Delete Season
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}
                </>
              )}

              {!selectedSeason && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                      Please select a season to manage season-specific settings.
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
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

      {/* Add Venue Dialog */}
      <Dialog open={showAddVenueDialog} onClose={() => {
        setShowAddVenueDialog(false);
        setSelectedVenueForAdd(null);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Add Existing Venue to Season</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={allVenues.filter(v => !venues.some(ev => ev._id === v._id))}
            getOptionLabel={(option) => option.name}
            value={selectedVenueForAdd}
            onChange={(_, newValue) => setSelectedVenueForAdd(newValue)}
            renderInput={(params) => (
          <TextField
                {...params}
                label="Select Venue"
                margin="normal"
            fullWidth
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option._id}>
                <Box>
                  <Typography variant="body1">{option.name}</Typography>
                  {option.fullAddress && (
                    <Typography variant="body2" color="textSecondary">
                      {option.fullAddress}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowAddVenueDialog(false);
            setSelectedVenueForAdd(null);
          }}>Cancel</Button>
          <Button
            onClick={handleAddVenue}
            variant="contained"
            disabled={!selectedVenueForAdd}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Season Dialog */}
      <Dialog open={showCreateSeasonDialog} onClose={() => {
        setShowCreateSeasonDialog(false);
        setNewSeasonData({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
        });
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Season</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Season Name"
            value={newSeasonData.name}
            onChange={(e) => setNewSeasonData({ ...newSeasonData, name: e.target.value })}
            required
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description (Optional)"
            value={newSeasonData.description}
            onChange={(e) => setNewSeasonData({ ...newSeasonData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={newSeasonData.startDate}
            onChange={(e) => setNewSeasonData({ ...newSeasonData, startDate: e.target.value })}
            required
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={newSeasonData.endDate}
            onChange={(e) => setNewSeasonData({ ...newSeasonData, endDate: e.target.value })}
            required
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowCreateSeasonDialog(false);
            setNewSeasonData({
              name: '',
              description: '',
              startDate: '',
              endDate: '',
            });
          }}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!id || !newSeasonData.name || !newSeasonData.startDate || !newSeasonData.endDate) {
                alert('Please fill in all required fields.');
                return;
              }
              try {
                const startDate = new Date(newSeasonData.startDate).toISOString();
                const endDate = new Date(newSeasonData.endDate).toISOString();
                
                await seasonsApi.create({
                  name: newSeasonData.name,
                  description: newSeasonData.description || undefined,
                  league: id,
                  startDate: startDate,
                  endDate: endDate,
                  teams: [],
                });
                
                await fetchSeasons();
                setShowCreateSeasonDialog(false);
                setNewSeasonData({
                  name: '',
                  description: '',
                  startDate: '',
                  endDate: '',
                });
                alert('Season created successfully!');
              } catch (error) {
                console.error('Error creating season:', error);
                alert('Error creating season. Please try again.');
              }
            }}
            variant="contained"
            disabled={!newSeasonData.name || !newSeasonData.startDate || !newSeasonData.endDate}
          >
            Create Season
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Venue Dialog */}
      <Dialog open={showCreateVenueDialog} onClose={() => {
        setShowCreateVenueDialog(false);
        setNewVenueData({
          name: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'USA'
          },
          capacity: '',
          surface: 'Grass',
          amenities: [],
          contact: {
            name: '',
            phone: '',
            email: ''
          },
          notes: ''
        });
      }} maxWidth="md" fullWidth>
        <DialogTitle>Create New Venue</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Venue Name"
            value={newVenueData.name}
            onChange={(e) => setNewVenueData({ ...newVenueData, name: e.target.value })}
            required
            margin="normal"
          />
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>Address</Typography>
            <TextField
              fullWidth
              label="Street"
              value={newVenueData.address.street}
              onChange={(e) => setNewVenueData({
                ...newVenueData,
                address: { ...newVenueData.address, street: e.target.value }
              })}
              margin="normal"
            />
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="City"
                value={newVenueData.address.city}
                onChange={(e) => setNewVenueData({
                  ...newVenueData,
                  address: { ...newVenueData.address, city: e.target.value }
                })}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="State"
                value={newVenueData.address.state}
                onChange={(e) => setNewVenueData({
                  ...newVenueData,
                  address: { ...newVenueData.address, state: e.target.value }
                })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Zip Code"
                value={newVenueData.address.zipCode}
                onChange={(e) => setNewVenueData({
                  ...newVenueData,
                  address: { ...newVenueData.address, zipCode: e.target.value }
                })}
                margin="normal"
              />
            </Box>
            <TextField
              fullWidth
              label="Country"
              value={newVenueData.address.country}
              onChange={(e) => setNewVenueData({
                ...newVenueData,
                address: { ...newVenueData.address, country: e.target.value }
              })}
              margin="normal"
            />
          </Box>
          <Box display="flex" gap={2} mt={2}>
            <TextField
              fullWidth
              label="Capacity"
              type="number"
              value={newVenueData.capacity}
              onChange={(e) => setNewVenueData({ ...newVenueData, capacity: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              select
              label="Surface"
              value={newVenueData.surface}
              onChange={(e) => setNewVenueData({ ...newVenueData, surface: e.target.value })}
              margin="normal"
              SelectProps={{
                native: true,
              }}
            >
              <option value="Grass">Grass</option>
              <option value="Artificial Turf">Artificial Turf</option>
              <option value="Indoor">Indoor</option>
              <option value="Other">Other</option>
            </TextField>
          </Box>
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>Contact Information (Optional)</Typography>
            <TextField
              fullWidth
              label="Contact Name"
              value={newVenueData.contact.name}
              onChange={(e) => setNewVenueData({
                ...newVenueData,
                contact: { ...newVenueData.contact, name: e.target.value }
              })}
              margin="normal"
            />
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="Phone"
                value={newVenueData.contact.phone}
                onChange={(e) => setNewVenueData({
                  ...newVenueData,
                  contact: { ...newVenueData.contact, phone: e.target.value }
                })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
            type="email"
                value={newVenueData.contact.email}
                onChange={(e) => setNewVenueData({
                  ...newVenueData,
                  contact: { ...newVenueData.contact, email: e.target.value }
                })}
                margin="normal"
              />
            </Box>
          </Box>
          <TextField
            fullWidth
            label="Notes (Optional)"
            value={newVenueData.notes}
            onChange={(e) => setNewVenueData({ ...newVenueData, notes: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowCreateVenueDialog(false);
            setNewVenueData({
              name: '',
              address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'USA'
              },
              capacity: '',
              surface: 'Grass',
              amenities: [],
              contact: {
                name: '',
                phone: '',
                email: ''
              },
              notes: ''
            });
          }}>Cancel</Button>
          <Button
            onClick={handleCreateVenue}
            variant="contained"
            disabled={!newVenueData.name || !newVenueData.address.city}
          >
            Create & Add to Season
          </Button>
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
                    <Autocomplete
                      options={availableTeams}
                      getOptionLabel={(option) => `${option.name} - ${option.city}`}
                      value={availableTeams.find(team => team._id === selectedTeam) || null}
                      onChange={(_, newValue) => {
                        setSelectedTeam(newValue?._id || '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Search and select a team"
                          placeholder="Type to search teams..."
                          margin="normal"
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} key={option._id}>
                          <Box>
                            <Typography variant="body1">{option.name}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              {option.city}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      sx={{ mt: 2, mb: 2 }}
                    />
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
                      <Autocomplete
                        options={registeredTeams}
                        getOptionLabel={(option) => `${option.name} - ${option.city}`}
                        value={registeredTeams.find(team => team._id === selectedTeam) || null}
                        onChange={(_, newValue) => {
                          setSelectedTeam(newValue?._id || '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Search and select a team"
                            placeholder="Type to search teams..."
                            margin="normal"
                          />
                        )}
                        renderOption={(props, option) => (
                          <Box component="li" {...props} key={option._id}>
                            <Box>
                              <Typography variant="body1">{option.name}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                {option.city}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        sx={{ mt: 2, mb: 2 }}
                      />
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

      {/* Set Venue & Time Dialog */}
      <Dialog 
        open={showSetVenueDialog} 
        onClose={() => {
          setShowSetVenueDialog(false);
          setSelectedGame(null);
          setGameVenueData({
            venueName: '',
            venueAddress: '',
            scheduledDate: '',
            scheduledTime: '',
          });
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Set Venue & Time {selectedGame && `- ${selectedGame.homeTeam.name} vs ${selectedGame.awayTeam.name}`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              options={venues}
              getOptionLabel={(option) => option.name}
              value={venues.find(v => v.name === gameVenueData.venueName) || null}
              onChange={(_, newValue) => {
                if (newValue) {
                  setGameVenueData({
                    ...gameVenueData,
                    venueName: newValue.name,
                    venueAddress: newValue.address?.street ? 
                      `${newValue.address.street}, ${newValue.address.city}, ${newValue.address.state} ${newValue.address.zipCode}` : 
                      '',
                  });
                } else {
                  setGameVenueData({
                    ...gameVenueData,
                    venueName: '',
                    venueAddress: '',
                  });
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Venue"
                  margin="normal"
                  fullWidth
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option._id}>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    {option.address && (
                      <Typography variant="body2" color="textSecondary">
                        {option.address.street}, {option.address.city}, {option.address.state}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            />
            <TextField
              fullWidth
              label="Venue Name (if not in list)"
              value={gameVenueData.venueName}
              onChange={(e) => setGameVenueData({ ...gameVenueData, venueName: e.target.value })}
              margin="normal"
              placeholder="Enter venue name manually"
            />
            <TextField
              fullWidth
              label="Venue Address (optional)"
              value={gameVenueData.venueAddress}
              onChange={(e) => setGameVenueData({ ...gameVenueData, venueAddress: e.target.value })}
              margin="normal"
              placeholder="Enter venue address"
            />
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={gameVenueData.scheduledDate}
              onChange={(e) => setGameVenueData({ ...gameVenueData, scheduledDate: e.target.value })}
              margin="normal"
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              fullWidth
              label="Time"
              type="time"
              value={gameVenueData.scheduledTime}
              onChange={(e) => setGameVenueData({ ...gameVenueData, scheduledTime: e.target.value })}
              margin="normal"
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowSetVenueDialog(false);
              setSelectedGame(null);
              setGameVenueData({
                venueName: '',
                venueAddress: '',
                scheduledDate: '',
                scheduledTime: '',
              });
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!selectedGame || !gameVenueData.venueName || !gameVenueData.scheduledDate || !gameVenueData.scheduledTime) {
                alert('Please fill in all required fields (Venue Name, Date, and Time).');
                return;
              }
              try {
                // Combine date and time
                const scheduledDateTime = new Date(`${gameVenueData.scheduledDate}T${gameVenueData.scheduledTime}`);
                
                await gamesApi.update(selectedGame._id, {
                  venue: {
                    name: gameVenueData.venueName,
                    address: gameVenueData.venueAddress || undefined,
                  },
                  scheduledDate: scheduledDateTime.toISOString(),
                });
                
                // Refresh games
                await fetchGames();
                setShowSetVenueDialog(false);
                setSelectedGame(null);
                setGameVenueData({
                  venueName: '',
                  venueAddress: '',
                  scheduledDate: '',
                  scheduledTime: '',
                });
                alert('Venue and time set successfully!');
              } catch (error) {
                console.error('Error setting venue and time:', error);
                alert('Error setting venue and time. Please try again.');
              }
            }}
            variant="contained"
            disabled={!gameVenueData.venueName || !gameVenueData.scheduledDate || !gameVenueData.scheduledTime}
          >
            Set Venue & Time
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Game Events Dialog */}
      <Dialog 
        open={showScoreDialog} 
        onClose={() => {
          setShowScoreDialog(false);
          setSelectedGame(null);
          setHomeTeamPlayers([]);
          setAwayTeamPlayers([]);
          setNewEventData({
            type: 'goal',
            player: '',
            team: '',
            minute: 0,
            description: '',
          });
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Manage Game {selectedGame && `- ${typeof selectedGame.homeTeam === 'object' ? selectedGame.homeTeam.name : 'Home'} vs ${typeof selectedGame.awayTeam === 'object' ? selectedGame.awayTeam.name : 'Away'}`}
        </DialogTitle>
        <DialogContent>
          {selectedGame && (
            <Box sx={{ mt: 2 }}>
              {/* Current Score Display */}
              <Box display="flex" alignItems="center" justifyContent="center" gap={3} mb={3} p={2} sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight="bold">
                    {selectedGame.score?.homeTeam || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {typeof selectedGame.homeTeam === 'object' ? selectedGame.homeTeam.name : 'Home'}
                  </Typography>
                </Box>
                <Typography variant="h4">-</Typography>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight="bold">
                    {selectedGame.score?.awayTeam || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {typeof selectedGame.awayTeam === 'object' ? selectedGame.awayTeam.name : 'Away'}
                  </Typography>
                </Box>
              </Box>

              {/* Current Events */}
              {selectedGame.events && selectedGame.events.length > 0 && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    Game Events
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Minute</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Player</TableCell>
                          <TableCell>Team</TableCell>
                          <TableCell>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedGame.events
                          .sort((a: any, b: any) => (a.minute || 0) - (b.minute || 0))
                          .map((event: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>{event.minute}'</TableCell>
                              <TableCell>
                                <Chip
                                  label={event.type.replace('_', ' ')}
                                  size="small"
                                  color={
                                    event.type === 'goal' || event.type === 'own_goal'
                                      ? 'success'
                                      : event.type === 'yellow_card'
                                      ? 'warning'
                                      : event.type === 'red_card'
                                      ? 'error'
                                      : 'default'
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                {typeof event.player === 'object' && event.player
                                  ? `${event.player.firstName} ${event.player.lastName}${event.player.jerseyNumber ? ` (#${event.player.jerseyNumber})` : ''}`
                                  : '—'}
                              </TableCell>
                              <TableCell>
                                {typeof event.team === 'object' && event.team
                                  ? event.team.name
                                  : '—'}
                              </TableCell>
                              <TableCell>{event.description || '—'}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Add New Event */}
              <Typography variant="h6" gutterBottom>
                Add Event
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <FormControl fullWidth>
                    <InputLabel>Event Type</InputLabel>
                    <Select
                      value={newEventData.type}
                      label="Event Type"
                      onChange={(e) => setNewEventData({ ...newEventData, type: e.target.value as any })}
                    >
                      <MenuItem value="goal">Goal</MenuItem>
                      <MenuItem value="own_goal">Own Goal</MenuItem>
                      <MenuItem value="yellow_card">Yellow Card</MenuItem>
                      <MenuItem value="red_card">Red Card</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box>
                  <FormControl fullWidth>
                    <InputLabel>Team</InputLabel>
                    <Select
                      value={newEventData.team}
                      label="Team"
                      onChange={(e) => {
                        setNewEventData({ ...newEventData, team: e.target.value, player: '' });
                      }}
                    >
                      {selectedGame.homeTeam && (
                        <MenuItem value={typeof selectedGame.homeTeam === 'object' ? selectedGame.homeTeam._id : selectedGame.homeTeam}>
                          {typeof selectedGame.homeTeam === 'object' ? selectedGame.homeTeam.name : 'Home Team'}
                        </MenuItem>
                      )}
                      {selectedGame.awayTeam && (
                        <MenuItem value={typeof selectedGame.awayTeam === 'object' ? selectedGame.awayTeam._id : selectedGame.awayTeam}>
                          {typeof selectedGame.awayTeam === 'object' ? selectedGame.awayTeam.name : 'Away Team'}
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Box>
                <Box>
                  <FormControl fullWidth>
                    <InputLabel>Player</InputLabel>
                    <Select
                      value={newEventData.player}
                      label="Player"
                      onChange={(e) => setNewEventData({ ...newEventData, player: e.target.value })}
                      disabled={!newEventData.team}
                    >
                      {newEventData.team && (
                        (newEventData.team === (typeof selectedGame.homeTeam === 'object' ? selectedGame.homeTeam._id : selectedGame.homeTeam)
                          ? homeTeamPlayers
                          : awayTeamPlayers
                        ).map((player) => (
                          <MenuItem key={player._id} value={player._id}>
                            {player.firstName} {player.lastName}
                            {player.jerseyNumber ? ` (#${player.jerseyNumber})` : ''}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Minute"
                    type="number"
                    value={newEventData.minute}
                    onChange={(e) => setNewEventData({ ...newEventData, minute: parseInt(e.target.value) || 0 })}
                    inputProps={{ min: 0, max: 120 }}
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                  <TextField
                    fullWidth
                    label="Description (optional)"
                    value={newEventData.description}
                    onChange={(e) => setNewEventData({ ...newEventData, description: e.target.value })}
                    multiline
                    rows={2}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowScoreDialog(false);
              setSelectedGame(null);
              setHomeTeamPlayers([]);
              setAwayTeamPlayers([]);
              setNewEventData({
                type: 'goal',
                player: '',
                team: '',
                minute: 0,
                description: '',
              });
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!selectedGame || !newEventData.player || !newEventData.team) {
                alert('Please fill in all required fields (Event Type, Team, Player, Minute)');
                return;
              }
              try {
                const updatedGame = await gamesApi.addEvent(selectedGame._id, {
                  type: newEventData.type,
                  player: newEventData.player,
                  team: newEventData.team,
                  minute: newEventData.minute,
                  description: newEventData.description || undefined,
                });
                
                // Update selected game with new data
                setSelectedGame(updatedGame);
                
                // Reset form
                setNewEventData({
                  type: 'goal',
                  player: '',
                  team: typeof selectedGame.homeTeam === 'object' ? selectedGame.homeTeam._id : selectedGame.homeTeam,
                  minute: 0,
                  description: '',
                });
                
                // Refresh games list
                await fetchGames();
                
                alert('Event added successfully!');
              } catch (error: any) {
                console.error('Error adding event:', error);
                alert(error.response?.data?.message || 'Error adding event. Please try again.');
              }
            }}
            variant="outlined"
            disabled={!newEventData.player || !newEventData.team || newEventData.minute < 0}
          >
            Add Event
          </Button>
          <Button
            onClick={async () => {
              if (!selectedGame) return;
              try {
                await gamesApi.update(selectedGame._id, {
                  status: 'completed',
                });
                
                await fetchGames();
                setShowScoreDialog(false);
                setSelectedGame(null);
                setHomeTeamPlayers([]);
                setAwayTeamPlayers([]);
                setNewEventData({
                  type: 'goal',
                  player: '',
                  team: '',
                  minute: 0,
                  description: '',
                });
                alert('Game completed successfully!');
              } catch (error) {
                console.error('Error completing game:', error);
                alert('Error completing game. Please try again.');
              }
            }}
            variant="contained"
            color="success"
          >
            Complete Game
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LeagueDetail;
