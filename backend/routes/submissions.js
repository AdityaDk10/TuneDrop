const express = require('express');
const multer = require('multer');
const path = require('path');
const { auth, db, storage, isInitialized } = require('../config/firebase');
const { verifyToken, requireArtist, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Configure multer for memory storage (Firebase Storage)
const upload = multer({
  storage: multer.memoryStorage(),
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

// Helper function to upload file to Firebase Storage
const uploadToFirebaseStorage = async (file, userId, submissionId) => {
  try {
    console.log('🔍 Upload Debug:', {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      userId,
      submissionId
    });

    if (!storage) {
      throw new Error('Firebase Storage not initialized');
    }

    const bucket = storage.bucket();
    if (!bucket) {
      throw new Error('Firebase Storage bucket not available');
    }

    console.log('✅ Bucket initialized:', bucket.name);

    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${safeName}`;
    const filePath = `audio/${userId}/${submissionId}/${fileName}`;
    
    console.log('📁 File path:', filePath);
    
    const fileUpload = bucket.file(filePath);
    
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          uploadedBy: userId,
          submissionId: submissionId,
          uploadedAt: new Date().toISOString()
        }
      }
    });
    
    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('❌ Stream error:', error);
        reject(error);
      });
      
      stream.on('finish', async () => {
        try {
          console.log('✅ File uploaded, making public...');
          // Make the file publicly readable (or use signed URLs for private access)
          await fileUpload.makePublic();
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
          
          console.log('✅ File made public:', publicUrl);
          
          resolve({
            fileName,
            filePath,
            publicUrl,
            bucket: bucket.name
          });
        } catch (error) {
          console.error('❌ Make public error:', error);
          reject(error);
        }
      });
      
      stream.end(file.buffer);
    });
  } catch (error) {
    console.error('❌ Upload function error:', error);
    throw error;
  }
};

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
    console.log('🎵 Upload endpoint called for submission:', req.params.submissionId);
    
    if (!isInitialized) {
      console.error('❌ Firebase not initialized');
      return res.status(503).json({ 
        error: 'Firebase not configured' 
      });
    }

    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📁 File received:', {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    const { submissionId } = req.params;
    const { trackTitle, genre, bpm, trackKey, trackDescription } = req.body;
    const artistId = req.user.uid;

    console.log('📝 Request data:', { trackTitle, genre, bpm, trackKey, submissionId, artistId });

    // Validate required fields
    if (!trackTitle || !genre) {
      console.error('❌ Missing required fields:', { trackTitle, genre });
      return res.status(400).json({ error: 'Track title and genre are required' });
    }

    // Get submission document
    const submissionRef = db.collection('submissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      console.error('❌ Submission not found:', submissionId);
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionData = submissionDoc.data();
    console.log('✅ Submission found:', submissionData.title);

    // Verify ownership
    if (submissionData.artistId !== artistId) {
      console.error('❌ Access denied for submission:', submissionId);
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('🚀 Starting Firebase Storage upload...');
    
    // Upload file to Firebase Storage
    const uploadResult = await uploadToFirebaseStorage(req.file, artistId, submissionId);
    console.log('✅ Upload successful:', uploadResult);
    
    const timestamp = Date.now();

    // Create track data
    const trackData = {
      id: `track_${timestamp}`,
      title: trackTitle,
      genre,
      bpm: bpm ? parseInt(bpm) : null,
      key: trackKey || '',
      description: trackDescription || '',
      filename: req.file.originalname,
      storageFilename: uploadResult.fileName,
      storagePath: uploadResult.filePath,
      audioUrl: uploadResult.publicUrl, // This is the key field for frontend
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date(),
      duration: null, // Could be extracted later with audio processing
      waveformData: null, // Could be generated later
      bucket: uploadResult.bucket
    };

    console.log('💾 Updating submission with track data...');

    // Update submission with new track
    const updatedTracks = [...(submissionData.tracks || []), trackData];
    
    await submissionRef.update({
      tracks: updatedTracks,
      totalTracks: updatedTracks.length,
      uploadedTracks: updatedTracks.length,
      updatedAt: new Date()
    });

    console.log('✅ Track upload completed successfully');

    res.json({
      message: 'Track uploaded successfully',
      track: trackData,
      submission: {
        id: submissionId,
        totalTracks: updatedTracks.length
      }
    });

  } catch (error) {
    console.error('❌ Upload track error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to upload track',
      details: error.message 
    });
  }
});



// Get artist's submissions
router.get('/my-submissions', verifyToken, requireArtist, async (req, res) => {
  try {
    const artistId = req.user.uid;
    const { status, limit = 10, offset = 0 } = req.query;

    // Simplified query to avoid index requirements
    let query = db.collection('submissions').where('artistId', '==', artistId);

    const snapshot = await query.get();
    let submissions = [];

    snapshot.forEach(doc => {
      submissions.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
      });
    });

    // Filter by status in memory if needed
    if (status) {
      submissions = submissions.filter(sub => sub.status === status);
    }

    // Sort by createdAt desc in memory
    submissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply limit
    const limitNum = parseInt(limit);
    const hasMore = submissions.length > limitNum;
    if (limitNum) {
      submissions = submissions.slice(0, limitNum);
    }

    res.json({
      submissions,
      total: submissions.length,
      hasMore
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

    // Delete files from Firebase Storage
    if (submissionData.tracks && submissionData.tracks.length > 0) {
      const bucket = storage.bucket();
      for (const track of submissionData.tracks) {
        try {
          if (track.storagePath) {
            const file = bucket.file(track.storagePath);
            await file.delete();
            console.log(`Deleted Firebase Storage file: ${track.storagePath}`);
          }
        } catch (error) {
          console.error('Error deleting Firebase Storage file:', track.storagePath, error);
        }
      }
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
    console.log('🔄 Status update request:', {
      submissionId: req.params.submissionId,
      status: req.body.status,
      reviewScore: req.body.reviewScore,
      hasReviewNotes: !!req.body.reviewNotes,
      hasAdminNotes: !!req.body.adminNotes
    });

    const { submissionId } = req.params;
    const { status, reviewScore, reviewNotes, adminNotes } = req.body;

    const validStatuses = ['pending', 'in-review', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      console.error('❌ Invalid status:', status);
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

    console.log('📝 Update data:', updateData);

    // Get submission data before update
    const submissionDoc = await db.collection('submissions').doc(submissionId).get();
    if (!submissionDoc.exists) {
      console.error('❌ Submission not found:', submissionId);
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    const submissionData = submissionDoc.data();
    console.log('✅ Submission found:', submissionData.title);
    
    // Update submission
    console.log('💾 Updating submission in database...');
    await db.collection('submissions').doc(submissionId).update(updateData);
    console.log('✅ Submission updated successfully');



    console.log('🎉 Status update completed successfully');
    res.json({ message: 'Submission updated successfully' });

  } catch (error) {
    console.error('❌ Update submission status error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to update submission',
      details: error.message 
    });
  }
});

module.exports = router; 