import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TeamStanding, LastFiveGame } from '@/types';
import { formatRecord, formatDivisionRecord, formatPointDiff } from '@/hooks/useStandings';

interface StandingsPanelProps {
  afcStandings: TeamStanding[];
  nfcStandings: TeamStanding[];
}

export function StandingsPanel({ afcStandings, nfcStandings }: StandingsPanelProps) {
  const [expandedConference, setExpandedConference] = useState<'AFC' | 'NFC' | 'both'>('both');

  return (
    <div className="space-y-2">
      {/* AFC Standings */}
      <ConferenceStandings
        conference="AFC"
        standings={afcStandings}
        isExpanded={expandedConference === 'AFC' || expandedConference === 'both'}
        onToggle={() => setExpandedConference(prev =>
          prev === 'AFC' ? 'both' : prev === 'both' ? 'NFC' : 'AFC'
        )}
      />

      {/* NFC Standings */}
      <ConferenceStandings
        conference="NFC"
        standings={nfcStandings}
        isExpanded={expandedConference === 'NFC' || expandedConference === 'both'}
        onToggle={() => setExpandedConference(prev =>
          prev === 'NFC' ? 'both' : prev === 'both' ? 'AFC' : 'NFC'
        )}
      />
    </div>
  );
}

interface ConferenceStandingsProps {
  conference: 'AFC' | 'NFC';
  standings: TeamStanding[];
  isExpanded: boolean;
  onToggle: () => void;
}

