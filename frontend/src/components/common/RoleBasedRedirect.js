import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RoleBasedRedirect = () => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return null; // or a loading spinner
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userRole === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (userRole === 'artist') {
    return <Navigate to="/artist" replace />;
  }

  // Default fallback
  return <Navigate to="/login" replace />;
};

export default RoleBasedRedirect; 