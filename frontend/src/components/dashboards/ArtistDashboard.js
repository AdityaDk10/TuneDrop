import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper
} from '@mui/material';
import {
  MusicNote,
  Logout,
  Add,
  Close,
  Edit
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SubmissionUploader from '../submissions/SubmissionUploader';
import SubmissionHistory from '../submissions/SubmissionHistory';
import EditProfileDialog from './EditProfileDialog';

const ArtistDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

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
           <Button
             color="inherit"
             startIcon={<Edit />}
             onClick={() => setEditProfileOpen(true)}
             sx={{ mr: 2 }}
           >
             Edit Profile
           </Button>
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

         {/* Recent Submissions Section */}
         <Paper sx={{ mb: 4 }}>
           <Box sx={{ p: 3 }}>
             <Typography variant="h5" gutterBottom>
               Recent Submissions
             </Typography>
             <SubmissionHistory />
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

       {/* Edit Profile Dialog */}
       <EditProfileDialog
         open={editProfileOpen}
         onClose={() => setEditProfileOpen(false)}
         onProfileUpdated={() => {
           // Refresh the page or update user data if needed
           window.location.reload();
         }}
       />
     </Box>
   );
 };

export default ArtistDashboard; 