import React from "react";
import { PlayerNeedingActivation } from "../../api";
import { Mail, Copy } from "lucide-react";

interface PlayersNeedingActivationProps {
  players: PlayerNeedingActivation[];
  onSendActivation: (playerId: number, playerName: string) => void;
}

const PlayersNeedingActivation: React.FC<PlayersNeedingActivationProps> = ({
  players,
  onSendActivation,
}) => {
  if (players.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Mail className="h-5 w-5 text-orange-500" />
        Players Needing Activation ({players.length})
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        These players have placeholder accounts and need to set a real email and
        password.
      </p>
      <div className="space-y-3">
        {players.map((player) => (
          <div
            key={player.id}
            className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-gray-900">{player.full_name}</p>
              <p className="text-sm text-gray-600">
                Current: {player.user.email}
              </p>
              {player.invite_sent_at && (
                <p className="text-xs text-gray-500 mt-1">
                  Invite sent:{" "}
                  {new Date(player.invite_sent_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={() => onSendActivation(player.id, player.full_name)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {player.invite_sent_at ? "Resend" : "Send"} Activation
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayersNeedingActivation;
