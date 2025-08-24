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
  Grid,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Link
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
  MusicNote,
  Instagram,
  Facebook,
  Twitter,
  YouTube,
  ArrowBack
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const steps = ['Account Details', 'Artist Information', 'Social Media'];

const ArtistRegistrationForm = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Account Details
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phoneNumber: '',
    
    // Artist Information
    artistName: '',
    bio: '',
    
    // Social Media
    socialMedia: {
      instagram: '',
      soundcloud: '',
      spotify: '',
      youtube: '',
      facebook: '',
      twitter: ''
    }
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { registerArtist, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('social.')) {
      const socialPlatform = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialPlatform]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) setError(null);
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Account Details
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        
        if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
        else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        
        if (!formData.displayName) newErrors.displayName = 'Display name is required';
        // Phone number is optional but if provided, validate format
        if (formData.phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
          newErrors.phoneNumber = 'Please enter a valid phone number with country code (e.g., +1234567890)';
        }
        break;
        
      case 1: // Artist Information
        if (!formData.artistName) newErrors.artistName = 'Artist name is required';
        if (!formData.bio) newErrors.bio = 'Bio is required';
        else if (formData.bio.length < 10) newErrors.bio = 'Bio must be at least 10 characters';
        break;
        
      case 2: // Social Media (Optional - no validation required)
        // Social media is optional, so no validation needed
        break;
        
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(activeStep)) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await registerArtist(formData);
      
      // Navigate to artist dashboard after successful registration
      if (result && result.user) {
        navigate('/artist');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Display Name"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                error={!!errors.displayName}
                helperText={errors.displayName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number (Optional)"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber || "Include country code (e.g., +1234567890). 10-15 digits recommended."}
                placeholder="+1234567890"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Artist Name"
                name="artistName"
                value={formData.artistName}
                onChange={handleChange}
                error={!!errors.artistName}
                helperText={errors.artistName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MusicNote color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Artist Bio"
                name="bio"
                multiline
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                error={!!errors.bio}
                helperText={errors.bio}
                placeholder="Tell us about your music, style, and what makes you unique..."
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Instagram"
                name="social.instagram"
                value={formData.socialMedia.instagram}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Instagram color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SoundCloud"
                name="social.soundcloud"
                value={formData.socialMedia.soundcloud}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MusicNote color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Spotify"
                name="social.spotify"
                value={formData.socialMedia.spotify}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MusicNote color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="YouTube"
                name="social.youtube"
                value={formData.socialMedia.youtube}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <YouTube color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Facebook"
                name="social.facebook"
                value={formData.socialMedia.facebook}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Facebook color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Twitter"
                name="social.twitter"
                value={formData.socialMedia.twitter}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Twitter color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
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
          maxWidth: 600,
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
            Join TuneDrop
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Register as an artist to submit your music
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Form Content */}
        <Box component="form" onSubmit={handleSubmit}>
          {renderStepContent(activeStep)}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    px: 4,
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
                    'Create Account'
                  )}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    px: 4,
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
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Already have an account?
          </Typography>
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/login')}
            sx={{ 
              textDecoration: 'none',
              fontWeight: 'bold',
              color: 'primary.main',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Sign In
          </Link>
        </Box>
      </Paper>
    </Box>
  );
};

export default ArtistRegistrationForm; 