function ConferenceStandings({ conference, standings, isExpanded, onToggle }: ConferenceStandingsProps) {
  // Separate playoff teams from non-playoff
  const playoffTeams = standings.filter(s => s.seed !== null).sort((a, b) => a.seed! - b.seed!);
  const nonPlayoffTeams = standings.filter(s => s.seed === null);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <h2 className="font-bold text-base text-gray-900 dark:text-white">{conference}</h2>
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
            {/* Table header */}
            <div className="grid grid-cols-12 gap-1 px-3 py-1 text-[10px] font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <div className="col-span-3">Team</div>
              <div className="col-span-2 text-center">Record</div>
              <div className="col-span-2 text-center">Div</div>
              <div className="col-span-2 text-center">Diff</div>
              <div className="col-span-1 text-center">Strk</div>
              <div className="col-span-2 text-center">L5</div>
            </div>

            {/* Playoff teams */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {playoffTeams.map((standing, index) => (
                <TeamRow
                  key={standing.team.id}
                  standing={standing}
                  rank={standing.seed!}
                  showPlayoffLine={index === 0 || index === 3}
                />
              ))}
            </div>

            {/* Playoff line */}
            <div className="h-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />

            {/* Non-playoff teams */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700 opacity-60">
              {nonPlayoffTeams.map((standing, index) => (
                <TeamRow
                  key={standing.team.id}
                  standing={standing}
                  rank={8 + index}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TeamRowProps {
  standing: TeamStanding;
  rank: number;
  showPlayoffLine?: boolean;
}

function TeamRow({ standing, rank, showPlayoffLine }: TeamRowProps) {
  const { team, clinched, isEliminated, streak, lastFive, magicNumber } = standing;

  // Format magic number tooltip
  const getMagicTooltip = () => {
    if (clinched) return null;
    if (isEliminated) return 'Eliminated';
    if (!magicNumber) return null;

    const parts: string[] = [];
    if (magicNumber.playoff !== null && magicNumber.playoff > 0) {
      parts.push(`Playoff: ${magicNumber.playoff} win${magicNumber.playoff !== 1 ? 's' : ''}`);
    }
    if (magicNumber.division !== null && magicNumber.division > 0) {
      parts.push(`Division: ${magicNumber.division} win${magicNumber.division !== 1 ? 's' : ''}`);
    }
    if (magicNumber.bye !== null && magicNumber.bye > 0) {
      parts.push(`Bye: ${magicNumber.bye} win${magicNumber.bye !== 1 ? 's' : ''}`);
    }
    return parts.join(' • ');
  };

  const magicTooltip = getMagicTooltip();

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`grid grid-cols-12 gap-1 px-3 py-1 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
        isEliminated ? 'opacity-50 grayscale' : ''
      }`}
      title={magicTooltip || undefined}
    >
      {/* Team info */}
      <div className="col-span-3 flex items-center gap-1">
        <span className="w-4 text-[10px] text-gray-400">{rank}</span>
        <img
          src={team.logo}
          alt={team.name}
          className="w-5 h-5 object-contain"
        />
        <div className="flex items-center gap-0.5">
          <span className="font-medium text-xs text-gray-900 dark:text-white">
            {team.abbreviation}
          </span>
          {clinched && (
            <span
              className={`text-[9px] px-0.5 rounded ${
                clinched === 'bye'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : clinched === 'division'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
              }`}
            >
              {clinched === 'bye' ? 'BYE' : clinched === 'division' ? 'DIV' : 'WC'}
            </span>
          )}
          {!clinched && !isEliminated && magicNumber && magicNumber.playoff !== null && magicNumber.playoff > 0 && (
            <span className="text-[9px] px-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
              M{magicNumber.playoff}
            </span>
          )}
        </div>
      </div>

      {/* Record */}
      <div className="col-span-2 text-center text-xs text-gray-700 dark:text-gray-300">
        {formatRecord(standing)}
      </div>

      {/* Division record */}
      <div className="col-span-2 text-center text-xs text-gray-500 dark:text-gray-400">
        {formatDivisionRecord(standing)}
      </div>

      {/* Point differential */}
      <div className={`col-span-2 text-center text-xs font-medium ${
        standing.pointsFor - standing.pointsAgainst > 0
          ? 'text-green-600 dark:text-green-400'
          : standing.pointsFor - standing.pointsAgainst < 0
          ? 'text-red-600 dark:text-red-400'
          : 'text-gray-500'
      }`}>
        {formatPointDiff(standing)}
      </div>

      {/* Streak */}
      <div className={`col-span-1 text-center text-[10px] font-medium ${
        streak?.startsWith('W')
          ? 'text-green-600 dark:text-green-400'
          : streak?.startsWith('L')
          ? 'text-red-600 dark:text-red-400'
          : 'text-gray-500'
      }`}>
        {streak || '-'}
      </div>

      {/* Last 5 */}
      <div className="col-span-2 flex justify-center gap-0.5">
        {lastFive && lastFive.length > 0 ? (
          lastFive.map((game, i) => (
            <LastFiveIndicator key={i} game={game} />
          ))
        ) : (
          <span className="text-[10px] text-gray-400">-</span>
        )}
      </div>
    </motion.div>
  );
}

interface LastFiveIndicatorProps {
  game: LastFiveGame;
}

function LastFiveIndicator({ game }: LastFiveIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tooltipRef.current &&
        buttonRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    }

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTooltip]);

  const formatScore = () => {
    if (game.isProjected) {
      return `Wk ${game.week}: vs ${game.opponentName} (projected)`;
    }
    return `Wk ${game.week}: ${game.teamName} ${game.teamScore} - ${game.opponentName} ${game.opponentScore}`;
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`w-3 h-3 rounded-full text-[8px] font-bold flex items-center justify-center cursor-pointer transition-transform hover:scale-125 ${
          game.result === 'W'
            ? 'bg-green-500 text-white'
            : game.result === 'L'
            ? 'bg-red-500 text-white'
            : 'bg-gray-400 text-white'
        } ${game.isProjected ? 'ring-1 ring-offset-1 ring-gray-400' : ''}`}
      >
        {game.result}
      </button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full right-0 mb-1 px-2 py-1 text-[10px] font-medium text-white bg-gray-900 dark:bg-gray-700 rounded shadow-lg whitespace-nowrap pointer-events-none"
          >
            {formatScore()}
            <div className="absolute top-full right-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
