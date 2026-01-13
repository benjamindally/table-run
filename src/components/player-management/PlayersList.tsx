import React, { useState } from "react";
import { Player } from "../../api/types";
import { Users, Mail, Copy, Search, CheckCircle } from "lucide-react";
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
}) => {
  const [searchTerm, setSearchTerm] = useState("");
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

  // Filter players by search term
  const filteredPlayers = searchTerm.trim()
    ? players.filter((player: Player) => {
        const searchLower = searchTerm.toLowerCase().trim();
        const [firstName = "", lastName = ""] = player.full_name.split(" ");
        return (
          firstName.toLowerCase().startsWith(searchLower) ||
          lastName.toLowerCase().startsWith(searchLower)
        );
      })
    : players;

  // Count unclaimed players for bulk invite button
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
              All Players ({players.length} of {totalCount})
              {unclaimedCount > 0 && (
                <span className="text-sm font-normal text-gray-600">
                  • {unclaimedCount} unclaimed
                </span>
              )}
            </h2>
            {isLeagueOp && unclaimedCount > 0 && (
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
              placeholder="Filter by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {filteredPlayers.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            {searchTerm
              ? "No players found matching your filter"
              : "No players available"}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredPlayers.map((player) => (
              <div
                key={player.id}
                className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
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
                  {!player.is_claimed && player.invite_sent_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Invite sent:{" "}
                      {new Date(player.invite_sent_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Only show invite buttons for unclaimed players */}
                {!player.is_claimed && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSendInvite(player.id, player.full_name)}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Invite Link
                    </button>
                    <button
                      onClick={() =>
                        handleOpenEmailModal(player.id, player.full_name)
                      }
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

        {/* Load More Button */}
        {hasMorePlayers && !searchTerm && (
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
