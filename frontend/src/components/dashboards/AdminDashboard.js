import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Chip
} from '@mui/material';
import {
  Dashboard,
  People,
  MusicNote,
  Settings,
  Logout,
  Shield
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)' }}>
        <Toolbar>
          <Shield sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            TuneDrop Admin Dashboard
          </Typography>
          <Chip 
            label={`${currentUser?.displayName} (Admin)`} 
            color="secondary" 
            sx={{ mr: 2 }} 
          />
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Dashboard Content */}
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {currentUser?.displayName}!
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Admin Dashboard - Manage your TuneDrop platform
        </Typography>

        {/* Dashboard Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <People sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6">User Management</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Manage artists and admin users
                </Typography>
                <Button variant="outlined" fullWidth>
                  View Users
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MusicNote sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6">Submissions</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Review and manage music submissions
                </Typography>
                <Button variant="outlined" fullWidth>
                  View Submissions
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Settings sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6">Settings</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Platform configuration and settings
                </Typography>
                <Button variant="outlined" fullWidth>
                  Manage Settings
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* User Info */}
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Your Account Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Email:</Typography>
              <Typography variant="body1">{currentUser?.email}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Role:</Typography>
              <Typography variant="body1">{currentUser?.role}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">User ID:</Typography>
              <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                {currentUser?.uid}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminDashboard; 