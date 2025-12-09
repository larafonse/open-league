import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  EmojiEvents,
  MilitaryTech,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { standingsApi, leaguesApi } from '../services/api';
import type { Standing, League } from '../types';

const Standings: React.FC = () => {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeagues();
  }, []);

  useEffect(() => {
    fetchStandings();
  }, [selectedLeague]);

  const fetchLeagues = async () => {
    try {
      const data = await leaguesApi.getMyLeagues();
      setLeagues(data);
      if (data.length > 0) {
        setSelectedLeague(data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  };

  const fetchStandings = async () => {
    try {
      setLoading(true);
      const data = await standingsApi.getAll({ 
        league: selectedLeague || undefined 
      });
      setStandings(data);
    } catch (error) {
      console.error('Error fetching standings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return <EmojiEvents sx={{ color: 'gold', fontSize: 20 }} />;
    if (position === 2) return <MilitaryTech sx={{ color: 'silver', fontSize: 20 }} />;
    if (position === 3) return <MilitaryTech sx={{ color: '#CD7F32', fontSize: 20 }} />;
    return (
      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: 12 }}>
        {position}
      </Avatar>
    );
  };

  const getTrendIcon = (pointDifferential: number) => {
    if (pointDifferential > 0) return <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />;
    if (pointDifferential < 0) return <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />;
    return <Box sx={{ width: 16, height: 16, color: 'text.secondary' }}>—</Box>;
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
        <Typography variant="h3" component="h1" gutterBottom>
          League Standings
        </Typography>
        {leagues.length > 0 && (
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select League</InputLabel>
            <Select
              value={selectedLeague}
              label="Select League"
              onChange={(e) => setSelectedLeague(e.target.value)}
            >
              <MenuItem value="">All My Leagues</MenuItem>
              {leagues.map((league) => (
                <MenuItem key={league._id} value={league._id}>
                  {league.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {standings.length > 0 ? (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Position</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell align="center">GP</TableCell>
                  <TableCell align="center">W</TableCell>
                  <TableCell align="center">L</TableCell>
                  <TableCell align="center">T</TableCell>
                  <TableCell align="center">Pts</TableCell>
                  <TableCell align="center">Win%</TableCell>
                  <TableCell align="center">PF</TableCell>
                  <TableCell align="center">PA</TableCell>
                  <TableCell align="center">Diff</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {standings.map((standing) => (
                  <TableRow key={standing.team._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getPositionIcon(standing.position)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {standing.team.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {standing.team.city}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {standing.gamesPlayed}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {standing.wins}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {standing.losses}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {standing.ties}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="bold">
                        {standing.points}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {(standing.winPercentage * 100).toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {standing.pointsFor}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {standing.pointsAgainst}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center">
                        {getTrendIcon(standing.pointDifferential)}
                        <Typography variant="body2" sx={{ ml: 0.5 }}>
                          {standing.pointDifferential > 0 ? '+' : ''}{standing.pointDifferential}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <EmojiEvents sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No standings available
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Standings will appear once games are played.
          </Typography>
        </Paper>
      )}

      {/* Legend */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Legend
          </Typography>
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
            <Box>
              <Typography variant="body2">
                <strong>GP:</strong> Games Played
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2">
                <strong>W:</strong> Wins
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2">
                <strong>L:</strong> Losses
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2">
                <strong>T:</strong> Ties
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2">
                <strong>Pts:</strong> Points (3 for win, 1 for tie)
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2">
                <strong>Win%:</strong> Win Percentage
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2">
                <strong>PF:</strong> Points For
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2">
                <strong>PA:</strong> Points Against
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Standings;
