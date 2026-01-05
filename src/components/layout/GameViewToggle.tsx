import type { ViewMode } from '@/types';

interface GameViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function GameViewToggle({ viewMode, onViewModeChange }: GameViewToggleProps) {
  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded p-0.5 flex">
      <button
        onClick={() => onViewModeChange('week')}
        className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
          viewMode === 'week'
            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`}
      >
        Week
      </button>
      <button
        onClick={() => onViewModeChange('team')}
        className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
          viewMode === 'team'
            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`}
      >
        Team
      </button>
    </div>
  );
}
