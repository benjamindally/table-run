import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import type { Match, MeMatch } from "../api";

interface NextMatchCardProps {
  matches?: Match[] | undefined;
  userTeamIds: number[];
  isLoading?: boolean;
  // Pre-filtered upcoming match from /me/ endpoint
  upcomingMatch?: MeMatch | null;
}

const NextMatchCard: React.FC<NextMatchCardProps> = ({
  matches,
  userTeamIds,
  isLoading = false,
  upcomingMatch,
}) => {
  const isUserOnATeam = userTeamIds.length > 0;

  // Find the next upcoming match for the user's team (from matches array)
  const nextMatchFromMatches = useMemo((): Match | null => {
    if (!matches || !isUserOnATeam) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingMatches = matches
      .filter((match) => {
        const matchDate = new Date(match.date);
        matchDate.setHours(0, 0, 0, 0);
        const isUserTeamPlaying =
          userTeamIds.includes(match.home_team) ||
          userTeamIds.includes(match.away_team);
        const isUpcoming = matchDate >= today;
        const isScheduled = match.status === "scheduled";
        return isUserTeamPlaying && isUpcoming && isScheduled;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return upcomingMatches[0] || null;
  }, [matches, isUserOnATeam, userTeamIds]);

  // Use upcomingMatch (from /me/) if provided, otherwise use computed match
  const hasUpcomingMatch = upcomingMatch !== undefined;
  const nextMatch = hasUpcomingMatch ? upcomingMatch : nextMatchFromMatches;

  // Don't render if user is not on a team (only when using matches array)
  if (!hasUpcomingMatch && !isUserOnATeam) return null;

  // Normalize match data (MeMatch uses _id/_name, Match uses nested _detail)
  const homeTeamId = hasUpcomingMatch
    ? (nextMatch as MeMatch | null)?.home_team_id
    : (nextMatch as Match | null)?.home_team;
  const homeTeamName = hasUpcomingMatch
    ? (nextMatch as MeMatch | null)?.home_team_name
    : (nextMatch as Match | null)?.home_team_detail?.name || "Home Team";
  const awayTeamName = hasUpcomingMatch
    ? (nextMatch as MeMatch | null)?.away_team_name
    : (nextMatch as Match | null)?.away_team_detail?.name || "Away Team";
  const isHome = homeTeamId !== undefined && userTeamIds.includes(homeTeamId);

  const cardContent = (
    <>
      <h4 className="font-semibold text-dark mb-2 flex items-center">
        <Clock className="h-4 w-4 mr-2 text-primary-600" />
        Next Match
      </h4>
      {isLoading ? (
        <p className="text-sm text-dark-300">Loading...</p>
      ) : nextMatch ? (
        <div className="space-y-1">
          <p className="text-sm text-dark-300">
            {new Date(nextMatch.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
          <p className="text-sm font-medium text-dark">
            {isHome ? `vs ${awayTeamName}` : `@ ${homeTeamName}`}
          </p>
          <span
            className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
              isHome
                ? "bg-secondary-100 text-secondary-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {isHome ? "Home" : "Away"}
          </span>
        </div>
      ) : (
        <p className="text-sm text-dark-300">No upcoming matches</p>
      )}
    </>
  );

  // If there's a next match, make the whole card clickable
  if (nextMatch) {
    return (
      <Link
        to={`/admin/matches/${nextMatch.id}/score`}
        className="block bg-white rounded-lg p-4 border hover:shadow-md transition-shadow cursor-pointer"
      >
        {cardContent}
      </Link>
    );
  }

  // Otherwise render as a static div
  return (
    <div className="bg-white rounded-lg p-4 border">
      {cardContent}
    </div>
  );
};

export default NextMatchCard;
