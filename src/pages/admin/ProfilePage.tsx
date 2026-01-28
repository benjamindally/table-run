import React from "react";
import {
  User,
  Mail,
  Calendar,
  Building2,
  Users,
  Trophy,
  Edit3,
  Shield,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLeagueSeason } from "../../contexts/LeagueSeasonContext";

const ProfilePage: React.FC = () => {
  const { user, player } = useAuth();
  const { leagues, teams } = useLeagueSeason();

  // Mock data for demo - in production these would come from API
  const memberSince = "January 2024";
  const lastLogin = "Today at 2:34 PM";

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || "U";
  };

  const getFullName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || "User";
  };

  const operatorLeagues = leagues.filter((l) => l.is_operator);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark">Your Profile</h1>
        <p className="text-sm text-dark-300 mt-1">
          Manage your account information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-700">
                  {getInitials()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-dark">{getFullName()}</h2>
                <p className="text-dark-300">@{user?.username}</p>
                {operatorLeagues.length > 0 && (
                  <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                    <Shield className="h-3 w-3 mr-1" />
                    League Operator
                  </span>
                )}
              </div>
            </div>
            <button className="btn btn-outline btn-sm flex items-center">
              <Edit3 className="h-4 w-4 mr-1" />
              Edit Profile
            </button>
          </div>

          {/* Contact Information */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-4">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Mail className="h-5 w-5 text-dark-400" />
                </div>
                <div>
                  <p className="text-xs text-dark-300">Email</p>
                  <p className="text-sm font-medium text-dark">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <User className="h-5 w-5 text-dark-400" />
                </div>
                <div>
                  <p className="text-xs text-dark-300">Username</p>
                  <p className="text-sm font-medium text-dark">
                    {user?.username}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-4">
              Account Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-dark-400" />
                </div>
                <div>
                  <p className="text-xs text-dark-300">Member Since</p>
                  <p className="text-sm font-medium text-dark">{memberSince}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-dark-400" />
                </div>
                <div>
                  <p className="text-xs text-dark-300">Last Login</p>
                  <p className="text-sm font-medium text-dark">{lastLogin}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Player Info (if linked) */}
          {player && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-4">
                Linked Player Profile
              </h3>
              <div className="bg-cream-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-secondary-100 p-2 rounded-lg">
                    <Trophy className="h-5 w-5 text-secondary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-dark">{player.name}</p>
                    <p className="text-sm text-dark-300">
                      Player ID: #{player.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-4">
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary-600" />
                  </div>
                  <span className="text-sm text-dark">Leagues</span>
                </div>
                <span className="text-lg font-bold text-dark">
                  {leagues.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-secondary-100 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-secondary-600" />
                  </div>
                  <span className="text-sm text-dark">Teams</span>
                </div>
                <span className="text-lg font-bold text-dark">
                  {teams.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-accent-100 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-accent-600" />
                  </div>
                  <span className="text-sm text-dark">Operating</span>
                </div>
                <span className="text-lg font-bold text-dark">
                  {operatorLeagues.length}
                </span>
              </div>
            </div>
          </div>

          {/* Leagues Operating */}
          {operatorLeagues.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-4">
                Leagues You Operate
              </h3>
              <div className="space-y-3">
                {operatorLeagues.map((league) => (
                  <div
                    key={league.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="bg-primary-100 p-1.5 rounded">
                      <Building2 className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-dark truncate">
                        {league.name}
                      </p>
                      <p className="text-xs text-dark-300">
                        {league.city}, {league.state}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
