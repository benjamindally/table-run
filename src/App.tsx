import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import HomePage from './pages/HomePage';
import TeamRegistrationPage from './pages/TeamRegistrationPage';
import MatchScorePage from './pages/MatchScorePage';
import ScoreEntryPage from './pages/ScoreEntryPage';
import LeaguesPage from './pages/LeaguesPage';
import StandingsPage from './pages/StandingsPage';
import TeamStatsPage from './pages/TeamStatsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminTeamsPage from './pages/admin/TeamsPage';
import AdminMatchesPage from './pages/admin/MatchesPage';
import AdminSeasonsPage from './pages/admin/SeasonsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="register" element={<TeamRegistrationPage />} />
            <Route path="match-score" element={<MatchScorePage />} />
            <Route path="score-entry" element={<ScoreEntryPage />} />
            <Route path="standings" element={<LeaguesPage />} />
            <Route path="leagues/:leagueId/standings" element={<StandingsPage />} />
            <Route path="team/:teamId/stats" element={<TeamStatsPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<RegisterPage />} />
          </Route>
          
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="teams" element={<AdminTeamsPage />} />
            <Route path="matches" element={<AdminMatchesPage />} />
            <Route path="seasons" element={<AdminSeasonsPage />} />
          </Route>
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthProvider>
  );
}

export default App;