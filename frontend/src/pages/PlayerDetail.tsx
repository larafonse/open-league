import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
} from '@mui/material';

const PlayerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          Player Details
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Player ID: {id}
        </Typography>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="body1" color="textSecondary">
            Player detail page coming soon...
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PlayerDetail;
