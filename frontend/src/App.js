import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';

// Import components
import LoginForm from './components/auth/LoginForm';
import ArtistRegistrationForm from './components/auth/ArtistRegistrationForm';
import AdminRegistrationForm from './components/auth/AdminRegistrationForm';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleBasedRedirect from './components/common/RoleBasedRedirect';
import AdminDashboard from './components/dashboards/AdminDashboard';
import ArtistDashboard from './components/dashboards/ArtistDashboard';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#8fa4f1',
      dark: '#4a5fd8',
    },
    secondary: {
      main: '#764ba2',
      light: '#9a6bc4',
      dark: '#5a3a7a',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register/artist" element={<ArtistRegistrationForm />} />
            <Route path="/register/admin" element={<AdminRegistrationForm />} />
            
            {/* Protected Routes - Admin */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Routes - Artist */}
            <Route 
              path="/artist/*" 
              element={
                <ProtectedRoute requiredRole="artist">
                  <ArtistDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect based on user role */}
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 