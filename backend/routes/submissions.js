const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, db, isInitialized } = require('../config/firebase');
const { verifyToken, requireArtist, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for local file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const submissionId = req.params.submissionId;
    const submissionDir = path.join(uploadsDir, submissionId);
    
    // Create submission directory if it doesn't exist
    if (!fs.existsSync(submissionDir)) {
      fs.mkdirSync(submissionDir, { recursive: true });
    }
    
    cb(null, submissionDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['.mp3', '.wav', '.flac', '.m4a'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  }
});

// Create new submission
router.post('/create', verifyToken, requireArtist, async (req, res) => {
  try {
    if (!isInitialized) {
      return res.status(503).json({ 
        error: 'Firebase not configured', 
        message: 'Backend is running but Firebase credentials are missing.' 
      });
    }

    const { title, description } = req.body;
    const artistId = req.user.uid;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: 'Submission title is required' });
    }

    // Get artist data
    const artistDoc = await db.collection('users').doc(artistId).get();
    if (!artistDoc.exists) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    const artistData = artistDoc.data();

    // Create submission document
    const submissionData = {
      title,
      description: description || '',
      artistId,
      artistName: artistData.artistName,
      artistEmail: artistData.email,
      status: 'pending',
      tracks: [],
      totalTracks: 0,
      uploadedTracks: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      reviewScore: null,
      reviewNotes: '',
      adminNotes: ''
    };

    const submissionRef = await db.collection('submissions').add(submissionData);

    res.status(201).json({
      message: 'Submission created successfully',
      submissionId: submissionRef.id,
      submission: {
        id: submissionRef.id,
        ...submissionData
      }
    });

  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

// Upload track to existing submission
router.post('/upload/:submissionId', verifyToken, requireArtist, upload.single('track'), async (req, res) => {
  try {
    if (!isInitialized) {
      return res.status(503).json({ 
        error: 'Firebase not configured' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { submissionId } = req.params;
    const { trackTitle, genre, bpm, trackKey, trackDescription } = req.body;
    const artistId = req.user.uid;

    // Validate required fields
    if (!trackTitle || !genre) {
      return res.status(400).json({ error: 'Track title and genre are required' });
    }

    // Get submission document
    const submissionRef = db.collection('submissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionData = submissionDoc.data();

    // Verify ownership
    if (submissionData.artistId !== artistId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // File is already saved by multer, now process the upload
    const timestamp = Date.now();
    const downloadURL = `${req.protocol}://${req.get('host')}/uploads/${submissionId}/${req.file.filename}`;

    // Create track data
    const trackData = {
      id: `track_${timestamp}`,
      title: trackTitle,
      genre,
      bpm: bpm ? parseInt(bpm) : null,
      key: trackKey || '',
      description: trackDescription || '',
      filename: req.file.originalname,
      storageFilename: req.file.filename,
      filePath: req.file.path,
      downloadURL,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date(),
      duration: null, // Could be extracted later with audio processing
      waveformData: null // Could be generated later
    };

    // Update submission with new track
    const updatedTracks = [...(submissionData.tracks || []), trackData];
    
    await submissionRef.update({
      tracks: updatedTracks,
      totalTracks: updatedTracks.length,
      uploadedTracks: updatedTracks.length,
      updatedAt: new Date()
    });

    res.json({
      message: 'Track uploaded successfully',
      track: trackData,
      submission: {
        id: submissionId,
        totalTracks: updatedTracks.length
      }
    });

  } catch (error) {
    console.error('Upload track error:', error);
    res.status(500).json({ error: 'Failed to upload track' });
  }
});

// Get artist's submissions
router.get('/my-submissions', verifyToken, requireArtist, async (req, res) => {
  try {
    const artistId = req.user.uid;
    const { status, limit = 10, offset = 0 } = req.query;

    let query = db.collection('submissions').where('artistId', '==', artistId);
    
    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));

    const snapshot = await query.get();
    const submissions = [];

    snapshot.forEach(doc => {
      submissions.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
      });
    });

    res.json({
      submissions,
      total: submissions.length,
      hasMore: submissions.length === parseInt(limit)
    });

  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get single submission details
router.get('/:submissionId', verifyToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.uid;

    const submissionDoc = await db.collection('submissions').doc(submissionId).get();

    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionData = submissionDoc.data();

    // Check access permissions
    if (submissionData.artistId !== userId) {
      // Check if user is admin (get user role)
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists || userDoc.data().role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({
      id: submissionDoc.id,
      ...submissionData,
      createdAt: submissionData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: submissionData.updatedAt?.toDate?.()?.toISOString() || null
    });

  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// Delete submission (artist only, if pending)
router.delete('/:submissionId', verifyToken, requireArtist, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const artistId = req.user.uid;

    const submissionRef = db.collection('submissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionData = submissionDoc.data();

    // Verify ownership
    if (submissionData.artistId !== artistId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow deletion of pending submissions
    if (submissionData.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot delete submission that is not pending' });
    }

    // Delete files from local storage
    if (submissionData.tracks && submissionData.tracks.length > 0) {
      for (const track of submissionData.tracks) {
        try {
          if (track.filePath && fs.existsSync(track.filePath)) {
            fs.unlinkSync(track.filePath);
          }
        } catch (error) {
          console.error('Error deleting file:', track.filePath, error);
        }
      }
    }

    // Delete submission directory if empty
    try {
      const submissionDir = path.join(uploadsDir, submissionId);
      if (fs.existsSync(submissionDir)) {
        const files = fs.readdirSync(submissionDir);
        if (files.length === 0) {
          fs.rmdirSync(submissionDir);
        }
      }
    } catch (error) {
      console.error('Error deleting submission directory:', error);
    }

    // Delete submission document
    await submissionRef.delete();

    res.json({ message: 'Submission deleted successfully' });

  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

// Admin endpoints for reviewing submissions
router.get('/admin/all', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    let query = db.collection('submissions');
    
    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));

    const snapshot = await query.get();
    const submissions = [];

    snapshot.forEach(doc => {
      submissions.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
      });
    });

    res.json({
      submissions,
      total: submissions.length,
      hasMore: submissions.length === parseInt(limit)
    });

  } catch (error) {
    console.error('Get all submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Update submission status (admin only)
router.put('/admin/:submissionId/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, reviewScore, reviewNotes, adminNotes } = req.body;

    const validStatuses = ['pending', 'in-review', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {
      status,
      updatedAt: new Date(),
      reviewedBy: req.user.uid
    };

    if (reviewScore !== undefined) {
      if (reviewScore < 1 || reviewScore > 10) {
        return res.status(400).json({ error: 'Review score must be between 1 and 10' });
      }
      updateData.reviewScore = reviewScore;
    }

    if (reviewNotes !== undefined) updateData.reviewNotes = reviewNotes;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    await db.collection('submissions').doc(submissionId).update(updateData);

    res.json({ message: 'Submission updated successfully' });

  } catch (error) {
    console.error('Update submission status error:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

module.exports = router; 