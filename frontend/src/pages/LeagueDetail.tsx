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
import { leaguesApi, seasonsApi, teamsApi, playersApi, gamesApi } from '../services/api';
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

  // Fetch teams and games when selected season changes
  useEffect(() => {
    if (selectedSeason && id) {
      fetchTeams();
      fetchGames();
    }
  }, [selectedSeason, id]);

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
        // Fetch games and teams after seasons are loaded
        await fetchGames();
        await fetchTeams();
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
          <Tab label="Games" />
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
                    onClick={() => {
                      // Find a season in registration status, or use the selected season, or the first available season
                      const registrationSeason = seasons.find(s => s.status === 'registration');
                      const seasonToUse = registrationSeason || selectedSeason || seasons[0];
                      if (seasonToUse) {
                        handleOpenRegisterDialog(seasonToUse);
                      } else {
                        alert('No seasons available for registration. Please create a season first.');
                      }
                    }}
                  >
                    Register
                  </Button>
                )}
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

      {tabValue === 2 && (
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
                                  label={game.status}
                                  size="small"
                                  color={
                                    game.status === 'completed'
                                      ? 'success'
                                      : game.status === 'in_progress'
                                      ? 'warning'
                                      : game.status === 'cancelled' || game.status === 'postponed'
                                      ? 'error'
                                      : 'default'
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                {game.status === 'completed' && game.score
                                  ? `${game.score.homeTeam} - ${game.score.awayTeam}`
                                  : '—'}
                              </TableCell>
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
    </Container>
  );
};

export default LeagueDetail;
