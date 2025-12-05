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
  Grid } from '@mui/material';
import {
  People,
  Person,
  CalendarToday,
  EmojiEvents,
} from '@mui/icons-material';
import { teamsApi, playersApi, gamesApi, standingsApi } from '../services/api';
import type { Team, Player, Game, Standing } from '../types';

const Dashboard: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsData, playersData, gamesData, standingsData] = await Promise.all([
          teamsApi.getAll(),
          playersApi.getAll(),
          gamesApi.getAll(),
          standingsApi.getAll(),
        ]);

        setTeams(teamsData);
        setPlayers(playersData);
        setGames(gamesData);
        setStandings(standingsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
