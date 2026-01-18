import React, { useState, useMemo } from "react";
import { X, ArrowLeft, Calendar, Users, MapPin } from "lucide-react";
import type { League, Season } from "../api/types";

interface LeagueSeasonSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  leagues: League[];
  allSeasons: Season[];
  currentLeagueId?: number | null;
  currentSeasonId?: number | null;
  onSelect: (leagueId: number, seasonId: number) => void;
}

const LeagueSeasonSelectorModal: React.FC<LeagueSeasonSelectorModalProps> = ({
  isOpen,
  onClose,
  leagues,
  allSeasons,
  currentLeagueId,
  currentSeasonId,
  onSelect,
}) => {
  const [step, setStep] = useState<"league" | "season">("league");
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(
    currentLeagueId || null
  );

  // Filter seasons by selected league
  const availableSeasons = useMemo(() => {
    if (!selectedLeagueId) return [];
    return allSeasons
      .filter(
        (season) => season.league === selectedLeagueId && season.is_active
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [selectedLeagueId, allSeasons]);

  const handleLeagueSelect = (leagueId: number) => {
    setSelectedLeagueId(leagueId);
    setStep("season");
  };

  const handleSeasonSelect = (seasonId: number) => {
    if (selectedLeagueId) {
      onSelect(selectedLeagueId, seasonId);
      onClose();
      // Reset to league step for next time
      setTimeout(() => setStep("league"), 300);
    }
  };

  const handleBack = () => {
    setStep("league");
    setSelectedLeagueId(null);
  };

  const handleClose = () => {
    onClose();
    // Reset to league step for next time
    setTimeout(() => setStep("league"), 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            {step === "season" && (
              <button
                onClick={handleBack}
                className="mr-4 text-dark-300 hover:text-dark transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-semibold text-dark">
                {step === "league" ? "Select League" : "Select Season"}
              </h2>
              <p className="text-sm text-dark-300 mt-1">
                {step === "league"
                  ? "Choose a league to view matches"
                  : "Choose a season to view matches"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-dark-300 hover:text-dark transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          {step === "league" ? (
            // League Selection
            leagues.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leagues.map((league) => (
                  <button
                    key={league.id}
                    onClick={() => handleLeagueSelect(league.id)}
                    className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all text-left p-6 border-2 ${
                      league.id === currentLeagueId
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-dark">
                        {league.name}
                      </h3>
                      {league.id === currentLeagueId && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-dark-300">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>
                          {league.city}, {league.state}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-dark-300">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{league.season_count || 0} seasons</span>
                      </div>

                      <div className="flex items-center text-sm text-dark-300">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{league.total_games || 0} games played</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-dark-300">
                <p>No leagues available</p>
              </div>
            )
          ) : (
            // Season Selection
            availableSeasons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSeasons.map((season) => (
                  <button
                    key={season.id}
                    onClick={() => handleSeasonSelect(season.id)}
                    className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all text-left p-6 border-2 ${
                      season.id === currentSeasonId
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-dark">
                          {season.name}
                        </h3>
                        <p className="text-sm text-dark-300 mt-1">
                          {season.league_detail?.name}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          season.id === currentSeasonId
                            ? "bg-primary-100 text-primary-800"
                            : season.is_active
                            ? "bg-secondary-100 text-secondary-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {season.id === currentSeasonId
                          ? "Current"
                          : season.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-dark-300">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Start</span>
                        </div>
                        <span className="font-semibold text-dark">
                          {new Date(season.start_date).toLocaleDateString()}
                        </span>
                      </div>

                      {season.end_date && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-dark-300">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>End</span>
                          </div>
                          <span className="font-semibold text-dark">
                            {new Date(season.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-dark-300">
                          <Users className="h-4 w-4 mr-2" />
                          <span>Teams</span>
                        </div>
                        <span className="font-semibold text-dark">
                          {season.team_count || 0}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-dark-300">
                <p>No active seasons available for this league</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default LeagueSeasonSelectorModal;
