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
    
    // Apply status filter if not 'all'
    if (statusFilter !== 'all') {
      q = query(q, where('status', '==', statusFilter));
    }
    
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
      setError('Failed to load submissions');
      setLoading(false);
    });
    
    // Cleanup listener on unmount or filter change
    return () => {
      console.log('🧹 Cleaning up Firebase listener for artist submissions');
      unsubscribe();
    };
  }, [currentUser, statusFilter]);

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          My Submissions
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={() => setLoading(true)}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Tracks</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id} hover>
                  <TableCell>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {submission.title}
                    </Typography>
                    {submission.description && (
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {submission.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${submission.uploadedTracks || 0} tracks`}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={statusIcons[submission.status]}
                      label={getStatusText(submission.status)}
                      color={statusColors[submission.status]}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(submission.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
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
                      <List>
                        {selectedSubmission.tracks.map((track, index) => (
                          <ListItem key={track.id} divider={index < selectedSubmission.tracks.length - 1}>
                            <ListItemIcon>
                              <MusicNote />
                            </ListItemIcon>
                            <ListItemText
                              primary={track.title}
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {track.genre}
                                    {track.bpm && ` • ${track.bpm} BPM`}
                                    {track.key && ` • ${track.key}`}
                                  </Typography>
                                  {track.description && (
                                    <Typography variant="body2" color="text.secondary">
                                      {track.description}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                              {track.audioUrl && (
                                <>
                                  {/* Audio Player */}
                                  <audio controls style={{ width: '100%', maxWidth: '300px' }}>
                                    <source src={track.audioUrl} type={track.mimeType || 'audio/mpeg'} />
                                    Your browser does not support the audio element.
                                  </audio>
                                  
                                  {/* Download Link */}
                                  <Tooltip title="Download">
                                    <IconButton 
                                      size="small"
                                      href={track.audioUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download
                                    >
                                      <Download />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          </ListItem>
                        ))}
                      </List>
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