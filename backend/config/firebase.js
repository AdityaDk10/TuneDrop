const admin = require('firebase-admin');
require('dotenv').config();

// Check if Firebase credentials are provided
const hasFirebaseConfig = process.env.FIREBASE_PROJECT_ID && 
                          process.env.FIREBASE_PRIVATE_KEY && 
                          process.env.FIREBASE_CLIENT_EMAIL;

let firebaseInitialized = false;

if (hasFirebaseConfig) {
  try {
    // Initialize Firebase Admin SDK
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    // Initialize the app
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'tunedrop-c775f.firebasestorage.app'
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    console.log('💡 Continuing without Firebase - some features may not work');
  }
} else {
  console.log('⚠️  Firebase credentials not found in environment variables');
  console.log('💡 Create a .env file with proper Firebase configuration for full functionality');
}

// Export Firebase services with null checks
const db = firebaseInitialized ? admin.firestore() : null;
const auth = firebaseInitialized ? admin.auth() : null;
const storage = firebaseInitialized ? admin.storage() : null;

module.exports = {
  admin: firebaseInitialized ? admin : null,
  db,
  auth,
  storage,
  isInitialized: firebaseInitialized
}; 