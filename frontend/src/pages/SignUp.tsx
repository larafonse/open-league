import React, { useState, Fragment } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Divider,
} from '@mui/material';
import {
  AdminPanelSettings,
  SportsSoccer,
  Check,
  Close,
  Mail,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { invitationsApi, teamsApi, leaguesApi, seasonsApi } from '../services/api';
import type { Invitation, CreateTeamData } from '../types';

const SignUp: React.FC = () => {
  const [signupType, setSignupType] = useState<'league_admin' | 'coach_player'>('coach_player');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    tier: 1 as 1 | 2 | 3,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);
  const [acceptedLeagueInvitation, setAcceptedLeagueInvitation] = useState<Invitation | null>(null);
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);
  const [teamFormData, setTeamFormData] = useState<CreateTeamData>({
    name: '',
    city: '',
    colors: {
      primary: '#000000',
      secondary: '#FFFFFF',
    },
  });
  const [creatingTeam, setCreatingTeam] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTierChange = (e: any) => {
    setFormData({
      ...formData,
      tier: parseInt(e.target.value) as 1 | 2 | 3,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (signupType === 'league_admin' && !formData.tier) {
      setError('Please select a tier');
      return;
    }

    setLoading(true);

    try {
      const response: any = await signup(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        signupType,
        signupType === 'league_admin' ? formData.tier : undefined
      );
      
      // Check for pending invitations after successful signup
      if (response?.pendingInvitations && response.pendingInvitations.length > 0) {
        setPendingInvitations(response.pendingInvitations);
        setShowInvitationsModal(true);
      } else {
        // No invitations, navigate to dashboard
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await invitationsApi.accept(invitationId);
      const invitation = pendingInvitations.find(inv => inv._id === invitationId);
      
      // Remove accepted invitation from list
      setPendingInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      
      // If it's a league invitation, show team creation form
      if (invitation?.type === 'league' && invitation.league) {
        setAcceptedLeagueInvitation(invitation);
        setShowCreateTeamForm(true);
      } else {
        // For team invitations, if no more invitations, close modal and navigate
        if (pendingInvitations.length === 1) {
          setShowInvitationsModal(false);
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error accepting invitation');
    }
  };

  const handleCreateTeam = async () => {
    if (!teamFormData.name || !teamFormData.city) {
      setError('Team name and city are required');
      return;
    }

    if (!acceptedLeagueInvitation?.league) {
      setError('League information is missing');
      return;
    }

    setCreatingTeam(true);
    setError('');

    try {
      // Create the team (user will be set as coach automatically)
      const newTeam = await teamsApi.create(teamFormData);
      
      // Register the team to the season from the invitation, or find a registration season
      try {
        const leagueId = acceptedLeagueInvitation.league._id;
        let seasonToRegister = null;
        
        // If invitation has a specific season, use that
        if (acceptedLeagueInvitation.season) {
          seasonToRegister = acceptedLeagueInvitation.season;
        } else {
          // Otherwise, find a season that's open for registration
          const seasons = await leaguesApi.getSeasons(leagueId);
          seasonToRegister = seasons.find(s => s.status === 'registration');
        }
        
        if (seasonToRegister) {
          // Register the team to the season
          const seasonId = typeof seasonToRegister === 'string' ? seasonToRegister : seasonToRegister._id;
          await seasonsApi.registerTeam(seasonId, newTeam._id);
        }
      } catch (regError: any) {
        // If registration fails, log but don't block the flow
        console.warn('Could not register team to season:', regError);
        // The team is still created, it just won't appear until manually registered
      }
      
      // Close modal and navigate to the league
      setShowInvitationsModal(false);
      setShowCreateTeamForm(false);
      setAcceptedLeagueInvitation(null);
      navigate(`/leagues/${acceptedLeagueInvitation.league._id}`);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error creating team');
      setCreatingTeam(false);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await invitationsApi.decline(invitationId);
      // Remove declined invitation from list
      setPendingInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      
      // If no more invitations, close modal and navigate
      if (pendingInvitations.length === 1) {
        setShowInvitationsModal(false);
        navigate('/dashboard');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error declining invitation');
    }
  };

  const handleSkipInvitations = () => {
    setShowInvitationsModal(false);
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Card sx={{ width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
              Sign Up
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 4 }}>
              Choose your account type to get started
            </Typography>

            {/* Signup Type Selection */}
            <Box sx={{ mb: 4 }}>
              <Tabs
                value={signupType === 'league_admin' ? 0 : 1}
                onChange={(_, newValue) => {
                  setSignupType(newValue === 0 ? 'league_admin' : 'coach_player');
                  setFormData({ ...formData, tier: 1 });
                }}
                variant="fullWidth"
                sx={{ mb: 3 }}
              >
                <Tab 
                  icon={<AdminPanelSettings />} 
                  iconPosition="start"
                  label="League Admin" 
                  sx={{ textTransform: 'none' }}
                />
                <Tab 
                  icon={<SportsSoccer />} 
                  iconPosition="start"
                  label="Coach/Player" 
                  sx={{ textTransform: 'none' }}
                />
              </Tabs>

              {/* Tier Selection for League Admin */}
              {signupType === 'league_admin' && (
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Select Your Tier
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>Tier</InputLabel>
                    <Select
                      value={formData.tier}
                      label="Tier"
                      onChange={handleTierChange}
                    >
                      <MenuItem value={1}>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">Tier 1</Typography>
                          <Typography variant="caption" color="textSecondary">
                            1 League
                          </Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value={2}>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">Tier 2</Typography>
                          <Typography variant="caption" color="textSecondary">
                            3 Leagues
                          </Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value={3}>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">Tier 3</Typography>
                          <Typography variant="caption" color="textSecondary">
                            3+ Leagues (Unlimited)
                          </Typography>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`Tier ${formData.tier}: ${formData.tier === 1 ? '1 league' : formData.tier === 2 ? '3 leagues' : 'Unlimited leagues'}`}
                      color="primary"
                      size="small"
                    />
                  </Box>
                </Paper>
              )}

              {signupType === 'coach_player' && (
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
                  <Typography variant="body2" color="textSecondary">
                    Sign up as a coach or player to join teams and participate in leagues.
                  </Typography>
                </Paper>
              )}
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    autoComplete="given-name"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    autoComplete="family-name"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    helperText="Must be at least 6 characters"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                </Grid>
              </Grid>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
                startIcon={signupType === 'league_admin' ? <AdminPanelSettings /> : <SportsSoccer />}
              >
                {loading ? <CircularProgress size={24} /> : `Sign Up as ${signupType === 'league_admin' ? 'League Admin' : 'Coach/Player'}`}
              </Button>
            </form>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <Typography component="span" color="primary" sx={{ fontWeight: 'bold' }}>
                    Login
                  </Typography>
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Invitations Modal */}
      <Dialog 
        open={showInvitationsModal} 
        onClose={showCreateTeamForm ? undefined : handleSkipInvitations}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Mail color="primary" />
            <Typography variant="h6">
              {showCreateTeamForm ? 'Create Your Team' : 'Team Invitations'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {showCreateTeamForm && acceptedLeagueInvitation?.league ? (
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Invitation Accepted!
                </Typography>
                <Typography variant="body2">
                  You've been added to <strong>{acceptedLeagueInvitation.league.name}</strong>. 
                  Now create your team to get started.
                </Typography>
              </Alert>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Team Name"
                value={teamFormData.name}
                onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                margin="normal"
                required
                disabled={creatingTeam}
              />
              <TextField
                fullWidth
                label="City"
                value={teamFormData.city}
                onChange={(e) => setTeamFormData({ ...teamFormData, city: e.target.value })}
                margin="normal"
                required
                disabled={creatingTeam}
              />
              <Box display="flex" gap={2} mt={2}>
                <TextField
                  type="color"
                  label="Primary Color"
                  value={teamFormData.colors.primary}
                  onChange={(e) => setTeamFormData({
                    ...teamFormData,
                    colors: { ...teamFormData.colors, primary: e.target.value }
                  })}
                  margin="normal"
                  disabled={creatingTeam}
                />
                <TextField
                  type="color"
                  label="Secondary Color"
                  value={teamFormData.colors.secondary}
                  onChange={(e) => setTeamFormData({
                    ...teamFormData,
                    colors: { ...teamFormData.colors, secondary: e.target.value }
                  })}
                  margin="normal"
                  disabled={creatingTeam}
                />
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                You will be automatically set as the coach/manager of this team.
              </Alert>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                You have {pendingInvitations.length} pending invitation{pendingInvitations.length > 1 ? 's' : ''}. 
                Would you like to accept any of them?
              </Typography>
              <List>
                {pendingInvitations.map((invitation, index) => (
                  <Fragment key={invitation._id}>
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
                    {index < pendingInvitations.length - 1 && <Divider />}
                  </Fragment>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {showCreateTeamForm ? (
            <>
              <Button 
                onClick={() => {
                  setShowCreateTeamForm(false);
                  setAcceptedLeagueInvitation(null);
                  setTeamFormData({
                    name: '',
                    city: '',
                    colors: {
                      primary: '#000000',
                      secondary: '#FFFFFF',
                    },
                  });
                  if (pendingInvitations.length === 0) {
                    setShowInvitationsModal(false);
                    navigate('/dashboard');
                  }
                }} 
                variant="outlined"
                disabled={creatingTeam}
              >
                Skip for Now
              </Button>
              <Button
                onClick={handleCreateTeam}
                variant="contained"
                disabled={creatingTeam || !teamFormData.name || !teamFormData.city}
                startIcon={creatingTeam ? <CircularProgress size={20} /> : <Check />}
              >
                {creatingTeam ? 'Creating...' : 'Create Team'}
              </Button>
            </>
          ) : (
            <Button onClick={handleSkipInvitations} variant="outlined">
              Skip for Now
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SignUp;

