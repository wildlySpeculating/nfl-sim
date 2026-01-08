import { useState, useCallback, useEffect } from 'react';
import { useEspnApi } from '@/hooks/useEspnApi';
import { useScenario } from '@/hooks/useScenario';
import { useStandings } from '@/hooks/useStandings';
import { useUrlState } from '@/hooks/useUrlState';
import { Header } from '@/components/layout/Header';
import { GameViewToggle } from '@/components/layout/GameViewToggle';
import { WeekView } from '@/components/games/WeekView';
import { TeamView } from '@/components/games/TeamView';
import { StandingsPanel } from '@/components/standings/StandingsPanel';
import { PlayoffBracket } from '@/components/bracket/PlayoffBracket';
import { ConflictModal } from '@/components/modals/ConflictModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StaleBanner } from '@/components/ui/StaleBanner';
import type { ViewMode, Game, GameSelection, PlayoffPicks } from '@/types';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  // Conflict modal state
  const [conflictGames, setConflictGames] = useState<Game[]>([]);
  const [pendingSelections, setPendingSelections] = useState<Record<string, GameSelection>>({});

  // Data fetching
  const { games, playoffGames, currentWeek, isLoading, error, isStale, lastUpdated, refresh } = useEspnApi();

  // Set selected week to current week once loaded
  useEffect(() => {
    if (selectedWeek === null && currentWeek && !isLoading) {
      setSelectedWeek(currentWeek);
    }
  }, [currentWeek, isLoading, selectedWeek]);

  // Scenario state
  const {
    selections,
    playoffPicks,
    setGameWinner,
    setTeamWinsRemaining,
    clearSelections,
    clearPlayoffPicks,
    setPlayoffWinner,
    setSuperBowlWinner,
    getConflicts,
    applyBulkSelections,
  } = useScenario();

  // Standings calculation
  const { afcStandings, nfcStandings, getTeamStanding } = useStandings(games, selections);

  // URL state management
  const handleStateLoad = useCallback((state: { selections: Record<string, GameSelection>; playoffPicks: PlayoffPicks }) => {
    applyBulkSelections(state.selections);
  }, [applyBulkSelections]);

  const { getShareableUrl, copyShareableUrl } = useUrlState(
    selections,
    playoffPicks,
    games,
    handleStateLoad
  );

  // Handle team wins all (with conflict detection)
  const handleTeamWinsAll = useCallback((teamId: string) => {
    const conflicts = getConflicts(teamId, games);
    if (conflicts.length > 0) {
      setConflictGames(conflicts.map(c => c.game));
      const teamGames = games.filter(
        g => g.status !== 'final' &&
        (g.homeTeam.id === teamId || g.awayTeam.id === teamId)
      );
      const pending: Record<string, GameSelection> = {};
      for (const game of teamGames) {
        const isConflict = conflicts.some(c => c.gameId === game.id);
        if (!isConflict) {
          const teamIsHome = game.homeTeam.id === teamId;
          pending[game.id] = teamIsHome ? 'home' : 'away';
        }
      }
      setPendingSelections(pending);
    } else {
      setTeamWinsRemaining(teamId, games);
    }
  }, [games, getConflicts, setTeamWinsRemaining]);

  // Handle conflict resolution
  const handleConflictResolve = useCallback((resolvedSelections: Record<string, GameSelection>) => {
    applyBulkSelections({ ...pendingSelections, ...resolvedSelections });
    setConflictGames([]);
    setPendingSelections({});
  }, [applyBulkSelections, pendingSelections]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (confirm('Reset all selections? This cannot be undone.')) {
      clearSelections();
      clearPlayoffPicks();
    }
  }, [clearSelections, clearPlayoffPicks]);

  // Handle share
  const handleShare = useCallback(async () => {
    const success = await copyShareableUrl();
    if (success) {
      alert('Link copied to clipboard!');
    } else {
      const url = getShareableUrl();
      prompt('Copy this link:', url);
    }
  }, [copyShareableUrl, getShareableUrl]);

  if (isLoading && games.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && games.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {isStale && <StaleBanner lastUpdated={lastUpdated} onRefresh={refresh} />}

      <Header
        onReset={handleReset}
        onShare={handleShare}
        hasSelections={Object.keys(selections).length > 0}
      />

      <main className="container mx-auto px-3 py-3">
        <div className="lg:grid lg:grid-cols-12 lg:gap-3">
          {/* Left column: Games + Team Needs */}
          <div className="lg:col-span-4 mb-3 lg:mb-0 space-y-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="font-bold text-base text-gray-900 dark:text-white">Games</h2>
                <GameViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              </div>

              <div className="p-2">
                {viewMode === 'week' && selectedWeek !== null && (
                  <WeekView
                    games={games}
                    currentWeek={currentWeek}
                    selectedWeek={selectedWeek}
                    selections={selections}
                    onWeekChange={setSelectedWeek}
                    onSelectionChange={setGameWinner}
                    getTeamStanding={getTeamStanding}
                  />
                )}

                {viewMode === 'team' && (
                  <TeamView
                    games={games}
                    selections={selections}
                    standings={[...afcStandings, ...nfcStandings]}
                    onSelectionChange={setGameWinner}
                    onTeamWinsAll={handleTeamWinsAll}
                    getTeamStanding={getTeamStanding}
                  />
                )}
              </div>
            </div>

          </div>

          {/* Right column: Bracket + Standings */}
          <div className="lg:col-span-8 space-y-3">
            {/* Playoff Bracket */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-bold text-base text-gray-900 dark:text-white">Playoff Bracket</h2>
              </div>
              <PlayoffBracket
                playoffPicks={playoffPicks}
                playoffGames={playoffGames}
                afcStandings={afcStandings}
                nfcStandings={nfcStandings}
                onPlayoffWinnerChange={setPlayoffWinner}
                onSuperBowlWinnerChange={setSuperBowlWinner}
              />
            </div>

            {/* Standings */}
            <StandingsPanel
              afcStandings={afcStandings}
              nfcStandings={nfcStandings}
            />
          </div>
        </div>
      </main>

      {/* Conflict resolution modal */}
      {conflictGames.length > 0 && (
        <ConflictModal
          games={conflictGames}
          onResolve={handleConflictResolve}
          onCancel={() => {
            setConflictGames([]);
            setPendingSelections({});
          }}
        />
      )}
    </div>
  );
}

export default App;
