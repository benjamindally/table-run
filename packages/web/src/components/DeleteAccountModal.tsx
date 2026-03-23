import React, { useState } from "react";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { authApi } from "@league-genius/shared";
import { useAuth } from "../contexts/AuthContext";
import Modal from "./Modal";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { getAuthToken, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleClose = () => {
    if (isDeleting) return;
    setPassword("");
    setError("");
    onClose();
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Please enter your password to continue.");
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const token = getAuthToken();
      if (!token) {
        setError("You need to be logged in to do this.");
        return;
      }

      await authApi.deleteAccount(password, token);
      toast.success("Your account has been deleted. We're sorry to see you go.");
      await logout();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Delete Your Account" maxWidth="md">
      <form onSubmit={handleDelete}>
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-red-100 p-2 rounded-full flex-shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="text-sm text-dark-300 space-y-2">
            <p>
              We're sad to see you go! Before you continue, here's what will
              happen if you delete your account:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                Your personal data, player profile, stats, and team memberships
                will be permanently removed.
              </li>
              <li>
                Any teams where you're the only captain will be deactivated.
              </li>
              <li>
                Past match results you were part of will still be visible to
                other players, but your name will no longer be attached to them.
              </li>
            </ul>
            <p className="font-medium text-dark">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="delete-password"
            className="block text-sm font-medium text-dark mb-1"
          >
            Confirm your password
          </label>
          <div className="relative">
            <input
              id="delete-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter your password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 pr-10"
              disabled={isDeleting}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-dark-300 hover:text-dark"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-gray-300 rounded-lg text-dark-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Nevermind
          </button>
          <button
            type="submit"
            disabled={isDeleting || !password.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Deleting...
              </>
            ) : (
              "Delete My Account"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DeleteAccountModal;
