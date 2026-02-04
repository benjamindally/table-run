import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { MatchScoringProvider } from "./contexts/MatchScoringContext";
import { LeagueSeasonProvider } from "./contexts/LeagueSeasonContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

// Pages
import HomePage from "./pages/HomePage";
import TeamRegistrationPage from "./pages/TeamRegistrationPage";
import MatchScorePage from "./pages/MatchScorePage";
import ScoreEntryPage from "./pages/ScoreEntryPage";
import LeaguesPage from "./pages/LeaguesPage";
import StandingsPage from "./pages/StandingsPage";
import SeasonDetailsPage from "./pages/SeasonDetailsPage";
import TeamStatsPage from "./pages/TeamStatsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PlayerPage from "./pages/PlayerPage";
import ClaimPlayerPage from "./pages/ClaimPlayerPage";
import ActivatePlayerPage from "./pages/ActivatePlayerPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import WebSocketTest from "./pages/WebSocketTest";
import MatchWebSocketTest from "./pages/MatchWebSocketTest";
import AdminDashboardPage from "./pages/admin/DashboardPage";
import AdminTeamsPage from "./pages/admin/TeamsPage";
import AdminMatchesPage from "./pages/admin/MatchesPage";
import AdminLeaguesPage from "./pages/admin/LeaguesPage";
import AdminLeagueDetailsPage from "./pages/admin/LeagueDetailsPage";
import AdminSeasonsPage from "./pages/admin/SeasonsPage";
import AdminSeasonDetailsPage from "./pages/admin/SeasonDetailsPage";
import AdminTeamDetailsPage from "./pages/admin/TeamDetailsPage";
import AdminPlayerDetailsPage from "./pages/admin/PlayerDetailsPage";
import AdminPlayersPage from "./pages/admin/AdminPlayersPage";
import AdminMatchScorePage from "./pages/admin/MatchScorePage";
import AdminOperatorMatchPage from "./pages/admin/OperatorMatchPage";
import AdminProfilePage from "./pages/admin/ProfilePage";
import AdminSeasonSchedulerPage from "./pages/admin/SeasonSchedulerPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <MatchScoringProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="register" element={<TeamRegistrationPage />} />
            <Route path="match-score" element={<MatchScorePage />} />
            <Route path="score-entry/:seasonId" element={<ScoreEntryPage />} />
            <Route path="leagues" element={<LeaguesPage />} />
            <Route
              path="leagues/:leagueId/standings"
              element={<StandingsPage />}
            />
            <Route
              path="leagues/:leagueId/seasons/:seasonId/standings"
              element={<StandingsPage />}
            />
            <Route
              path="leagues/:leagueId/seasons/:seasonId"
              element={<SeasonDetailsPage />}
            />
            <Route path="team/:teamId/stats" element={<TeamStatsPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<RegisterPage />} />
            <Route path="players" element={<PlayerPage />} />
            <Route path="claim-player/:token" element={<ClaimPlayerPage />} />
            <Route path="activate-player/:token" element={<ActivatePlayerPage />} />
            <Route path="reset-password/:uid/:token" element={<ResetPasswordPage />} />
            <Route path="websocket-test" element={<WebSocketTest />} />
            <Route path="match-websocket-test" element={<MatchWebSocketTest />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <LeagueSeasonProvider>
                  <AdminLayout />
                </LeagueSeasonProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="teams" element={<AdminTeamsPage />} />
            <Route path="teams/:id" element={<AdminTeamDetailsPage />} />
            <Route path="players" element={<AdminPlayersPage />} />
            <Route path="players/:id" element={<AdminPlayerDetailsPage />} />
            <Route path="matches" element={<AdminMatchesPage />} />
            <Route path="matches/:matchId/score" element={<AdminMatchScorePage />} />
            <Route path="matches/:matchId/operator" element={<AdminOperatorMatchPage />} />
            <Route path="leagues" element={<AdminLeaguesPage />} />
            <Route path="leagues/:id" element={<AdminLeagueDetailsPage />} />
            <Route path="seasons" element={<AdminSeasonsPage />} />
            <Route path="seasons/:id" element={<AdminSeasonDetailsPage />} />
            <Route path="seasons/:id/schedule" element={<AdminSeasonSchedulerPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
          </Route>
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
      </MatchScoringProvider>
    </AuthProvider>
  );
}

export default App;
