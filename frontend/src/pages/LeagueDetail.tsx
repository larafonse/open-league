import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
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
  Alert,
} from '@mui/material';
import {
  Public,
  Lock,
  Edit,
  Delete,
  Add,
  HowToReg,
  PlayArrow,
  Share,
  CheckCircle,
  RadioButtonUnchecked,
  Mail,
} from '@mui/icons-material';
import { leaguesApi, seasonsApi, teamsApi, playersApi, gamesApi, venuesApi, authApi, invitationsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { League, Season, Team, Player, CreateTeamData, CreatePlayerData, Game, PlayerRegistration } from '../types';

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
  const [showInviteCoachesDialog, setShowInviteCoachesDialog] = useState(false);
  const [inviteCoachEmails, setInviteCoachEmails] = useState<string[]>([]);
  const [inviteCoachEmailInput, setInviteCoachEmailInput] = useState('');
  const [invitingCoaches, setInvitingCoaches] = useState(false);
  const [inviteCoachError, setInviteCoachError] = useState('');
  const [inviteCoachSuccess, setInviteCoachSuccess] = useState(false);
  const [inviteCoachResults, setInviteCoachResults] = useState<{ email: string; success: boolean; message?: string }[]>([]);
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
  const [playerRegistrations, setPlayerRegistrations] = useState<PlayerRegistration[]>([]);
  const [showPlayerRegistrationDialog, setShowPlayerRegistrationDialog] = useState(false);
  const [selectedTeamForRegistration, setSelectedTeamForRegistration] = useState<Team | null>(null);
  const [selectedPlayerForRegistration, setSelectedPlayerForRegistration] = useState<Player | null>(null);
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);
  const [showCreatePlayerForm, setShowCreatePlayerForm] = useState(false);
  const [userPlayer, setUserPlayer] = useState<Player | null>(null);
  const { user } = useAuth();
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
  });
  const [coachSearchQuery, setCoachSearchQuery] = useState('');
  const [coachOptions, setCoachOptions] = useState<Array<{ _id: string; firstName: string; lastName: string; email: string }>>([]);
  const [selectedCoach, setSelectedCoach] = useState<{ _id: string; firstName: string; lastName: string; email: string } | null>(null);
  
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
  const [statistics, setStatistics] = useState<{ topScorers: any[]; standings: any[] } | null>(null);
  const [loadingStatistics, setLoadingStatistics] = useState(false);
  const shareableContentRef = useRef<HTMLDivElement>(null);
  const hatTrickContentRef = useRef<HTMLDivElement>(null);
  const [hatTrickPlayer, setHatTrickPlayer] = useState<any | null>(null);

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
      fetchStatistics();
      fetchPlayerRegistrations();
    } else {
      setStatistics(null);
      setPlayerRegistrations([]);
    }
  }, [selectedSeason, id]);

  const fetchPlayerRegistrations = async () => {
    if (!selectedSeason) return;
    try {
      const registrations = await seasonsApi.getPlayerRegistrations(selectedSeason._id);
      setPlayerRegistrations(registrations);
    } catch (error) {
      console.error('Error fetching player registrations:', error);
      setPlayerRegistrations([]);
    }
  };

  // Fetch statistics for active season when on overview tab
  useEffect(() => {
    if (tabValue === 0 && seasons.length > 0) {
      const activeSeason = seasons.find(s => s.status === 'active') || seasons.find(s => s.status === 'completed') || seasons[0];
      if (activeSeason && (!selectedSeason || selectedSeason._id !== activeSeason._id)) {
        const fetchActiveSeasonStats = async () => {
          setLoadingStatistics(true);
          try {
            const data = await seasonsApi.getStatistics(activeSeason._id);
            setStatistics(data);
          } catch (error) {
            console.error('Error fetching statistics:', error);
            setStatistics(null);
          } finally {
            setLoadingStatistics(false);
          }
        };
        fetchActiveSeasonStats();
      }
    }
  }, [tabValue, seasons]);

  // Fetch statistics for the selected season
  const fetchStatistics = async () => {
    if (!selectedSeason) return;
    
    setLoadingStatistics(true);
    try {
      const data = await seasonsApi.getStatistics(selectedSeason._id);
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStatistics(null);
    } finally {
      setLoadingStatistics(false);
    }
  };

  // Search for users when coach search query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (coachSearchQuery.length >= 2) {
        try {
          const users = await authApi.searchUsers(coachSearchQuery);
          setCoachOptions(users);
        } catch (error) {
          console.error('Error searching users:', error);
          setCoachOptions([]);
        }
      } else {
        setCoachOptions([]);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [coachSearchQuery]);

  // Check for hat-trick when game is selected
  useEffect(() => {
    if (selectedGame && selectedGame.status === 'completed' && selectedGame.events) {
      const goalEvents = selectedGame.events.filter((e: any) => e.type === 'goal' && e.player);
      const playerGoals = new Map<string, { player: any; team: any; count: number }>();

      goalEvents.forEach((event: any) => {
        const playerId = typeof event.player === 'object' && event.player._id 
          ? event.player._id.toString() 
          : String(event.player);
        
        if (!playerGoals.has(playerId)) {
          playerGoals.set(playerId, {
            player: typeof event.player === 'object' ? event.player : null,
            team: typeof event.team === 'object' ? event.team : null,
            count: 0,
          });
        }
        
        const playerData = playerGoals.get(playerId);
        if (playerData) {
          playerData.count++;
        }
      });

      // Find players with hat-trick (3+ goals)
      const hatTrickPlayers = Array.from(playerGoals.values()).filter(p => p.count >= 3);
      setHatTrickPlayer(hatTrickPlayers.length > 0 ? hatTrickPlayers[0] : null);
    } else {
      setHatTrickPlayer(null);
    }
  }, [selectedGame]);

  // Generate and download shareable image for completed game
  const handleShareGame = async () => {
    if (!selectedGame || !shareableContentRef.current) return;

    try {
      const canvas = await html2canvas(shareableContentRef.current, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `game-${selectedGame._id}-${new Date().getTime()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating shareable image:', error);
      alert('Error generating image. Please try again.');
    }
  };

  // Generate and download hat-trick image
  const handleShareHatTrick = async () => {
    if (!selectedGame || !hatTrickContentRef.current || !hatTrickPlayer) return;

    try {
      const canvas = await html2canvas(hatTrickContentRef.current, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const playerName = hatTrickPlayer.player 
        ? `${hatTrickPlayer.player.firstName}-${hatTrickPlayer.player.lastName}`.toLowerCase()
        : 'player';
      link.download = `hattrick-${playerName}-${selectedGame._id}-${new Date().getTime()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating hat-trick image:', error);
      alert('Error generating hat-trick image. Please try again.');
    }
  };

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
          // Refresh statistics when games are updated
          if (tabValue === 3) {
            fetchStatistics();
          }
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
      // Create team with coach
      const teamData = {
        ...newTeamData,
        coach: selectedCoach?._id || undefined
      };
      const newTeam = await teamsApi.create(teamData);
      
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
      setSelectedCoach(null);
      setCoachSearchQuery('');
      setCoachOptions([]);
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
                {league.isOwner && (
              <Chip label="Owner" color="secondary" />
            )}
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
          {league.isOwner && (
            <Button
              variant="outlined"
              startIcon={<Mail />}
              onClick={() => setShowInviteCoachesDialog(true)}
            >
              Invite Coaches
            </Button>
          )}
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
          {selectedSeason && selectedSeason.status === 'registration' && (
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
              {user?.userType === 'league_admin' ? 'Register Team' : 'Register Your Team'}
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
        <>
          {/* Standings and Top Scorers for Overview */}
        {(() => {
          // Get the active season or most recent season for overview stats
          const activeSeason = seasons.find(s => s.status === 'active') || seasons.find(s => s.status === 'completed') || seasons[0];
          
          if (!activeSeason || !statistics) {
            return null;
          }

          const topFourStandings = statistics.standings.slice(0, 4);
          const topThreeScorers = statistics.topScorers.slice(0, 3);

          return (
            <Grid container spacing={3} sx={{ mt: 0 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                      League Standings
                </Typography>
                    {topFourStandings.length > 0 ? (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Rank</TableCell>
                              <TableCell>Club</TableCell>
                              <TableCell align="center">Pts</TableCell>
                              <TableCell align="center">GD</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {topFourStandings.map((standing, index) => {
                              if (!standing.team) return null;
                              return (
                                <TableRow 
                                  key={standing.team._id || index} 
                                  hover
                                  sx={{
                                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                                    borderLeft: '3px solid',
                                    borderLeftColor: 'primary.main',
                                  }}
                                >
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="bold">
                                      {index + 1}
                  </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                      {standing.team.name}
                  </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Typography variant="body2" fontWeight="bold">
                                      {standing.Pts}
                  </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Typography variant="body2" color={standing.GD > 0 ? 'success.main' : standing.GD < 0 ? 'error.main' : 'text.secondary'}>
                                      {standing.GD > 0 ? '+' : ''}{standing.GD}
                  </Typography>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                        No standings available yet.
                  </Typography>
                    )}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                      Top Scorers
                </Typography>
                    {topThreeScorers.length > 0 ? (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Rank</TableCell>
                              <TableCell>Player</TableCell>
                              <TableCell align="center">Goals</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {topThreeScorers.map((scorer, index) => {
                              if (!scorer.player) return null;
                              return (
                                <TableRow 
                                  key={scorer.player._id || index} 
                                  hover
                      sx={{
                                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                                    borderLeft: '3px solid',
                                    borderLeftColor: 'primary.main',
                                  }}
                                >
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="bold">
                                      {index + 1}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                      <Typography variant="body2" fontWeight="medium">
                                        {scorer.player.firstName} {scorer.player.lastName}
                                </Typography>
                                      {scorer.player.jerseyNumber && (
                            <Chip
                                          label={`#${scorer.player.jerseyNumber}`} 
                                    size="small"
                    variant="outlined"
                                        />
                                      )}
                  </Box>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Typography variant="body2" fontWeight="bold" color="primary">
                                      {scorer.goals}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                        No goal data available yet.
                      </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        </Grid>
          );
        })()}
      </>
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
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
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
                        hover
                        sx={{
                          textDecoration: 'none',
                          cursor: 'pointer',
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
                            <Typography variant="body2" fontWeight="medium">
                              {team.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{team.city}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{Array.isArray(team.players) ? team.players.length : 0}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                          {team.captain
                            ? `${team.captain.firstName} ${team.captain.lastName}`
                            : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
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
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Player Registrations Section */}
            {selectedSeason && teams.length > 0 && (
              <Box mt={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Player Registrations & Payment Status
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setShowPlayerRegistrationDialog(true)}
                  >
                    Register Player
                  </Button>
                </Box>
                
                {playerRegistrations.length === 0 ? (
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      No player registrations yet. Register players to track their registration fees.
                    </Typography>
                  </Paper>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Player</TableCell>
                          <TableCell>Team</TableCell>
                          <TableCell>Position</TableCell>
                          <TableCell>Jersey #</TableCell>
                          <TableCell>Payment Status</TableCell>
                          <TableCell>Payment Date</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {playerRegistrations.map((registration) => {
                          const player = typeof registration.player === 'object' ? registration.player : null;
                          const team = typeof registration.team === 'object' ? registration.team : null;
                          if (!player || !team) return null;
                          
                          return (
                            <TableRow key={`${registration.player}_${registration.team}`} hover>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                    {player.firstName?.[0]}{player.lastName?.[0]}
                                  </Avatar>
                                  <Typography variant="body2">
                                    {player.firstName} {player.lastName}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{team.name}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={player.position} size="small" color="primary" />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {player.jerseyNumber ? `#${player.jerseyNumber}` : '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={registration.hasPaid ? 'Paid' : 'Unpaid'}
                                  size="small"
                                  color={registration.hasPaid ? 'success' : 'error'}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="textSecondary">
                                  {registration.paymentDate
                                    ? new Date(registration.paymentDate).toLocaleDateString()
                                    : '-'}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={async () => {
                                    const playerId = typeof registration.player === 'object' 
                                      ? registration.player._id 
                                      : registration.player;
                                    const teamId = typeof registration.team === 'object' 
                                      ? registration.team._id 
                                      : registration.team;
                                    try {
                                      await seasonsApi.updatePlayerRegistration(
                                        selectedSeason._id,
                                        playerId,
                                        teamId,
                                        !registration.hasPaid
                                      );
                                      await fetchPlayerRegistrations();
                                    } catch (error) {
                                      console.error('Error updating payment status:', error);
                                      alert('Error updating payment status');
                                    }
                                  }}
                                  color={registration.hasPaid ? 'default' : 'success'}
                                  title={registration.hasPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
                                >
                                  {registration.hasPaid ? <CheckCircle /> : <RadioButtonUnchecked />}
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
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
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
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
                              hover
                              sx={{
                                textDecoration: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2">
                                {new Date(game.scheduledDate).toLocaleDateString()} {new Date(game.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                {typeof game.homeTeam === 'object' ? game.homeTeam.name : '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                {typeof game.awayTeam === 'object' ? game.awayTeam.name : '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                {game.venue?.name || 'TBD'}
                                </Typography>
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
                                <Typography variant="body2" fontWeight={game.score ? 'bold' : 'normal'}>
                                {game.score && (game.status === 'completed' || game.status === 'in_progress')
                                  ? `${game.score.homeTeam} - ${game.score.awayTeam}`
                                  : '—'}
                                </Typography>
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
                                    {game.status === 'completed' && (
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                        onClick={async (e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          // Fetch full game details with populated events
                                          try {
                                            const gameDetails = await gamesApi.getById(game._id);
                                            setSelectedGame(gameDetails);
                                            setShowScoreDialog(true);
                                          } catch (error) {
                                            console.error('Error fetching game details:', error);
                                            alert('Error loading game details. Please try again.');
                                          }
                                        }}
                                      >
                                        Details
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
            {selectedSeason ? (
              loadingStatistics ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
            </Box>
              ) : statistics ? (
                <>
                  {/* Standings and Top Scorers Side by Side */}
                  <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
                  {/* Standings Section */}
                    <Box flex={1}>
                  <Typography variant="h6" gutterBottom>
                    Standings
                  </Typography>
                      {statistics.standings.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
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
                              {statistics.standings.map((standing, index) => {
                                if (!standing.team) return null;
                                const isTopFour = index < 4;
                        return (
                                  <TableRow 
                                    key={standing.team._id || index} 
                                    hover
                                    sx={{
                                      bgcolor: isTopFour ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                                      borderLeft: isTopFour ? '3px solid' : 'none',
                                      borderLeftColor: isTopFour ? 'primary.main' : 'transparent',
                                      '&:hover': {
                                        bgcolor: isTopFour ? 'rgba(25, 118, 210, 0.12)' : undefined,
                                      },
                                    }}
                                  >
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {index + 1}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                                        {standing.team.name}
                            </Typography>
                                      {standing.team.city && (
                              <Typography variant="caption" color="textSecondary">
                                          {standing.team.city}
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
                                        {standing.last5 && standing.last5.length > 0 ? (
                                          standing.last5.map((result: 'W' | 'D' | 'L', idx: number) => (
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
              )}
                    </Box>

                    {/* Top Scorers Section */}
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom>
                        Top Scorers
                      </Typography>
                      {statistics.topScorers.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined">
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Rank</TableCell>
                                <TableCell>Player</TableCell>
                                <TableCell>Team</TableCell>
                                <TableCell align="center">Goals</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {statistics.topScorers.map((scorer, index) => {
                                if (!scorer.player) return null;
                                const isTopThree = index < 3;
                                return (
                                  <TableRow 
                                    key={scorer.player._id || index} 
                                    hover
                                    sx={{
                                      bgcolor: isTopThree ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                                      borderLeft: isTopThree ? '3px solid' : 'none',
                                      borderLeftColor: isTopThree ? 'primary.main' : 'transparent',
                                      '&:hover': {
                                        bgcolor: isTopThree ? 'rgba(25, 118, 210, 0.12)' : undefined,
                                      },
                                    }}
                                  >
                                    <TableCell>
                                      <Typography variant="body2" fontWeight="bold">
                                        {index + 1}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="body2" fontWeight="medium">
                                          {scorer.player.firstName} {scorer.player.lastName}
                                        </Typography>
                                        {scorer.player.jerseyNumber && (
                                          <Chip 
                                            label={`#${scorer.player.jerseyNumber}`} 
                                            size="small" 
                                            variant="outlined"
                                          />
                                        )}
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      {scorer.team ? (
                                        <Typography variant="body2">
                                          {scorer.team.name}
                                        </Typography>
                                      ) : (
                                        <Typography variant="body2" color="textSecondary">
                                          —
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Typography variant="body2" fontWeight="bold" color="primary">
                                        {scorer.goals}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Box p={3} textAlign="center">
                          <Typography variant="body2" color="textSecondary">
                            No goal data available yet. Goals will appear here once games are completed with events recorded.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </>
              ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="body2" color="textSecondary">
                    No statistics available for this season.
                  </Typography>
                </Box>
              )
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="body2" color="textSecondary">
                  Please select a season to view statistics.
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
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
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
                      <TableRow key={venue._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {venue.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
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
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{venue.capacity || '—'}</Typography>
                        </TableCell>
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
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        {league.isOwner && <TableCell>Actions</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                      {league.owner.firstName[0]}{league.owner.lastName[0]}
                    </Avatar>
                            <Typography variant="body2" fontWeight="medium">
                              {league.owner.firstName} {league.owner.lastName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{league.owner.email}</Typography>
                        </TableCell>
                        <TableCell>
                  <Chip label="Owner" color="secondary" size="small" />
                        </TableCell>
                        {league.isOwner && <TableCell></TableCell>}
                      </TableRow>
                      {league.members && league.members.length > 0 && league.members.map((member) => (
                        <TableRow key={member._id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                            {member.firstName?.[0]}{member.lastName?.[0]}
                      </Avatar>
                              <Typography variant="body2" fontWeight="medium">
                                {member.firstName} {member.lastName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{member.email}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label="Member" size="small" />
                          </TableCell>
                        {league.isOwner && (
                            <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveMember(member._id)}
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
              </Box>

              {/* Players from Teams Section */}
              <Box>
                <Typography variant="h6" gutterBottom>Players from Teams ({players.length})</Typography>
                {players.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                    No players found in teams for this league.
                  </Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
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
                            hover
                            sx={{
                              textDecoration: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Avatar sx={{ width: 32, height: 32 }}>
                                  {player.firstName[0]}{player.lastName[0]}
                                </Avatar>
                                <Typography variant="body2" fontWeight="medium">
                                  {player.firstName} {player.lastName}
                                </Typography>
                                {player.isCaptain && (
                                  <Chip label="C" size="small" color="primary" />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                              {typeof player.team === 'object' && player.team
                                ? `${player.team.name} (${player.team.city})`
                                : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{player.position}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{player.jerseyNumber || '—'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{player.email}</Typography>
                            </TableCell>
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
          {user?.userType === 'coach_player' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              As a coach/player, you can register teams you coach or join teams as a player.
            </Alert>
          )}
          <Box sx={{ mb: 2 }}>
            <Button
              variant={registerMode === 'team' ? 'contained' : 'outlined'}
              onClick={() => setRegisterMode('team')}
              sx={{ mr: 1 }}
            >
              {user?.userType === 'coach_player' ? 'Register Your Team' : 'Register Team'}
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
                  {user?.userType === 'league_admin' ? (
                    <Box mt={2}>
                      <Autocomplete
                        options={coachOptions}
                        getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                        value={selectedCoach}
                        onInputChange={(_, newValue) => {
                          setCoachSearchQuery(newValue);
                        }}
                        onChange={(_, newValue) => {
                          setSelectedCoach(newValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Coach/Manager (Optional)"
                            placeholder={user ? `Default: ${user.firstName} ${user.lastName} (you)` : 'Search users...'}
                            helperText={!selectedCoach && user ? `Will default to ${user.firstName} ${user.lastName} if not specified` : ''}
                            margin="normal"
                          />
                        )}
                        renderOption={(props, option) => (
                          <Box component="li" {...props} key={option._id}>
                            <Box>
                              <Typography variant="body1">{option.firstName} {option.lastName}</Typography>
                              <Typography variant="body2" color="textSecondary">{option.email}</Typography>
                            </Box>
                          </Box>
                        )}
                        noOptionsText={coachSearchQuery.length < 2 ? 'Type at least 2 characters to search' : 'No users found'}
                        loading={false}
                      />
                    </Box>
                  ) : (
                    <Box mt={2}>
                      <Alert severity="info">
                        You will be automatically set as the coach/manager of this team.
                      </Alert>
                    </Box>
                  )}
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

      {/* Invite Coaches Dialog */}
      <Dialog 
        open={showInviteCoachesDialog} 
        onClose={() => {
          setShowInviteCoachesDialog(false);
          setInviteCoachEmails([]);
          setInviteCoachEmailInput('');
          setInviteCoachError('');
          setInviteCoachSuccess(false);
          setInviteCoachResults([]);
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Invite Coaches to {league?.name}</DialogTitle>
        <DialogContent>
          {inviteCoachSuccess && inviteCoachResults.length > 0 && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {inviteCoachResults.filter(r => r.success).length} of {inviteCoachResults.length} invitation{inviteCoachResults.length > 1 ? 's' : ''} sent successfully!
            </Alert>
          )}
          {inviteCoachError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {inviteCoachError}
            </Alert>
          )}
          {inviteCoachResults.some(r => !r.success) && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Some invitations failed:
              </Typography>
              {inviteCoachResults.filter(r => !r.success).map((result, idx) => (
                <Typography key={idx} variant="body2">
                  {result.email}: {result.message}
                </Typography>
              ))}
            </Alert>
          )}
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Enter email addresses and press Enter to add them. Invited coaches can create a team for this league. If they already have an account, they'll see the invitation in their dashboard. If not, they'll see it when they sign up.
          </Typography>
          
          {/* Email Chips */}
          {inviteCoachEmails.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {inviteCoachEmails.map((email) => (
                <Chip
                  key={email}
                  label={email}
                  onDelete={() => setInviteCoachEmails(inviteCoachEmails.filter(e => e !== email))}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
          
          <TextField
            fullWidth
            label="Email Addresses"
            type="email"
            value={inviteCoachEmailInput}
            onChange={(e) => {
              setInviteCoachEmailInput(e.target.value);
              setInviteCoachError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inviteCoachEmailInput.trim()) {
                e.preventDefault();
                const email = inviteCoachEmailInput.trim().toLowerCase();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                  setInviteCoachError('Please enter a valid email address');
                  return;
                }
                if (inviteCoachEmails.includes(email)) {
                  setInviteCoachError('This email has already been added');
                  return;
                }
                setInviteCoachEmails([...inviteCoachEmails, email]);
                setInviteCoachEmailInput('');
                setInviteCoachError('');
              }
            }}
            placeholder="Enter email and press Enter to add"
            margin="normal"
            disabled={invitingCoaches || inviteCoachSuccess}
            helperText="Press Enter to add each email address"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowInviteCoachesDialog(false);
              setInviteCoachEmails([]);
              setInviteCoachEmailInput('');
              setInviteCoachError('');
              setInviteCoachSuccess(false);
              setInviteCoachResults([]);
            }}
            disabled={invitingCoaches}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (inviteCoachEmails.length === 0) {
                setInviteCoachError('Please add at least one email address');
                return;
              }

              setInvitingCoaches(true);
              setInviteCoachError('');
              setInviteCoachSuccess(false);
              setInviteCoachResults([]);

              const results: { email: string; success: boolean; message?: string }[] = [];

              try {
                await Promise.allSettled(
                  inviteCoachEmails.map(async (email) => {
                    try {
                      // Pass the selected season if available
                      await invitationsApi.createLeagueInvitation(id!, email, selectedSeason?._id);
                      results.push({ email, success: true });
                    } catch (error: any) {
                      const errorMessage = error.response?.data?.message || 
                                         error.response?.data?.error || 
                                         error.message || 
                                         'Error sending invitation';
                      console.error(`Error inviting ${email}:`, error);
                      results.push({ 
                        email, 
                        success: false, 
                        message: errorMessage
                      });
                    }
                  })
                );

                setInviteCoachResults(results);
                const successCount = results.filter(r => r.success).length;
                
                if (successCount > 0) {
                  setInviteCoachSuccess(true);
                  setInviteCoachEmails([]);
                  
                  if (successCount === inviteCoachEmails.length) {
                    setTimeout(() => {
                      setShowInviteCoachesDialog(false);
                      setInviteCoachSuccess(false);
                      setInviteCoachResults([]);
                    }, 3000);
                  }
                } else {
                  setInviteCoachError('Failed to send all invitations');
                }
              } catch (error: any) {
                setInviteCoachError('Error sending invitations');
              } finally {
                setInvitingCoaches(false);
              }
            }}
            variant="contained"
            startIcon={<Mail />}
            disabled={invitingCoaches || inviteCoachSuccess || inviteCoachEmails.length === 0}
          >
            {invitingCoaches ? `Sending ${inviteCoachEmails.length} invitation${inviteCoachEmails.length > 1 ? 's' : ''}...` : `Send ${inviteCoachEmails.length} Invitation${inviteCoachEmails.length > 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Register Player Dialog */}
      <Dialog 
        open={showPlayerRegistrationDialog} 
        onClose={() => {
          setShowPlayerRegistrationDialog(false);
          setSelectedTeamForRegistration(null);
          setSelectedPlayerForRegistration(null);
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Register Player for Season</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Select Team</InputLabel>
              <Select
                value={selectedTeamForRegistration?._id || ''}
                label="Select Team"
                onChange={(e) => {
                  const team = teams.find(t => t._id === e.target.value);
                  setSelectedTeamForRegistration(team || null);
                  setSelectedPlayerForRegistration(null);
                }}
              >
                {teams.map((team) => (
                  <MenuItem key={team._id} value={team._id}>
                    {team.name} - {team.city}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {selectedTeamForRegistration && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Select Player</InputLabel>
                <Select
                  value={selectedPlayerForRegistration?._id || ''}
                  label="Select Player"
                  onChange={(e) => {
                    const player = (selectedTeamForRegistration.players || []).find(
                      (p: Player) => p._id === e.target.value
                    );
                    setSelectedPlayerForRegistration(player || null);
                  }}
                >
                  {(selectedTeamForRegistration.players || []).map((player: Player) => {
                    // Check if player is already registered
                    const isRegistered = playerRegistrations.some(
                      reg => {
                        const regPlayerId = typeof reg.player === 'object' ? reg.player._id : reg.player;
                        const regTeamId = typeof reg.team === 'object' ? reg.team._id : reg.team;
                        return regPlayerId === player._id && regTeamId === selectedTeamForRegistration._id;
                      }
                    );
                    return (
                      <MenuItem 
                        key={player._id} 
                        value={player._id}
                        disabled={isRegistered}
                      >
                        {player.firstName} {player.lastName} {isRegistered ? '(Already Registered)' : ''}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowPlayerRegistrationDialog(false);
            setSelectedTeamForRegistration(null);
            setSelectedPlayerForRegistration(null);
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!selectedTeamForRegistration || !selectedPlayerForRegistration || !selectedSeason) return;
              try {
                await seasonsApi.registerPlayer(
                  selectedSeason._id,
                  selectedPlayerForRegistration._id,
                  selectedTeamForRegistration._id
                );
                await fetchPlayerRegistrations();
                setShowPlayerRegistrationDialog(false);
                setSelectedTeamForRegistration(null);
                setSelectedPlayerForRegistration(null);
              } catch (error) {
                console.error('Error registering player:', error);
                alert('Error registering player. Please try again.');
              }
            }}
            disabled={!selectedTeamForRegistration || !selectedPlayerForRegistration}
          >
            Register Player
          </Button>
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
          {selectedGame?.status === 'completed' ? 'Game Details' : 'Manage Game'} {selectedGame && `- ${typeof selectedGame.homeTeam === 'object' ? selectedGame.homeTeam.name : 'Home'} vs ${typeof selectedGame.awayTeam === 'object' ? selectedGame.awayTeam.name : 'Away'}`}
        </DialogTitle>
        <DialogContent>
          {selectedGame && (
            <>
              {/* Hidden shareable content for image generation */}
              {selectedGame.status === 'completed' && (
                <>
                <Box
                  ref={shareableContentRef}
                  sx={{
                    position: 'absolute',
                    left: '-9999px',
                    width: '800px',
                    backgroundColor: '#000000',
                    p: 4,
                    color: '#ffffff',
                  }}
                >
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: '#ffffff' }}>
                      {league?.name || 'League'}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#cccccc' }}>
                      {selectedGame.season && typeof selectedGame.season === 'object' 
                        ? selectedGame.season.name 
                        : 'Season'}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" justifyContent="center" gap={4} mb={3} p={3}>
                    <Box 
                      textAlign="center"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: typeof selectedGame.homeTeam === 'object' && selectedGame.homeTeam.colors
                          ? `${selectedGame.homeTeam.colors.primary}20`
                          : 'rgba(255, 255, 255, 0.1)',
                        border: `2px solid ${typeof selectedGame.homeTeam === 'object' && selectedGame.homeTeam.colors
                          ? `${selectedGame.homeTeam.colors.primary}40`
                          : 'rgba(255, 255, 255, 0.2)'}`,
                      }}
                    >
                      <Typography 
                        variant="h2" 
                        fontWeight="bold" 
                        sx={{ 
                          fontSize: '3rem',
                          color: '#ffffff'
                        }}
                      >
                        {selectedGame.score?.homeTeam || 0}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        fontWeight="medium" 
                        sx={{ 
                          mt: 1,
                          color: '#ffffff'
                        }}
                      >
                        {typeof selectedGame.homeTeam === 'object' ? selectedGame.homeTeam.name : 'Home'}
                      </Typography>
                    </Box>
                    <Typography variant="h3" sx={{ fontSize: '2rem', color: '#ffffff' }}>VS</Typography>
                    <Box 
                      textAlign="center"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: typeof selectedGame.awayTeam === 'object' && selectedGame.awayTeam.colors
                          ? `${selectedGame.awayTeam.colors.primary}20`
                          : 'rgba(255, 255, 255, 0.1)',
                        border: `2px solid ${typeof selectedGame.awayTeam === 'object' && selectedGame.awayTeam.colors
                          ? `${selectedGame.awayTeam.colors.primary}40`
                          : 'rgba(255, 255, 255, 0.2)'}`,
                      }}
                    >
                      <Typography 
                        variant="h2" 
                        fontWeight="bold" 
                        sx={{ 
                          fontSize: '3rem',
                          color: '#ffffff'
                        }}
                      >
                        {selectedGame.score?.awayTeam || 0}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        fontWeight="medium" 
                        sx={{ 
                          mt: 1,
                          color: '#ffffff'
                        }}
                      >
                        {typeof selectedGame.awayTeam === 'object' ? selectedGame.awayTeam.name : 'Away'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ color: '#cccccc' }} align="center">
                      {new Date(selectedGame.actualDate || selectedGame.scheduledDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                    {selectedGame.venue?.name && (
                      <Typography variant="body2" sx={{ color: '#cccccc' }} align="center">
                        {selectedGame.venue.name}
                      </Typography>
                    )}
                  </Box>

                  {selectedGame.events && selectedGame.events.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, textAlign: 'center', color: '#ffffff' }}>
                        Match Events
                      </Typography>
                      {selectedGame.events
                        .filter((e: any) => e.type === 'goal')
                        .sort((a: any, b: any) => (a.minute || 0) - (b.minute || 0))
                        .slice(0, 5)
                        .map((event: any, idx: number) => {
                          const eventTeam = typeof event.team === 'object' ? event.team : null;
                          const teamColor = eventTeam && eventTeam.colors ? eventTeam.colors.primary : null;
                          return (
                            <Box 
                              key={idx} 
                              sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                mb: 1, 
                                p: 1, 
                                bgcolor: teamColor ? `${teamColor}15` : '#1a1a1a',
                                borderRadius: 1,
                                border: teamColor ? `1px solid ${teamColor}30` : 'none',
                              }}
                            >
                              <Typography variant="body1" fontWeight="medium" sx={{ color: '#ffffff' }}>
                                {event.minute}'
                              </Typography>
                              <Typography variant="body1" sx={{ color: '#ffffff' }}>
                                {typeof event.player === 'object' && event.player
                                  ? `${event.player.firstName} ${event.player.lastName}`
                                  : '—'}
                              </Typography>
                              <Typography variant="body1" fontWeight="medium" sx={{ color: '#ffffff' }}>
                                {eventTeam ? eventTeam.name : '—'}
                              </Typography>
                            </Box>
                          );
                        })}
                    </Box>
                  )}
                </Box>

                {/* Hidden hat-trick shareable content */}
                {hatTrickPlayer && hatTrickPlayer.player && (
                  <Box
                    ref={hatTrickContentRef}
                    sx={{
                      position: 'absolute',
                      left: '-9999px',
                      width: '800px',
                      backgroundColor: '#000000',
                      p: 4,
                      color: '#ffffff',
                    }}
                  >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Typography variant="h3" fontWeight="bold" sx={{ mb: 1, color: '#FFD700', fontSize: '2.5rem' }}>
                        HAT-TRICK
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, color: '#ffffff' }}>
                        {league?.name || 'League'}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#cccccc' }}>
                        {selectedGame.season && typeof selectedGame.season === 'object' 
                          ? selectedGame.season.name 
                          : 'Season'}
                      </Typography>
                    </Box>
                    
                    <Box 
                      sx={{
                        textAlign: 'center',
                        p: 4,
                        borderRadius: 3,
                        bgcolor: hatTrickPlayer.team && hatTrickPlayer.team.colors
                          ? `${hatTrickPlayer.team.colors.primary}25`
                          : 'rgba(255, 215, 0, 0.1)',
                        border: `3px solid ${hatTrickPlayer.team && hatTrickPlayer.team.colors
                          ? `${hatTrickPlayer.team.colors.primary}60`
                          : 'rgba(255, 215, 0, 0.3)'}`,
                        mb: 3,
                      }}
                    >
                      <Typography variant="h1" fontWeight="bold" sx={{ fontSize: '5rem', color: '#FFD700', mb: 2 }}>
                        3
                      </Typography>
                      <Typography variant="h3" fontWeight="bold" sx={{ color: '#ffffff', mb: 1 }}>
                        GOALS
                      </Typography>
                      <Typography variant="h4" fontWeight="medium" sx={{ color: '#ffffff', mb: 2 }}>
                        {hatTrickPlayer.player.firstName} {hatTrickPlayer.player.lastName}
                        {hatTrickPlayer.player.jerseyNumber && ` #${hatTrickPlayer.player.jerseyNumber}`}
                      </Typography>
                      {hatTrickPlayer.team && (
                        <Typography variant="h5" sx={{ color: '#cccccc' }}>
                          {hatTrickPlayer.team.name}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: '#ffffff', mb: 2 }}>
                        {typeof selectedGame.homeTeam === 'object' ? selectedGame.homeTeam.name : 'Home'} {selectedGame.score?.homeTeam || 0} - {selectedGame.score?.awayTeam || 0} {typeof selectedGame.awayTeam === 'object' ? selectedGame.awayTeam.name : 'Away'}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#cccccc' }}>
                        {new Date(selectedGame.actualDate || selectedGame.scheduledDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Typography>
                    </Box>
                  </Box>
                )}
                </>
              )}

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

              {selectedGame.status !== 'completed' && (
                <>
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
                </>
              )}
            </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {selectedGame?.status === 'completed' && (
            <>
              <Button
                startIcon={<Share />}
                onClick={handleShareGame}
                variant="outlined"
                color="primary"
              >
                Share Game
              </Button>
              {hatTrickPlayer && (
                <Button
                  startIcon={<Share />}
                  onClick={handleShareHatTrick}
                  variant="contained"
                  sx={{
                    bgcolor: '#FFD700',
                    color: '#000000',
                    '&:hover': {
                      bgcolor: '#FFC700',
                    },
                  }}
                >
                  Share Hat-Trick
                </Button>
              )}
            </>
          )}
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
            {selectedGame?.status === 'completed' ? 'Close' : 'Cancel'}
          </Button>
          {selectedGame?.status !== 'completed' && (
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
          )}
          {selectedGame?.status === 'in_progress' && (
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
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LeagueDetail;
