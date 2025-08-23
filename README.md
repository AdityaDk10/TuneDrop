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
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **Firebase Admin SDK** - Backend Firebase integration
- **Socket.io** - Real-time WebSocket server
- **Firestore** - NoSQL database
- **Firebase Storage** - File storage

### Infrastructure
- **Firebase Hosting** - Frontend deployment
- **Railway/Heroku** - Backend deployment
- **SendGrid** - Email service

## 📋 Features

### Phase 1: Authentication & User Management ✅
- [x] User registration (Artists & Admins)
- [x] Secure login/logout
- [x] Role-based access control
- [x] Protected routes
- [x] User profile management

### Phase 2: File Upload System (Coming Next)
- [ ] Multi-track uploader
- [ ] Progress tracking
- [ ] File validation
- [ ] Firebase Storage integration

### Phase 3: Artist Submission Portal (Planned)
- [ ] Track submission form
- [ ] Artist dashboard
- [ ] Submission history
- [ ] Status tracking

### Phase 4: Admin Dashboard (Planned)
- [ ] Submission management
- [ ] Audio player with waveform
- [ ] Review & grading system
- [ ] Real-time notifications

### Phase 5: Email Integration (Planned)
- [ ] Automated confirmations


### Phase 6: Real-time Features (Planned)
- [ ] Live submission updates
- [ ] Admin activity indicators
- [ ] Real-time collaboration

## 🛠️ Setup Instructions

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

## 🧪 Testing

### Test Credentials
- **Admin**: admin@yourlabel.com / admin123
- **Artist**: Register through the application

### API Endpoints

#### Authentication
- `POST /api/auth/register/artist` - Artist registration
- `POST /api/auth/register/admin` - Admin registration (protected)
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

#### Health Check
- `GET /api/health` - Server health check

## 📁 Project Structure

```
TuneDrop/
├── backend/
│   ├── config/
│   │   └── firebase.js          # Firebase Admin SDK config
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/
│   │   └── auth.js              # Authentication routes
│   ├── server.js                # Express server with Socket.io
│   ├── package.json
│   └── env.example
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.js
│   │   │   │   └── ArtistRegistrationForm.js
│   │   │   └── common/
│   │   │       └── ProtectedRoute.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js   # Authentication context
│   │   ├── config/
│   │   │   └── firebase.js      # Firebase client config
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## 🔒 Security Features

- **Firebase Authentication** - Secure user authentication
- **Role-based Access Control** - Admin/Artist role separation
- **Protected Routes** - Route-level security
- **Token Verification** - JWT token validation
- **CORS Configuration** - Cross-origin security
- **Rate Limiting** - API abuse prevention
- **Input Validation** - Form data validation

## 🎨 UI/UX Features

- **Material UI Design** - Modern, professional interface
- **Responsive Design** - Works on all devices
- **Dark/Light Theme** - Customizable appearance
- **Loading States** - User feedback
- **Error Handling** - Clear error messages
- **Form Validation** - Real-time validation
- **Smooth Animations** - Enhanced user experience

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

---

**TuneDrop** - Where great music finds its home 🎵