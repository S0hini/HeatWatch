import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ZoneMap from './pages/ZoneMap';
import Analysis from './pages/Analysis';
import Recommendations from './pages/Recommendations';

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-heat-600/30 border-t-heat-500 rounded-full animate-spin" />
          <p className="text-surface-500 text-sm">Loading HeatWatch…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function AuthRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-heat-600/30 border-t-heat-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;
  return <Landing />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AuthRoute />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/map"             element={<ZoneMap />} />
        <Route path="/analysis"        element={<Analysis />} />
        <Route path="/recommendations" element={<Recommendations />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
