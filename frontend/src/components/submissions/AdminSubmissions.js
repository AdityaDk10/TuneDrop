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
  Email
} from '@mui/icons-material';
import axios from 'axios';
import { db } from '../../config/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

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
      console.log('🔄 Cleaning up Firebase listener');
      unsubscribe();
    };
  }, [statusFilter]);



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
        reviewedBy: localStorage.getItem('userId') || 'admin'
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
        <Typography variant="h4">Submissions Management</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
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
          >
            Refresh
          </Button>
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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Artist</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Tracks</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary">
                    No submissions found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {submission.artistName || 'Unknown Artist'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {submission.artistEmail}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {submission.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {submission.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabels[submission.status]}
                      color={statusColors[submission.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(submission.createdAt).toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
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
      >
        <DialogTitle>
          Review Submission: {selectedSubmission?.title}
        </DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
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
                  <Typography variant="h6" gutterBottom>
                    Tracks ({selectedSubmission.tracks?.length || 0})
                  </Typography>
                  {selectedSubmission.tracks?.map((track, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {track.title || `Track ${index + 1}`}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {track.genre} • {track.duration}
                      </Typography>
                      <Box display="flex" gap={1} mt={1}>
                        <IconButton size="small" onClick={() => window.open(track.audioUrl, '_blank')}>
                          <PlayArrow />
                        </IconButton>
                        <IconButton size="small" onClick={() => window.open(track.audioUrl, '_blank')}>
                          <Download />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
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
