import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppShell } from './components/shell/app-shell';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ErrorBoundary from './components/ErrorBoundary';

import { DashboardView } from './components/dashboard/dashboard-view';
import { LeaderboardView } from './components/leaderboard/leaderboard-view';
import { ProfileView } from './components/profile/profile-view';
import ProblemsPage from './pages/ProblemsPage';
import { WorkspaceShell } from './components/workspace/workspace-shell';
import { ArenaLobby } from './components/arena/ArenaLobby';
import { ArenaWorkspace } from './components/arena/ArenaWorkspace';
import { ArenaProvider } from './context/ArenaContext';
import SubmitIntelPage from './pages/SubmitIntelPage';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={
          <PublicRoute><ErrorBoundary><LandingPage /></ErrorBoundary></PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute><AuthPage /></PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute><AuthPage /></PublicRoute>
        } />

        {/* Landing page accessible to logged-in users (for presentation) */}
        <Route path="/landing" element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />

        {/* Protected routes — AppShell (sidebar + Outlet) */}
        <Route element={
          <ProtectedRoute><AppShell /></ProtectedRoute>
        }>
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/problems" element={<ProblemsPage />} />
          <Route path="/problems/:id" element={<WorkspaceShell />} />

          <Route path="/leaderboard" element={<LeaderboardView />} />
          <Route path="/profile" element={<ProfileView />} />
          <Route path="/arena" element={<ArenaProvider><ArenaLobby /></ArenaProvider>} />
          <Route path="/arena/:roomId" element={<ArenaProvider><ArenaWorkspace /></ArenaProvider>} />
          <Route path="/intel" element={<SubmitIntelPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
