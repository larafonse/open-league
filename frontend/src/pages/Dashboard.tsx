import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Divider,
  Grid,
  Button,
} from '@mui/material';
import {
  People,
  Person,
  CalendarToday,
  EmojiEvents,
  Mail,
  Check,
  Close,
} from '@mui/icons-material';
import { teamsApi, playersApi, gamesApi, standingsApi, invitationsApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import type { Team, Player, Game, Standing, Invitation } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsData, playersData, gamesData, standingsData, invitationsData] = await Promise.all([
          teamsApi.getAll(),
          playersApi.getAll(),
          gamesApi.getAll(),
          standingsApi.getAll(),
          invitationsApi.getAll().catch(() => []), // Fail silently if not authenticated
        ]);

        setTeams(teamsData);
        setPlayers(playersData);
        setGames(gamesData);
        setStandings(standingsData);
        setInvitations(invitationsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await invitationsApi.accept(invitationId);
      // Refresh data
      const [teamsData, playersData, invitationsData] = await Promise.all([
        teamsApi.getAll(),
        playersApi.getAll(),
        invitationsApi.getAll(),
      ]);
      setTeams(teamsData);
      setPlayers(playersData);
      setInvitations(invitationsData);
      
      // If it's a league invitation, navigate to that league
      const invitation = invitations.find(inv => inv._id === invitationId);
      if (invitation?.type === 'league' && invitation.league) {
        navigate(`/leagues/${invitation.league._id}`);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error accepting invitation');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await invitationsApi.decline(invitationId);
      const invitationsData = await invitationsApi.getAll();
      setInvitations(invitationsData);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error declining invitation');
    }
  };

  const recentGames = games
    .filter(game => game.status === 'completed')
    .sort((a, b) => new Date(b.actualDate || b.scheduledDate).getTime() - new Date(a.actualDate || a.scheduledDate).getTime())
    .slice(0, 5);

  const upcomingGames = games
    .filter(game => game.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 5);

  const topTeams = standings.slice(0, 3);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center">
          <Avatar sx={{ bgcolor: color, mr: 2 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Welcome to your sports league management system
        </Typography>
      </Box>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Mail sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h5" component="h2">
                Pending Invitations
              </Typography>
            </Box>
            <List>
              {invitations.map((invitation, index) => (
                <React.Fragment key={invitation._id}>
                  <ListItem>
                    {invitation.type === 'team' && invitation.team ? (
                      <>
                        <Avatar
                          sx={{
                            bgcolor: invitation.team.colors.primary,
                            color: invitation.team.colors.secondary,
                            mr: 2,
                          }}
                        >
                          {invitation.team.name.charAt(0)}
                        </Avatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight="medium">
                              {invitation.team.name}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                {invitation.team.city} • Team Invitation • Invited by {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {new Date(invitation.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </>
                    ) : invitation.type === 'league' && invitation.league ? (
                      <>
                        <Avatar
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            mr: 2,
                          }}
                        >
                          {invitation.league.name.charAt(0)}
                        </Avatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight="medium">
                              {invitation.league.name}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                League Invitation • Create your team • Invited by {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {new Date(invitation.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </>
                    ) : null}
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<Check />}
                        onClick={() => handleAcceptInvitation(invitation._id)}
                        sx={{ mr: 1 }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<Close />}
                        onClick={() => handleDeclineInvitation(invitation._id)}
                      >
                        Decline
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < invitations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Teams"
            value={teams.length}
            icon={<People />}
            color="primary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Players"
            value={players.length}
            icon={<Person />}
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Games"
            value={games.length}
            icon={<CalendarToday />}
            color="info.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Completed Games"
            value={games.filter(game => game.status === 'completed').length}
            icon={<EmojiEvents />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top Teams */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  League Leaders
                </Typography>
                <Link to="/standings" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    View All
                  </Typography>
                </Link>
              </Box>
              <List>
                {topTeams.map((standing, index) => (
                  <React.Fragment key={standing.team._id}>
                    <ListItem>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        {standing.position}
                      </Avatar>
                      <ListItemText
                        primary={standing.team.name}
                        secondary={standing.team.city}
                      />
                      <ListItemSecondaryAction>
                        <Box textAlign="right">
                          <Typography variant="body2" fontWeight="bold">
                            {standing.points} pts
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {standing.wins}-{standing.losses}-{standing.ties}
                          </Typography>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < topTeams.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Games */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  Recent Results
                </Typography>
                <Link to="/games" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    View All
                  </Typography>
                </Link>
              </Box>
              <List>
                {recentGames.length > 0 ? (
                  recentGames.map((game, index) => (
                    <React.Fragment key={game._id}>
                      <ListItem>
                        <ListItemText
                          primary={`${game.homeTeam.name} vs ${game.awayTeam.name}`}
                          secondary={new Date(game.actualDate || game.scheduledDate).toLocaleDateString()}
                        />
                        <ListItemSecondaryAction>
                          <Box textAlign="right">
                            <Typography variant="body2" fontWeight="bold">
                              {game.score.homeTeam} - {game.score.awayTeam}
                            </Typography>
                            <Chip label={game.status} size="small" color="success" />
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < recentGames.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="No recent games"
                      sx={{ textAlign: 'center' }}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
        {/* Upcoming Games */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  Upcoming Games
                </Typography>
                <Link to="/games" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    View All
                  </Typography>
                </Link>
              </Box>
              <List>
                {upcomingGames.length > 0 ? (
                  upcomingGames.map((game, index) => (
                    <React.Fragment key={game._id}>
                      <ListItem>
                        <ListItemText
                          primary={`${game.homeTeam.name} vs ${game.awayTeam.name}`}
                          secondary={new Date(game.actualDate || game.scheduledDate).toLocaleDateString()}
                        />
                        <ListItemSecondaryAction>
                          <Box textAlign="right">
                            <Typography variant="body2" fontWeight="bold">
                              {game.score.homeTeam} - {game.score.awayTeam}
                            </Typography>
                            <Chip label={game.status} size="small" color="primary" />
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < upcomingGames.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="No upcoming games"
                      sx={{ textAlign: 'center' }}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
