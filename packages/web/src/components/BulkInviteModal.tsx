import React from "react";
import { X, Mail, AlertTriangle } from "lucide-react";
import { UnclaimedPlayer } from "../api";

interface BulkInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  players: UnclaimedPlayer[];
  isLoading?: boolean;
}

const BulkInviteModal: React.FC<BulkInviteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  players,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Mail className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Send Bulk Invites
                  </h3>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-700">
                        This will send emails to all unclaimed players listed
                        below.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send {players.length} Email
                      {players.length !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkInviteModal;
