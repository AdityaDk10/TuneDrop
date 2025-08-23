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
import axios from 'axios';

const SubmissionHistory = () => {
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

  // Fetch submissions
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await axios.get('/api/submissions/my-submissions', { params });
      setSubmissions(response.data.submissions);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  // Delete submission
  const deleteSubmission = async (submissionId) => {
    if (!window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/submissions/${submissionId}`);
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      if (selectedSubmission?.id === submissionId) {
        setDetailsOpen(false);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete submission');
    }
  };

  // View submission details
  const viewDetails = async (submission) => {
    try {
      const response = await axios.get(`/api/submissions/${submission.id}`);
      setSelectedSubmission(response.data);
      setDetailsOpen(true);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch submission details');
    }
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
          onClick={fetchSubmissions}
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
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {track.downloadURL && (
                                <Tooltip title="Download">
                                  <IconButton 
                                    size="small"
                                    href={track.downloadURL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Download />
                                  </IconButton>
                                </Tooltip>
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