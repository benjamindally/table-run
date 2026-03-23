/**
 * Match Details Screen - Match info, real-time scoring, and status.
 *
 * Single destination for tapping any match. Handles all roles:
 *   - Anonymous / non-captain: read-only view
 *   - Captain: interactive lineup and scoring flow
 *   - League operator: full edit access
 *
 * Registered in both MatchesStack and SeasonsStack, so it uses
 * useRoute / useNavigation hooks instead of typed screen props.
 */

import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { AlertTriangle, Shield, WifiOff } from "lucide-react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";

import { useMatchDetails } from "../hooks/useMatchDetails";
import MatchScoreHeader from "../components/match/MatchScoreHeader";
import StatusBanner from "../components/match/StatusBanner";
import AttendanceSection from "../components/match/AttendanceSection";
import GamesSection from "../components/match/GamesSection";
import ScoreOverrideCard from "../components/match/ScoreOverrideCard";
import MatchActionBar from "../components/match/MatchActionBar";

type MatchDetailsRouteParams = { matchId: number };

export default function MatchDetailsScreen() {
  const route = useRoute<RouteProp<{ MatchDetails: MatchDetailsRouteParams }, "MatchDetails">>();
  const { matchId } = route.params;

  const {
    match,
    scoringState,
    loading,
    refreshing,
    error,
    onRefresh,
    captainRole,
    isLeagueOperator,
    isAuthenticated,
    canEditAwayLineup,
    canEditHomeLineup,
    canScore,
    isReadOnly,
    lineupState,
    isAwayLineupPhase,
    isHomeLineupPhase,
    isReadyToStart,
    isMatchLive,
    isMatchCompleted,
    connectionStatus,
    showConnectionStatus,
    reconnectWebSocket,
    homeTeamName,
    awayTeamName,
    presentHome,
    presentAway,
    displayHomeScore,
    displayAwayScore,
    isAwayLineupComplete,
    isHomeLineupComplete,
    gamesPerSet,
    showScoreOverride,
    hasNoGameData,
    showAwaySubmit,
    showHomeSubmit,
    toggleHomeAttendance,
    toggleAwayAttendance,
    handlePlayerChange,
    handleWinnerChange,
    handleTableRunToggle,
    handle8BallToggle,
    handleSubmitLineup,
    handleStartMatch,
    autoAssignPlayers,
    handleScorecardSubmit,
    handleScorecardReject,
    handleFinalizeMatch,
    isStartingMatch,
    isSubmitting,
    scoreOverrideHome,
    scoreOverrideAway,
    setScoreOverrideHome,
    setScoreOverrideAway,
    isSavingScoreOverride,
    handleScoreOverrideSave,
  } = useMatchDetails(matchId);

  // ── Loading / error states ───────────────────────────────────────────

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
        <Text className="text-gray-500 mt-2">Loading match...</Text>
      </View>
    );
  }

  if (error || !match) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <AlertTriangle size={48} color="#EF4444" />
        <Text className="text-red-600 font-medium mt-4 text-center">
          {error || "Match not found"}
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          className="mt-4 px-4 py-2 bg-primary-600 rounded-lg"
        >
          <Text className="text-white font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────

  const totalGames = scoringState?.games.length ?? 0;
  const gamesWithWinners =
    scoringState?.games.filter((g) => g.winner !== null).length ?? 0;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4 pb-20 space-y-4">
        <MatchScoreHeader
          match={match}
          homeScore={displayHomeScore}
          awayScore={displayAwayScore}
          connectionStatus={connectionStatus}
          showConnectionStatus={showConnectionStatus}
          isCompleted={isMatchCompleted}
        />

        {/* Operator mode badge */}
        {isLeagueOperator && (
          <View className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 flex-row items-center gap-2">
            <Shield size={14} color="#7C3AED" />
            <Text className="text-xs font-medium text-purple-700">Operator Mode — Full edit access</Text>
          </View>
        )}

        <StatusBanner
          lineupState={lineupState}
          captainRole={captainRole}
          isLeagueOperator={isLeagueOperator}
          isAuthenticated={isAuthenticated}
          onStartMatch={isReadyToStart ? handleStartMatch : undefined}
          isStartingMatch={isStartingMatch}
        />

        {/* Connection lost banner */}
        {showConnectionStatus && connectionStatus === "error" && (
          <TouchableOpacity
            onPress={reconnectWebSocket}
            className="flex-row items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-2">
              <WifiOff size={14} color="#DC2626" />
              <Text className="text-xs font-medium text-red-700">Connection lost</Text>
            </View>
            <Text className="text-xs text-red-600 underline">Tap to retry</Text>
          </TouchableOpacity>
        )}

        {/* Attendance */}
        {(isAwayLineupPhase || isHomeLineupPhase || isLeagueOperator) && (
          <View className="space-y-3">
            <AttendanceSection
              team="away"
              teamName={awayTeamName}
              roster={scoringState?.awayRoster || []}
              canEdit={canEditAwayLineup}
              onToggleAttendance={toggleAwayAttendance}
              defaultExpanded={isAwayLineupPhase}
              minPlayers={gamesPerSet}
            />
            <AttendanceSection
              team="home"
              teamName={homeTeamName}
              roster={scoringState?.homeRoster || []}
              canEdit={canEditHomeLineup}
              onToggleAttendance={toggleHomeAttendance}
              defaultExpanded={isHomeLineupPhase}
              minPlayers={gamesPerSet}
            />
          </View>
        )}

        <MatchActionBar
          captainRole={captainRole}
          isLeagueOperator={isLeagueOperator}
          isMatchLive={isMatchLive}
          lineupState={lineupState}
          showAwaySubmit={showAwaySubmit}
          showHomeSubmit={showHomeSubmit}
          canEditAwayLineup={canEditAwayLineup}
          canEditHomeLineup={canEditHomeLineup}
          isAwayLineupComplete={isAwayLineupComplete}
          isHomeLineupComplete={isHomeLineupComplete}
          presentAwayCount={presentAway.length}
          presentHomeCount={presentHome.length}
          gamesPerSet={gamesPerSet}
          totalGames={totalGames}
          gamesWithWinners={gamesWithWinners}
          submittedBy={scoringState?.submittedBy ?? null}
          isSubmitting={isSubmitting}
          onAutoAssign={autoAssignPlayers}
          onSubmitLineup={handleSubmitLineup}
          onScorecardSubmit={handleScorecardSubmit}
          onScorecardReject={handleScorecardReject}
          onFinalizeMatch={handleFinalizeMatch}
        />

        {/* Games grid */}
        {scoringState && scoringState.games.length > 0 && (
          <GamesSection
            games={scoringState.games}
            gamesPerSet={gamesPerSet}
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            presentHomePlayers={presentHome}
            presentAwayPlayers={presentAway}
            canEditHome={canEditHomeLineup}
            canEditAway={canEditAwayLineup}
            canScore={canScore}
            isReadOnly={isReadOnly}
            onPlayerChange={handlePlayerChange}
            onWinnerChange={handleWinnerChange}
            onTableRunToggle={handleTableRunToggle}
            on8BallToggle={handle8BallToggle}
          />
        )}

        {/* Operator score override */}
        {showScoreOverride && (
          <ScoreOverrideCard
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            scoreOverrideHome={scoreOverrideHome}
            scoreOverrideAway={scoreOverrideAway}
            onChangeHome={setScoreOverrideHome}
            onChangeAway={setScoreOverrideAway}
            onSave={handleScoreOverrideSave}
            isSaving={isSavingScoreOverride}
            hasNoGameData={hasNoGameData}
          />
        )}
      </View>
    </ScrollView>
  );
}
