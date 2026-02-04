import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clipboard, Users } from "lucide-react";
import { useLeagueStats } from "../hooks/useStats";

const HomePage: React.FC = () => {
  const { data: stats, isLoading, error } = useLeagueStats();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-dark-900 text-cream rounded-lg overflow-hidden">
        <div className="container mx-auto px-6 py-16 relative">
          <div className="max-w-2xl fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Welcome to <span className="text-primary">League Genius</span>
            </h1>
            <p className="text-xl mb-8 text-cream-300">
              Join our local pool league for competitive play, great community,
              and unforgettable memories around the table.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/login"
                className="bg-primary hover:bg-primary-600 text-white font-medium px-6 py-3 rounded-md transition-colors flex items-center"
              >
                Login <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/leagues"
                className="bg-cream hover:bg-cream-200 text-dark font-medium px-6 py-3 rounded-md transition-colors"
              >
                Leagues
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow slide-in">
              <div className="rounded-full bg-primary-100 p-3 w-14 h-14 flex items-center justify-center mb-4">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Register Your Team</h3>
              <p className="text-dark-300 mb-4">
                Sign up your team with 2-8 players, designate a captain and
                choose your home establishment.
              </p>
              <Link
                to="/register"
                className="text-primary hover:text-primary-600 font-medium flex items-center"
              >
                Register Now <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Feature 2 */}
            <div
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow slide-in"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="rounded-full bg-primary-100 p-3 w-14 h-14 flex items-center justify-center mb-4">
                <Calendar className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Play Matches</h3>
              <p className="text-dark-300 mb-4">
                Compete in weekly matches against other teams in the league at
                your home establishment or theirs.
              </p>
              <Link
                to="/"
                className="text-primary hover:text-primary-600 font-medium flex items-center"
              >
                View Schedule <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Feature 3 */}
            <div
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow slide-in"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="rounded-full bg-primary-100 p-3 w-14 h-14 flex items-center justify-center mb-4">
                <Clipboard className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Submit Scores</h3>
              <p className="text-dark-300 mb-4">
                After each match, team captains submit scores, including wins,
                losses, and special achievements.
              </p>
              <Link
                to="/score-entry"
                className="text-primary hover:text-primary-600 font-medium flex items-center"
              >
                Submit Scores <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* League Stats Section */}
      <section className="bg-cream-200 py-12 rounded-lg">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            League Statistics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Stat 1 */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md text-center">
              {isLoading || error ? (
                <>
                  <div className="h-8 md:h-10 bg-primary-100 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 bg-cream-300 rounded w-20 md:w-24 mx-auto animate-pulse"></div>
                </>
              ) : (
                <>
                  <p className="text-2xl md:text-4xl font-bold text-primary mb-2">
                    {stats?.active_teams ?? 0}
                  </p>
                  <p className="text-sm md:text-base text-dark-300">Active Teams</p>
                </>
              )}
            </div>

            {/* Stat 2 */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md text-center">
              {isLoading || error ? (
                <>
                  <div className="h-8 md:h-10 bg-primary-100 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 bg-cream-300 rounded w-20 md:w-28 mx-auto animate-pulse"></div>
                </>
              ) : (
                <>
                  <p className="text-2xl md:text-4xl font-bold text-primary mb-2">
                    {stats?.active_players ?? 0}
                  </p>
                  <p className="text-sm md:text-base text-dark-300">League Players</p>
                </>
              )}
            </div>

            {/* Stat 3 */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md text-center">
              {isLoading || error ? (
                <>
                  <div className="h-8 md:h-10 bg-primary-100 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 bg-cream-300 rounded w-20 md:w-32 mx-auto animate-pulse"></div>
                </>
              ) : (
                <>
                  <p className="text-2xl md:text-4xl font-bold text-primary mb-2">
                    {stats?.venues ?? 0}
                  </p>
                  <p className="text-sm md:text-base text-dark-300">Venues</p>
                </>
              )}
            </div>

            {/* Stat 4 */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md text-center">
              {isLoading || error ? (
                <>
                  <div className="h-8 md:h-10 bg-primary-100 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 bg-cream-300 rounded w-20 md:w-28 mx-auto animate-pulse"></div>
                </>
              ) : (
                <>
                  <p className="text-2xl md:text-4xl font-bold text-primary mb-2">
                    {stats?.matches_played ?? 0}
                  </p>
                  <p className="text-sm md:text-base text-dark-300">Matches Played</p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white rounded-lg overflow-hidden">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Join the League?
            </h2>
            <p className="text-xl mb-8">
              Register your team today and be part of our growing community of
              pool enthusiasts!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="bg-white hover:bg-cream-200 text-primary font-medium px-6 py-3 rounded-md transition-colors"
              >
                Register Your Team
              </Link>
              <Link
                to="/contact"
                className="bg-transparent hover:bg-primary-600 border-2 border-white text-white font-medium px-6 py-3 rounded-md transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
