import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Plus,
  UserPlus,
  Building2,
} from "lucide-react";
import { useMyLeagues } from "../../hooks/useLeagues";
import CreateLeagueModal from "../../components/CreateLeagueModal";

const DashboardPage: React.FC = () => {
  const { data: leaguesData, isLoading } = useMyLeagues();
  const leagues = leaguesData?.results || [];
  const hasLeagues = leagues.length > 0;
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  // No leagues - show action cards
  if (!hasLeagues) {
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

  // Has leagues - show dashboard with real data
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Admin Dashboard</h1>
        <p className="text-sm text-dark-300 mt-1">Overview of your leagues</p>
      </div>

      {/* Your Leagues */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-dark mb-4">Your Leagues ({leagues.length})</h2>
        <div className="space-y-3">
          {leagues.map((league) => (
            <div key={league.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <Building2 className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-dark">{league.name}</h3>
                  <p className="text-sm text-dark-300">{league.city}, {league.state}</p>
                </div>
              </div>
              <Link to="/admin/leagues" className="btn btn-outline btn-sm">
                Manage
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Coming soon placeholder */}
      <div className="bg-cream-200 rounded-lg p-8 text-center">
        <h3 className="font-semibold text-dark mb-2">Dashboard Analytics Coming Soon</h3>
        <p className="text-sm text-dark-300">
          Real-time stats, match results, and league insights will appear here.
        </p>
      </div>

      {/* Create League Modal */}
      <CreateLeagueModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default DashboardPage;
