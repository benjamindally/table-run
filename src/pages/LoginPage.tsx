import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AlertCircle, Plus, UserPlus, Building2, Users } from "lucide-react";
import { leaguesApi } from "../api/leagues";
import CreateLeagueModal from "../components/CreateLeagueModal";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, getAuthToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showNoLeaguesPrompt, setShowNoLeaguesPrompt] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      await login({ email, password });

      // After successful login, check if user has any leagues
      const token = getAuthToken();
      if (token) {
        try {
          const leaguesResponse = await leaguesApi.getMyLeagues(token);
          const hasLeagues = leaguesResponse.results && leaguesResponse.results.length > 0;

          if (hasLeagues) {
            // User has leagues, navigate to dashboard
            navigate("/admin/dashboard");
          } else {
            // User has no leagues, show the prompt
            setShowNoLeaguesPrompt(true);
          }
        } catch (leagueError) {
          // If we can't fetch leagues, just navigate to dashboard
          // The dashboard will handle the no leagues case
          console.error("Error fetching leagues:", leagueError);
          navigate("/admin/dashboard");
        }
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid email or password"
      );
    }
  };

  // Show no leagues prompt after successful login
  if (showNoLeaguesPrompt) {
    return (
      <>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-dark">Welcome to League Genius</h1>
            <p className="text-sm text-dark-300 mt-1">Get started by creating or joining a league</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {/* Add a League Card */}
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-8">
              <div className="bg-primary-100 p-4 rounded-lg w-fit mb-4">
                <Building2 className="h-8 w-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-dark mb-2">Create a League</h2>
              <p className="text-dark-300 mb-6">
                Start your own pool league and manage teams, matches, and standings.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create League
              </button>
            </div>

            {/* Join a League Card */}
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-8">
              <div className="bg-secondary-100 p-4 rounded-lg w-fit mb-4">
                <UserPlus className="h-8 w-8 text-secondary-600" />
              </div>
              <h2 className="text-xl font-bold text-dark mb-2">Join a League</h2>
              <p className="text-dark-300 mb-6">
                Connect with an existing league as an operator or staff member.
              </p>
              <button className="btn btn-outline flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Browse Leagues
              </button>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-cream-200 rounded-lg p-6 max-w-4xl">
            <h3 className="font-semibold text-dark mb-2">Need help getting started?</h3>
            <p className="text-sm text-dark-300">
              Check out our documentation or contact support for assistance setting up your first league.
            </p>
          </div>
        </div>

        {/* Create League Modal */}
        <CreateLeagueModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </>
    );
  }

  // Show login form
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">Welcome Back</h1>
        <p className="text-dark-300">
          Sign in to your account to access the admin features
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary-600"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-dark-200 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-dark"
              >
                Remember me
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="text-center mt-6">
        <p className="text-dark-300 text-sm">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-primary hover:text-primary-600 font-medium"
          >
            Contact us to register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
