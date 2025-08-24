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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Visibility,
  MusicNote,
  Download,
  Delete,
  Refresh,
  FilterList,
  Star,
  Schedule,
  CheckCircle,
  Cancel,
  Info
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import AudioPlayer from '../common/AudioPlayer';

const SubmissionHistory = () => {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const statusColors = {
    pending: 'warning',
    'in-review': 'info',
    approved: 'success',
    rejected: 'error'
  };

  const statusIcons = {
    pending: <Schedule />,
    'in-review': <Info />,
    approved: <CheckCircle />,
    rejected: <Cancel />
  };

  // Firebase real-time listener for submissions
  useEffect(() => {
    if (!currentUser) return;
    
    console.log('🔄 Setting up Firebase real-time listener for artist submissions');
    
    let q = collection(db, 'submissions');
    
    // Filter by current user's submissions
    q = query(q, where('artistId', '==', currentUser.uid));
    
    // Order by creation date (newest first)
    q = query(q, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📡 Firebase real-time update received:', snapshot.docs.length, 'submissions');
      
      const submissionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
      }));
      
      setSubmissions(submissionsData);
      setLoading(false);
      setError(null);
    }, (error) => {
      console.error('❌ Firebase listener error:', error);
      // Only show error for actual connection issues, not for empty results
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        setError('Failed to load submissions');
      } else {
        // For other errors (like no submissions), just set empty array
        setSubmissions([]);
        setError(null);
      }
      setLoading(false);
    });
    
    // Cleanup listener on unmount or filter change
    return () => {
      console.log('🧹 Cleaning up Firebase listener for artist submissions');
      unsubscribe();
    };
  }, [currentUser]);

  // Delete submission
  const deleteSubmission = async (submissionId) => {
    if (!window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'submissions', submissionId));
      
      // Close details dialog if the deleted submission was selected
      if (selectedSubmission?.id === submissionId) {
        setDetailsOpen(false);
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      setError('Failed to delete submission');
    }
  };

  // View submission details
  const viewDetails = (submission) => {
    setSelectedSubmission(submission);
    setDetailsOpen(true);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status text
  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  // Filter submissions by status
  const filteredSubmissions = statusFilter === 'all' 
    ? submissions 
    : submissions.filter(s => s.status === statusFilter);

  // Debug logging
  console.log('🔍 Debug - Current status filter:', statusFilter);
  console.log('🔍 Debug - Total submissions:', submissions.length);
  console.log('🔍 Debug - All submission statuses:', submissions.map(s => ({ id: s.id, status: s.status, title: s.title })));
  console.log('🔍 Debug - Filtered submissions:', filteredSubmissions.length);
  console.log('🔍 Debug - Filtered submission statuses:', filteredSubmissions.map(s => ({ id: s.id, status: s.status, title: s.title })));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        gap: { xs: 2, sm: 0 },
        mb: 3 
      }}>
        <Typography variant="h5" sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          My Submissions
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={() => setLoading(true)}
          disabled={loading}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Refresh
        </Button>
      </Box>

      {/* Error Alert - Only show if there's an actual error and we're not just showing empty state */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Status Filter Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={statusFilter}
          onChange={(e, newValue) => setStatusFilter(newValue)}
          variant="fullWidth"
        >
          <Tab label="All" value="all" />
          <Tab label="Pending" value="pending" />
          <Tab label="In Review" value="in-review" />
          <Tab label="Approved" value="approved" />
          <Tab label="Rejected" value="rejected" />
        </Tabs>
      </Paper>

      {/* Submissions Table */}
      {filteredSubmissions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <MusicNote sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No submissions found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {statusFilter === 'all' 
              ? "You haven't submitted any tracks yet." 
              : `No submissions with status "${getStatusText(statusFilter)}".`
            }
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: { xs: 600, sm: 'auto' } }}>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Tracks</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Status</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Submitted</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Score</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {submission.title}
                      </Typography>
                      {submission.description && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {submission.description}
                        </Typography>
                      )}
                      {/* Show status and tracks on mobile */}
                      <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        <Chip
                          icon={statusIcons[submission.status]}
                          label={getStatusText(submission.status)}
                          color={statusColors[submission.status]}
                          variant="outlined"
                          size="small"
                        />
                        <Chip 
                          label={`${submission.uploadedTracks || 0} tracks`}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Chip 
                      label={`${submission.uploadedTracks || 0} tracks`}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Chip
                      icon={statusIcons[submission.status]}
                      label={getStatusText(submission.status)}
                      color={statusColors[submission.status]}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    <Typography variant="body2">
                      {formatDate(submission.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    {submission.reviewScore ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Star sx={{ color: 'warning.main', mr: 0.5, fontSize: 20 }} />
                        <Typography variant="body2" fontWeight="medium">
                          {submission.reviewScore}/10
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not rated
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => viewDetails(submission)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {submission.status === 'pending' && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => deleteSubmission(submission.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Submission Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedSubmission?.title}
            </Typography>
            <Chip
              icon={statusIcons[selectedSubmission?.status]}
              label={getStatusText(selectedSubmission?.status || '')}
              color={statusColors[selectedSubmission?.status]}
            />
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedSubmission && (
            <Grid container spacing={3}>
              {/* Submission Info */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Submission Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Submitted
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(selectedSubmission.createdAt)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Last Updated
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(selectedSubmission.updatedAt)}
                        </Typography>
                      </Grid>
                      {selectedSubmission.description && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Description
                          </Typography>
                          <Typography variant="body1">
                            {selectedSubmission.description}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Review Info */}
              {(selectedSubmission.reviewScore || selectedSubmission.reviewNotes) && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Review
                      </Typography>
                      {selectedSubmission.reviewScore && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Star sx={{ color: 'warning.main', mr: 1 }} />
                          <Typography variant="h6">
                            {selectedSubmission.reviewScore}/10
                          </Typography>
                        </Box>
                      )}
                      {selectedSubmission.reviewNotes && (
                        <Typography variant="body1">
                          {selectedSubmission.reviewNotes}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Tracks */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Tracks ({selectedSubmission.tracks?.length || 0})
                    </Typography>
                    {selectedSubmission.tracks?.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {selectedSubmission.tracks.map((track, index) => {
                          console.log('🎵 SubmissionHistory: Track data:', {
                            index,
                            id: track.id,
                            title: track.title,
                            audioUrl: track.audioUrl,
                            genre: track.genre
                          });
                          return (
                            <Box key={track.id}>
                              <AudioPlayer
                                audioUrl={track.audioUrl}
                                title={track.title}
                                genre={`${track.genre}${track.bpm ? ` • ${track.bpm} BPM` : ''}${track.key ? ` • ${track.key}` : ''}`}
                                width={300}
                                height={60}
                                onDownload={() => {
                                  const link = document.createElement('a');
                                  link.href = track.audioUrl;
                                  link.download = track.title || `track-${index + 1}`;
                                  link.click();
                                }}
                              />
                              {track.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 2 }}>
                                  {track.description}
                                </Typography>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No tracks uploaded
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubmissionHistory; 