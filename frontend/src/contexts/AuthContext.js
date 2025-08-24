import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import axios from 'axios';

// Configure axios base URL and auth token
const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://tunedrop.onrender.com';
axios.defaults.baseURL = backendUrl;

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Artist registration
  const registerArtist = async (userData) => {
    try {
      setError(null);
      const { email, password, displayName, phoneNumber, artistName, bio, socialMedia } = userData;
      
      // Register artist through backend (backend handles Firebase Auth creation)
      const response = await axios.post('/api/auth/register/artist', {
        email,
        password,
        displayName,
        phoneNumber,
        artistName,
        bio,
        socialMedia
      });

      // Don't auto-login - let user complete the form and login manually
      return response.data;
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      throw error;
    }
  };

  // Create first admin (development)
  const createFirstAdmin = async (userData) => {
    try {
      setError(null);
      const { email, password, displayName, phoneNumber } = userData;
      
      const response = await axios.post('/api/auth/create-first-admin', {
        email,
        password,
        displayName,
        phoneNumber
      });

      // After successful admin creation, auto-login
      if (response.data.user) {
        await loginWithBackend(email, password);
      }

      return response.data;
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      throw error;
    }
  };

  // Admin registration (protected)
  const registerAdmin = async (userData) => {
    try {
      setError(null);
      const { email, password, displayName, phoneNumber } = userData;
      
      // Register admin through backend (requires existing admin token)
      const response = await axios.post('/api/auth/register/admin', {
        email,
        password,
        displayName,
        phoneNumber
      });

      return response.data;
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      throw error;
    }
  };

  // Login with backend development endpoint
  const loginWithBackend = async (email, password) => {
    try {
      setError(null);
      
      // Use development login endpoint
      const response = await axios.post('/api/auth/dev-auth', {
        email,
        password
      });
      
      // Store token and user data
      localStorage.setItem('authToken', response.data.token);
      setCurrentUser(response.data.user);
      setUserRole(response.data.user.role);
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      throw error;
    }
  };

  // Standard Firebase login (for production)
  const login = async (email, password) => {
    try {
      setError(null);
      
      // For now, use the backend development login
      return await loginWithBackend(email, password);
      
      // TODO: Implement full Firebase client auth flow
      /*
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      
      const response = await axios.post('/api/auth/login', { idToken });
      
      setCurrentUser(response.data.user);
      setUserRole(response.data.user.role);
      
      return response.data;
      */
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      setError(null);
      
      // Call backend logout
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          await axios.post('/api/auth/logout', {});
        } catch (error) {
          console.error('Backend logout error:', error);
        }
      }
      
      // Clear local storage and state
      localStorage.removeItem('authToken');
      setCurrentUser(null);
      setUserRole(null);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Get user profile
  const getProfile = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return null;
      
      const response = await axios.get('/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      
      setCurrentUser(response.data.user);
      setUserRole(response.data.user.role);
      
      return response.data.user;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  };

  // Update user profile
  const updateProfileData = async (profileData) => {
    try {
      setError(null);
      const idToken = await auth.currentUser?.getIdToken();
      
      const response = await axios.put('/api/auth/profile', profileData, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      
      // Update local user data
      await getProfile();
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      throw error;
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return userRole === 'admin';
  };

  // Check if user is artist
  const isArtist = () => {
    return userRole === 'artist';
  };

  // Get auth token for API calls
  const getAuthToken = async () => {
    try {
      return await auth.currentUser?.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  // Check for stored auth token on app load
  useEffect(() => {
    const checkStoredAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // Get user profile with stored token
          await getProfile();
        } catch (error) {
          console.error('Stored token invalid:', error);
          localStorage.removeItem('authToken');
          setCurrentUser(null);
          setUserRole(null);
        }
      }
      setLoading(false);
    };

    checkStoredAuth();
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    error,
    registerArtist,
    createFirstAdmin,
    registerAdmin,
    login,
    loginWithBackend,
    logout,
    getProfile,
    updateProfileData,
    isAdmin,
    isArtist,
    getAuthToken,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 