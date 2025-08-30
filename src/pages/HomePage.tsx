import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Calendar, Clipboard, Users } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-black text-white rounded-lg overflow-hidden">
        <div className="container mx-auto px-6 py-16 relative">
          <div className="max-w-2xl fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Welcome to the <span className="text-orange-500">8-Ball League</span>
            </h1>
            <p className="text-xl mb-8 text-gray-300">
              Join our local pool league for competitive play, great community, 
              and unforgettable memories around the table.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-md transition-colors flex items-center"
              >
                Register Your Team <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/match-score"
                className="bg-white hover:bg-gray-100 text-black font-medium px-6 py-3 rounded-md transition-colors"
              >
                Submit Match Scores
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
              <div className="rounded-full bg-orange-100 p-3 w-14 h-14 flex items-center justify-center mb-4">
                <Users className="h-7 w-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Register Your Team</h3>
              <p className="text-gray-600 mb-4">
                Sign up your team with 2-8 players, designate a captain and 
                choose your home establishment.
              </p>
              <Link to="/register" className="text-orange-500 hover:text-orange-600 font-medium flex items-center">
                Register Now <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow slide-in" style={{animationDelay: "0.1s"}}>
              <div className="rounded-full bg-orange-100 p-3 w-14 h-14 flex items-center justify-center mb-4">
                <Calendar className="h-7 w-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Play Matches</h3>
              <p className="text-gray-600 mb-4">
                Compete in weekly matches against other teams in the league at your home 
                establishment or theirs.
              </p>
              <Link to="/" className="text-orange-500 hover:text-orange-600 font-medium flex items-center">
                View Schedule <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow slide-in" style={{animationDelay: "0.2s"}}>
              <div className="rounded-full bg-orange-100 p-3 w-14 h-14 flex items-center justify-center mb-4">
                <Clipboard className="h-7 w-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Submit Scores</h3>
              <p className="text-gray-600 mb-4">
                After each match, team captains submit scores, including wins, losses, 
                and special achievements.
              </p>
              <Link to="/match-score" className="text-orange-500 hover:text-orange-600 font-medium flex items-center">
                Submit Scores <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* League Stats Section */}
      <section className="bg-gray-100 py-12 rounded-lg">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">League Statistics</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Stat 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-4xl font-bold text-orange-500 mb-2">24</p>
              <p className="text-gray-600">Active Teams</p>
            </div>
            
            {/* Stat 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-4xl font-bold text-orange-500 mb-2">156</p>
              <p className="text-gray-600">League Players</p>
            </div>
            
            {/* Stat 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-4xl font-bold text-orange-500 mb-2">12</p>
              <p className="text-gray-600">Sponsoring Venues</p>
            </div>
            
            {/* Stat 4 */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-4xl font-bold text-orange-500 mb-2">432</p>
              <p className="text-gray-600">Matches Played</p>
            </div>
          </div>
        </div>
      </section>

      {/* Current Rankings */}
      <section>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Current Rankings</h2>
            <Link to="/" className="text-orange-500 hover:text-orange-600 font-medium flex items-center">
              View All Rankings <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Captain</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Won</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Top 5 teams */}
                  {[
                    { rank: 1, team: 'Cue Masters', captain: 'John Smith', won: 18, lost: 2 },
                    { rank: 2, team: 'Chalk & Awe', captain: 'Sarah Johnson', won: 16, lost: 4 },
                    { rank: 3, team: 'Break Point', captain: 'Mike Wilson', won: 15, lost: 5 },
                    { rank: 4, team: 'Straight Shooters', captain: 'Lisa Brown', won: 13, lost: 7 },
                    { rank: 5, team: '8-Ball Wizards', captain: 'Dave Miller', won: 12, lost: 8 },
                  ].map((team) => (
                    <tr key={team.rank} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {team.rank === 1 ? (
                            <Award className="h-5 w-5 text-yellow-500 mr-1" />
                          ) : team.rank === 2 ? (
                            <Award className="h-5 w-5 text-gray-400 mr-1" />
                          ) : team.rank === 3 ? (
                            <Award className="h-5 w-5 text-amber-700 mr-1" />
                          ) : null}
                          <span className={team.rank <= 3 ? "font-bold" : ""}>{team.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.team}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.captain}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.won}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.lost}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {((team.won / (team.won + team.lost)) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-orange-500 text-white rounded-lg overflow-hidden">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Join the League?
            </h2>
            <p className="text-xl mb-8">
              Register your team today and be part of our growing community of pool enthusiasts!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="bg-white hover:bg-gray-100 text-orange-500 font-medium px-6 py-3 rounded-md transition-colors"
              >
                Register Your Team
              </Link>
              <Link
                to="/contact"
                className="bg-transparent hover:bg-orange-600 border-2 border-white text-white font-medium px-6 py-3 rounded-md transition-colors"
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