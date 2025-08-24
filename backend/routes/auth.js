const express = require('express');
const { auth, db, isInitialized } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Artist Registration
router.post('/register/artist', async (req, res) => {
  try {
    // Check if Firebase is initialized
    if (!isInitialized) {
      return res.status(503).json({ 
        error: 'Firebase not configured', 
        message: 'Backend is running but Firebase credentials are missing. Check environment configuration.' 
      });
    }

    const { email, password, displayName, phoneNumber, artistName, bio, socialMedia } = req.body;

    // Validate required fields
    if (!email || !password || !displayName || !artistName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate phone number format if provided
    if (phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number format. Please include country code (e.g., +1234567890)' });
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      phoneNumber
    });

    // Create user document in Firestore
    const userData = {
      uid: userRecord.uid,
      email,
      displayName,
      phoneNumber,
      role: 'artist',
      artistName,
      bio: bio || '',
      socialMedia: socialMedia || {},
      createdAt: new Date(),
      lastLogin: new Date()
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    res.status(201).json({
      message: 'Artist registered successfully',
      user: {
        uid: userRecord.uid,
        email,
        displayName,
        role: 'artist'
      }
    });

  } catch (error) {
    console.error('Artist registration error:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Development-only: Create first admin (remove in production)
router.post('/create-first-admin', async (req, res) => {
  try {
    // Check if Firebase is initialized
    if (!isInitialized) {
      return res.status(503).json({ 
        error: 'Firebase not configured', 
        message: 'Backend is running but Firebase credentials are missing. Check environment configuration.' 
      });
    }

    const { email, password, displayName, phoneNumber } = req.body;

    // Validate required fields
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      phoneNumber
    });

    // Create admin user document in Firestore
    const userData = {
      uid: userRecord.uid,
      email,
      displayName,
      phoneNumber,
      role: 'admin',
      permissions: ['review_submissions', 'manage_templates'],
      isActive: true,
      createdAt: new Date(),
      lastLogin: new Date()
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    res.status(201).json({
      message: 'First admin created successfully',
      user: {
        uid: userRecord.uid,
        email,
        displayName,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Create first admin error:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    res.status(500).json({ error: 'Admin creation failed' });
  }
});

// Development-only: Generate test token for existing user
router.post('/dev-login', async (req, res) => {
  try {
    // Check if Firebase is initialized
    if (!isInitialized) {
      return res.status(503).json({ 
        error: 'Firebase not configured', 
        message: 'Backend is running but Firebase credentials are missing. Check environment configuration.' 
      });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    
    // Create a custom token
    const customToken = await auth.createCustomToken(userRecord.uid);
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    const userData = userDoc.data();

    res.json({
      message: 'Development login successful',
      customToken: customToken,
      user: {
        uid: userRecord.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        ...(userData.role === 'artist' && {
          artistName: userData.artistName,
          bio: userData.bio,
          socialMedia: userData.socialMedia
        }),
        ...(userData.role === 'admin' && {
          permissions: userData.permissions,
          isActive: userData.isActive
        })
      }
    });

  } catch (error) {
    console.error('Dev login error:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(500).json({ error: 'Dev login failed' });
  }
});

// Development-only: Direct login with email/password (bypasses Firebase client)
router.post('/dev-auth', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user by email to verify they exist
    const userRecord = await auth.getUserByEmail(email);
    
    // Create a custom token (simulating successful login)
    const customToken = await auth.createCustomToken(userRecord.uid);
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    const userData = userDoc.data();

    // Update last login
    await db.collection('users').doc(userRecord.uid).update({
      lastLogin: new Date()
    });

    res.json({
      message: 'Development authentication successful',
      token: customToken,
      user: {
        uid: userRecord.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        ...(userData.role === 'artist' && {
          artistName: userData.artistName,
          bio: userData.bio,
          socialMedia: userData.socialMedia
        }),
        ...(userData.role === 'admin' && {
          permissions: userData.permissions,
          isActive: userData.isActive
        })
      }
    });

  } catch (error) {
    console.error('Dev auth error:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'Invalid email or password' });
    }
    
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Admin Registration (Protected - only existing admins can create new admins)
router.post('/register/admin', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, displayName, phoneNumber } = req.body;

    // Validate required fields
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      phoneNumber
    });

    // Create user document in Firestore
    const userData = {
      uid: userRecord.uid,
      email,
      displayName,
      phoneNumber,
      role: 'admin',
      permissions: ['review_submissions', 'manage_templates'],
      isActive: true,
      createdAt: new Date(),
      lastLogin: new Date()
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    res.status(201).json({
      message: 'Admin registered successfully',
      user: {
        uid: userRecord.uid,
        email,
        displayName,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Admin registration error:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User Login (Firebase handles authentication, this endpoint provides user data)
router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token required' });
    }

    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // Update last login
    await db.collection('users').doc(decodedToken.uid).update({
      lastLogin: new Date()
    });

    res.json({
      message: 'Login successful',
      user: {
        uid: decodedToken.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        ...(userData.role === 'artist' && {
          artistName: userData.artistName,
          bio: userData.bio,
          socialMedia: userData.socialMedia
        }),
        ...(userData.role === 'admin' && {
          permissions: userData.permissions,
          isActive: userData.isActive
        })
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    res.json({
      user: {
        uid: req.user.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        ...(userData.role === 'artist' && {
          artistName: userData.artistName,
          bio: userData.bio,
          socialMedia: userData.socialMedia
        }),
        ...(userData.role === 'admin' && {
          permissions: userData.permissions,
          isActive: userData.isActive
        })
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { displayName, phoneNumber, bio, socialMedia } = req.body;
    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const updateData = {};

    if (displayName) updateData.displayName = displayName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    
    if (userData.role === 'artist') {
      if (bio !== undefined) updateData.bio = bio;
      if (socialMedia) updateData.socialMedia = socialMedia;
    }

    await db.collection('users').doc(req.user.uid).update(updateData);

    res.json({ message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Logout (client-side handles Firebase logout, this endpoint can be used for server-side cleanup)
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // Update last logout time
    await db.collection('users').doc(req.user.uid).update({
      lastLogout: new Date()
    });

    res.json({ message: 'Logout successful' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router; 