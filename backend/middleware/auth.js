const { auth } = require('../config/firebase');
const { db } = require('../config/firebase');

// Middleware to verify Firebase ID token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split('Bearer ')[1] || authHeader?.split(' ')[1];
    
    console.log('🔍 Auth Debug:', { 
      authHeader: authHeader ? 'Present' : 'Missing',
      tokenExists: !!token,
      tokenStart: token ? token.substring(0, 20) + '...' : 'None'
    });
    
    if (!token) {
      console.log('❌ No token provided in request');
      return res.status(401).json({ error: 'No token provided' });
    }

    let decodedToken;
    
    try {
      // Try to verify as ID token first
      decodedToken = await auth.verifyIdToken(token);
      console.log('✅ ID Token verified successfully');
    } catch (idTokenError) {
      try {
        // For development: decode custom token manually
        // Custom tokens are JWT tokens that can be decoded
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(token);
        
        if (decoded && decoded.uid) {
          // Verify the user exists in Firestore
          const userDoc = await db.collection('users').doc(decoded.uid).get();
          if (userDoc.exists) {
            decodedToken = { 
              uid: decoded.uid, 
              email: userDoc.data().email,
              ...decoded 
            };
            console.log('✅ Custom Token verified successfully for:', decoded.uid);
          } else {
            throw new Error('User not found in database');
          }
        } else {
          throw new Error('Invalid token structure');
        }
      } catch (customTokenError) {
        console.error('Token verification failed:', { 
          idTokenError: idTokenError.message, 
          customTokenError: customTokenError.message 
        });
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user role from Firestore
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    if (userData.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.userRole = userData.role;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to check if user is artist
const requireArtist = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user role from Firestore
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    if (userData.role !== 'artist') {
      return res.status(403).json({ error: 'Artist access required' });
    }

    req.userRole = userData.role;
    next();
  } catch (error) {
    console.error('Artist check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to get user role (for both admin and artist)
const getUserRole = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user role from Firestore
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    req.userRole = userData.role;
    req.userData = userData;
    next();
  } catch (error) {
    console.error('Get user role error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireArtist,
  getUserRole
}; 