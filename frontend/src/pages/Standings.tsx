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
} from '@mui/material';
import {
  EmojiEvents,
  MilitaryTech,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { standingsApi } from '../services/api';
import type { Standing } from '../types';

const Standings: React.FC = () => {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStandings();
  }, []);

  const fetchStandings = async () => {
    try {
      const data = await standingsApi.getAll();
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
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          League Standings
        </Typography>
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
