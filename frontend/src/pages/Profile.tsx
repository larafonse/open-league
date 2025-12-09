import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  Avatar,
  Grid,
  Chip,
} from '@mui/material';
import {
  Person,
  Email,
  Badge,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md">
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          Profile
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Your account information
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                bgcolor: 'primary.main',
                fontSize: '3rem',
                mb: 2,
              }}
            >
              {user.firstName?.[0]}{user.lastName?.[0]}
            </Avatar>
            <Typography variant="h4" component="h2" gutterBottom>
              {user.firstName} {user.lastName}
            </Typography>
            <Chip
              label={user.role === 'admin' ? 'Administrator' : 'User'}
              color={user.role === 'admin' ? 'primary' : 'default'}
              sx={{ mb: 2 }}
            />
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ mr: 2, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Full Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {user.firstName} {user.lastName}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Email sx={{ mr: 2, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Email Address
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Badge sx={{ mr: 2, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Role
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {user.role === 'admin' ? 'Administrator' : 'User'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Profile;

