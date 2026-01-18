import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import { playerClaimsApi, PlayerSearchResult } from "../api";
import { playersApi } from "../api/players";
import { PlayerUpdateData } from "../api/types";
import PendingClaimReviews from "../components/player-management/PendingClaimReviews";
import PlayersNeedingActivation from "../components/player-management/PlayersNeedingActivation";
import PlayersList from "../components/player-management/PlayersList";
import { usePlayerManagement } from "../hooks/usePlayerManagement";
import { User, Search } from "lucide-react";

const PlayerPage: React.FC = () => {
  const { user, player, accessToken, leagueData } = useAuth();

  // User search state (for users without player profiles)
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Determine user role
  const isLoggedIn = !!user;
  const hasPlayer = !!player;
  const isCaptain = hasPlayer && player.captain_of_teams.length > 0;
  const isLeagueOp = hasPlayer && leagueData.myLeagues.length > 0;
  const canManagePlayers = isCaptain || isLeagueOp;

  // Use player management hook for admin functionality
  const {
    allPlayers,
    pendingReviews,
    isLoading,
    isLoadingMore,
    hasMorePlayers,
    totalCount,
    loadMorePlayers,
    handleSendInvite,
    handleSendEmail,
    handleBulkInvite,
    handleApproveClaim,
    handleDenyClaim,
    // Search state from hook
    searchTerm: adminSearchTerm,
    setSearchTerm: setAdminSearchTerm,
    searchResults: adminSearchResults,
    isSearching: isAdminSearching,
    searchResultCount: adminSearchResultCount,
  } = usePlayerManagement({ accessToken, canManagePlayers });

  // Server-side search with debouncing (for everyone, including unauthenticated users)
  useEffect(() => {
    // Allow search for users without player profiles (both logged in and not logged in)
    if (hasPlayer) return;

    // Don't search if query is empty or too short
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    // Debounce the API call
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const response = await playerClaimsApi.searchPlayers(
          searchTerm.trim(),
          50,
          accessToken || undefined
        );
        console.log(response);
        setSearchResults(response.results);
      } catch (err: any) {
        console.error("Search error:", err);
        setSearchError(err.message || "Search failed");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, hasPlayer, accessToken]);

  const handleManualSearch = () => {
    if (!searchTerm.trim()) {
      toast.error("Please enter a name to search");
      return;
    }

    if (searchTerm.trim().length < 2) {
      toast.error("Please enter at least 2 characters to search");
      return;
    }

    // If no results after manual search button click, show specific message
    if (searchResults.length === 0 && !isSearching) {
      toast.info("No players found matching your search");
    }
  };

  const handleSaveReconciliation = async (reconciledData: PlayerUpdateData) => {
    if (!accessToken || !player || !user) return;

    try {
      // Update player data on backend (should update both player and user records)
      await playersApi.update(player.id, reconciledData, accessToken);

      // Fetch the updated player data from backend
      const updatedPlayer = await playersApi.getCurrentUser(accessToken);

      // Update localStorage with new player data so AuthContext has latest info
      localStorage.setItem("player", JSON.stringify(updatedPlayer));

      // Always update the user data in localStorage with the reconciled data
      // Keep username synced with email client-side
      const updatedUser = {
        ...user,
        username: reconciledData.email || user.email, // Username always matches email
        email: reconciledData.email || user.email,
        first_name: reconciledData.first_name || user.first_name,
        last_name: reconciledData.last_name || user.last_name,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Player information updated successfully!");

      // Reload the page to refresh AuthContext with updated data
      window.location.reload();
    } catch (err: any) {
      console.error("Error updating player data:", err);

      // Show detailed error message with support contact
      const errorMessage = err.message || "Failed to update player information";
      toast.error(
        `${errorMessage}. Please try again later or contact support at contact@leaguegenius.app`,
        {
          autoClose: 7000, // Longer duration for support message
        }
      );

      // Re-throw to prevent modal from closing
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading player data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {hasPlayer ? "Manage Players" : "Player Profiles"}
          </h1>
          <p className="text-gray-600">
            {!hasPlayer && "Search for and claim your player profile"}
            {hasPlayer && !canManagePlayers && "View your player profile"}
            {canManagePlayers && "Manage player invites and claim requests"}
          </p>
        </div>

        {/* My Player Profile (if user has player) */}
        {hasPlayer && player && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-full">
                <User className="h-8 w-8 text-orange-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {player.full_name}
                </h2>
                <p className="text-gray-600">{player?.user?.email || ""}</p>
                {player.phone && (
                  <p className="text-gray-600 text-sm">{player.phone}</p>
                )}
              </div>
            </div>

            {player.captain_of_teams.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Captain of:
                </p>
                <div className="flex flex-wrap gap-2">
                  {player.captain_of_teams.map((team) => (
                    <span
                      key={team.team_id}
                      className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
                    >
                      {team.team_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin Sections - Using shared components */}
        {canManagePlayers && (
          <div className="space-y-8">
            <PendingClaimReviews
              pendingReviews={pendingReviews}
              onApprove={handleApproveClaim}
              onDeny={handleDenyClaim}
            />

            <PlayersList
              players={allPlayers}
              isLeagueOp={isLeagueOp}
              totalCount={totalCount}
              hasMorePlayers={hasMorePlayers}
              isLoadingMore={isLoadingMore}
              onLoadMore={loadMorePlayers}
              onSendInvite={handleSendInvite}
              onSendEmail={handleSendEmail}
              onBulkInvite={handleBulkInvite}
              searchTerm={adminSearchTerm}
              setSearchTerm={setAdminSearchTerm}
              searchResults={adminSearchResults}
              isSearching={isAdminSearching}
              searchResultCount={adminSearchResultCount}
            />
          </div>
        )}

        {/* Player Search - View stats only */}
        {!hasPlayer && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-orange-500" />
              Search Players
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              Search for players to view their stats and league information.
            </p>

            {/* Search Box */}
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Start typing a player name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button
                onClick={handleManualSearch}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
              >
                Search
              </button>
            </div>

            {/* Search Results */}
            {searchTerm.trim() && searchTerm.trim().length < 2 && (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  Please enter at least 2 characters to search
                </p>
              </div>
            )}

            {searchTerm.trim() && searchTerm.trim().length >= 2 && (
              <div>
                {/* Loading State */}
                {isSearching && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-3 text-gray-600">Searching...</p>
                  </div>
                )}

                {/* Error State */}
                {!isSearching && searchError && (
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-2">Search failed</p>
                    <p className="text-sm text-gray-500">{searchError}</p>
                  </div>
                )}

                {/* No Results */}
                {!isSearching && !searchError && searchResults.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      No players found matching "{searchTerm}"
                    </p>
                    <p className="text-sm text-gray-500">
                      Try a different name or spelling.
                    </p>
                  </div>
                )}

                {/* Results List */}
                {!isSearching && !searchError && searchResults.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-3">
                      Found {searchResults.length} player
                      {searchResults.length !== 1 ? "s" : ""}
                    </p>
                    {searchResults.map((player) => (
                      <div
                        key={player.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {player.full_name}
                          </p>
                          {player.leagues.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {player.leagues.map((league, idx) => (
                                <p key={idx} className="text-sm text-gray-600">
                                  {league.league_name} - {league.season_name}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!searchTerm.trim() && (
              <div className="text-center py-8 text-gray-500">
                <p>Start typing to search for players</p>
                <p className="text-sm mt-2">
                  Results will appear as you type (minimum 2 characters)
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerPage;
