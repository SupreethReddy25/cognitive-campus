import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { TransitionProvider } from './context/TransitionContext';
import { AppShell } from './components/shell/app-shell';
import ProtectedRoute from './components/ProtectedRoute';
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/ui/loading-screen';

const DashboardView = lazy(() => import('./components/dashboard/dashboard-view').then((m) => ({ default: m.DashboardView })));
const ProfileView = lazy(() => import('./components/profile/profile-view').then((m) => ({ default: m.ProfileView })));
const ProblemsPage = lazy(() => import('./pages/ProblemsPage'));
const WorkspaceShell = lazy(() => import('./components/workspace/workspace-shell').then((m) => ({ default: m.WorkspaceShell })));
const ArenaLobby = lazy(() => import('./components/arena/ArenaLobby').then((m) => ({ default: m.ArenaLobby })));
const ArenaWorkspace = lazy(() => import('./components/arena/ArenaWorkspace').then((m) => ({ default: m.ArenaWorkspace })));
import { ArenaProvider } from './context/ArenaContext';

// Intel Hub — unified Companies + Experience submission
const IntelHubPage = lazy(() => import('./pages/IntelHubPage'));
const CompanyDetailPage = lazy(() => import('./pages/CompanyDetailPage'));

// Placement Intelligence
const PlacementDashboardPage = lazy(() => import('./pages/PlacementDashboardPage'));
const PlacementCompanyPage = lazy(() => import('./pages/PlacementCompanyPage'));

// Sheets
const SheetsPage = lazy(() => import('./pages/SheetsPage'));
const SheetDetailPage = lazy(() => import('./pages/SheetDetailPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

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
        <Suspense fallback={<LoadingScreen />}>
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
        </Suspense>
      </TransitionProvider>
    </BrowserRouter>
  );
};

export default App;
