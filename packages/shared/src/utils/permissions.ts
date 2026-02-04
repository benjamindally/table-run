/**
 * Permission utilities for checking user access to league resources
 */

import type { Match, League, Player } from '../types';

/**
 * Check if a player is a league operator for a specific league
 */
export const isLeagueOperator = (
  myLeagues: League[],
  leagueId?: number
): boolean => {
  if (!myLeagues.length) return false;

  // If no leagueId provided, check if user is operator of any league
  if (!leagueId) return myLeagues.length > 0;

  // Check if user is operator of the specific league
  return myLeagues.some(league => league.id === leagueId);
};

/**
 * Check if a player is a captain of a specific team
 */
export const isTeamCaptain = (
  player: Player | null,
  teamId: number
): boolean => {
  if (!player?.captain_of_teams) return false;

  const captainTeamIds = player.captain_of_teams.map(ct => ct.team_id);
  return captainTeamIds.includes(teamId);
};

/**
 * Check if a player can edit a match based on:
 * - Being a league operator for the match's league
 * - Being a captain of either team in the match
 */
export const canEditMatch = (
  match: Match,
  player: Player | null,
  myLeagues: League[],
  leagueId?: number
): boolean => {
  // League operators can edit all matches in their leagues
  if (leagueId && isLeagueOperator(myLeagues, leagueId)) {
    return true;
  }

  // Team captains can edit matches for their teams
  if (player?.captain_of_teams) {
    const captainTeamIds = player.captain_of_teams.map(ct => ct.team_id);
    return (
      captainTeamIds.includes(match.home_team) ||
      captainTeamIds.includes(match.away_team)
    );
  }

  return false;
};
