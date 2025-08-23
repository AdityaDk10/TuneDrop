const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const submissionRoutes = require('./routes/submissions');

// Import Firebase config
const { auth } = require('./config/firebase');

const app = express();
const server = createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());

// Trust proxy for rate limiting (required when behind proxy/load balancer)
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TuneDrop Backend is running with Local Storage',
    timestamp: new Date().toISOString(),
    features: {
      storage: 'Local File System',
      firebase: 'Authentication & Database',
      uploads: 'Enabled'
    }
  });
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decodedToken = await auth.verifyIdToken(token);
    socket.userId = decodedToken.uid;
    socket.userEmail = decodedToken.email;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userEmail} (${socket.userId})`);

  // Join admin room if user is admin
  socket.on('join-admin-room', async () => {
    try {
      // Verify user is admin (you might want to check this in Firestore)
      socket.join('admin-room');
      console.log(`Admin joined admin room: ${socket.userEmail}`);
    } catch (error) {
      console.error('Error joining admin room:', error);
    }
  });

  // Handle new submission notification
  socket.on('new-submission', (data) => {
    // Broadcast to admin room
    socket.to('admin-room').emit('submission-received', data);
  });

  // Handle submission status updates
  socket.on('submission-updated', (data) => {
    socket.to('admin-room').emit('submission-status-changed', data);
  });

  // Handle admin activity
  socket.on('admin-activity', (data) => {
    socket.to('admin-room').emit('admin-activity-update', {
      ...data,
      adminId: socket.userId,
      adminEmail: socket.userEmail,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userEmail}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 TuneDrop Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time connections`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = { app, server, io }; 