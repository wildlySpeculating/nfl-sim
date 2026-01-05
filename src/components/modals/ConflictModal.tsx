import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Game, GameSelection } from '@/types';

interface ConflictModalProps {
  games: Game[];
  onResolve: (selections: Record<string, GameSelection>) => void;
  onCancel: () => void;
}

export function ConflictModal({ games, onResolve, onCancel }: ConflictModalProps) {
  const [selections, setSelections] = useState<Record<string, GameSelection>>({});

  const allResolved = games.every(g => selections[g.id]);

  const handleResolve = () => {
    if (allResolved) {
      onResolve(selections);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Resolve Conflicts
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Select a winner for each conflicting game
          </p>
        </div>

        {/* Games list */}
        <div className="px-6 py-4 space-y-4 max-h-[50vh] overflow-y-auto">
          {games.map(game => (
            <ConflictGame
              key={game.id}
              game={game}
              selection={selections[game.id] || null}
              onSelectionChange={(selection) =>
                setSelections(prev => ({ ...prev, [game.id]: selection }))
              }
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={!allResolved}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              allResolved
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Apply Selections
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface ConflictGameProps {
  game: Game;
  selection: GameSelection;
  onSelectionChange: (selection: GameSelection) => void;
}

function ConflictGame({ game, selection, onSelectionChange }: ConflictGameProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Week {game.week}
      </div>

      <div className="flex items-center gap-2">
        {/* Away team */}
        <button
          onClick={() => onSelectionChange('away')}
          className={`flex-1 flex items-center gap-2 p-2 rounded-lg transition-all ${
            selection === 'away'
              ? 'ring-2 bg-white dark:bg-gray-600'
              : 'hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
          style={selection === 'away' ? {
            '--tw-ring-color': game.awayTeam.primaryColor,
          } as React.CSSProperties : undefined}
        >
          <img
            src={game.awayTeam.logo}
            alt={game.awayTeam.name}
            className="w-8 h-8 object-contain"
          />
          <span className="font-medium text-gray-900 dark:text-white">
            {game.awayTeam.abbreviation}
          </span>
        </button>

        <span className="text-gray-400">@</span>

        {/* Home team */}
        <button
          onClick={() => onSelectionChange('home')}
          className={`flex-1 flex items-center gap-2 p-2 rounded-lg transition-all ${
            selection === 'home'
              ? 'ring-2 bg-white dark:bg-gray-600'
              : 'hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
          style={selection === 'home' ? {
            '--tw-ring-color': game.homeTeam.primaryColor,
          } as React.CSSProperties : undefined}
        >
          <img
            src={game.homeTeam.logo}
            alt={game.homeTeam.name}
            className="w-8 h-8 object-contain"
          />
          <span className="font-medium text-gray-900 dark:text-white">
            {game.homeTeam.abbreviation}
          </span>
        </button>
      </div>

      {/* Tie option */}
      <button
        onClick={() => onSelectionChange('tie')}
        className={`w-full mt-2 py-1 text-xs font-medium rounded transition-colors ${
          selection === 'tie'
            ? 'bg-gray-600 text-white'
            : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        Tie
      </button>
    </div>
  );
}
