import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CloudUpload,
  MusicNote,
  Delete,
  CheckCircle,
  Error,
  Info,
  Close
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const SubmissionUploader = ({ onSubmissionCreated, onClose }) => {
  const [submissionData, setSubmissionData] = useState({
    title: '',
    description: ''
  });
  const [submissionId, setSubmissionId] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [trackDetailsDialog, setTrackDetailsDialog] = useState(null);
  
  const genres = [
    'Electronic', 'Hip-Hop', 'Rock', 'Pop', 'R&B', 'Jazz', 'Classical', 
    'Folk', 'Country', 'Reggae', 'Blues', 'Alternative', 'Indie', 'Other'
  ];

  const keys = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
    'C minor', 'C# minor', 'D minor', 'D# minor', 'E minor', 'F minor',
    'F# minor', 'G minor', 'G# minor', 'A minor', 'A# minor', 'B minor'
  ];

  // File validation
  const validateFile = (file) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/x-m4a', 'audio/mp4'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload MP3, WAV, FLAC, or M4A files.';
    }

    if (file.size > maxSize) {
      return 'File size too large. Maximum size is 50MB.';
    }

    return null;
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setError(`Some files were rejected: ${rejectedFiles.map(f => f.file.name).join(', ')}`);
      return;
    }

    const newTracks = acceptedFiles.map(file => {
      const validationError = validateFile(file);
      return {
        id: `track_${Date.now()}_${Math.random()}`,
        file,
        filename: file.name,
        size: file.size,
        status: validationError ? 'error' : 'pending',
        error: validationError,
        details: {
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          genre: '',
          bpm: '',
          key: '',
          description: ''
        }
      };
    });

    setTracks(prev => [...prev, ...newTracks]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.m4a']
    },
    multiple: true
  });

  // Create submission
  const createSubmission = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/submissions/create', {
        title: submissionData.title,
        description: submissionData.description
      });

      setSubmissionId(response.data.submissionId);
      return response.data.submissionId;
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create submission');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Upload individual track
  const uploadTrack = async (track, submissionId) => {
    try {
      const formData = new FormData();
      formData.append('track', track.file);
      formData.append('trackTitle', track.details.title);
      formData.append('genre', track.details.genre);
      formData.append('bpm', track.details.bpm);
      formData.append('trackKey', track.details.key);
      formData.append('trackDescription', track.details.description);

      const response = await axios.post(`/api/submissions/upload/${submissionId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({
            ...prev,
            [track.id]: progress
          }));
        }
      });

      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Upload failed';
    }
  };

  // Handle submission
  const handleSubmit = async () => {
    if (!submissionData.title) {
      setError('Submission title is required');
      return;
    }

    if (tracks.length === 0) {
      setError('Please add at least one track');
      return;
    }

    const validTracks = tracks.filter(track => track.status !== 'error');
    if (validTracks.length === 0) {
      setError('Please fix track errors before submitting');
      return;
    }

    // Check if all tracks have required details
    const invalidTracks = validTracks.filter(track => !track.details.title || !track.details.genre);
    if (invalidTracks.length > 0) {
      setError('Please fill in title and genre for all tracks');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create submission
      const submissionId = await createSubmission();

      // Upload all tracks
      const uploadPromises = validTracks.map(async (track) => {
        try {
          setTracks(prev => prev.map(t => 
            t.id === track.id ? { ...t, status: 'uploading' } : t
          ));

          await uploadTrack(track, submissionId);

          setTracks(prev => prev.map(t => 
            t.id === track.id ? { ...t, status: 'completed' } : t
          ));
        } catch (error) {
          setTracks(prev => prev.map(t => 
            t.id === track.id ? { ...t, status: 'error', error } : t
          ));
        }
      });

      await Promise.all(uploadPromises);

      setSuccess(true);
      if (onSubmissionCreated) {
        onSubmissionCreated(submissionId);
      }
    } catch (error) {
      setError(error.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  // Remove track
  const removeTrack = (trackId) => {
    setTracks(prev => prev.filter(track => track.id !== trackId));
  };

  // Update track details
  const updateTrackDetails = (trackId, details) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, details: { ...track.details, ...details } } : track
    ));
  };

  // Open track details dialog
  const openTrackDetails = (track) => {
    setTrackDetailsDialog(track);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'uploading': return 'info';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  if (success) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Submission Successful!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Your tracks have been uploaded and are now under review.
        </Typography>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Submission Details */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Submission Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Submission Title"
              value={submissionData.title}
              onChange={(e) => setSubmissionData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description (Optional)"
              multiline
              rows={3}
              value={submissionData.description}
              onChange={(e) => setSubmissionData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Tell us about this submission..."
            />
          </Grid>
        </Grid>
      </Paper>

      {/* File Upload Area */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upload Tracks
        </Typography>
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <input {...getInputProps()} />
          <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop files here...' : 'Drag & drop audio files here'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Or click to select files
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supports MP3, WAV, FLAC, M4A (Max 50MB each)
          </Typography>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Track List */}
      {tracks.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Tracks ({tracks.length})
          </Typography>
          <List>
            {tracks.map((track, index) => (
              <React.Fragment key={track.id}>
                <ListItem>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <MusicNote sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                        {track.filename}
                      </Typography>
                      <Chip 
                        label={track.status} 
                        color={getStatusColor(track.status)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <IconButton 
                        size="small" 
                        onClick={() => removeTrack(track.id)}
                        disabled={track.status === 'uploading'}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {formatFileSize(track.size)}
                      {track.details.title && ` • ${track.details.title}`}
                      {track.details.genre && ` • ${track.details.genre}`}
                      {track.details.bpm && ` • ${track.details.bpm} BPM`}
                    </Typography>

                    {track.status === 'uploading' && (
                      <LinearProgress 
                        variant="determinate" 
                        value={uploadProgress[track.id] || 0}
                        sx={{ mb: 1 }}
                      />
                    )}

                    {track.error && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {track.error}
                      </Alert>
                    )}

                    <Button
                      size="small"
                      onClick={() => openTrackDetails(track)}
                      disabled={track.status === 'uploading'}
                    >
                      {track.details.title && track.details.genre ? 'Edit Details' : 'Add Details'}
                    </Button>
                  </Box>
                </ListItem>
                {index < tracks.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Submit Button */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={loading || tracks.length === 0}
          sx={{ px: 4, py: 1.5 }}
        >
          {loading ? 'Submitting...' : `Submit ${tracks.length} Track${tracks.length !== 1 ? 's' : ''}`}
        </Button>
      </Box>

      {/* Track Details Dialog */}
      <Dialog 
        open={!!trackDetailsDialog} 
        onClose={() => setTrackDetailsDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Track Details: {trackDetailsDialog?.filename}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Track Title"
                value={trackDetailsDialog?.details.title || ''}
                onChange={(e) => updateTrackDetails(trackDetailsDialog?.id, { title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Genre</InputLabel>
                <Select
                  value={trackDetailsDialog?.details.genre || ''}
                  label="Genre"
                  onChange={(e) => updateTrackDetails(trackDetailsDialog?.id, { genre: e.target.value })}
                >
                  {genres.map(genre => (
                    <MenuItem key={genre} value={genre}>{genre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="BPM (Optional)"
                type="number"
                value={trackDetailsDialog?.details.bpm || ''}
                onChange={(e) => updateTrackDetails(trackDetailsDialog?.id, { bpm: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Key (Optional)</InputLabel>
                <Select
                  value={trackDetailsDialog?.details.key || ''}
                  label="Key (Optional)"
                  onChange={(e) => updateTrackDetails(trackDetailsDialog?.id, { key: e.target.value })}
                >
                  {keys.map(key => (
                    <MenuItem key={key} value={key}>{key}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                multiline
                rows={3}
                value={trackDetailsDialog?.details.description || ''}
                onChange={(e) => updateTrackDetails(trackDetailsDialog?.id, { description: e.target.value })}
                placeholder="Describe this track..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrackDetailsDialog(null)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubmissionUploader; 