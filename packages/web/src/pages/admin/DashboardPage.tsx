import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  UserPlus,
  Building2,
  Megaphone,
  ChevronDown,
  ChevronRight,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { useLeagueSeason } from "../../contexts/LeagueSeasonContext";
import { useSeasonMatches } from "../../hooks/useSeasons";
import type { MeSeason } from "../../api";
import CreateLeagueModal from "../../components/CreateLeagueModal";
import CreateAnnouncementModal from "../../components/CreateAnnouncementModal";
import NextMatchCard from "../../components/NextMatchCard";

// Component for the Next Match and View Matches cards (uses React Query hook)
interface CurrentSeasonCardsProps {
  season: MeSeason;
  leagueId: number;
  userTeamIds: number[];
  setLeagueAndSeason: (leagueId: number, seasonId: number) => void;
}

const CurrentSeasonCards: React.FC<CurrentSeasonCardsProps> = ({
  season,
  leagueId,
  userTeamIds,
  setLeagueAndSeason,
}) => {
  const { data: matches, isLoading } = useSeasonMatches(season.id);

  return (
    <>
      {/* Next Match Card */}
      <NextMatchCard
        matches={matches}
        userTeamIds={userTeamIds}
        isLoading={isLoading}
      />

      {/* View Matches Card */}
      <div className="bg-white rounded-lg p-4 border hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <h4 className="font-semibold text-dark mb-2">Season Schedule</h4>
          <p className="text-sm text-dark-300 mb-4">
            View all matches for this season
          </p>
        </div>
        <Link
          to="/admin/matches"
          onClick={(e) => {
            e.stopPropagation();
            setLeagueAndSeason(leagueId, season.id);
          }}
          className="btn btn-primary btn-sm flex items-center justify-center"
        >
          View All Matches
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </>
  );
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { leagues, seasons, teams, isLoading, setLeagueAndSeason } =
    useLeagueSeason();
  const hasLeagues = leagues.length > 0;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [expandedLeagueId, setExpandedLeagueId] = useState<number | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Memoize user's team IDs
  const userTeamIds = useMemo(() => teams.map((t) => t.id), [teams]);

  // Memoize seasons grouped by league
  const seasonsByLeague = useMemo(() => {
    const grouped: Record<number, MeSeason[]> = {};
    for (const season of seasons) {
      if (!grouped[season.league_id]) {
        grouped[season.league_id] = [];
      }
      grouped[season.league_id].push(season);
    }
    // Sort each league's seasons by start_date descending
    for (const leagueId in grouped) {
      grouped[leagueId].sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
    }
    return grouped;
  }, [seasons]);

  const getSeasonsForLeague = (leagueId: number) => {
    return seasonsByLeague[leagueId] || [];
  };

  const toggleLeagueExpand = (leagueId: number) => {
    setExpandedLeagueId(expandedLeagueId === leagueId ? null : leagueId);
  };

  const handleSeasonClick = (leagueId: number, seasonId: number) => {
    setLeagueAndSeason(leagueId, seasonId);
    navigate(`/admin/seasons/${seasonId}`);
  };

  const handleAnnouncementClick = (leagueId: number, leagueName: string) => {
    setSelectedLeague({ id: leagueId, name: leagueName });
    setShowAnnouncementModal(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
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
            <h1 className="text-xl sm:text-2xl font-bold text-dark">
              Welcome to League Genius
            </h1>
            <p className="text-sm text-dark-300 mt-1">
              Get started by creating or joining a league
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {/* Add a League Card */}
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-8">
              <div className="bg-primary-100 p-4 rounded-lg w-fit mb-4">
                <Building2 className="h-8 w-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-dark mb-2">
                Create a League
              </h2>
              <p className="text-dark-300 mb-6">
                Start your own pool league and manage teams, matches, and
                standings.
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
              <h2 className="text-xl font-bold text-dark mb-2">
                Join a League
              </h2>
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
            <h3 className="font-semibold text-dark mb-2">
              Need help getting started?
            </h3>
            <p className="text-sm text-dark-300">
              Check out our documentation or contact support for assistance
              setting up your first league.
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
        <h1 className="text-xl sm:text-2xl font-bold text-dark">Dashboard</h1>
        <p className="text-sm text-dark-300 mt-1">Overview of your leagues</p>
      </div>

      {/* Your Leagues */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-dark mb-4">
          Your Leagues ({leagues.length})
        </h2>
        <div className="space-y-3">
          {leagues.map((league) => {
            const leagueSeasons = getSeasonsForLeague(league.id);
            const isExpanded = expandedLeagueId === league.id;

            return (
              <div
                key={league.id}
                className="border rounded-lg overflow-hidden"
              >
                {/* League Header - Clickable to expand */}
                <div
                  onClick={() => toggleLeagueExpand(league.id)}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark">
                        {league.name}
                        {league.is_operator && (
                          <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                            Operator
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-dark-300">
                        {league.city}, {league.state}
                        {leagueSeasons.length > 0 && (
                          <span className="ml-2 text-dark-400">
                            · {leagueSeasons.length} season
                            {leagueSeasons.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {league.is_operator && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnnouncementClick(league.id, league.name);
                        }}
                        className="btn btn-secondary btn-sm flex items-center"
                        title="Send announcement to all league members"
                      >
                        <Megaphone className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Announce</span>
                      </button>
                    )}
                    {league.is_operator && (
                      <Link
                        to="/admin/leagues"
                        onClick={(e) => e.stopPropagation()}
                        className="btn btn-outline btn-sm hidden sm:inline-flex"
                      >
                        Manage
                      </Link>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-dark-300" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-dark-300" />
                    )}
                  </div>
                </div>

                {/* Expanded Seasons Section */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-2 sm:p-4">
                    {leagueSeasons.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3">
                        {leagueSeasons.map((season, index) => {
                          const isCurrentSeason = index === 0;

                          return (
                            <React.Fragment key={season.id}>
                              {/* Season Card */}
                              <div
                                onClick={() =>
                                  handleSeasonClick(league.id, season.id)
                                }
                                className={`bg-white rounded-lg p-4 border hover:shadow-md transition-shadow cursor-pointer ${
                                  isCurrentSeason
                                    ? "ring-2 ring-primary-200"
                                    : ""
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold text-dark">
                                    {season.name}
                                    {isCurrentSeason && (
                                      <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                                        Current
                                      </span>
                                    )}
                                  </h4>
                                  <span
                                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                      season.is_active
                                        ? "bg-secondary-100 text-secondary-800"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {season.is_active ? "Active" : "Inactive"}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-dark-300">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  <span>
                                    {new Date(
                                      season.start_date
                                    ).toLocaleDateString()}
                                    {season.end_date && (
                                      <>
                                        {" "}
                                        -{" "}
                                        {new Date(
                                          season.end_date
                                        ).toLocaleDateString()}
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Current Season Cards (Next Match + View Matches) */}
                              {isCurrentSeason && (
                                <CurrentSeasonCards
                                  season={season}
                                  leagueId={league.id}
                                  userTeamIds={userTeamIds}
                                  setLeagueAndSeason={setLeagueAndSeason}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-dark-300 text-center py-2">
                        No seasons found for this league.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Create League Modal */}
      <CreateLeagueModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Create Announcement Modal */}
      {selectedLeague && (
        <CreateAnnouncementModal
          isOpen={showAnnouncementModal}
          onClose={() => {
            setShowAnnouncementModal(false);
            setSelectedLeague(null);
          }}
          leagueId={selectedLeague.id}
          leagueName={selectedLeague.name}
        />
      )}
    </div>
  );
};

export default DashboardPage;
