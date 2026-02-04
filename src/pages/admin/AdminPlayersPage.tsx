import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { usePlayerManagement } from "../../hooks/usePlayerManagement";
import PendingClaimReviews from "../../components/player-management/PendingClaimReviews";
import PlayersNeedingActivation from "../../components/player-management/PlayersNeedingActivation";
import PlayersList from "../../components/player-management/PlayersList";
import type { Player } from "../../api/types";

const AdminPlayersPage: React.FC = () => {
  const { accessToken, player, leagueData } = useAuth();

  // Determine user role
  const hasPlayer = !!player;
  const isCaptain = hasPlayer && player.captain_of_teams.length > 0;
  const isLeagueOp = hasPlayer && leagueData.myLeagues.length > 0;
  const canManagePlayers = isCaptain || isLeagueOp;

  // Check if user can edit a specific player
  // League ops can edit all players
  // Team captains would need team membership data on Player type to check (future enhancement)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const canEditPlayer = (playerToEdit: Player): boolean => {
    // League operators can edit all players
    if (isLeagueOp) return true;
    // For now, only league ops can edit - team captain editing requires
    // team membership info on the Player type
    return false;
  };

  const {
    allPlayers,
    playersNeedingActivation,
    pendingReviews,
    isLoading,
    isLoadingMore,
    hasMorePlayers,
    totalCount,
    loadMorePlayers,
    handleSendInvite,
    handleSendEmail,
    handleSendActivation,
    handleBulkInvite,
    handleApproveClaim,
    handleDenyClaim,
    // Search state
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    searchResultCount,
  } = usePlayerManagement({ accessToken, canManagePlayers });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading player data...</p>
        </div>
      </div>
    );
  }

  // Anyone with a player profile can view players in their league (read-only)
  // Only league ops and team captains can edit
  if (!hasPlayer) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-gray-600">
            You need a player profile to view players.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {canManagePlayers ? "Manage Players" : "Player Directory"}
        </h1>
        <p className="text-gray-600">
          {canManagePlayers
            ? "Manage player invites, activations, and claim requests"
            : "Browse players in your league"}
        </p>
      </div>

      {/* Pending Claim Reviews - Only for managers */}
      {canManagePlayers && (
        <PendingClaimReviews
          pendingReviews={pendingReviews}
          onApprove={handleApproveClaim}
          onDeny={handleDenyClaim}
        />
      )}

      {/* All Players List */}
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
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchResults={searchResults}
        isSearching={isSearching}
        searchResultCount={searchResultCount}
        canEditPlayer={canEditPlayer}
      />
    </div>
  );
};

export default AdminPlayersPage;
