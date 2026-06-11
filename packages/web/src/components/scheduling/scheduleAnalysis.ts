import type { ScheduleWeek, SeasonParticipation } from "../../api";

export interface ScheduleAnomaly {
  id: string;
  message: string;
}

interface SeasonDates {
  start_date?: string | null;
  end_date?: string | null;
}

/**
 * Advisory analysis of a schedule the operator is about to save.
 *
 * This is intentionally a "heads-up" layer, NOT a gate: the league operator has
 * final say, so everything here is a warning surfaced in the pre-save review
 * dialog, never something that blocks the save. The backend remains the real
 * safety net for genuinely corrupt data (a team playing itself, a non-existent
 * team). A little overlap with server-side warnings is fine — these are purely
 * to inform the confirm step.
 *
 * The generator's team/week selection ("the tiles") is deliberately NOT
 * consulted here: it only configures auto-generation and must never constrain
 * what the operator does with the resulting matches.
 */
export function analyzeSchedule(
  schedule: ScheduleWeek[],
  teams: SeasonParticipation[],
  season?: SeasonDates | null
): ScheduleAnomaly[] {
  const anomalies: ScheduleAnomaly[] = [];

  const teamNameById = new Map<number, string>();
  teams.forEach((p) => {
    if (p.team_detail?.name) teamNameById.set(p.team, p.team_detail.name);
  });
  const rosterTeamIds = new Set(teams.map((p) => p.team));

  const nameFor = (id: number | null | undefined, fallback?: string): string =>
    (id != null && teamNameById.get(id)) || fallback || `Team ${id}`;

  const playedTeamIds = new Set<number>();
  const offRosterTeams = new Map<number, string>();
  // date -> venue name -> count, for spotting same-night double-bookings
  const venueByDate = new Map<string, Map<string, number>>();

  schedule.forEach((week) => {
    const matchupsThisWeek = new Set<string>();
    const appearancesThisWeek = new Map<number, number>();

    week.matches.forEach((m) => {
      if (m.is_bye) return;
      const home = m.home_team_id;
      const away = m.away_team_id;
      if (home == null || away == null) return;

      // Track who plays (for the "no matches" summary) and off-roster teams.
      [
        [home, m.home_team_name] as const,
        [away, m.away_team_name] as const,
      ].forEach(([id, name]) => {
        playedTeamIds.add(id);
        if (!rosterTeamIds.has(id) && !offRosterTeams.has(id)) {
          offRosterTeams.set(id, nameFor(id, name));
        }
      });

      // Repeated matchup in the same week (e.g. a double-header makeup).
      const matchupKey = [home, away].sort((a, b) => a - b).join("-");
      if (matchupsThisWeek.has(matchupKey)) {
        anomalies.push({
          id: `repeat-${week.week_number}-${matchupKey}`,
          message: `Week ${week.week_number}: ${nameFor(
            home,
            m.home_team_name
          )} and ${nameFor(
            away,
            m.away_team_name
          )} play each other more than once.`,
        });
      }
      matchupsThisWeek.add(matchupKey);

      appearancesThisWeek.set(home, (appearancesThisWeek.get(home) || 0) + 1);
      appearancesThisWeek.set(away, (appearancesThisWeek.get(away) || 0) + 1);

      // Venue double-booking on the same date.
      const dateKey = m.date || week.date;
      if (m.venue_name && dateKey) {
        const byVenue = venueByDate.get(dateKey) || new Map<string, number>();
        byVenue.set(m.venue_name, (byVenue.get(m.venue_name) || 0) + 1);
        venueByDate.set(dateKey, byVenue);
      }

      // Match date outside the season window.
      if (dateKey) {
        if (season?.start_date && dateKey < season.start_date) {
          anomalies.push({
            id: `before-${week.week_number}-${matchupKey}`,
            message: `Week ${week.week_number}: a match on ${dateKey} is before the season starts (${season.start_date}).`,
          });
        }
        if (season?.end_date && dateKey > season.end_date) {
          anomalies.push({
            id: `after-${week.week_number}-${matchupKey}`,
            message: `Week ${week.week_number}: a match on ${dateKey} is after the season ends (${season.end_date}).`,
          });
        }
      }
    });

    // A team playing several matches in one week (different opponents).
    appearancesThisWeek.forEach((count, teamId) => {
      if (count > 1) {
        anomalies.push({
          id: `multi-${week.week_number}-${teamId}`,
          message: `Week ${week.week_number}: ${nameFor(
            teamId
          )} is scheduled for ${count} matches.`,
        });
      }
    });
  });

  // Venue double-bookings (collected across the whole schedule).
  venueByDate.forEach((byVenue, date) => {
    byVenue.forEach((count, venueName) => {
      if (count > 1) {
        anomalies.push({
          id: `venue-${date}-${venueName}`,
          message: `${venueName} has ${count} matches on ${date}.`,
        });
      }
    });
  });

  // Off-roster teams (will be auto-added to the season on save).
  offRosterTeams.forEach((name, id) => {
    anomalies.push({
      id: `offroster-${id}`,
      message: `${name} isn't in this season yet and will be added when you save.`,
    });
  });

  // Roster teams with no matches at all (single summary line — partial
  // schedules are expected, so this is just a count, not per-team noise).
  if (schedule.length > 0) {
    const withoutMatches = teams.filter((p) => !playedTeamIds.has(p.team));
    if (withoutMatches.length > 0) {
      anomalies.push({
        id: "no-matches",
        message:
          withoutMatches.length === 1
            ? `${nameFor(withoutMatches[0].team)} has no matches scheduled.`
            : `${withoutMatches.length} teams have no matches scheduled.`,
      });
    }
  }

  return anomalies;
}
