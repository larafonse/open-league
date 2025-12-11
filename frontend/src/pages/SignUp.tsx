import React, { useState } from 'react';
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
} from '@mui/material';
import {
  AdminPanelSettings,
  SportsSoccer,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

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
      await signup(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        signupType,
        signupType === 'league_admin' ? formData.tier : undefined
      );
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
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
    </Container>
  );
};

export default SignUp;

