import React, { useState } from "react";
import Modal from "./Modal";
import { User, Mail, Phone, AlertTriangle } from "lucide-react";
import type { PlayerUpdateData } from "../api";

interface PlayerData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface ReconcilePlayerDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerData: PlayerData;
  userData: UserData;
  onSave: (reconciledData: PlayerUpdateData) => Promise<void>;
}

const ReconcilePlayerDataModal: React.FC<ReconcilePlayerDataModalProps> = ({
  isOpen,
  onClose,
  playerData,
  userData,
  onSave,
}) => {
  // State for form fields - prioritize player data as defaults
  const [firstName, setFirstName] = useState(
    playerData.first_name || userData.first_name
  );
  const [lastName, setLastName] = useState(
    playerData.last_name || userData.last_name
  );
  const [email, setEmail] = useState(playerData.email || userData.email);
  const [phone, setPhone] = useState(playerData.phone || "");
  const [isSaving, setIsSaving] = useState(false);

  // Detect conflicts
  const hasFirstNameConflict =
    playerData.first_name &&
    userData.first_name &&
    playerData.first_name !== userData.first_name;
  const hasLastNameConflict =
    playerData.last_name &&
    userData.last_name &&
    playerData.last_name !== userData.last_name;
  const hasEmailConflict =
    playerData.email && userData.email && playerData.email !== userData.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if email/username is changing
    const isChangingEmail = email !== userData.email;

    if (isChangingEmail) {
      // Show confirmation dialog
      const currentUsername = userData.username || userData.email;
      const confirmed = window.confirm(
        `Are you sure you want to change your username/email?\n\n` +
        `Current username: ${currentUsername}\n` +
        `New username: ${email}\n\n` +
        `This username is used to log in. You will need to use the new email address to log in next time.`
      );

      if (!confirmed) {
        return; // User canceled
      }
    }

    setIsSaving(true);

    try {
      await onSave({
        // Don't send username - let backend handle it
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      });
      onClose();
    } catch (error) {
      console.error("Error saving reconciled data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const ConflictBadge = ({
    playerValue,
    userValue,
  }: {
    playerValue: string;
    userValue: string;
  }) => (
    <div className="mt-1 flex items-center gap-1 text-xs text-amber-700">
      <AlertTriangle className="h-3 w-3" />
      <span>
        Player: <span className="font-medium">{playerValue}</span> | User:{" "}
        <span className="font-medium">{userValue}</span>
      </span>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Player Information"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit}>
        {/* Info box */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Please review and confirm the player information. Player record data
            is shown as the default.
          </p>
        </div>

        <div className="space-y-5">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {hasFirstNameConflict && (
              <ConflictBadge
                playerValue={playerData.first_name}
                userValue={userData.first_name}
              />
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {hasLastNameConflict && (
              <ConflictBadge
                playerValue={playerData.last_name}
                userValue={userData.last_name}
              />
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline h-4 w-4 mr-1" />
              Username/Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {hasEmailConflict && (
              <ConflictBadge
                playerValue={playerData.email}
                userValue={userData.email}
              />
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline h-4 w-4 mr-1" />
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Confirm & Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReconcilePlayerDataModal;
