import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { usePlayerManagement } from "../../hooks/usePlayerManagement";
import PendingClaimReviews from "../../components/player-management/PendingClaimReviews";
import PlayersNeedingActivation from "../../components/player-management/PlayersNeedingActivation";
import PlayersList from "../../components/player-management/PlayersList";

const AdminPlayersPage: React.FC = () => {
  const { accessToken, player, leagueData } = useAuth();

  // Determine user role
  const hasPlayer = !!player;
  const isCaptain = hasPlayer && player.captain_of_teams.length > 0;
  const isLeagueOp = hasPlayer && leagueData.myLeagues.length > 0;
  const canManagePlayers = isCaptain || isLeagueOp;

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

  if (!canManagePlayers) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-gray-600">
            You don't have permission to manage players.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Manage Players
        </h1>
        <p className="text-gray-600">
          Manage player invites, activations, and claim requests
        </p>
      </div>

      {/* Pending Claim Reviews */}
      <PendingClaimReviews
        pendingReviews={pendingReviews}
        onApprove={handleApproveClaim}
        onDeny={handleDenyClaim}
      />

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
      />
    </div>
  );
};

export default AdminPlayersPage;
