import React from 'react';
import { Container, Typography, Box, Button, Paper, Grid } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Welcome to MYR Customer Portal
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Access and Manage Your Resources
          </Typography>
          <Typography variant="body1" paragraph>
            MYR provides a powerful platform for accessing and managing various resources. 
            With our customer portal, you can easily create projects, manage API keys, and access 
            the resources you need for your applications.
          </Typography>
          
          {!isAuthenticated ? (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/login"
                size="large"
              >
                Sign In
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                component={Link} 
                to="/register"
                size="large"
              >
                Create Account
              </Button>
            </Box>
          ) : (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/projects"
                size="large"
              >
                Go to My Projects
              </Button>
            </Box>
          )}
        </Paper>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Project Management
              </Typography>
              <Typography variant="body2">
                Create and manage multiple projects. Each project can have its own set of API keys 
                and access to different resources based on your subscription.
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                API Key Management
              </Typography>
              <Typography variant="body2">
                Generate, revoke, and manage API keys for your projects. Use these keys to 
                authenticate your applications when accessing our resources.
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Resource Access
              </Typography>
              <Typography variant="body2">
                Browse and search through available resources. Access detailed information about 
                each resource and how to use it in your applications.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Home;