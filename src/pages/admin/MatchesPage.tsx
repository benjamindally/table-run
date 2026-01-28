import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, AlertCircle, MapPin, Users, Edit2 } from "lucide-react";
import { useMe } from "../../hooks/useMe";
import { useSeasons } from "../../hooks/useSeasons";
import { useSeasonMatches } from "../../hooks/useSeasons";
import { useCurrentTeams } from "../../hooks/usePlayers";
import { useAuth } from "../../contexts/AuthContext";
import { useLeagueSeason } from "../../contexts/LeagueSeasonContext";
import SeasonMatches from "../../components/seasons/SeasonMatches";
import LeagueSeasonSelectorModal from "../../components/LeagueSeasonSelectorModal";
import type { Match } from "../../api/types";

const MatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: meData, isLoading: meLoading } = useMe();
  const { data: allSeasonsData, isLoading: seasonsLoading } = useSeasons();
  const { data: currentTeams } = useCurrentTeams();
  const { leagueData } = useAuth();
  const { currentLeagueId, currentSeasonId, setLeagueAndSeason } = useLeagueSeason();

  const myLeagues = meData?.leagues || [];
  const allSeasons = allSeasonsData?.results || [];

  // State for selected league and season - initialize from context
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(currentLeagueId);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(currentSeasonId);
  const [showSelectorModal, setShowSelectorModal] = useState(false);

  // Get selected league and season objects
  const selectedLeague = useMemo(() => {
    return myLeagues.find((league) => league.id === selectedLeagueId);
  }, [myLeagues, selectedLeagueId]);

  const selectedSeason = useMemo(() => {
    return allSeasons.find((season) => season.id === selectedSeasonId);
  }, [allSeasons, selectedSeasonId]);

  // Filter seasons by selected league
  const filteredSeasons = useMemo(() => {
    if (!selectedLeagueId) return [];
    return allSeasons.filter(
      (season) => season.league === selectedLeagueId && season.is_active
    );
  }, [selectedLeagueId, allSeasons]);

  // Fetch matches for selected season
  const {
    data: matchesData,
    isLoading: matchesLoading,
  } = useSeasonMatches(selectedSeasonId || 0);

  // Sync from context when it has values (e.g., navigating from dashboard)
  useEffect(() => {
    if (currentLeagueId && currentSeasonId) {
      setSelectedLeagueId(currentLeagueId);
      setSelectedSeasonId(currentSeasonId);
    }
  }, [currentLeagueId, currentSeasonId]);

  // Auto-select first league and season on load (only if context doesn't have values)
  useEffect(() => {
    if (myLeagues.length > 0 && !selectedLeagueId && !currentLeagueId) {
      setSelectedLeagueId(myLeagues[0].id);
    }
  }, [myLeagues, selectedLeagueId, currentLeagueId]);

  useEffect(() => {
    if (filteredSeasons.length > 0 && !selectedSeasonId && !currentSeasonId) {
      setSelectedSeasonId(filteredSeasons[0].id);
    }
  }, [filteredSeasons, selectedSeasonId, currentSeasonId]);

  // Check if user is a league operator for the selected league
  const isLeagueOperator = selectedLeagueId
    ? leagueData.isLeagueOperator(selectedLeagueId)
    : false;

  // Get user's team IDs (teams where they are a captain)
  const userTeamIds = useMemo(() => {
    return currentTeams?.map((team) => team.id) || [];
  }, [currentTeams]);

  // Sort matches by date (everyone can see all matches, editing is permission-based)
  const displayMatches = useMemo(() => {
    if (!matchesData) return [];

    // Sort by date (upcoming first, then by week_number)
    return [...matchesData].sort((a: Match, b: Match) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      // First sort by date
      if (dateA !== dateB) return dateA - dateB;

      // Then by week number
      return (a.week_number || 0) - (b.week_number || 0);
    });
  }, [matchesData]);

  // Check if a match involves one of the user's teams (for highlighting)
  const isUserTeamMatch = (match: Match): boolean => {
    if (userTeamIds.length === 0) return false;
    return userTeamIds.includes(match.home_team) || userTeamIds.includes(match.away_team);
  };

  // Handle match click - navigate to match score page
  const handleMatchClick = (match: Match) => {
    navigate(`/admin/matches/${match.id}/score`);
  };

  // Handle league/season selection from modal
  const handleLeagueSeasonSelect = (leagueId: number, seasonId: number) => {
    setSelectedLeagueId(leagueId);
    setSelectedSeasonId(seasonId);
    setLeagueAndSeason(leagueId, seasonId);
  };

  // Loading state
  if (meLoading || seasonsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-dark">Matches</h1>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  // No leagues - show empty state
  if (myLeagues.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-dark">Matches</h1>
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-cream-200 p-4 rounded-full mb-4">
              <Calendar className="h-12 w-12 text-dark-300" />
            </div>
            <h2 className="text-xl font-semibold text-dark mb-2">
              No Leagues Found
            </h2>
            <p className="text-dark-300 text-center max-w-md mb-6">
              You're not associated with any leagues yet. Join a team or contact
              your league operator to get access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No active seasons for selected league
  const showNoSeasonsMessage = selectedLeagueId && filteredSeasons.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark">Matches</h1>
        <p className="text-sm text-dark-300 mt-1">
          View and manage matches across your leagues
        </p>
      </div>

      {/* Current Selection Card */}
      {selectedLeague && selectedSeason && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-dark mb-1">
                {selectedLeague.name}
              </h2>
              <p className="text-sm text-dark-300">{selectedSeason.name}</p>
            </div>
            <button
              onClick={() => setShowSelectorModal(true)}
              className="btn btn-outline btn-sm flex items-center"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Change
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* League Info */}
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-dark-300" />
                <span className="text-dark-300 mr-2">Location:</span>
                <span className="font-medium text-dark">
                  {selectedLeague.city}, {selectedLeague.state}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-dark-300" />
                <span className="text-dark-300 mr-2">Active Seasons:</span>
                <span className="font-medium text-dark">
                  {filteredSeasons.length}
                </span>
              </div>
            </div>

            {/* Season Info */}
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-dark-300" />
                <span className="text-dark-300 mr-2">Start Date:</span>
                <span className="font-medium text-dark">
                  {new Date(selectedSeason.start_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2 text-dark-300" />
                <span className="text-dark-300 mr-2">Teams:</span>
                <span className="font-medium text-dark">
                  {selectedSeason.team_count || 0}
                </span>
              </div>
            </div>
          </div>

          {/* User Role Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                {isLeagueOperator ? (
                  <p>
                    <strong>League Operator:</strong> You can view all matches
                    and enter scores for any match.
                  </p>
                ) : userTeamIds.length > 0 ? (
                  <p>
                    <strong>Team Captain:</strong> You can view and enter scores
                    for matches involving your teams.
                  </p>
                ) : (
                  <p>
                    <strong>Player:</strong> You can view all matches but cannot
                    enter scores. Contact your team captain or league operator
                    for score entry.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prompt to select if nothing selected yet */}
      {(!selectedLeague || !selectedSeason) && !showNoSeasonsMessage && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-primary-100 p-4 rounded-full mb-4">
              <Calendar className="h-12 w-12 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-dark mb-2">
              Select a League and Season
            </h2>
            <p className="text-dark-300 text-center max-w-md mb-6">
              Choose a league and season to view and manage matches.
            </p>
            <button
              onClick={() => setShowSelectorModal(true)}
              className="btn btn-primary"
            >
              Select League & Season
            </button>
          </div>
        </div>
      )}

      {/* No seasons message */}
      {showNoSeasonsMessage && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-cream-200 p-4 rounded-full mb-4">
              <Calendar className="h-12 w-12 text-dark-300" />
            </div>
            <h2 className="text-xl font-semibold text-dark mb-2">
              No Active Seasons
            </h2>
            <p className="text-dark-300 text-center max-w-md mb-4">
              The selected league doesn't have any active seasons yet.
            </p>
            <button
              onClick={() => setShowSelectorModal(true)}
              className="btn btn-outline"
            >
              Select Different League
            </button>
          </div>
        </div>
      )}

      {/* Matches Display */}
      {selectedSeasonId && !showNoSeasonsMessage && (
        <>
          {matchesLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-500">Loading matches...</div>
            </div>
          ) : (
            <SeasonMatches
              matches={displayMatches}
              editable={() => true}
              onEditMatch={handleMatchClick}
              initialWeeksToShow={4}
              isUserTeamMatch={isUserTeamMatch}
            />
          )}
        </>
      )}

      {/* League/Season Selector Modal */}
      <LeagueSeasonSelectorModal
        isOpen={showSelectorModal}
        onClose={() => setShowSelectorModal(false)}
        leagues={myLeagues}
        allSeasons={allSeasons}
        currentLeagueId={selectedLeagueId}
        currentSeasonId={selectedSeasonId}
        onSelect={handleLeagueSeasonSelect}
      />
    </div>
  );
};

export default MatchesPage;
