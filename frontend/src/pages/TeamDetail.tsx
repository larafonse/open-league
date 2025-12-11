import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  CircularProgress,
  Avatar,
  Grid,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  People,
  EmojiEvents,
  TrendingUp,
  Edit,
  Delete,
  Person,
} from '@mui/icons-material';
import { teamsApi, playersApi } from '../services/api';
import type { Team, Player } from '../types';
import SoccerPitch from '../components/SoccerPitch';

const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTeam();
    }
  }, [id]);

  const fetchTeam = async () => {
    try {
      const data = await teamsApi.getById(id!);
      setTeam(data);
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await teamsApi.delete(id!);
        navigate('/teams');
      } catch (error) {
        console.error('Error deleting team:', error);
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

  if (!team) {
    return (
      <Container maxWidth="xl">
        <Typography variant="h6" color="error">
          Team not found
        </Typography>
      </Container>
    );
  }

  const players = Array.isArray(team.players) ? team.players : [];
  const captain = team.captain;

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <IconButton component={Link} to="/teams" size="small">
            <ArrowBack />
          </IconButton>
          <Box display="flex" alignItems="center" gap={2} flex={1}>
            <Avatar
              sx={{
                bgcolor: team.colors.primary,
                color: team.colors.secondary,
                width: 64,
                height: 64,
                fontSize: '2rem',
                fontWeight: 'bold',
              }}
            >
              {team.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h3" component="h1">
                {team.name}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body1" color="textSecondary">
                  {team.city}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              component={Link}
              to={`/teams/${id}/edit`}
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
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Team Information */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Team Information
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box mt={2}>
                <Typography variant="body2" color="textSecondary">
                  City
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {team.city}
                </Typography>
              </Box>
              {team.coach && (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Coach/Manager
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {typeof team.coach === 'object' 
                      ? `${team.coach.firstName} ${team.coach.lastName} (${team.coach.email})`
                      : team.coach}
                  </Typography>
                </Box>
              )}
              {team.founded && (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Founded
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {team.founded}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Colors
                </Typography>
                <Box display="flex" gap={1} mt={1}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      bgcolor: team.colors.primary,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  />
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      bgcolor: team.colors.secondary,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Captain Card */}
          {captain && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Captain
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {captain.firstName?.[0]}{captain.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {captain.firstName} {captain.lastName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {captain.position}
                      {captain.jerseyNumber && ` • #${captain.jerseyNumber}`}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Team Statistics */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Box textAlign="center">
                    <EmojiEvents sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold">
                      {team.wins}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Wins
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="error.main">
                      {team.losses}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Losses
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {team.ties}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Ties
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box textAlign="center">
                    <TrendingUp sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold">
                      {(team.winPercentage * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Win %
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="textSecondary">
                    Points For
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {team.pointsFor}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="textSecondary">
                    Points Against
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {team.pointsAgainst}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="textSecondary">
                    Point Differential
                  </Typography>
                  <Typography 
                    variant="body1" 
                    fontWeight="medium"
                    color={team.pointDifferential >= 0 ? 'success.main' : 'error.main'}
                  >
                    {team.pointDifferential >= 0 ? '+' : ''}{team.pointDifferential}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Players Count */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Roster
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box textAlign="center" py={2}>
                <People sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h3" fontWeight="bold">
                  {players.length}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {players.length === 1 ? 'Player' : 'Players'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Soccer Pitch with Starting Lineup */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Starting Lineup
              </Typography>
              <Divider sx={{ my: 2 }} />
              {players.length > 0 ? (
                <SoccerPitch players={players} teamColors={team.colors} />
              ) : (
                <Box textAlign="center" py={4}>
                  <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="textSecondary">
                    No players available for lineup.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Players Table */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Players ({players.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Person />}
                  component={Link}
                  to="/players"
                >
                  Add Player
                </Button>
              </Box>
              {players.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Position</TableCell>
                        <TableCell>Jersey #</TableCell>
                        <TableCell>Age</TableCell>
                        <TableCell>Games</TableCell>
                        <TableCell>Goals</TableCell>
                        <TableCell>Assists</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {players.map((player) => (
                        <TableRow key={player._id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                {player.firstName?.[0]}{player.lastName?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {player.firstName} {player.lastName}
                                </Typography>
                                {player.isCaptain && (
                                  <Chip label="Captain" size="small" color="primary" sx={{ mt: 0.5 }} />
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{player.position}</TableCell>
                          <TableCell>{player.jerseyNumber || '-'}</TableCell>
                          <TableCell>{player.age || '-'}</TableCell>
                          <TableCell>{player.stats?.gamesPlayed || 0}</TableCell>
                          <TableCell>{player.stats?.goals || 0}</TableCell>
                          <TableCell>{player.stats?.assists || 0}</TableCell>
                          <TableCell>
                            <Chip
                              label={player.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={player.isActive ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              component={Link}
                              to={`/players/${player._id}`}
                              size="small"
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box textAlign="center" py={4}>
                  <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="textSecondary">
                    No players on this team yet.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Person />}
                    component={Link}
                    to="/players"
                    sx={{ mt: 2 }}
                  >
                    Add Player
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TeamDetail;
