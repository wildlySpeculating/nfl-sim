import { useState, useMemo } from 'react';
import type { Game, GameSelection, TeamStanding, Team, Division } from '@/types';
import { teams } from '@/data/teams';
import { GameCard } from './GameCard';
import { calculateTeamPaths, type TeamPath } from '@/utils/teamPaths';

interface TeamViewProps {
  games: Game[];
  selections: Record<string, GameSelection>;
  standings: TeamStanding[];
  onSelectionChange: (gameId: string, selection: GameSelection) => void;
  onTeamWinsAll: (teamId: string) => void;
  getTeamStanding: (teamId: string) => TeamStanding | undefined;
}

const AFC_DIVISIONS: Division[] = ['AFC East', 'AFC North', 'AFC South', 'AFC West'];
const NFC_DIVISIONS: Division[] = ['NFC East', 'NFC North', 'NFC South', 'NFC West'];

export function TeamView({
  games,
  selections,
  standings,
  onSelectionChange,
  onTeamWinsAll,
  getTeamStanding,
}: TeamViewProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0].id);

  const selectedTeam = useMemo(() =>
    teams.find(t => t.id === selectedTeamId) || teams[0],
    [selectedTeamId]
  );

  const teamStanding = useMemo(() =>
    standings.find(s => s.team.id === selectedTeamId),
    [standings, selectedTeamId]
  );

  // Get all games for selected team
  const teamGames = useMemo(() => {
    return games
      .filter(g => g.homeTeam.id === selectedTeamId || g.awayTeam.id === selectedTeamId)
      .sort((a, b) => a.week - b.week);
  }, [games, selectedTeamId]);

  // Count remaining games
  const remainingGames = useMemo(() =>
    teamGames.filter(g => g.status !== 'final').length,
    [teamGames]
  );

  // Calculate team paths
  const paths = useMemo(() => {
    return calculateTeamPaths(selectedTeamId, games, selections, standings);
  }, [selectedTeamId, games, selections, standings]);

  // Group paths by type
  const byePaths = paths.filter(p => p.type === 'bye');
  const divisionPaths = paths.filter(p => p.type === 'division');
  const wildcardPaths = paths.filter(p => p.type === 'wildcard');

  // Group teams by division
  const teamsByDivision = useMemo(() => {
    const grouped: Record<Division, Team[]> = {} as Record<Division, Team[]>;
    for (const division of [...AFC_DIVISIONS, ...NFC_DIVISIONS]) {
      grouped[division] = teams.filter(t => t.division === division);
    }
    return grouped;
  }, []);

  return (
    <div>
      {/* Team selector grid */}
      <div className="mb-3 space-y-2">
        {/* AFC */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <img src="https://a.espncdn.com/i/teamlogos/nfl/500/afc.png" alt="AFC" className="h-4 w-4 object-contain" />
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">AFC</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {AFC_DIVISIONS.map(division => (
              <div key={division} className="space-y-0.5">
                <div className="text-[8px] text-gray-400 dark:text-gray-500 text-center truncate">
                  {division.replace('AFC ', '')}
                </div>
                <div className="flex flex-col gap-0.5">
                  {teamsByDivision[division].map(team => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`p-1 rounded transition-all ${
                        selectedTeamId === team.id
                          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={`${team.location} ${team.name}`}
                    >
                      <img src={team.logo} alt={team.name} className="w-6 h-6 mx-auto object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NFC */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <img src="https://a.espncdn.com/i/teamlogos/nfl/500/nfc.png" alt="NFC" className="h-4 w-4 object-contain" />
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">NFC</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {NFC_DIVISIONS.map(division => (
              <div key={division} className="space-y-0.5">
                <div className="text-[8px] text-gray-400 dark:text-gray-500 text-center truncate">
                  {division.replace('NFC ', '')}
                </div>
                <div className="flex flex-col gap-0.5">
                  {teamsByDivision[division].map(team => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`p-1 rounded transition-all ${
                        selectedTeamId === team.id
                          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={`${team.location} ${team.name}`}
                    >
                      <img src={team.logo} alt={team.name} className="w-6 h-6 mx-auto object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team header */}
      <div
        className="rounded-lg p-4 mb-4 flex items-center justify-between"
        style={{ backgroundColor: `${selectedTeam.primaryColor}20` }}
      >
        <div className="flex items-center gap-3">
          <img
            src={selectedTeam.logo}
            alt={selectedTeam.name}
            className="w-12 h-12 object-contain"
          />
          <div>
            <h2 className="font-bold text-lg" style={{ color: selectedTeam.primaryColor }}>
              {selectedTeam.location} {selectedTeam.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedTeam.division}
            </p>
          </div>
        </div>

        {remainingGames > 0 && (
          <button
            onClick={() => onTeamWinsAll(selectedTeamId)}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: selectedTeam.primaryColor,
              color: 'white',
            }}
          >
            Win All ({remainingGames})
          </button>
        )}
      </div>

      {/* Team Needs Section */}
      {teamStanding && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
            What does {selectedTeam.abbreviation} need?
          </h3>

          {teamStanding.clinched && (
            <div className="text-sm text-green-600 dark:text-green-400">
              {teamStanding.clinched === 'bye' && '✓ Clinched first-round bye'}
              {teamStanding.clinched === 'division' && '✓ Clinched division title'}
              {teamStanding.clinched === 'playoff' && '✓ Clinched playoff spot'}
            </div>
          )}

          {teamStanding.isEliminated && (
            <div className="text-sm text-red-600 dark:text-red-400">
              ✗ Eliminated from playoff contention
            </div>
          )}

          {!teamStanding.clinched && !teamStanding.isEliminated && paths.length > 0 && (
            <div className="space-y-2">
              {byePaths.length > 0 && (
                <PathSection title="First-Round Bye" paths={byePaths.slice(0, 1)} color="yellow" />
              )}
              {divisionPaths.length > 0 && (
                <PathSection title="Division Title" paths={divisionPaths.slice(0, 1)} color="green" />
              )}
              {wildcardPaths.length > 0 && (
                <PathSection title="Playoff Spot" paths={wildcardPaths.slice(0, 1)} color="blue" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Games list */}
      <div className="space-y-2">
        {teamGames.map(game => {
          const isHome = game.homeTeam.id === selectedTeamId;
          const opponent = isHome ? game.awayTeam : game.homeTeam;

          return (
            <div key={game.id} className="relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 w-8">
                W{game.week}
              </div>
              <div className="ml-10">
                <GameCard
                  game={game}
                  selection={selections[game.id] || null}
                  onSelectionChange={(selection) => onSelectionChange(game.id, selection)}
                  homeTeamStanding={getTeamStanding(game.homeTeam.id)}
                  awayTeamStanding={getTeamStanding(game.awayTeam.id)}
                  compact
                  highlightTeamId={selectedTeamId}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Path section component
interface PathSectionProps {
  title: string;
  paths: TeamPath[];
  color: 'yellow' | 'green' | 'blue';
}

function PathSection({ title, paths, color }: PathSectionProps) {
  const colorClasses = {
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  };

  const titleColors = {
    yellow: 'text-yellow-700 dark:text-yellow-400',
    green: 'text-green-700 dark:text-green-400',
    blue: 'text-blue-700 dark:text-blue-400',
  };

  return (
    <div className={`rounded border p-2 ${colorClasses[color]}`}>
      <h4 className={`font-medium text-xs mb-1 ${titleColors[color]}`}>{title}</h4>
      {paths.map((path, i) => (
        <PathDisplay key={i} path={path} />
      ))}
    </div>
  );
}

function PathDisplay({ path }: { path: TeamPath }) {
  if (path.requirements.length === 0) {
    return (
      <p className="text-xs text-gray-600 dark:text-gray-300">{path.description}</p>
    );
  }

  return (
    <div className="text-xs">
      <p className="text-gray-600 dark:text-gray-300 mb-1">{path.description}</p>
      <ul className="space-y-0.5 ml-2">
        {path.requirements.map((req, i) => (
          <li key={i} className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <span className={req.type === 'win' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {req.type === 'win' ? '✓' : '✗'}
            </span>
            <span>
              {req.type === 'win' ? 'Beat' : 'Lose to'} {req.opponentName} (Week {req.week})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
