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
import AdminSubmissions from '../submissions/AdminSubmissions';
import UserManagement from './UserManagement';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showSubmissions, setShowSubmissions] = useState(true);
  const [showUserManagement, setShowUserManagement] = useState(false);

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
          <Button 
            color="inherit" 
            startIcon={<MusicNote />}
            onClick={() => {
              setShowSubmissions(true);
              setShowUserManagement(false);
            }}
            sx={{ mr: 2 }}
          >
            Submissions
          </Button>
          <Button 
            color="inherit" 
            startIcon={<People />}
            onClick={() => {
              setShowUserManagement(true);
              setShowSubmissions(false);
            }}
            sx={{ mr: 2 }}
          >
            User Management
          </Button>
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

      {/* Welcome Message */}
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {currentUser?.displayName}!
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Admin Dashboard - Manage your TuneDrop platform
        </Typography>
      </Box>
      
      {/* Admin Submissions Management */}
      {showSubmissions && (
        <AdminSubmissions onBack={() => setShowSubmissions(false)} />
      )}
      
      {/* User Management */}
      {showUserManagement && (
        <UserManagement 
          onBack={() => setShowUserManagement(false)} 
          onBackToSubmissions={() => {
            setShowUserManagement(false);
            setShowSubmissions(true);
          }}
        />
      )}
    </Box>
  );
};

export default AdminDashboard; 