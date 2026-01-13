import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  playerClaimsApi,
  PlayerNeedingActivation,
  PlayerClaimRequest,
} from "../api";
import { playersApi } from "../api/players";
import { Player } from "../api/types";

interface UsePlayerManagementProps {
  accessToken: string | null;
  canManagePlayers: boolean;
}

export const usePlayerManagement = ({
  accessToken,
  canManagePlayers,
}: UsePlayerManagementProps) => {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [playersNeedingActivation, setPlayersNeedingActivation] = useState<
    PlayerNeedingActivation[]
  >([]);
  const [pendingReviews, setPendingReviews] = useState<PlayerClaimRequest[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (canManagePlayers && accessToken) {
        // Fetch all players
        const playersResponse = await playersApi.getAll(accessToken);
        setAllPlayers(playersResponse.results);
        setNextPageUrl(playersResponse.next);
        setTotalCount(playersResponse.count);

        // Fetch players needing activation
        const needsActivation =
          await playerClaimsApi.getPlayersNeedingActivation();
        setPlayersNeedingActivation(needsActivation);

        // Fetch pending reviews
        const reviews = await playerClaimsApi.getPendingReviews(accessToken);
        setPendingReviews(reviews);
      }
    } catch (err: any) {
      console.error("Error loading player data:", err);
      toast.error("Failed to load player data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePlayers = async () => {
    if (!nextPageUrl || !accessToken || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      // Make request to the next page URL
      const response = await fetch(nextPageUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load more players');
      }

      const data = await response.json();
      setAllPlayers((prev) => [...prev, ...data.results]);
      setNextPageUrl(data.next);
    } catch (err: any) {
      console.error("Error loading more players:", err);
      toast.error("Failed to load more players");
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, canManagePlayers]);

  const handleSendInvite = async (playerId: number, playerName: string) => {
    if (!accessToken) return;

    try {
      const response = await playerClaimsApi.sendInvite(playerId, accessToken);

      await navigator.clipboard.writeText(response.reset_link);
      toast.success(
        `Password reset link copied for ${playerName}! Valid for ${response.expires_in}.`,
        {
          autoClose: 5000,
        }
      );

      loadData();
    } catch (err: any) {
      console.error("Error sending invite:", err);
      toast.error(err.message || "Failed to send invite");
    }
  };

  const handleSendEmail = async (playerId: number, playerName: string) => {
    if (!accessToken) return;

    try {
      const response = await playerClaimsApi.sendInvite(
        playerId,
        accessToken,
        true // Send email
      );

      toast.success(
        `Email sent to ${playerName}! Valid for ${response.expires_in}.`,
        {
          autoClose: 5000,
        }
      );

      loadData();
    } catch (err: any) {
      console.error("Error sending email:", err);
      toast.error(err.message || "Failed to send email");
      throw err;
    }
  };

  const handleSendActivation = async (playerId: number, playerName: string) => {
    if (!accessToken) return;

    try {
      const response = await playerClaimsApi.sendActivation(
        playerId,
        accessToken
      );
      const activationLink = `${window.location.origin}/activate-player/${response.invite_token}`;

      await navigator.clipboard.writeText(activationLink);
      toast.success(`Activation link copied for ${playerName}!`);

      loadData();
    } catch (err: any) {
      console.error("Error sending activation:", err);
      toast.error(err.message || "Failed to send activation link");
    }
  };

  const handleBulkInvite = async () => {
    if (!accessToken) return;

    try {
      const response = await playerClaimsApi.sendBulkInvites(accessToken, true);

      toast.success(
        `Successfully sent ${response.sent_count} email${
          response.sent_count !== 1 ? "s" : ""
        }!` +
          (response.failed_count > 0
            ? ` ${response.failed_count} failed.`
            : ""),
        { autoClose: 5000 }
      );

      loadData();
    } catch (err: any) {
      console.error("Error sending bulk invites:", err);
      toast.error(err.message || "Failed to send bulk invites");
      throw err;
    }
  };

  const handleApproveClaim = async (requestId: number) => {
    if (!accessToken) return;

    try {
      await playerClaimsApi.approveClaimRequest(requestId, accessToken);
      toast.success("Claim request approved!");
      loadData();
    } catch (err: any) {
      console.error("Error approving claim:", err);
      toast.error(err.message || "Failed to approve claim");
    }
  };

  const handleDenyClaim = async (requestId: number) => {
    if (!accessToken) return;

    if (!confirm("Are you sure you want to deny this claim request?")) return;

    try {
      await playerClaimsApi.denyClaimRequest(requestId, accessToken);
      toast.success("Claim request denied");
      loadData();
    } catch (err: any) {
      console.error("Error denying claim:", err);
      toast.error(err.message || "Failed to deny claim");
    }
  };

  return {
    allPlayers,
    playersNeedingActivation,
    pendingReviews,
    isLoading,
    isLoadingMore,
    hasMorePlayers: !!nextPageUrl,
    totalCount,
    loadData,
    loadMorePlayers,
    handleSendInvite,
    handleSendEmail,
    handleSendActivation,
    handleBulkInvite,
    handleApproveClaim,
    handleDenyClaim,
  };
};
