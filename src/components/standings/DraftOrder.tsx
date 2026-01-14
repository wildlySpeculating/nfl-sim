import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TeamStanding, PlayoffPicks, Game } from '@/types';
import type { PlayoffGame } from '@/hooks/useEspnApi';
import { calculateDraftOrder, DraftPick } from '@/utils/draftOrder';

interface DraftOrderProps {
  afcStandings: TeamStanding[];
  nfcStandings: TeamStanding[];
  playoffPicks: PlayoffPicks;
  playoffGames: PlayoffGame[];
  games: Game[];
}

// Helper to determine what round needs picks next
function getMissingRoundMessage(
  playoffPicks: PlayoffPicks,
  playoffGames: PlayoffGame[]
): string | null {
  // Check wild card (6 games total - 3 per conference)
  const wcGames = playoffGames.filter(g => g.round === 'wildCard');
  const wcComplete = wcGames.filter(g => g.status === 'final').length;
  const wcPicks = [
    ...playoffPicks.afc.wildCard.filter(p => p !== null),
    ...playoffPicks.nfc.wildCard.filter(p => p !== null),
  ].length;
  const wcTotal = wcComplete + wcPicks;
  if (wcTotal < 6) {
    const remaining = 6 - wcTotal;
    return `Select ${remaining} more Wild Card winner${remaining > 1 ? 's' : ''} to see picks 19-24`;
  }

  // Check divisional (4 games total - 2 per conference)
  const divGames = playoffGames.filter(g => g.round === 'divisional');
  const divComplete = divGames.filter(g => g.status === 'final').length;
  const divPicks = [
    ...playoffPicks.afc.divisional.filter(p => p !== null),
    ...playoffPicks.nfc.divisional.filter(p => p !== null),
  ].length;
  const divTotal = divComplete + divPicks;
  if (divTotal < 4) {
    const remaining = 4 - divTotal;
    return `Select ${remaining} more Divisional winner${remaining > 1 ? 's' : ''} to see picks 25-28`;
  }

  // Check conference championship (2 games total)
  const confGames = playoffGames.filter(g => g.round === 'championship');
  const confComplete = confGames.filter(g => g.status === 'final').length;
  const confPicks = [
    playoffPicks.afc.championship,
    playoffPicks.nfc.championship,
  ].filter(p => p !== null).length;
  const confTotal = confComplete + confPicks;
  if (confTotal < 2) {
    const remaining = 2 - confTotal;
    return `Select ${remaining} more Conference Championship winner${remaining > 1 ? 's' : ''} to see picks 29-30`;
  }

  // Check Super Bowl
  const sbGame = playoffGames.find(g => g.round === 'superBowl');
  const sbComplete = sbGame?.status === 'final';
  if (!sbComplete && !playoffPicks.superBowl) {
    return 'Select Super Bowl winner to see picks 31-32';
  }

  return null;
}

export function DraftOrder({ afcStandings, nfcStandings, playoffPicks, playoffGames, games }: DraftOrderProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const draftOrder = useMemo(() => {
    return calculateDraftOrder(afcStandings, nfcStandings, playoffPicks, playoffGames, games);
  }, [afcStandings, nfcStandings, playoffPicks, playoffGames, games]);

  // Get dynamic message about what's needed next
  const missingRoundMessage = getMissingRoundMessage(playoffPicks, playoffGames);
  const partialPicks = draftOrder.length > 0 && draftOrder.length < 32;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-base text-gray-900 dark:text-white">Draft Order</h2>
          {partialPicks && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              Partial
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {draftOrder.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Make selections to see the projected draft order
              </div>
            ) : (
              <>
                {missingRoundMessage && (
                  <div className="px-3 py-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/30">
                    {missingRoundMessage}
                  </div>
                )}

                {/* Table header */}
                <div className="grid grid-cols-12 gap-1 px-3 py-1 text-[10px] font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <div className="col-span-1">Pick</div>
                  <div className="col-span-5">Team</div>
                  <div className="col-span-2 text-center">Record</div>
                  <div className="col-span-4">Reason</div>
                </div>

                {/* Draft picks */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {draftOrder.map((pick) => (
                    <DraftPickRow key={pick.pick} pick={pick} />
                  ))}
                </div>

                {/* Summary */}
                <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                  Showing {draftOrder.length} of 32 picks
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DraftPickRowProps {
  pick: DraftPick;
}

function DraftPickRow({ pick }: DraftPickRowProps) {
  const { team } = pick;

  // Color code by reason
  const getReasonColor = () => {
    switch (pick.reason) {
      case 'Did not make playoffs':
        return 'text-gray-500 dark:text-gray-400';
      case 'Lost in Wild Card':
        return 'text-blue-600 dark:text-blue-400';
      case 'Lost in Divisional':
        return 'text-purple-600 dark:text-purple-400';
      case 'Lost in Conference Championship':
        return 'text-orange-600 dark:text-orange-400';
      case 'Lost Super Bowl':
        return 'text-red-600 dark:text-red-400';
      case 'Won Super Bowl':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-12 gap-1 px-3 py-1.5 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
    >
      {/* Pick number */}
      <div className="col-span-1">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {pick.pick}
        </span>
      </div>

      {/* Team info */}
      <div className="col-span-5 flex items-center gap-1.5">
        <img
          src={team.logo}
          alt={team.name}
          className="w-5 h-5 object-contain"
        />
        <span className="font-medium text-xs text-gray-900 dark:text-white truncate">
          {team.location} {team.name}
        </span>
      </div>

      {/* Record */}
      <div className="col-span-2 text-center text-xs text-gray-700 dark:text-gray-300">
        {pick.record}
      </div>

      {/* Reason */}
      <div className={`col-span-4 text-[10px] truncate ${getReasonColor()}`}>
        {pick.reason}
      </div>
    </motion.div>
  );
}
