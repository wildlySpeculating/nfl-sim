import { useMemo } from 'react';
import type { Game, GameSelection, TeamStanding } from '@/types';
import { GameCard } from './GameCard';

interface WeekViewProps {
  games: Game[];
  selectedWeek: number;
  selections: Record<string, GameSelection>;
  onWeekChange: (week: number) => void;
  onSelectionChange: (gameId: string, selection: GameSelection) => void;
  getTeamStanding: (teamId: string) => TeamStanding | undefined;
}

export function WeekView({
  games,
  selectedWeek,
  selections,
  onWeekChange,
  onSelectionChange,
  getTeamStanding,
}: WeekViewProps) {
  // Filter games by selected week
  const weekGames = useMemo(() => {
    return games
      .filter(g => g.week === selectedWeek)
      .sort((a, b) => a.kickoffTime.getTime() - b.kickoffTime.getTime());
  }, [games, selectedWeek]);

  // Group games by day
  const gamesByDay = useMemo(() => {
    const groups: Map<string, Game[]> = new Map();

    for (const game of weekGames) {
      const dateKey = game.kickoffTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(game);
    }

    return groups;
  }, [weekGames]);

  return (
    <div>
      {/* Week selector - two rows */}
      <div className="mb-2 space-y-1">
        {/* Weeks 1-9 */}
        <div className="grid grid-cols-9 gap-1">
          {Array.from({ length: 9 }, (_, i) => i + 1).map(week => (
            <button
              key={week}
              onClick={() => onWeekChange(week)}
              className={`py-1 text-xs font-medium rounded transition-colors ${
                week === selectedWeek
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {week}
            </button>
          ))}
        </div>
        {/* Weeks 10-18 */}
        <div className="grid grid-cols-9 gap-1">
          {Array.from({ length: 9 }, (_, i) => i + 10).map(week => (
            <button
              key={week}
              onClick={() => onWeekChange(week)}
              className={`py-1 text-xs font-medium rounded transition-colors ${
                week === selectedWeek
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {week}
            </button>
          ))}
        </div>
      </div>

      {/* Games list */}
      <div className="space-y-2">
        {Array.from(gamesByDay.entries()).map(([dateKey, dayGames]) => (
          <div key={dateKey}>
            <h3 className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">
              {dateKey}
            </h3>
            <div className="space-y-1">
              {dayGames.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  selection={selections[game.id] || null}
                  onSelectionChange={(selection) => onSelectionChange(game.id, selection)}
                  homeTeamStanding={getTeamStanding(game.homeTeam.id)}
                  awayTeamStanding={getTeamStanding(game.awayTeam.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {weekGames.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            No games scheduled for Week {selectedWeek}
          </div>
        )}
      </div>
    </div>
  );
}
