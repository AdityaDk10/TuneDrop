import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Switch,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  ArrowBack,
  Search,
  Person,
  AdminPanelSettings,
  MusicNote,
  Block,
  CheckCircle
} from '@mui/icons-material';
import { db } from '../../config/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';

  const UserManagement = ({ onBack, onBackToSubmissions }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const roleLabels = {
    admin: 'Admin',
    artist: 'Artist'
  };

  const roleColors = {
    admin: 'error',
    artist: 'primary'
  };

  const statusLabels = {
    active: 'Active',
    inactive: 'Inactive'
  };

  const statusColors = {
    active: 'success',
    inactive: 'error'
  };

  // Firebase real-time listener for users
  useEffect(() => {
    console.log('🔄 Setting up Firebase real-time listener for users');
    
    let q = collection(db, 'users');
    
    // Apply role filter if not 'all'
    if (roleFilter !== 'all') {
      q = query(q, where('role', '==', roleFilter));
    }
    
    // Apply status filter if not 'all'
    if (statusFilter !== 'all') {
      q = query(q, where('status', '==', statusFilter));
    }
    
    // Order by creation date (newest first)
    q = query(q, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📡 Firebase real-time update received:', snapshot.docs.length, 'users');
      
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || 'active', // Default to 'active' for existing users without status
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
      }));
      
      setUsers(usersData);
      setLoading(false);
      setError(null);
    }, (error) => {
      console.error('❌ Firebase listener error:', error);
      setError('Failed to load users');
      setLoading(false);
    });
    
    // Cleanup listener on unmount or filter change
    return () => {
      console.log('🔄 Cleaning up Firebase listener');
      unsubscribe();
    };
  }, [roleFilter, statusFilter]);

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.stageName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      setUpdating(true);
      console.log('🔄 Toggling user status via Firebase:', userId, currentStatus);
      
      // Default to 'active' if no status is set, then toggle
      const actualCurrentStatus = currentStatus || 'active';
      const newStatus = actualCurrentStatus === 'active' ? 'inactive' : 'active';
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: localStorage.getItem('userId') || 'admin'
      });

      console.log('✅ User status updated successfully');
    } catch (error) {
      console.error('❌ Failed to update user status:', error);
      setError('Failed to update user status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={onBackToSubmissions} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">User Management</Typography>
        </Box>

      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4">
                {users.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h4" color="success.main">
                {users.filter(u => u.status === 'active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Artists
              </Typography>
              <Typography variant="h4" color="primary.main">
                {users.filter(u => u.role === 'artist').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Admins
              </Typography>
              <Typography variant="h4" color="error.main">
                {users.filter(u => u.role === 'admin').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                label="Role"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="artist">Artists</MenuItem>
                <MenuItem value="admin">Admins</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary">
                    No users found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {user.role === 'admin' ? (
                        <AdminPanelSettings sx={{ mr: 1, color: 'error.main' }} />
                      ) : (
                        <MusicNote sx={{ mr: 1, color: 'primary.main' }} />
                      )}
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {user.displayName || user.stageName || 'Unknown User'}
                        </Typography>
                        {user.stageName && user.displayName && (
                          <Typography variant="caption" color="textSecondary">
                            Stage: {user.stageName}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={roleLabels[user.role]}
                      color={roleColors[user.role]}
                      size="small"
                      icon={user.role === 'admin' ? <AdminPanelSettings /> : <MusicNote />}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabels[user.status] || 'Unknown'}
                      color={statusColors[user.status] || 'default'}
                      size="small"
                      icon={user.status === 'active' ? <CheckCircle /> : <Block />}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(user.createdAt).toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </Typography>
                      <Switch
                        checked={user.status === 'active'}
                        onChange={() => handleToggleUserStatus(user.id, user.status)}
                        disabled={updating}
                        color="success"
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UserManagement;
