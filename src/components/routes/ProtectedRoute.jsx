import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Sprawdza, czy użytkownik jest zalogowany
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Czekamy na weryfikację tokena
    return <div>Ładowanie...</div>; 
  }

  if (!isAuthenticated) {
    // Użytkownik nie jest zalogowany, przekieruj na /login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;