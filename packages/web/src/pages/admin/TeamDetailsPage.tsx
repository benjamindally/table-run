import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Users,
  Trophy,
  Calendar,
  Mail,
  MapPin,
  X,
  Check,
} from "lucide-react";
import { useTeam, useTeamRoster, useTeamSeasons } from "../../hooks/useTeams";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { teamsApi } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-toastify";
import { teamsKeys } from "../../hooks/useTeams";

const TeamDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const teamId = parseInt(id || "0");
  const { getAuthToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: team, isLoading, error } = useTeam(teamId);
  const { data: roster } = useTeamRoster(teamId);
  const { data: seasons } = useTeamSeasons(teamId);

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedEstablishment, setEditedEstablishment] = useState("");
  const [editedActive, setEditedActive] = useState(true);
  const [showCaptainModal, setShowCaptainModal] = useState(false);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: {
      name: string;
      establishment: string;
      active: boolean;
    }) => teamsApi.update(teamId, data, getAuthToken() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.detail(teamId) });
      toast.success("Team updated successfully!");
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update team");
    },
  });

  // Add captain mutation
  const addCaptainMutation = useMutation({
    mutationFn: (playerId: number) =>
      teamsApi.addCaptain(teamId, playerId, getAuthToken() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: teamsKeys.roster(teamId) });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add captain");
    },
  });

  // Remove captain mutation
  const removeCaptainMutation = useMutation({
    mutationFn: (playerId: number) =>
      teamsApi.removeCaptain(teamId, playerId, getAuthToken() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: teamsKeys.roster(teamId) });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove captain");
    },
  });

  const handleEdit = () => {
    if (team) {
      setEditedName(team.name);
      setEditedEstablishment(team.establishment);
      setEditedActive(team.active);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      name: editedName,
      establishment: editedEstablishment,
      active: editedActive,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleToggleCaptain = async (playerId: number, isCaptain: boolean) => {
    if (isCaptain) {
      // Removing captain - show confirmation
      const playerName = roster?.find((m) => m.player === playerId)
        ?.player_detail?.full_name;
      const confirmed = window.confirm(
        `Remove ${playerName} as captain? They will no longer be able to enter scores during matches or manage team settings.`
      );

      if (confirmed) {
        await removeCaptainMutation.mutateAsync(playerId);
        toast.success("Captain removed successfully!");
      }
    } else {
      // Adding captain
      await addCaptainMutation.mutateAsync(playerId);
      toast.success("Captain added successfully!");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500">Loading team details...</div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Failed to load team details. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline btn-sm flex items-center justify-center sm:justify-start w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-dark">{team.name}</h1>
            <p className="text-sm text-dark-300 mt-1">
              <MapPin className="h-4 w-4 inline mr-1" />
              {team.establishment}
            </p>
          </div>
        </div>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="btn btn-primary btn-sm flex items-center justify-center w-full sm:w-auto"
          >
            <Edit className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Edit Team</span>
            <span className="sm:hidden ml-1">Edit</span>
          </button>
        ) : (
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="btn btn-primary btn-sm flex items-center justify-center flex-1 sm:flex-none"
            >
              <Check className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              onClick={handleCancel}
              disabled={updateMutation.isPending}
              className="btn btn-outline btn-sm flex items-center justify-center flex-1 sm:flex-none"
            >
              <X className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
          </div>
        )}
      </div>

      {/* Team Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-dark mb-4">
          Team Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">
              Team Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-lg font-semibold text-dark">{team.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">
              Establishment
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedEstablishment}
                onChange={(e) => setEditedEstablishment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-lg font-semibold text-dark">
                {team.establishment}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">
              Status
            </label>
            {isEditing ? (
              <select
                value={editedActive ? "active" : "inactive"}
                onChange={(e) => setEditedActive(e.target.value === "active")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            ) : (
              <span
                className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                  team.active
                    ? "bg-secondary-100 text-secondary-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {team.active ? "Active" : "Inactive"}
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">
              Created
            </label>
            <p className="text-lg font-semibold text-dark">
              {new Date(team.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Team Captains */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dark">Team Leadership</h2>
          <button
            onClick={() => setShowCaptainModal(true)}
            className="btn btn-primary btn-sm"
          >
            Manage Captains
          </button>
        </div>
        {team.captains_detail && team.captains_detail.length > 0 ? (
          <div className="space-y-3">
            {team.captains_detail.map((captain) => (
              <div
                key={captain.id}
                className="flex items-center justify-between p-4 border border-cream-400 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-dark">
                      {captain.player_detail?.full_name}
                    </p>
                    <p className="text-sm text-dark-300">Captain</p>
                  </div>
                </div>
                <div className="text-sm text-dark-300">
                  Appointed{" "}
                  {new Date(captain.appointed_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-dark-300">
            No captains assigned yet.
          </div>
        )}
      </div>

      {/* Team Roster */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dark">Team Roster</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-dark-300">
              {roster?.length || 0}{" "}
              {roster?.length === 1 ? "Player" : "Players"}
            </span>
            <button className="btn btn-primary btn-sm">Add Player</button>
          </div>
        </div>
        {roster && roster.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {roster.map((membership) => (
                <div
                  key={membership.id}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary-600">
                          {membership.player_detail?.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-dark truncate">
                          {membership.player_detail?.full_name}
                        </p>
                        <p className="text-xs text-dark-300 truncate">
                          {membership.player_detail?.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                        membership.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {membership.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-dark-300">
                      Joined {new Date(membership.joined_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() =>
                        navigate(`/admin/players/${membership.player}`)
                      }
                      className="btn btn-outline btn-sm"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Player
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roster.map((membership) => (
                    <tr key={membership.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary-600">
                              {membership.player_detail?.full_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-dark">
                              {membership.player_detail?.full_name}
                            </p>
                            <p className="text-sm text-dark-300">
                              ID: {membership.player_detail?.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center text-sm text-dark-300">
                          <Mail className="h-4 w-4 mr-2" />
                          {membership.player_detail?.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-dark-300">
                        {new Date(membership.joined_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            membership.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {membership.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            navigate(`/admin/players/${membership.player}`)
                          }
                          className="btn btn-outline btn-sm"
                        >
                          View Player
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-dark-300">
            No players on the roster yet. Add players to get started.
          </div>
        )}
      </div>

      {/* Season Participations */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dark">Season History</h2>
          {seasons && (
            <span className="text-sm text-dark-300">
              {seasons.length} {seasons.length === 1 ? "Season" : "Seasons"}
            </span>
          )}
        </div>
        {seasons && seasons.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {seasons.map((participation) => (
                <div
                  key={participation.id}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-dark-300 flex-shrink-0" />
                        <span className="font-medium text-dark truncate">
                          {participation.season_detail?.name}
                        </span>
                      </div>
                      <p className="text-xs text-dark-300 mt-1 truncate">
                        {participation.season_detail?.league_name}
                      </p>
                    </div>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                        participation.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {participation.is_active ? "Active" : "Completed"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Record</p>
                        <p className="text-sm font-semibold">
                          <span className="text-green-600">{participation.wins}</span>
                          {" - "}
                          <span className="text-red-600">{participation.losses}</span>
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Win %</p>
                        <p className="text-sm font-medium">
                          {participation.win_percentage?.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        navigate(`/admin/seasons/${participation.season}`)
                      }
                      className="btn btn-outline btn-sm"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Season
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      League
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      W
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      L
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Win %
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      <Trophy className="h-3 w-3 inline mr-1" />
                      Place
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {seasons.map((participation) => (
                    <tr key={participation.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-dark-300" />
                          <span className="font-medium text-dark">
                            {participation.season_detail?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-300">
                        {participation.season_detail?.league_name}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">
                        {participation.wins}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-red-600">
                        {participation.losses}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {participation.win_percentage?.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span className="text-gray-400">-</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            participation.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {participation.is_active ? "Active" : "Completed"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            navigate(`/admin/seasons/${participation.season}`)
                          }
                          className="btn btn-outline btn-sm"
                        >
                          View Season
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-dark-300">
            This team hasn't completed in any seasons of record.
          </div>
        )}
      </div>

      {/* Manage Captains Modal */}
      {showCaptainModal && roster && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-[95vw] sm:max-w-2xl w-full mx-2 sm:mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-dark">
                Manage Team Captains
              </h3>
              <button
                onClick={() => setShowCaptainModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-dark-300 mb-4">
                Select team members to promote to captain. Captains can enter
                scores during matches and manage team settings.
              </p>

              <div className="space-y-2">
                {roster.map((membership) => {
                  const isCaptain =
                    team.captains_detail?.some(
                      (c) => c.player === membership.player
                    ) || false;

                  return (
                    <div
                      key={membership.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary-600">
                            {membership.player_detail?.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-dark">
                            {membership.player_detail?.full_name}
                          </p>
                          <p className="text-sm text-dark-300">
                            {membership.player_detail?.email}
                          </p>
                        </div>
                      </div>

                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isCaptain}
                          onChange={() =>
                            handleToggleCaptain(membership.player, isCaptain)
                          }
                          disabled={
                            addCaptainMutation.isPending ||
                            removeCaptainMutation.isPending
                          }
                          className="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-dark">
                          {isCaptain ? "Captain" : "Make Captain"}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowCaptainModal(false)}
                className="btn btn-outline btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetailsPage;
