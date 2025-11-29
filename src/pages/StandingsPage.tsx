import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trophy, TrendingUp, ChevronRight, ArrowLeft } from "lucide-react";
import { seasonsApi, Season, api, SeasonStandingsResponse } from "../api";
import { toast } from "react-toastify";

interface League {
  id: number;
  name: string;
  city: string;
  state: string;
}

export default function StandingsPage() {
  const navigate = useNavigate();
  const { leagueId } = useParams<{ leagueId: string }>();
  const [league, setLeague] = useState<League | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [standingsData, setStandingsData] =
    useState<SeasonStandingsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Load league info
  useEffect(() => {
    if (!leagueId) return;

    const loadLeague = async () => {
      try {
        const data = await api.get<League>(`/leagues/${leagueId}/`);
        setLeague(data);
      } catch (error) {
        console.error("Failed to load league:", error);
        toast.error("Failed to load league");
      }
    };

    loadLeague();
  }, [leagueId]);

  // Load all seasons for this league
  useEffect(() => {
    if (!leagueId) return;

    const loadSeasons = async () => {
      try {
        const response = await seasonsApi.getAll();
        // Filter seasons by league and active status
        const leagueSeasons = response.results.filter(
          (s) => s.league === Number(leagueId) && s.is_active && !s.is_archived
        );
        setSeasons(leagueSeasons);

        // Auto-select first active season
        if (leagueSeasons.length > 0) {
          setSelectedSeasonId(leagueSeasons[0].id);
        }
      } catch (error) {
        console.error("Failed to load seasons:", error);
        toast.error("Failed to load seasons");
      } finally {
        setLoading(false);
      }
    };

    loadSeasons();
  }, [leagueId]);

  // Load standings when season changes
  useEffect(() => {
    if (!selectedSeasonId) return;

    const loadStandings = async () => {
      try {
        const data = await seasonsApi.getStandings(selectedSeasonId);
        setStandingsData(data);
      } catch (error) {
        console.error("Failed to load standings:", error);
        toast.error("Failed to load standings");
      }
    };

    loadStandings();
  }, [selectedSeasonId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Loading...</div>
      </div>
    );
  }

  if (seasons.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Active Seasons
          </h2>
          <p className="text-gray-600">
            There are no active seasons at this time.
          </p>
        </div>
      </div>
    );
  }

  const standings = standingsData?.standings || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/standings")}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Leagues
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {standingsData?.league_name || league?.name || "League Standings"}
            </h1>
            {standingsData?.season_name && (
              <p className="text-sm text-gray-600 mt-1">
                {standingsData.season_name}
              </p>
            )}
            {league && (league.city || league.state) && (
              <p className="text-sm text-gray-600 mt-1">
                {[league.city, league.state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Season Selector */}
        {seasons.length > 1 && (
          <div className="flex items-center gap-4">
            <label
              htmlFor="season-select"
              className="text-sm font-medium text-gray-700"
            >
              Season:
            </label>
            <select
              id="season-select"
              value={selectedSeasonId || ""}
              onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
              className="rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Standings */}
      {standings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">No teams have joined this season yet.</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card View */}
          <div className="md:hidden space-y-3">
            {standings.map((standing, index) => (
              <div
                key={standing.team_id}
                onClick={() =>
                  navigate(
                    `/team/${standing.team_id}/stats?season=${selectedSeasonId}`
                  )
                }
                className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow ${
                  index < 3 ? "border-l-4 border-orange-500" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-400">
                      {standing.place}
                    </span>
                    {index === 0 && (
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    )}
                    {index === 1 && (
                      <Trophy className="h-5 w-5 text-gray-400" />
                    )}
                    {index === 2 && (
                      <Trophy className="h-5 w-5 text-orange-400" />
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {standing.team_name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {standing.establishment}
                </p>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-xs text-gray-500 uppercase">W</div>
                    <div className="text-lg font-semibold text-orange-600">
                      {standing.wins}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">L</div>
                    <div className="text-lg font-semibold text-red-600">
                      {standing.losses}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Win%</div>
                    <div className="text-lg font-medium text-gray-900">
                      {standing.win_percentage?.toFixed(1) || "0.0"}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">GB</div>
                    <div className="text-lg font-medium text-gray-600">
                      {standing.games_behind || "-"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Establishment
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wins
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Losses
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Win %
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GB
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {standings.map((standing, index) => (
                <tr
                  key={standing.team_id}
                  onClick={() =>
                    navigate(
                      `/team/${standing.team_id}/stats?season=${selectedSeasonId}`
                    )
                  }
                  className={`cursor-pointer transition-colors ${
                    index < 3
                      ? "bg-orange-50 hover:bg-primary-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index === 0 && (
                        <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                      )}
                      {index === 1 && (
                        <Trophy className="h-5 w-5 text-gray-400 mr-2" />
                      )}
                      {index === 2 && (
                        <Trophy className="h-5 w-5 text-orange-400 mr-2" />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {standing.place}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">
                        {standing.team_name}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {standing.establishment}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-semibold text-orange-600">
                      {standing.wins}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-semibold text-red-600">
                      {standing.losses}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-gray-900">
                      {standing.win_percentage?.toFixed(1) || "0.0"}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-600">
                      {standing.games_behind || "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Legend for top 3 */}
      {standings.length >= 3 && (
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span>1st Place</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gray-400" />
            <span>2nd Place</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-orange-400" />
            <span>3rd Place</span>
          </div>
        </div>
      )}
    </div>
  );
}
