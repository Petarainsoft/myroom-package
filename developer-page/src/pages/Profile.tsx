import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Grid,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts';
import ApiKeyManagement from '../components/ApiKeyManagement';

const Profile: React.FC = () => {
  const { user, loading, error } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const handleEditToggle = () => {
    if (editMode) {
      // Reset form when canceling edit
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setLocalError(null);
      setSuccess(null);
    }
    setEditMode(!editMode);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccess(null);

    // Validation
    if (!formData.name.trim()) {
      setLocalError('Name is required');
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 8) {
      setLocalError('New password must be at least 8 characters long');
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      setUpdating(true);
      
      // This is a placeholder for the actual API call
      // In a real application, you would call an API to update the user profile
      // For example: await AuthService.updateProfile(formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Profile updated successfully');
      setEditMode(false);
    } catch (err: any) {
      setLocalError(err.response?.data?.message || 'Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Alert severity="error">
            You must be logged in to view this page.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Profile
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {localError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {localError}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: 3 }}>
          {editMode ? (
            <Box component="form" onSubmit={handleSubmit}>
              <Typography variant="h6" gutterBottom>
                Edit Profile
              </Typography>
              
              <TextField
                fullWidth
                margin="normal"
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={updating}
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                disabled={true} // Email cannot be changed
              />
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Change Password (Optional)
              </Typography>
              
              <TextField
                fullWidth
                margin="normal"
                label="Current Password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                type="password"
                disabled={updating}
              />
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="New Password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    type="password"
                    disabled={updating}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Confirm New Password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    type="password"
                    disabled={updating}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={updating}
                >
                  {updating ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleEditToggle}
                  disabled={updating}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
                <Button variant="outlined" onClick={handleEditToggle}>
                  Edit Profile
                </Button>
              </Box>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Name
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 9 }}>
                  <Typography variant="body1">
                    {user.name}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 9 }}>
                  <Typography variant="body1">
                    {user.email}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User ID
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 9 }}>
                  <Typography variant="body1">
                    {user.id}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>

        {/* API Key Management Section */}
        <ApiKeyManagement />
      </Box>
    </Container>
  );
};

export default Profile;