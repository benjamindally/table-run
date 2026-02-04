import React, { useState } from "react";
import { Search, Download, Plus, Edit, Trash2, Info, X } from "lucide-react";

interface Team {
  id: number;
  name: string;
  establishment: string;
  captain: string;
  players: number;
  wins: number;
  losses: number;
  active: boolean;
}

const TeamsPage: React.FC = () => {
  // Sample teams data
  const teamData: Team[] = [
    {
      id: 1,
      name: "Cue Masters",
      establishment: "Corner Pocket Bar & Grill",
      captain: "John Smith",
      players: 8,
      wins: 18,
      losses: 2,
      active: true,
    },
    {
      id: 2,
      name: "Chalk & Awe",
      establishment: "The Billiards Club",
      captain: "Sarah Johnson",
      players: 7,
      wins: 16,
      losses: 4,
      active: true,
    },
    {
      id: 3,
      name: "break Point",
      establishment: "Shark's Pool Hall",
      captain: "Mike Wilson",
      players: 8,
      wins: 15,
      losses: 5,
      active: true,
    },
    {
      id: 4,
      name: "Straight Shooters",
      establishment: "Sully's Pub",
      captain: "Lisa Brown",
      players: 6,
      wins: 13,
      losses: 7,
      active: true,
    },
    {
      id: 5,
      name: "8-Ball Wizards",
      establishment: "Rack & Roll",
      captain: "Dave Miller",
      players: 8,
      wins: 12,
      losses: 8,
      active: true,
    },
    {
      id: 6,
      name: "Corner Pocket",
      establishment: "The 8-Ball Lounge",
      captain: "Robert Jones",
      players: 6,
      wins: 10,
      losses: 10,
      active: true,
    },
    {
      id: 7,
      name: "Ball Busters",
      establishment: "Shooter's Place",
      captain: "Amanda Lee",
      players: 7,
      wins: 9,
      losses: 11,
      active: true,
    },
    {
      id: 8,
      name: "Rack 'em Up",
      establishment: "Corner Pocket Bar & Grill",
      captain: "Thomas Clark",
      players: 5,
      wins: 8,
      losses: 12,
      active: true,
    },
    {
      id: 9,
      name: "Stick Wizards",
      establishment: "The Billiards Club",
      captain: "Jennifer Adams",
      players: 6,
      wins: 7,
      losses: 13,
      active: false,
    },
    {
      id: 10,
      name: "Pool Sharks",
      establishment: "Shark's Pool Hall",
      captain: "Steve Martin",
      players: 8,
      wins: 5,
      losses: 15,
      active: false,
    },
  ];

  const [teams, setTeams] = useState<Team[]>(teamData);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [establishmentFilter, setEstablishmentFilter] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  // Get unique establishments for filter dropdown
  const establishments = Array.from(
    new Set(teamData.map((team) => team.establishment))
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleActiveFilter = (value: boolean | null) => {
    setActiveFilter(value);
  };

  const handleEstablishmentFilter = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setEstablishmentFilter(e.target.value);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setActiveFilter(null);
    setEstablishmentFilter("");
  };

  const confirmDelete = (team: Team) => {
    setTeamToDelete(team);
    setShowDeleteModal(true);
  };

  const deleteTeam = () => {
    if (teamToDelete) {
      setTeams(teams.filter((team) => team.id !== teamToDelete.id));
      setShowDeleteModal(false);
      setTeamToDelete(null);
    }
  };

  // Apply filters
  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.captain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.establishment.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesActive = activeFilter === null || team.active === activeFilter;

    const matchesEstablishment =
      establishmentFilter === "" || team.establishment === establishmentFilter;

    return matchesSearch && matchesActive && matchesEstablishment;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <button className="btn btn-primary flex items-center justify-center sm:w-auto">
          <Plus className="h-5 w-5 mr-1" /> Add New Team
        </button>
      </div>

      {/* Filters and search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          {/* Active filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex space-x-2">
              <button
                className={`px-3 py-2 rounded-md text-sm ${
                  activeFilter === null
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => handleActiveFilter(null)}
              >
                All
              </button>
              <button
                className={`px-3 py-2 rounded-md text-sm ${
                  activeFilter === true
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => handleActiveFilter(true)}
              >
                Active
              </button>
              <button
                className={`px-3 py-2 rounded-md text-sm ${
                  activeFilter === false
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => handleActiveFilter(false)}
              >
                Inactive
              </button>
            </div>
          </div>

          {/* Establishment filter */}
          <div>
            <label
              htmlFor="establishmentFilter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Establishment
            </label>
            <select
              id="establishmentFilter"
              className="form-input"
              value={establishmentFilter}
              onChange={handleEstablishmentFilter}
            >
              <option value="">All establishments</option>
              {establishments.map((establishment, index) => (
                <option key={index} value={establishment}>
                  {establishment}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-end space-x-2">
            <button
              onClick={resetFilters}
              className="btn btn-outline px-3 py-2"
              disabled={
                !searchTerm && activeFilter === null && !establishmentFilter
              }
            >
              Reset Filters
            </button>
            <button className="btn btn-secondary px-3 py-2 flex items-center">
              <Download className="h-4 w-4 mr-1" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Teams - Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {filteredTeams.length > 0 ? (
          filteredTeams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-dark truncate">{team.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{team.establishment}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                    team.active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {team.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div>
                  <p className="text-xs text-gray-500">Captain</p>
                  <p className="font-medium truncate">{team.captain}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Record</p>
                  <p className="font-medium">
                    <span className="text-green-600">{team.wins}W</span>
                    {" - "}
                    <span className="text-red-600">{team.losses}L</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Win %</p>
                  <p className="font-medium">
                    {((team.wins / (team.wins + team.losses)) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">{team.players} players</span>
                <div className="flex space-x-3">
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    title="View team details"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                  <button
                    className="text-gray-600 hover:text-gray-800"
                    title="Edit team"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800"
                    title="Delete team"
                    onClick={() => confirmDelete(team)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            No teams found matching your filters.
          </div>
        )}
      </div>

      {/* Teams - Desktop Table */}
      <div className="hidden sm:block bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Establishment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Captain
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Players
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Record
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Win %
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeams.length > 0 ? (
                filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {team.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {team.establishment}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {team.captain}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {team.players}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {team.wins}W - {team.losses}L
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                      {((team.wins / (team.wins + team.losses)) * 100).toFixed(
                        1
                      )}
                      %
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          team.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {team.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className="flex justify-center space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          title="View team details"
                        >
                          <Info className="h-5 w-5" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-800"
                          title="Edit team"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          title="Delete team"
                          onClick={() => confirmDelete(team)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No teams found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && teamToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-[95vw] sm:max-w-md w-full p-4 sm:p-6 shadow-xl mx-2 sm:mx-0">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">Confirm Delete</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete the team "{teamToDelete.name}"?
              </p>
              <p className="text-red-600 text-sm">
                This action cannot be undone. All team data, including match
                history, will be removed.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={deleteTeam}
                className="btn bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
