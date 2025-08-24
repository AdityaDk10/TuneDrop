import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Link
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  MusicNote
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await login(formData.email, formData.password);
      
      // Navigate based on user role
      if (result && result.user) {
        if (result.user.role === 'admin') {
          navigate('/admin');
        } else if (result.user.role === 'artist') {
          navigate('/artist');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Paper
        elevation={24}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <MusicNote sx={{ fontSize: 40, color: 'primary.main' }} />
          </Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            TuneDrop
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sign in to your account
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Login Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderRadius: 2,
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
              }
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign In'
            )}
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Don't have an account?
            </Typography>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/register/artist')}
              sx={{ 
                textDecoration: 'none',
                fontWeight: 'bold',
                color: 'primary.main',
                mr: 2,
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Register as Artist
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/register/admin')}
              sx={{ 
                textDecoration: 'none',
                fontWeight: 'bold',
                color: 'secondary.main',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Create Admin
            </Link>
          </Box>

          {/* Test Credentials Info */}
          <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              <strong>Test Admin Credentials:</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Email: admin@tunedrop.com
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Password: AdminTuneDrop2024!
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginForm; 