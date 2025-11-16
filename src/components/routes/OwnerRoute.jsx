import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Sprawdza, czy użytkownik ma rolę 'owner'
const OwnerRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Ładowanie...</div>;
  }

  if (!isAuthenticated) {
    // Jeśli w ogóle nie jest zalogowany
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'owner') {
    // Zalogowany, ale nie jest właścicielem - przekieruj na stronę główną
    return <Navigate to="/" replace />;
  }

  // Zalogowany i jest właścicielem
  return <Outlet />;
};

export default OwnerRoute;