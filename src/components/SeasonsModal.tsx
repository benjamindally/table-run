import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, ArrowRight } from "lucide-react";
import Modal from "./Modal";
import { api } from "../api";
import { Season } from "../api/types";
import { toast } from "react-toastify";

interface SeasonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leagueId: number;
  leagueName: string;
}

const SeasonsModal: React.FC<SeasonsModalProps> = ({
  isOpen,
  onClose,
  leagueId,
  leagueName,
}) => {
  const navigate = useNavigate();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && leagueId) {
      const loadSeasons = async () => {
        setLoading(true);
        try {
          const response = await api.get<{ results: Season[] }>("/seasons/");
          // Filter seasons for this league and sort by created_at descending
          const leagueSeasons = response.results
            .filter((season) => season.league === leagueId)
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );
          setSeasons(leagueSeasons);
        } catch (error) {
          console.error("Failed to load seasons:", error);
          toast.error("Failed to load seasons");
        } finally {
          setLoading(false);
        }
      };

      loadSeasons();
    }
  }, [isOpen, leagueId]);

  const handleSeasonClick = (seasonId: number) => {
    navigate(`/leagues/${leagueId}/seasons/${seasonId}`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${leagueName} - Seasons`}
      maxWidth="xl"
    >
      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading seasons...</div>
      ) : seasons.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No seasons found for this league.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seasons.map((season) => (
            <div
              key={season.id}
              onClick={() => handleSeasonClick(season.id)}
              className="bg-white rounded-lg border-2 border-gray-200 hover:border-primary transition-all cursor-pointer p-4 hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {season.name}
                  </h3>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    season.is_active
                      ? "bg-green-100 text-green-800"
                      : season.is_archived
                      ? "bg-gray-100 text-gray-600"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {season.is_active
                    ? "Active"
                    : season.is_archived
                    ? "Archived"
                    : "Inactive"}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Start Date</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {new Date(season.start_date).toLocaleDateString()}
                  </span>
                </div>

                {season.end_date && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>End Date</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {new Date(season.end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Teams</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {season.team_count || 0}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-center text-sm font-medium text-primary hover:text-primary-600">
                  View Season
                  <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default SeasonsModal;
