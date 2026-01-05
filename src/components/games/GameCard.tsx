import { motion } from 'framer-motion';
import type { Game, GameSelection, TeamStanding } from '@/types';

interface GameCardProps {
  game: Game;
  selection: GameSelection;
  onSelectionChange: (selection: GameSelection) => void;
  homeTeamStanding?: TeamStanding;
  awayTeamStanding?: TeamStanding;
  compact?: boolean;
  highlightTeamId?: string;
}

export function GameCard({
  game,
  selection,
  onSelectionChange,
  homeTeamStanding,
  awayTeamStanding,
  compact = false,
  highlightTeamId,
}: GameCardProps) {
  const isCompleted = game.status === 'final';
  const isLive = game.status === 'in_progress';

  const homeRecord = homeTeamStanding
    ? `${homeTeamStanding.wins}-${homeTeamStanding.losses}${homeTeamStanding.ties ? `-${homeTeamStanding.ties}` : ''}`
    : '';
  const awayRecord = awayTeamStanding
    ? `${awayTeamStanding.wins}-${awayTeamStanding.losses}${awayTeamStanding.ties ? `-${awayTeamStanding.ties}` : ''}`
    : '';

  const homeEliminated = homeTeamStanding?.isEliminated ?? false;
  const awayEliminated = awayTeamStanding?.isEliminated ?? false;

  const handleSelection = (newSelection: GameSelection) => {
    if (isCompleted) return;
    if (selection === newSelection) {
      onSelectionChange(null);
    } else {
      onSelectionChange(newSelection);
    }
  };

  if (compact) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-700/50 rounded p-2 ${isLive ? 'ring-2 ring-green-500' : ''}`}>
        <div className="flex items-center justify-between">
          {/* Away team */}
          <TeamButton
            team={game.awayTeam}
            record={awayRecord}
            isSelected={selection === 'away'}
            isWinner={isCompleted && (game.awayScore ?? 0) > (game.homeScore ?? 0)}
            isEliminated={awayEliminated}
            isCompleted={isCompleted}
            score={isCompleted || isLive ? game.awayScore : undefined}
            onClick={() => handleSelection('away')}
            highlight={highlightTeamId === game.awayTeam.id}
            side="away"
          />

          <div className="text-gray-400 text-xs px-1">@</div>

          {/* Home team */}
          <TeamButton
            team={game.homeTeam}
            record={homeRecord}
            isSelected={selection === 'home'}
            isWinner={isCompleted && (game.homeScore ?? 0) > (game.awayScore ?? 0)}
            isEliminated={homeEliminated}
            isCompleted={isCompleted}
            score={isCompleted || isLive ? game.homeScore : undefined}
            onClick={() => handleSelection('home')}
            highlight={highlightTeamId === game.homeTeam.id}
            side="home"
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-50 dark:bg-gray-700/50 rounded p-2 ${isLive ? 'ring-2 ring-green-500' : ''}`}
    >
      {/* Game time */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-gray-500 dark:text-gray-400">
          {isCompleted
            ? 'Final'
            : isLive
            ? 'LIVE'
            : game.kickoffTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
        {!isCompleted && (
          <button
            onClick={() => handleSelection('tie')}
            className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
              selection === 'tie'
                ? 'bg-gray-600 text-white'
                : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Tie
          </button>
        )}
      </div>

      {/* Teams */}
      <div className="space-y-1">
        {/* Away team */}
        <TeamRow
          team={game.awayTeam}
          record={awayRecord}
          isSelected={selection === 'away'}
          isWinner={isCompleted && (game.awayScore ?? 0) > (game.homeScore ?? 0)}
          isEliminated={awayEliminated}
          isCompleted={isCompleted}
          score={isCompleted || isLive ? game.awayScore : undefined}
          onClick={() => handleSelection('away')}
        />

        {/* Home team */}
        <TeamRow
          team={game.homeTeam}
          record={homeRecord}
          isSelected={selection === 'home'}
          isWinner={isCompleted && (game.homeScore ?? 0) > (game.awayScore ?? 0)}
          isEliminated={homeEliminated}
          isCompleted={isCompleted}
          score={isCompleted || isLive ? game.homeScore : undefined}
          onClick={() => handleSelection('home')}
        />
      </div>
    </motion.div>
  );
}

interface TeamRowProps {
  team: Game['homeTeam'];
  record: string;
  isSelected: boolean;
  isWinner: boolean;
  isEliminated: boolean;
  isCompleted: boolean;
  score?: number | null;
  onClick: () => void;
}

function TeamRow({
  team,
  record,
  isSelected,
  isWinner,
  isEliminated,
  isCompleted,
  score,
  onClick,
}: TeamRowProps) {
  return (
    <button
      onClick={onClick}
      disabled={isCompleted}
      className={`w-full flex items-center justify-between p-1.5 rounded transition-all ${
        isCompleted
          ? isWinner
            ? 'bg-green-100 dark:bg-green-900/30'
            : 'opacity-60'
          : isSelected
          ? 'ring-2 ring-offset-1 dark:ring-offset-gray-700'
          : 'hover:bg-gray-100 dark:hover:bg-gray-600'
      } ${isEliminated && !isCompleted ? 'opacity-50 grayscale' : ''}`}
      style={isSelected ? {
        '--tw-ring-color': team.primaryColor,
      } as React.CSSProperties : undefined}
    >
      <div className="flex items-center gap-2">
        <img
          src={team.logo}
          alt={team.name}
          className="w-6 h-6 object-contain"
        />
        <div className="text-left">
          <div className="font-medium text-xs text-gray-900 dark:text-white">
            {team.abbreviation}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400">
            {record}
          </div>
        </div>
      </div>

      {score !== undefined && score !== null && (
        <span className={`text-sm font-bold ${isWinner ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
          {score}
        </span>
      )}

      {!isCompleted && isSelected && (
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: team.primaryColor }}
        >
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
}

interface TeamButtonProps extends TeamRowProps {
  highlight?: boolean;
  side: 'home' | 'away';
}

function TeamButton({
  team,
  record,
  isSelected,
  isWinner,
  isEliminated,
  isCompleted,
  score,
  onClick,
  highlight,
  side,
}: TeamButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isCompleted}
      className={`flex-1 flex items-center gap-1.5 p-1.5 rounded transition-all ${
        side === 'away' ? '' : 'flex-row-reverse'
      } ${
        isCompleted
          ? isWinner
            ? 'bg-green-100 dark:bg-green-900/30'
            : 'opacity-60'
          : isSelected
          ? 'ring-2'
          : 'hover:bg-gray-100 dark:hover:bg-gray-600'
      } ${isEliminated && !isCompleted ? 'opacity-50 grayscale' : ''} ${highlight ? 'font-bold' : ''}`}
      style={isSelected ? {
        '--tw-ring-color': team.primaryColor,
      } as React.CSSProperties : undefined}
    >
      <img
        src={team.logo}
        alt={team.name}
        className="w-5 h-5 object-contain"
      />
      <span className="text-xs font-medium">{team.abbreviation}</span>
      {score !== undefined && score !== null && (
        <span className={`text-xs font-bold ml-0.5 ${isWinner ? 'text-green-600' : ''}`}>
          {score}
        </span>
      )}
    </button>
  );
}
