import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Award, 
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  // Sample data for demonstration
  const recentMatches = [
    {
      id: 1,
      date: '2025-01-15',
      homeTeam: 'Cue Masters',
      homeScore: 3,
      awayTeam: 'Chalk & Awe',
      awayScore: 1,
    },
    {
      id: 2,
      date: '2025-01-14',
      homeTeam: 'Break Point',
      homeScore: 2,
      awayTeam: 'Straight Shooters',
      awayScore: 2,
    },
    {
      id: 3,
      date: '2025-01-13',
      homeTeam: '8-Ball Wizards',
      homeScore: 0,
      awayTeam: 'Corner Pocket',
      awayScore: 4,
    },
    {
      id: 4,
      date: '2025-01-12',
      homeTeam: 'Ball Busters',
      homeScore: 3,
      awayTeam: 'Rack \'em Up',
      awayScore: 1,
    },
  ];

  const upcomingMatches = [
    {
      id: 1,
      date: '2025-01-20',
      homeTeam: 'Chalk & Awe',
      awayTeam: 'Break Point',
      venue: 'The Billiards Club',
    },
    {
      id: 2,
      date: '2025-01-21',
      homeTeam: 'Straight Shooters',
      awayTeam: 'Cue Masters',
      venue: 'Corner Pocket Bar & Grill',
    },
    {
      id: 3,
      date: '2025-01-22',
      homeTeam: 'Corner Pocket',
      awayTeam: 'Ball Busters',
      venue: 'Shark\'s Pool Hall',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Teams</p>
              <p className="text-2xl font-bold mt-1">24</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-500 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              12%
            </span>
            <span className="text-gray-500 ml-2">Since last season</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Players</p>
              <p className="text-2xl font-bold mt-1">156</p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-500 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              8%
            </span>
            <span className="text-gray-500 ml-2">Since last month</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Matches Played</p>
              <p className="text-2xl font-bold mt-1">432</p>
            </div>
            <div className="bg-orange-100 p-2 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-500 flex items-center">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All recorded
            </span>
            <span className="text-gray-500 ml-2">Current season</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming Matches</p>
              <p className="text-2xl font-bold mt-1">16</p>
            </div>
            <div className="bg-purple-100 p-2 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-blue-500 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Next 2 weeks
            </span>
            <span className="text-gray-500 ml-2">View schedule</span>
          </div>
        </div>
      </div>
      
      {/* Recent Matches */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-lg font-medium">Recent Match Results</h2>
          <Link
            to="/admin/matches"
            className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center"
          >
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Home Team</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Away Team</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentMatches.map((match) => (
                <tr key={match.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(match.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {match.homeTeam}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={`font-bold ${
                      match.homeScore > match.awayScore 
                        ? 'text-green-600' 
                        : match.homeScore < match.awayScore 
                          ? 'text-red-600' 
                          : 'text-blue-600'
                    }`}>
                      {match.homeScore}
                    </span>
                    {" - "}
                    <span className={`font-bold ${
                      match.awayScore > match.homeScore 
                        ? 'text-green-600' 
                        : match.awayScore < match.homeScore 
                          ? 'text-red-600' 
                          : 'text-blue-600'
                    }`}>
                      {match.awayScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {match.awayTeam}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button className="text-blue-600 hover:text-blue-800 font-medium">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Two-column layout for Upcoming Matches and Top Teams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Matches */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-lg font-medium">Upcoming Matches</h2>
            <Link
              to="/admin/schedule"
              className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center"
            >
              View Schedule <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <div key={match.id} className="border rounded-md p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">
                      {new Date(match.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                      Upcoming
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{match.homeTeam}</div>
                    <div className="text-xs font-bold px-2">VS</div>
                    <div className="font-medium">{match.awayTeam}</div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {match.venue}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Top Teams */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-lg font-medium">Top Teams</h2>
            <Link
              to="/admin/teams"
              className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center"
            >
              View All Teams <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { rank: 1, team: 'Cue Masters', wins: 18, losses: 2, percentage: 90 },
                { rank: 2, team: 'Chalk & Awe', wins: 16, losses: 4, percentage: 80 },
                { rank: 3, team: 'Break Point', wins: 15, losses: 5, percentage: 75 },
              ].map((team) => (
                <div key={team.rank} className="flex items-center p-3 border rounded-md hover:bg-gray-50">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 mr-4">
                    {team.rank === 1 ? (
                      <Award className="h-4 w-4 text-yellow-500" />
                    ) : team.rank === 2 ? (
                      <Award className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Award className="h-4 w-4 text-amber-700" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{team.team}</h3>
                    <div className="text-sm text-gray-500">
                      {team.wins}W - {team.losses}L
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{team.percentage}%</div>
                    <div className="text-xs text-gray-500">Win rate</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-orange-500 text-white rounded-lg shadow-sm p-6 hover:bg-orange-600 transition-colors">
          <h2 className="text-lg font-bold mb-2">Register New Team</h2>
          <p className="mb-4 text-orange-100">Quickly add a new team to the league database.</p>
          <Link
            to="/register"
            className="inline-flex items-center text-sm font-medium"
          >
            Add Team <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="bg-gray-800 text-white rounded-lg shadow-sm p-6 hover:bg-gray-900 transition-colors">
          <h2 className="text-lg font-bold mb-2">Record Match</h2>
          <p className="mb-4 text-gray-300">Enter results for a recently completed match.</p>
          <Link
            to="/match-score"
            className="inline-flex items-center text-sm font-medium"
          >
            Enter Scores <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="bg-blue-600 text-white rounded-lg shadow-sm p-6 hover:bg-blue-700 transition-colors">
          <h2 className="text-lg font-bold mb-2">Export Reports</h2>
          <p className="mb-4 text-blue-100">Generate and download league statistics and reports.</p>
          <button className="inline-flex items-center text-sm font-medium">
            Export Data <ArrowRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;