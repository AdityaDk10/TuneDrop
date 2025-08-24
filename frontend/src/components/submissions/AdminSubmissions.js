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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Visibility,
  Refresh,
  PlayArrow,
  Download,
  Email,
  MusicNote
} from '@mui/icons-material';
import axios from 'axios';
import { db } from '../../config/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import AudioPlayer from '../common/AudioPlayer';

const AdminSubmissions = ({ onBack }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState(false);

  const statusColors = {
    pending: 'warning',
    'in-review': 'info',
    approved: 'success',
    rejected: 'error'
  };

  const statusLabels = {
    pending: 'Pending',
    'in-review': 'In Review',
    approved: 'Approved',
    rejected: 'Rejected'
  };

  // Firebase real-time listener for submissions
  useEffect(() => {
    console.log('🔄 Setting up Firebase real-time listener for admin submissions');
    
    let q = collection(db, 'submissions');
    
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
      console.log('🔄 Cleaning up Firebase listener');
      unsubscribe();
    };
  }, []);



  const handleStatusUpdate = async (submissionId, status, reviewScore, reviewNotes, adminNotes) => {
    try {
      setUpdating(true);
      console.log('🔄 Updating submission status via Firebase:', submissionId, status);
      
      // Validate rating is required for approval/rejection
      if (['approved', 'rejected'].includes(status) && (!reviewScore || reviewScore === 0)) {
        setError('Rating is required for approval or rejection');
        setUpdating(false);
        return;
      }
      
      const submissionRef = doc(db, 'submissions', submissionId);
      await updateDoc(submissionRef, {
        status,
        reviewScore,
        reviewNotes,
        adminNotes,
        updatedAt: new Date(),
        reviewedBy: 'admin' // Since this is admin-only component
      });

      console.log('✅ Submission status updated successfully');
      setReviewDialog(false);
      setSelectedSubmission(null);
    } catch (error) {
      console.error('❌ Failed to update submission:', error);
      setError('Failed to update submission status');
    } finally {
      setUpdating(false);
    }
  };

  const openReviewDialog = (submission) => {
    setSelectedSubmission(submission);
    setReviewDialog(true);
  };



  // Filter submissions by status
  const filteredSubmissions = statusFilter === 'all' 
    ? submissions 
    : submissions.filter(s => s.status === statusFilter);

  // Debug logging
  console.log('🔍 Admin Debug - Current status filter:', statusFilter);
  console.log('🔍 Admin Debug - Total submissions:', submissions.length);
  console.log('🔍 Admin Debug - All submission statuses:', submissions.map(s => ({ id: s.id, status: s.status, title: s.title, artist: s.artistName })));
  console.log('🔍 Admin Debug - Filtered submissions:', filteredSubmissions.length);
  console.log('🔍 Admin Debug - Filtered submission statuses:', filteredSubmissions.map(s => ({ id: s.id, status: s.status, title: s.title, artist: s.artistName })));

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
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
        alignItems: { xs: 'stretch', sm: 'center' }, 
        justifyContent: 'space-between', 
        gap: { xs: 2, sm: 0 },
        mb: 3 
      }}>
        <Typography variant="h4" sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          Submissions Management
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          width: { xs: '100%', sm: 'auto' }
        }}>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
            <InputLabel>Filter Status</InputLabel>
            <Select
              value={statusFilter}
              label="Filter Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in-review">In Review</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              console.log('🔄 Manual refresh requested');
              setLoading(true);
            }}
            disabled={loading}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Error Alert - Only show if there's an actual error and we're not just showing empty state */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Submissions
              </Typography>
              <Typography variant="h4">
                {submissions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Review
              </Typography>
              <Typography variant="h4" color="warning.main">
                {submissions.filter(s => s.status === 'pending').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approved
              </Typography>
              <Typography variant="h4" color="success.main">
                {submissions.filter(s => s.status === 'approved').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Rejected
              </Typography>
              <Typography variant="h4" color="error.main">
                {submissions.filter(s => s.status === 'rejected').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Submissions Table */}
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: { xs: 650, sm: 'auto' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Artist</TableCell>
              <TableCell>Title</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Status</TableCell>
              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Submitted</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Tracks</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <MusicNote sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No submissions found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {statusFilter === 'all' 
                        ? "No submissions have been made yet." 
                        : `No submissions with status "${statusFilter}".`
                      }
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography variant="body2" fontWeight="bold">
                      {submission.artistName || 'Unknown Artist'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {submission.artistEmail}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {submission.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {submission.description}
                      </Typography>
                      {/* Show status on mobile */}
                      <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 1 }}>
                        <Chip
                          label={statusLabels[submission.status]}
                          color={statusColors[submission.status]}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Chip
                      label={statusLabels[submission.status]}
                      color={statusColors[submission.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    <Typography variant="body2">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(submission.createdAt).toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Typography variant="body2">
                      {submission.tracks?.length || 0} tracks
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Review Submission">
                      <IconButton
                        size="small"
                        onClick={() => openReviewDialog(submission)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialog}
        onClose={() => setReviewDialog(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 2, sm: 'auto' },
            width: { xs: 'calc(100% - 32px)', sm: 'auto' }
          }
        }}
      >
        <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            Review Submission: {selectedSubmission?.title}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          {selectedSubmission && (
            <Box>
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Submission Details
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Artist:</strong> {selectedSubmission.artistName}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Email:</strong> {selectedSubmission.artistEmail}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Title:</strong> {selectedSubmission.title}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Description:</strong> {selectedSubmission.description}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Submitted:</strong> {new Date(selectedSubmission.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Current Status:</strong> {statusLabels[selectedSubmission.status]}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Tracks ({selectedSubmission.tracks?.length || 0})
                  </Typography>
                  {selectedSubmission.tracks?.map((track, index) => {
                    console.log('🎵 AdminSubmissions: Track data:', {
                      index,
                      title: track.title,
                      audioUrl: track.audioUrl,
                      genre: track.genre
                    });
                    return (
                      <Box key={index} sx={{ mb: 2 }}>
                        <AudioPlayer
                          audioUrl={track.audioUrl}
                          title={track.title || `Track ${index + 1}`}
                          genre={track.genre}
                          width={{ xs: 280, sm: 250 }}
                          height={50}
                          onDownload={() => window.open(track.audioUrl, '_blank')}
                        />
                      </Box>
                    );
                  })}
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Review & Decision
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>New Status</InputLabel>
                    <Select
                      value={selectedSubmission.status}
                      label="New Status"
                      onChange={(e) => setSelectedSubmission({
                        ...selectedSubmission,
                        status: e.target.value
                      })}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in-review">In Review</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Rating (1-10) {['approved', 'rejected'].includes(selectedSubmission.status) && '*'}
                    </Typography>
                    <Rating
                      value={selectedSubmission.reviewScore || 0}
                      max={10}
                      onChange={(event, newValue) => setSelectedSubmission({
                        ...selectedSubmission,
                        reviewScore: newValue
                      })}
                      required={['approved', 'rejected'].includes(selectedSubmission.status)}
                    />
                    {['approved', 'rejected'].includes(selectedSubmission.status) && !selectedSubmission.reviewScore && (
                      <Typography variant="caption" color="error">
                        Rating is required for approval/rejection
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Review Notes (sent to artist)"
                    value={selectedSubmission.reviewNotes || ''}
                    onChange={(e) => setSelectedSubmission({
                      ...selectedSubmission,
                      reviewNotes: e.target.value
                    })}
                    placeholder="Provide constructive feedback for the artist..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Admin Notes (internal use only)"
                    value={selectedSubmission.adminNotes || ''}
                    onChange={(e) => setSelectedSubmission({
                      ...selectedSubmission,
                      adminNotes: e.target.value
                    })}
                    placeholder="Internal notes for admin reference..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleStatusUpdate(
              selectedSubmission.id,
              selectedSubmission.status,
              selectedSubmission.reviewScore,
              selectedSubmission.reviewNotes,
              selectedSubmission.adminNotes
            )}
            disabled={updating}
          >
            {updating ? <CircularProgress size={20} /> : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSubmissions;
