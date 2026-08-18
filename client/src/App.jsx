import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { TransitionProvider } from './context/TransitionContext';
import { AppShell } from './components/shell/app-shell';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/ui/loading-screen';

import { DashboardView } from './components/dashboard/dashboard-view';
import { ProfileView } from './components/profile/profile-view';
import ProblemsPage from './pages/ProblemsPage';
import { WorkspaceShell } from './components/workspace/workspace-shell';
import { ArenaLobby } from './components/arena/ArenaLobby';
import { ArenaWorkspace } from './components/arena/ArenaWorkspace';
import { ArenaProvider } from './context/ArenaContext';

// Intel Hub — unified Companies + Experience submission
import IntelHubPage from './pages/IntelHubPage';
import CompanyDetailPage from './pages/CompanyDetailPage';

// Placement Intelligence
import PlacementDashboardPage from './pages/PlacementDashboardPage';
import PlacementCompanyPage from './pages/PlacementCompanyPage';

// Sheets
import SheetsPage from './pages/SheetsPage';
import SheetDetailPage from './pages/SheetDetailPage';
import AdminPage from './pages/AdminPage';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/intel" replace />;
  return children;
};


const App = () => {
  return (
    <BrowserRouter>
      <TransitionProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={
            <PublicRoute><ErrorBoundary><LandingPage /></ErrorBoundary></PublicRoute>
          } />
          <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/landing" element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />

          {/* Protected routes — AppShell (sidebar + Outlet) */}
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/problems" element={<ProblemsPage />} />
            <Route path="/problems/:id" element={<WorkspaceShell />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/arena" element={<ArenaProvider><ArenaLobby /></ArenaProvider>} />
            <Route path="/arena/:roomId" element={<ArenaProvider><ArenaWorkspace /></ArenaProvider>} />

            {/* Intel Hub — replaces separate /intel and /companies listing */}
            <Route path="/intel" element={<IntelHubPage />} />
            {/* Keep /companies redirect to /intel for backward compat */}
            <Route path="/companies" element={<Navigate to="/intel" replace />} />
            <Route path="/companies/:slug" element={<CompanyDetailPage />} />

            {/* Placement Intelligence — college-scoped view */}
            <Route path="/placement" element={<PlacementDashboardPage />} />
            <Route path="/placement/companies/:companySlug" element={<PlacementCompanyPage />} />

            {/* Sheets */}
            <Route path="/sheets" element={<SheetsPage />} />
            <Route path="/sheets/:slug" element={<SheetDetailPage />} />

            {/* Admin Panel — role-gated inside AdminPage itself */}
            <Route path="/admin" element={<AdminPage />} />

            {/* Leaderboard — embedded in dashboard, redirect keeps deep-link working */}
            <Route path="/leaderboard" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TransitionProvider>
    </BrowserRouter>
  );
};

export default App;
