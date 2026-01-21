import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Player } from "../../api/types";
import { Users, Mail, Copy, Search, CheckCircle, X } from "lucide-react";
import BulkInviteModal from "../BulkInviteModal";
import SendEmailConfirmModal from "../SendEmailConfirmModal";

interface PlayersListProps {
  players: Player[];
  isLeagueOp: boolean;
  totalCount: number;
  hasMorePlayers: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<void>;
  onSendInvite: (playerId: number, playerName: string) => void;
  onSendEmail: (playerId: number, playerName: string) => Promise<void>;
  onBulkInvite: () => Promise<void>;
  // Search props
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: Player[];
  isSearching: boolean;
  searchResultCount: number;
  // Permission check for editing individual players (team captains can edit their team's players)
  canEditPlayer?: (player: Player) => boolean;
}

const PlayersList: React.FC<PlayersListProps> = ({
  players,
  isLeagueOp,
  totalCount,
  hasMorePlayers,
  isLoadingMore,
  onLoadMore,
  onSendInvite,
  onSendEmail,
  onBulkInvite,
  searchTerm,
  setSearchTerm,
  searchResults,
  isSearching,
  searchResultCount,
  canEditPlayer,
}) => {
  const navigate = useNavigate();
  const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
  const [isSendingBulkInvites, setIsSendingBulkInvites] = useState(false);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [selectedPlayerForEmail, setSelectedPlayerForEmail] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleOpenEmailModal = (playerId: number, playerName: string) => {
    setSelectedPlayerForEmail({ id: playerId, name: playerName });
    setShowSendEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!selectedPlayerForEmail) return;

    setIsSendingEmail(true);
    try {
      await onSendEmail(selectedPlayerForEmail.id, selectedPlayerForEmail.name);
      setShowSendEmailModal(false);
      setSelectedPlayerForEmail(null);
    } catch (err) {
      // Error already handled in hook
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleBulkInvite = async () => {
    setIsSendingBulkInvites(true);
    try {
      await onBulkInvite();
      setShowBulkInviteModal(false);
    } catch (err) {
      // Error already handled in hook
    } finally {
      setIsSendingBulkInvites(false);
    }
  };

  // Determine if we're in search mode
  const safeSearchTerm = searchTerm || "";
  const isSearchMode = safeSearchTerm.trim().length >= 2;
  const isSearchActive = safeSearchTerm.trim().length > 0;

  // Use search results when searching, otherwise use paginated players
  const displayPlayers = isSearchMode ? searchResults : players;
  const displayCount = isSearchMode ? searchResultCount : totalCount;

  // Count unclaimed players for bulk invite button (only from paginated list, not search)
  const unclaimedCount = players.filter((p) => !p.is_claimed).length;

  // For the bulk invite modal, we only want unclaimed players
  const unclaimedPlayersForModal = players
    .filter((p) => !p.is_claimed)
    .map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      first_name: p.first_name,
      last_name: p.last_name,
      phone: p.phone,
      is_claimed: p.is_claimed,
      needs_activation: p.needs_activation,
      invite_token: p.invite_token,
      invite_sent_at: p.invite_sent_at,
      user: null,
    }));

  return (
    <>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              {isSearchMode ? (
                <>
                  Search Results ({displayPlayers.length} of {displayCount})
                </>
              ) : (
                <>
                  All Players ({players.length} of {totalCount})
                  {isLeagueOp && unclaimedCount > 0 && (
                    <span className="text-sm font-normal text-gray-600">
                      • {unclaimedCount} unclaimed
                    </span>
                  )}
                </>
              )}
            </h2>
            {isLeagueOp && unclaimedCount > 0 && !isSearchMode && (
              <button
                onClick={() => setShowBulkInviteModal(true)}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Send All Invites ({unclaimedCount})
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search all players by name..."
              value={safeSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {safeSearchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {isSearchMode && (
            <p className="text-sm text-gray-600 mt-2">
              {isSearching ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500"></div>
                  Searching all players...
                </span>
              ) : (
                `Showing results for "${safeSearchTerm}"`
              )}
            </p>
          )}
        </div>

        {isSearching ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">Searching...</p>
          </div>
        ) : displayPlayers.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            {isSearchMode
              ? `No players found matching "${safeSearchTerm}"`
              : "No players available"}
          </p>
        ) : (
          <div className="space-y-3">
            {displayPlayers.map((player: Player) => (
              <div
                key={player.id}
                onClick={() => navigate(`/admin/players/${player.id}`)}
                className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {player.full_name}
                    </p>
                    {player.is_claimed && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        Claimed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{player.email}</p>
                  {player.phone && (
                    <p className="text-sm text-gray-600">{player.phone}</p>
                  )}
                  {player.is_claimed && player.user && (
                    <p className="text-xs text-gray-500 mt-1">
                      User: {player.user.email}
                    </p>
                  )}
                  {isLeagueOp && !player.is_claimed && player.invite_sent_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Invite sent:{" "}
                      {new Date(player.invite_sent_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Only show invite buttons for unclaimed players if user has edit permission */}
                {!player.is_claimed &&
                  (canEditPlayer ? canEditPlayer(player) : isLeagueOp) && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendInvite(player.id, player.full_name);
                        }}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Invite Link
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEmailModal(player.id, player.full_name);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Send Email
                      </button>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}

        {/* Load More Button - only in browse mode */}
        {!isSearchMode && hasMorePlayers && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Loading...
                </>
              ) : (
                <>Load More Players</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bulk Invite Modal */}
      <BulkInviteModal
        isOpen={showBulkInviteModal}
        onClose={() => setShowBulkInviteModal(false)}
        onConfirm={handleBulkInvite}
        players={unclaimedPlayersForModal}
        isLoading={isSendingBulkInvites}
      />

      {/* Send Email Confirmation Modal */}
      <SendEmailConfirmModal
        isOpen={showSendEmailModal}
        onClose={() => {
          setShowSendEmailModal(false);
          setSelectedPlayerForEmail(null);
        }}
        onConfirm={handleSendEmail}
        playerName={selectedPlayerForEmail?.name || ""}
        isLoading={isSendingEmail}
      />
    </>
  );
};

export default PlayersList;
