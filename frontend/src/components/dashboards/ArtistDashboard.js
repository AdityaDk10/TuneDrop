import React, { useState } from 'react';
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import {
  MusicNote,
  CloudUpload,
  History,
  Person,
  Logout,
  Add,
  Close
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SubmissionUploader from '../submissions/SubmissionUploader';
import SubmissionHistory from '../submissions/SubmissionHistory';

const ArtistDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSubmissionCreated = (submissionId) => {
    setUploadDialogOpen(false);
    setActiveTab(1); // Switch to submission history tab
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)' }}>
        <Toolbar>
          <MusicNote sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            TuneDrop Artist Portal
          </Typography>
          <Chip 
            label={`${currentUser?.displayName} (Artist)`} 
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Welcome, {currentUser?.displayName}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Artist Portal - Submit and manage your music
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setUploadDialogOpen(true)}
            size="large"
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
              }
            }}
          >
            Submit New Tracks
          </Button>
        </Box>

        {/* Quick Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CloudUpload sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">Quick Submit</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Upload new tracks
                </Typography>
                <Button 
                  variant="outlined" 
                  fullWidth
                  onClick={() => setUploadDialogOpen(true)}
                >
                  Upload Now
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <History sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h6">View History</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Track your submissions
                </Typography>
                <Button 
                  variant="outlined" 
                  fullWidth
                  onClick={() => setActiveTab(1)}
                >
                  View All
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Person sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                <Typography variant="h6">Profile</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Update your info
                </Typography>
                <Button 
                  variant="outlined" 
                  fullWidth
                  onClick={() => setActiveTab(2)}
                >
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <MusicNote sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h6">Artist: {currentUser?.artistName || 'Not Set'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Your stage name
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Tabs */}
        <Paper sx={{ mt: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
            <Tab label="Overview" />
            <Tab label="Submission History" />
            <Tab label="Profile" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* Overview Tab */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Getting Started
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Welcome to TuneDrop! Here's how to submit your music:
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" color="primary">1. Prepare Your Tracks</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ensure your audio files are in MP3, WAV, FLAC, or M4A format (max 50MB each)
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" color="primary">2. Add Track Details</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Fill in track information including title, genre, BPM, key, and description
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" color="primary">3. Submit & Track</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Upload your tracks and monitor the review status in your submission history
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Submission History Tab */}
            {activeTab === 1 && <SubmissionHistory />}

            {/* Profile Tab */}
            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Your Artist Profile
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Artist Name:</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>{currentUser?.artistName || 'Not set'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Email:</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>{currentUser?.email}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Bio:</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {currentUser?.bio || 'No bio available'}
                    </Typography>
                  </Grid>
                  {currentUser?.socialMedia && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Social Media:</Typography>
                      <Box sx={{ mt: 1 }}>
                        {Object.entries(currentUser.socialMedia).map(([platform, url]) => (
                          url && (
                            <Chip 
                              key={platform} 
                              label={platform} 
                              size="small" 
                              sx={{ mr: 1, mb: 1 }} 
                            />
                          )
                        ))}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Submit New Tracks</Typography>
            <IconButton onClick={() => setUploadDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <SubmissionUploader 
              onSubmissionCreated={handleSubmissionCreated}
              onClose={() => setUploadDialogOpen(false)}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ArtistDashboard; 