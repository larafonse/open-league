import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
} from '@mui/material';

const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          Team Details
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Team ID: {id}
        </Typography>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="body1" color="textSecondary">
            Team detail page coming soon...
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default TeamDetail;
