# TuneDrop - Music Demo Submission Platform

A modern, full-featured web application for music demo submissions, built with React, Node.js, and Firebase.

## 🎵 Project Overview

TuneDrop is a platform that allows artists to submit their music demos to a label, with an efficient admin dashboard for the A&R team to review submissions. The application features real-time updates, secure authentication, and a beautiful, responsive interface.

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Material UI** - Beautiful, responsive UI components
- **React Router** - Client-side routing
- **Firebase Auth** - User authentication

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **Firebase Admin SDK** - Backend Firebase integration
- **Firestore** - NoSQL database
- **Firebase Storage** - File storage
- **SendGrid** - Email service

## 🛠️ Setup and Installation Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project

### 1. Clone the Repository
```bash
git clone <repository-url>
cd TuneDrop
```

### 2. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
   - Hosting

#### Get Service Account Key
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Save it securely (don't commit to git)

### 3. Backend Setup

```bash
cd backend
npm install
```

#### Environment Variables
Create a `.env` file in the `backend` directory:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Email Configuration - SendGrid (Recommended for Production)
SENDGRID_API_KEY=your_sendgrid_api_key_here
EMAIL_FROM=submissions@tunedrop.com
TEST_EMAIL=your-email@example.com

# Email Configuration - Gmail SMTP (Fallback)
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
```

#### Start Backend Server
```bash
npm run dev
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

#### Environment Variables
Create a `.env` file in the `frontend` directory:

```env
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

#### Start Frontend Development Server
```bash
npm start
```

The frontend will run on `http://localhost:3000`

### 5. Create Admin User

Since admin registration is protected, you'll need to create the first admin user manually:

1. Register as an artist first
2. Go to your Firebase Console
3. Navigate to Firestore Database
4. Find your user document in the `users` collection
5. Change the `role` field from `"artist"` to `"admin"`

## 📊 Database Schema

### Collections

#### `users`
Stores user account information and profiles.

```javascript
{
  uid: "string",                    // Firebase Auth UID
  email: "string",                  // User email
  displayName: "string",            // Display name
  phoneNumber: "string",            // Phone number with country code
  role: "artist" | "admin",         // User role
  createdAt: "timestamp",           // Account creation date
  lastLogin: "timestamp",           // Last login date
  
  // Artist-specific fields
  artistName: "string",             // Artist/stage name
  bio: "string",                    // Artist biography
  socialMedia: {                    // Social media links
    instagram: "string",
    twitter: "string",
    youtube: "string"
  },
  
  // Admin-specific fields
  permissions: ["array"],           // Admin permissions
  isActive: "boolean"               // Admin account status
}
```

#### `submissions`
Stores music demo submissions from artists.

```javascript
{
  id: "string",                     // Submission ID
  title: "string",                  // Submission title
  description: "string",            // Submission description
  artistId: "string",               // Artist's UID
  artistName: "string",             // Artist name
  artistEmail: "string",            // Artist email
  status: "pending" | "in-review" | "approved" | "rejected",
  tracks: [                         // Array of tracks
    {
      id: "string",                 // Track ID
      title: "string",              // Track title
      genre: "string",              // Music genre
      bpm: "number",                // Beats per minute
      key: "string",                // Musical key
      description: "string",        // Track description
      filename: "string",           // Original filename
      storageFilename: "string",    // Firebase Storage filename
      storagePath: "string",        // Firebase Storage path
      audioUrl: "string",           // Public audio URL
      fileSize: "number",           // File size in bytes
      mimeType: "string",           // File MIME type
      uploadedAt: "timestamp",      // Upload timestamp
      duration: "number",           // Track duration (seconds)
      waveformData: "object",       // Audio waveform data
      bucket: "string"              // Storage bucket name
    }
  ],
  totalTracks: "number",            // Total number of tracks
  uploadedTracks: "number",         // Number of uploaded tracks
  createdAt: "timestamp",           // Submission creation date
  updatedAt: "timestamp",           // Last update date
  reviewedBy: "string",             // Admin UID who reviewed
  reviewScore: "number",            // Review score (1-10)
  reviewNotes: "string",            // Public review notes
  adminNotes: "string",             // Private admin notes
  
  // Email tracking
  confirmationEmailSent: "boolean", // Confirmation email status
  confirmationEmailSentAt: "timestamp",
  confirmationEmailMessageId: "string",
  emailMethod: "sendgrid" | "smtp"  // Email service used
}
```

#### `emails` (Local Storage)
Stores email history for admin dashboard (development/testing).

```javascript
{
  id: "string",                     // Email ID
  from: "string",                   // Sender email
  to: "string",                     // Recipient email
  subject: "string",                // Email subject
  html: "string",                   // Email HTML content
  timestamp: "string",              // Email timestamp
  type: "submission_confirmation" | "approval" | "rejection" | "test",
  submissionId: "string",           // Related submission ID
  messageId: "string",              // Email service message ID
  method: "sendgrid" | "smtp"       // Email service used
}
```

### Indexes

#### Firestore Indexes Required
- `submissions` collection: `artistId` (for user submissions)
- `submissions` collection: `status` (for admin filtering)
- `submissions` collection: `createdAt` (for sorting)

## 📁 Project Structure

```
TuneDrop/
├── backend/
│   ├── config/
│   │   └── firebase.js          # Firebase Admin SDK config
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── submissions.js       # Submission management
│   │   └── email.js             # Email service routes
│   ├── services/
│   │   └── emailService.js      # Email service logic
│   ├── uploads/                 # File upload directory
│   ├── server.js                # Express server
│   ├── package.json
│   └── env.example
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.js
│   │   │   │   ├── ArtistRegistrationForm.js
│   │   │   │   └── AdminRegistrationForm.js
│   │   │   ├── common/
│   │   │   │   ├── ProtectedRoute.js
│   │   │   │   ├── AudioPlayer.js
│   │   │   │   └── RoleBasedRedirect.js
│   │   │   ├── dashboards/
│   │   │   │   ├── AdminDashboard.js
│   │   │   │   ├── ArtistDashboard.js
│   │   │   │   ├── UserManagement.js
│   │   │   │   └── EditProfileDialog.js
│   │   │   └── submissions/
│   │   │       ├── SubmissionUploader.js
│   │   │       ├── SubmissionHistory.js
│   │   │       └── AdminSubmissions.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js   # Authentication context
│   │   ├── config/
│   │   │   └── firebase.js      # Firebase client config
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## 🚀 Deployment

### Frontend (Firebase Hosting)
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Backend (Railway/Heroku)
1. Connect your repository to Railway/Heroku
2. Set environment variables
3. Deploy automatically on push



---

**TuneDrop** - Where great music finds its home 🎵
