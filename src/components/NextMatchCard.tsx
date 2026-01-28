import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import type { Match } from "../api/types";

interface NextMatchCardProps {
  matches: Match[] | undefined;
  userTeamIds: number[];
  isLoading?: boolean;
}

const NextMatchCard: React.FC<NextMatchCardProps> = ({
  matches,
  userTeamIds,
  isLoading = false,
}) => {
  const isUserOnATeam = userTeamIds.length > 0;

  // Find the next upcoming match for the user's team
  const nextMatch = useMemo((): Match | null => {
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

  // Don't render if user is not on a team
  if (!isUserOnATeam) return null;

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
            {userTeamIds.includes(nextMatch.home_team)
              ? `vs ${nextMatch.away_team_detail?.name || "Away Team"}`
              : `@ ${nextMatch.home_team_detail?.name || "Home Team"}`}
          </p>
          <span
            className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
              userTeamIds.includes(nextMatch.home_team)
                ? "bg-secondary-100 text-secondary-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {userTeamIds.includes(nextMatch.home_team) ? "Home" : "Away"}
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
