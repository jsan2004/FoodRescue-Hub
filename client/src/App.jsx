import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/DonorDashboard';
import NgoDashboard from './pages/NgoDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm font-medium">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's assigned dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'ngo') return <Navigate to="/ngo" replace />;
    if (user.role === 'donor') return <Navigate to="/donor" replace />;
    if (user.role === 'volunteer') return <Navigate to="/volunteer" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

// Landing route: Public visitors see Home (Public Impact), but logged-in Admins go to /admin and NGOs go to /ngo
function HomeRoute() {
  const { user, loading } = useAuth();
  if (!loading && user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (!loading && user?.role === 'ngo') {
    return <Navigate to="/ngo" replace />;
  }
  return <Home />;
}

// Surplus Feed route: Donors, Volunteers, and Admins are redirected away; only NGOs/Public can access
function NgoRoute() {
  const { user, loading } = useAuth();
  if (!loading && user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (!loading && user?.role === 'donor') {
    return <Navigate to="/donor" replace />;
  }
  if (!loading && user?.role === 'volunteer') {
    return <Navigate to="/volunteer" replace />;
  }
  return <NgoDashboard />;
}

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public / Landing Routes */}
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Role-Specific Dashboards */}
          <Route 
            path="/donor" 
            element={
              <ProtectedRoute allowedRoles={['donor', 'admin']}>
                <DonorDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/ngo" 
            element={
              <NgoRoute />
            } 
          />

          <Route 
            path="/volunteer" 
            element={
              <ProtectedRoute allowedRoles={['volunteer', 'admin']}>
                <VolunteerDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
