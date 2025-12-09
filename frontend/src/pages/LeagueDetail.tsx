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
} from '@mui/material';
import {
  Groups,
  Person,
  Public,
  Lock,
  Edit,
  Delete,
  Add,
  CalendarToday,
  People,
} from '@mui/icons-material';
import { leaguesApi, seasonsApi } from '../services/api';
import type { League, Season } from '../types';

const LeagueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [league, setLeague] = useState<League | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
  });
  const [newMemberEmail, setNewMemberEmail] = useState('');

  useEffect(() => {
    if (id) {
      fetchLeague();
      fetchSeasons();
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
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
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
                          component={Link}
                          to={`/seasons/${season._id}`}
                          sx={{ cursor: 'pointer' }}
                        >
                          <ListItemAvatar>
                            <Avatar>
                              <CalendarToday />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={season.name}
                            secondary={`Status: ${season.status}`}
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
              <Typography variant="h6">Seasons</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                component={Link}
                to={`/seasons?league=${league._id}`}
              >
                Create Season
              </Button>
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
                      sx={{ textDecoration: 'none', height: '100%' }}
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
                          {season.teams.length} teams
                        </Typography>
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
              <Typography variant="h6">Members</Typography>
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
                  <Avatar>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${league.owner.firstName} ${league.owner.lastName}`}
                  secondary={league.owner.email}
                />
                <Chip label="Owner" color="secondary" size="small" />
              </ListItem>
              <Divider />
              {league.members.map((member) => (
                <React.Fragment key={member._id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        {member.firstName[0]}{member.lastName[0]}
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
                  <Divider />
                </React.Fragment>
              ))}
              {league.members.length === 0 && (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                  No additional members
                </Typography>
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
    </Container>
  );
};

export default LeagueDetail;
