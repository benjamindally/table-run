import React from "react";
import { Trophy } from "lucide-react";
import type {
  PlayoffBracketData,
  PlayoffRound,
  PlayoffMatchup,
  PlayoffSeed,
} from "../../api";
import { formatDateDisplay } from "@league-genius/shared";

function getRoundName(roundNumber: number, totalRounds: number): string {
  if (roundNumber === totalRounds) return "Finals";
  if (roundNumber === totalRounds - 1) return "Semifinals";
  if (roundNumber === totalRounds - 2) return "Quarterfinals";
  return `Round ${roundNumber}`;
}

function buildRoundsFromMatchups(
  matchups: PlayoffMatchup[],
  totalRounds: number
): PlayoffRound[] {
  const roundMap: Record<number, PlayoffMatchup[]> = {};
  for (const m of matchups) {
    if (!roundMap[m.round_number]) roundMap[m.round_number] = [];
    roundMap[m.round_number].push(m);
  }
  const rounds: PlayoffRound[] = [];
  for (const [rn, rMatchups] of Object.entries(roundMap)) {
    const roundNum = Number(rn);
    rounds.push({
      round_number: roundNum,
      round_name: getRoundName(roundNum, totalRounds),
      matchups: rMatchups.sort((a, b) => a.position - b.position),
    });
  }
  return rounds.sort((a, b) => a.round_number - b.round_number);
}

interface MatchupCardProps {
  matchup: PlayoffMatchup;
  seeds: PlayoffSeed[];
  isPreview: boolean;
  isOperator: boolean;
  onEdit?: () => void;
}

const MatchupCard: React.FC<MatchupCardProps> = ({
  matchup,
  seeds,
  isPreview,
  isOperator,
  onEdit,
}) => {
  const getSeedInfo = (seedNum: number | null) => {
    if (seedNum == null) return null;
    return seeds.find((s) => s.seed_number === seedNum);
  };

  const homeSeed = getSeedInfo(matchup.home_seed_number ?? matchup.home_seed ?? null);
  const awaySeed = getSeedInfo(matchup.away_seed_number ?? matchup.away_seed ?? null);

  const homeDetail = matchup.home_seed_detail;
  const awayDetail = matchup.away_seed_detail;

  const homeName = homeDetail?.team_name ?? homeSeed?.team_name ?? matchup.home_team_name;
  const awayName = awayDetail?.team_name ?? awaySeed?.team_name ?? matchup.away_team_name;
  const homeSeedNum = homeDetail?.seed_number ?? homeSeed?.seed_number ?? matchup.home_seed_number;
  const awaySeedNum = awayDetail?.seed_number ?? awaySeed?.seed_number ?? matchup.away_seed_number;

  const matchDetail = matchup.match_detail;
  const isCompleted = matchDetail?.status === "completed";

  const canEdit = isOperator && isPreview;

  if (matchup.is_bye) {
    return (
      <button
        onClick={canEdit ? onEdit : undefined}
        disabled={!canEdit}
        className={`w-full text-left rounded-lg p-3 border-2 border-dashed border-cream-400 bg-cream-50 mb-3 transition-colors ${
          canEdit ? "hover:border-primary-300 cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-primary">#{homeSeedNum}</span>
          <span className="text-sm font-semibold text-dark-600 truncate">
            {homeName ?? "TBD"}
          </span>
        </div>
        <span className="text-xs text-dark-300 italic">BYE — Advances automatically</span>
      </button>
    );
  }

  return (
    <button
      onClick={canEdit ? onEdit : undefined}
      disabled={!canEdit}
      className={`w-full text-left rounded-lg p-3 border mb-3 transition-colors ${
        isPreview
          ? "border-blue-200 bg-blue-50 hover:border-blue-300"
          : "border-cream-300 bg-white hover:border-dark-200"
      } ${canEdit ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Home */}
      <div className="flex items-center gap-2 mb-1">
        {homeSeedNum != null && (
          <span className="text-xs font-bold text-primary">#{homeSeedNum}</span>
        )}
        <span
          className={`text-sm font-semibold flex-1 truncate ${
            isCompleted && matchDetail?.winner_team_id === homeSeed?.team_id
              ? "text-green-700"
              : "text-dark"
          }`}
        >
          {homeName ?? "TBD"}
        </span>
        {isCompleted && matchDetail?.home_score != null && (
          <span className="text-sm font-bold text-dark-600">{matchDetail.home_score}</span>
        )}
      </div>

      {/* Away */}
      <div className="flex items-center gap-2 mb-2">
        {awaySeedNum != null && (
          <span className="text-xs font-bold text-primary">#{awaySeedNum}</span>
        )}
        <span
          className={`text-sm font-semibold flex-1 truncate ${
            isCompleted && matchDetail?.winner_team_id === awaySeed?.team_id
              ? "text-green-700"
              : "text-dark"
          }`}
        >
          {awayName ?? "TBD"}
        </span>
        {isCompleted && matchDetail?.away_score != null && (
          <span className="text-sm font-bold text-dark-600">{matchDetail.away_score}</span>
        )}
      </div>

      {/* Date + Venue */}
      <div className="flex items-center gap-2 text-xs text-dark-300">
        {matchup.scheduled_date && (
          <span>{formatDateDisplay(matchup.scheduled_date)}</span>
        )}
        {matchup.venue_name && (
          <>
            <span>·</span>
            <span className="truncate">{matchup.venue_name}</span>
          </>
        )}
      </div>
    </button>
  );
};

interface PlayoffBracketViewProps {
  bracket: PlayoffBracketData;
  seeds: PlayoffSeed[];
  isPreview: boolean;
  isOperator: boolean;
  onEditMatchup?: (roundIdx: number, matchupIdx: number) => void;
}

const PlayoffBracketView: React.FC<PlayoffBracketViewProps> = ({
  bracket,
  seeds,
  isPreview,
  isOperator,
  onEditMatchup,
}) => {
  const rounds: PlayoffRound[] = bracket.rounds ?? [];

  const displayRounds: PlayoffRound[] =
    rounds.length > 0
      ? rounds
      : buildRoundsFromMatchups(bracket.matchups ?? [], bracket.total_rounds);

  if (displayRounds.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-cream-300 p-12 text-center">
        <Trophy className="h-10 w-10 text-cream-400 mx-auto mb-3" />
        <p className="text-dark-300">No bracket data available.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 min-w-max p-2">
        {displayRounds.map((round, roundIdx) => (
          <div key={round.round_number} className="w-72 flex-shrink-0">
            {/* Round header */}
            <div className="bg-dark-50 rounded-t-lg py-2 px-3 border border-cream-300 border-b-0">
              <h3 className="text-sm font-bold text-dark text-center">
                {round.round_name}
              </h3>
            </div>

            {/* Matchups */}
            <div className="border border-cream-300 border-t-0 rounded-b-lg p-3">
              {round.matchups.map((matchup, matchupIdx) => (
                <MatchupCard
                  key={`${round.round_number}-${matchup.position}`}
                  matchup={matchup}
                  seeds={seeds}
                  isPreview={isPreview}
                  isOperator={isOperator}
                  onEdit={() => onEditMatchup?.(roundIdx, matchupIdx)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayoffBracketView;
