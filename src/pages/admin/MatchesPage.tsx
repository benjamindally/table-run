import React, { useState } from "react";
import {
  Search,
  Filter,
  Download,
  CalendarDays,
  Eye,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Match {
  id: number;
  date: string;
  homeTeam: string;
  homeScore: number;
  awayTeam: string;
  awayScore: number;
  location: string;
  status: "completed" | "upcoming" | "canceled";
}

const MatchesPage: React.FC = () => {
  // Sample matches data
  const matchesData: Match[] = [
    {
      id: 1,
      date: "2025-01-15",
      homeTeam: "Cue Masters",
      homeScore: 3,
      awayTeam: "Chalk & Awe",
      awayScore: 1,
      location: "Corner Pocket Bar & Grill",
      status: "completed",
    },
    {
      id: 2,
      date: "2025-01-14",
      homeTeam: "break Point",
      homeScore: 2,
      awayTeam: "Straight Shooters",
      awayScore: 2,
      location: "Shark's Pool Hall",
      status: "completed",
    },
    {
      id: 3,
      date: "2025-01-13",
      homeTeam: "8-Ball Wizards",
      homeScore: 0,
      awayTeam: "Corner Pocket",
      awayScore: 4,
      location: "Rack & Roll",
      status: "completed",
    },
    {
      id: 4,
      date: "2025-01-12",
      homeTeam: "Ball Busters",
      homeScore: 3,
      awayTeam: "Rack 'em Up",
      awayScore: 1,
      location: "Shooter's Place",
      status: "completed",
    },
    {
      id: 5,
      date: "2025-01-20",
      homeTeam: "Chalk & Awe",
      homeScore: 0,
      awayTeam: "break Point",
      awayScore: 0,
      location: "The Billiards Club",
      status: "upcoming",
    },
    {
      id: 6,
      date: "2025-01-21",
      homeTeam: "Straight Shooters",
      homeScore: 0,
      awayTeam: "Cue Masters",
      awayScore: 0,
      location: "Corner Pocket Bar & Grill",
      status: "upcoming",
    },
    {
      id: 7,
      date: "2025-01-22",
      homeTeam: "Corner Pocket",
      homeScore: 0,
      awayTeam: "Ball Busters",
      awayScore: 0,
      location: "Shark's Pool Hall",
      status: "upcoming",
    },
    {
      id: 8,
      date: "2025-01-08",
      homeTeam: "Rack 'em Up",
      homeScore: 0,
      awayTeam: "Stick Wizards",
      awayScore: 0,
      location: "The 8-Ball Lounge",
      status: "canceled",
    },
    {
      id: 9,
      date: "2025-01-07",
      homeTeam: "Pool Sharks",
      homeScore: 2,
      awayTeam: "8-Ball Wizards",
      awayScore: 2,
      location: "Shark's Pool Hall",
      status: "completed",
    },
    {
      id: 10,
      date: "2025-01-06",
      homeTeam: "Cue Masters",
      homeScore: 4,
      awayTeam: "Ball Busters",
      awayScore: 0,
      location: "Corner Pocket Bar & Grill",
      status: "completed",
    },
    {
      id: 11,
      date: "2025-01-05",
      homeTeam: "Chalk & Awe",
      homeScore: 3,
      awayTeam: "Rack 'em Up",
      awayScore: 1,
      location: "The Billiards Club",
      status: "completed",
    },
    {
      id: 12,
      date: "2025-01-04",
      homeTeam: "break Point",
      homeScore: 1,
      awayTeam: "Corner Pocket",
      awayScore: 3,
      location: "Shark's Pool Hall",
      status: "completed",
    },
  ];

  const [matches, setMatches] = useState<Match[]>(matchesData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [matchToEdit, setMatchToEdit] = useState<Match | null>(null);
  const [editFormData, setEditFormData] = useState({
    date: "",
    homeScore: 0,
    awayScore: 0,
    location: "",
    status: "" as "completed" | "upcoming" | "canceled",
  });

  const itemsPerPage = 8;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (field: "start" | "end", value: string) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateRange({ start: "", end: "" });
    setCurrentPage(1);
  };

  const confirmDelete = (match: Match) => {
    setMatchToDelete(match);
    setShowDeleteModal(true);
  };

  const deleteMatch = () => {
    if (matchToDelete) {
      setMatches(matches.filter((match) => match.id !== matchToDelete.id));
      setShowDeleteModal(false);
      setMatchToDelete(null);
    }
  };

  const openEditModal = (match: Match) => {
    setMatchToEdit(match);
    setEditFormData({
      date: match.date,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      location: match.location,
      status: match.status,
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (
    field: keyof typeof editFormData,
    value: string | number
  ) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveMatchEdit = () => {
    if (matchToEdit) {
      setMatches(
        matches.map((match) =>
          match.id === matchToEdit.id
            ? {
                ...match,
                date: editFormData.date,
                homeScore: editFormData.homeScore,
                awayScore: editFormData.awayScore,
                location: editFormData.location,
                status: editFormData.status,
              }
            : match
        )
      );
      setShowEditModal(false);
      setMatchToEdit(null);
    }
  };

  // Apply filters
  const filteredMatches = matches.filter((match) => {
    const matchesSearch =
      match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || match.status === statusFilter;

    const matchDate = new Date(match.date);
    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;

    const matchesDateRange =
      (!startDate || matchDate >= startDate) &&
      (!endDate || matchDate <= endDate);

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
  const paginatedMatches = filteredMatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Match Management</h1>
        <button className="btn btn-primary flex items-center">
          <CalendarDays className="h-5 w-5 mr-1" /> Schedule New Match
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
              placeholder="Search matches..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-1 rounded-md text-sm ${
                  statusFilter === "all"
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => handleStatusFilter("all")}
              >
                All
              </button>
              <button
                className={`px-3 py-1 rounded-md text-sm ${
                  statusFilter === "completed"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => handleStatusFilter("completed")}
              >
                Completed
              </button>
              <button
                className={`px-3 py-1 rounded-md text-sm ${
                  statusFilter === "upcoming"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => handleStatusFilter("upcoming")}
              >
                Upcoming
              </button>
              <button
                className={`px-3 py-1 rounded-md text-sm ${
                  statusFilter === "canceled"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => handleStatusFilter("canceled")}
              >
                Canceled
              </button>
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                From
              </label>
              <input
                type="date"
                id="startDate"
                className="form-input"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange("start", e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                To
              </label>
              <input
                type="date"
                id="endDate"
                className="form-input"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange("end", e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-end space-x-2">
            <button
              onClick={resetFilters}
              className="btn btn-outline px-3 py-2"
              disabled={
                !searchTerm &&
                statusFilter === "all" &&
                !dateRange.start &&
                !dateRange.end
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

      {/* Matches table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Home Team
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Away Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
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
              {paginatedMatches.length > 0 ? (
                paginatedMatches.map((match) => (
                  <tr key={match.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(match.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {match.homeTeam}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {match.status === "completed" ? (
                        <span
                          className={`font-bold ${
                            match.homeScore > match.awayScore
                              ? "text-green-600"
                              : match.homeScore < match.awayScore
                              ? "text-red-600"
                              : "text-blue-600"
                          }`}
                        >
                          {match.homeScore}
                        </span>
                      ) : (
                        <span>-</span>
                      )}
                      <span className="mx-1">:</span>
                      {match.status === "completed" ? (
                        <span
                          className={`font-bold ${
                            match.awayScore > match.homeScore
                              ? "text-green-600"
                              : match.awayScore < match.homeScore
                              ? "text-red-600"
                              : "text-blue-600"
                          }`}
                        >
                          {match.awayScore}
                        </span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {match.awayTeam}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {match.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
                          match.status
                        )}`}
                      >
                        {match.status.charAt(0).toUpperCase() +
                          match.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className="flex justify-center space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          title="View match details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-800"
                          title="Edit match"
                          onClick={() => openEditModal(match)}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          title="Delete match"
                          onClick={() => confirmDelete(match)}
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
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No matches found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredMatches.length > 0 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredMatches.length)}
              </span>{" "}
              of <span className="font-medium">{filteredMatches.length}</span>{" "}
              results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md text-sm ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      currentPage === page
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md text-sm ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit match modal */}
      {showEditModal && matchToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">Edit Match</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Match Info (Read-only) */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Home Team
                    </label>
                    <p className="text-gray-900 font-medium">
                      {matchToEdit.homeTeam}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Away Team
                    </label>
                    <p className="text-gray-900 font-medium">
                      {matchToEdit.awayTeam}
                    </p>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="edit-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Match Date
                  </label>
                  <input
                    type="date"
                    id="edit-date"
                    className="form-input w-full"
                    value={editFormData.date}
                    onChange={(e) =>
                      handleEditFormChange("date", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-location"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    id="edit-location"
                    className="form-input w-full"
                    value={editFormData.location}
                    onChange={(e) =>
                      handleEditFormChange("location", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="edit-home-score"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Home Score
                  </label>
                  <input
                    type="number"
                    id="edit-home-score"
                    className="form-input w-full"
                    min="0"
                    value={editFormData.homeScore}
                    onChange={(e) =>
                      handleEditFormChange("homeScore", parseInt(e.target.value) || 0)
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-away-score"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Away Score
                  </label>
                  <input
                    type="number"
                    id="edit-away-score"
                    className="form-input w-full"
                    min="0"
                    value={editFormData.awayScore}
                    onChange={(e) =>
                      handleEditFormChange("awayScore", parseInt(e.target.value) || 0)
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-status"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Status
                  </label>
                  <select
                    id="edit-status"
                    className="form-input w-full"
                    value={editFormData.status}
                    onChange={(e) =>
                      handleEditFormChange(
                        "status",
                        e.target.value as "completed" | "upcoming" | "canceled"
                      )
                    }
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={saveMatchEdit}
                className="btn btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && matchToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
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
                Are you sure you want to delete the match between{" "}
                <strong>{matchToDelete.homeTeam}</strong> and{" "}
                <strong>{matchToDelete.awayTeam}</strong> on{" "}
                <strong>
                  {new Date(matchToDelete.date).toLocaleDateString()}
                </strong>
                ?
              </p>
              <p className="text-red-600 text-sm">
                This action cannot be undone. All match data, including scores
                and statistics, will be removed.
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
                onClick={deleteMatch}
                className="btn bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesPage;
