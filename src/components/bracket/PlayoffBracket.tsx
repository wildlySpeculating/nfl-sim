import { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { PlayoffPicks, TeamStanding, Team } from '@/types';
import type { PlayoffGame } from '@/hooks/useEspnApi';

interface PlayoffBracketProps {
  playoffPicks: PlayoffPicks;
  playoffGames: PlayoffGame[];
  afcStandings: TeamStanding[];
  nfcStandings: TeamStanding[];
  onPlayoffWinnerChange: (
    conference: 'afc' | 'nfc',
    round: 'wildCard' | 'divisional' | 'championship',
    matchupIndex: number,
    winnerId: string | null
  ) => void;
  onSuperBowlWinnerChange: (winnerId: string | null) => void;
}

interface TeamWithSeed {
  team: Team;
  seed: number;
}

interface BracketState {
  seeds: TeamWithSeed[];
  wildCardMatchups: [TeamWithSeed | null, TeamWithSeed | null][];
  wildCardWinners: (TeamWithSeed | null)[];
  divisionalMatchups: [TeamWithSeed | null, TeamWithSeed | null][];
  divisionalWinners: (TeamWithSeed | null)[];
  championshipMatchup: [TeamWithSeed | null, TeamWithSeed | null];
  champion: TeamWithSeed | null;
}

// Build bracket from actual playoff games
function buildBracketFromGames(
  conferenceGames: Record<string, PlayoffGame[]>,
  picks: PlayoffPicks['afc'],
  fallbackSeeds: TeamWithSeed[]
): BracketState {
  const wcGames = conferenceGames.wildCard || [];
  const divGames = conferenceGames.divisional || [];
  const champGames = conferenceGames.championship || [];

  // Helper to create TeamWithSeed from a team (use seed 0 as placeholder if not in standings)
  const toTeamWithSeed = (team: Team): TeamWithSeed => {
    const standing = fallbackSeeds.find(s => s.team.id === team.id);
    return standing || { team, seed: 0 };
  };

  // Build wild card matchups from actual games or fallback to standings
  let wildCardMatchups: [TeamWithSeed | null, TeamWithSeed | null][] = [];
  let wildCardWinners: (TeamWithSeed | null)[] = [];

  if (wcGames.length > 0) {
    // Use actual playoff games - home team is higher seed
    wildCardMatchups = wcGames.map(game => [
      toTeamWithSeed(game.homeTeam),
      toTeamWithSeed(game.awayTeam),
    ]);
    wildCardWinners = wcGames.map(game => {
      if (game.winnerId) {
        const winner = game.winnerId === game.homeTeam.id ? game.homeTeam : game.awayTeam;
        return toTeamWithSeed(winner);
      }
      // Check picks for user selection
      const pickIndex = wcGames.indexOf(game);
      const pickedId = picks.wildCard[pickIndex];
      if (pickedId) {
        const winner = pickedId === game.homeTeam.id ? game.homeTeam : game.awayTeam;
        return toTeamWithSeed(winner);
      }
      return null;
    });
  } else {
    // Fallback to standings-based matchups (2v7, 3v6, 4v5)
    const getSeed = (num: number) => fallbackSeeds.find(s => s.seed === num) || null;
    wildCardMatchups = [
      [getSeed(2), getSeed(7)],
      [getSeed(3), getSeed(6)],
      [getSeed(4), getSeed(5)],
    ];
    wildCardWinners = picks.wildCard.map((winnerId, i) => {
      if (!winnerId) return null;
      const [high, low] = wildCardMatchups[i];
      if (high?.team.id === winnerId) return high;
      if (low?.team.id === winnerId) return low;
      return null;
    });
  }

  // Build divisional matchups from actual games or derive from wild card results
  let divisionalMatchups: [TeamWithSeed | null, TeamWithSeed | null][] = [];
  let divisionalWinners: (TeamWithSeed | null)[] = [];

  if (divGames.length > 0) {
    // Use actual divisional games
    divisionalMatchups = divGames.map(game => [
      toTeamWithSeed(game.homeTeam),
      toTeamWithSeed(game.awayTeam),
    ]);
    divisionalWinners = divGames.map((game, i) => {
      if (game.winnerId) {
        const winner = game.winnerId === game.homeTeam.id ? game.homeTeam : game.awayTeam;
        return toTeamWithSeed(winner);
      }
      const pickedId = picks.divisional[i];
      if (pickedId) {
        const winner = pickedId === game.homeTeam.id ? game.homeTeam : game.awayTeam;
        return toTeamWithSeed(winner);
      }
      return null;
    });
  } else {
    // Derive from wild card winners + 1 seed
    const seed1 = fallbackSeeds.find(s => s.seed === 1) || null;
    const allWcDecided = wildCardWinners.every(w => w !== null);

    if (allWcDecided && seed1) {
      const divisionalTeams = [seed1, ...wildCardWinners.filter(Boolean) as TeamWithSeed[]]
        .sort((a, b) => a.seed - b.seed);
      divisionalMatchups = [
        [divisionalTeams[0], divisionalTeams[3]], // 1 vs lowest
        [divisionalTeams[1], divisionalTeams[2]], // 2nd vs 3rd
      ];
    } else {
      divisionalMatchups = [
        [seed1, null],
        [null, null],
      ];
    }
    divisionalWinners = picks.divisional.map((winnerId, i) => {
      if (!winnerId) return null;
      const [high, low] = divisionalMatchups[i];
      if (high?.team.id === winnerId) return high;
      if (low?.team.id === winnerId) return low;
      return null;
    });
  }

  // Build championship matchup
  let championshipMatchup: [TeamWithSeed | null, TeamWithSeed | null] = [null, null];
  let champion: TeamWithSeed | null = null;

  if (champGames.length > 0) {
    const game = champGames[0];
    championshipMatchup = [toTeamWithSeed(game.homeTeam), toTeamWithSeed(game.awayTeam)];
    if (game.winnerId) {
      const winner = game.winnerId === game.homeTeam.id ? game.homeTeam : game.awayTeam;
      champion = toTeamWithSeed(winner);
    } else if (picks.championship) {
      const winner = picks.championship === game.homeTeam.id ? game.homeTeam : game.awayTeam;
      champion = toTeamWithSeed(winner);
    }
  } else {
    const allDivDecided = divisionalWinners.every(w => w !== null);
    if (allDivDecided) {
      const champTeams = (divisionalWinners.filter(Boolean) as TeamWithSeed[])
        .sort((a, b) => a.seed - b.seed);
      championshipMatchup = [champTeams[0] || null, champTeams[1] || null];
    }
    if (picks.championship) {
      champion = divisionalWinners.find(w => w?.team.id === picks.championship) || null;
    }
  }

  return {
    seeds: fallbackSeeds,
    wildCardMatchups,
    wildCardWinners,
    divisionalMatchups,
    divisionalWinners,
    championshipMatchup,
    champion,
  };
}

export function PlayoffBracket({
  playoffPicks,
  playoffGames,
  afcStandings,
  nfcStandings,
  onPlayoffWinnerChange,
  onSuperBowlWinnerChange,
}: PlayoffBracketProps) {
  const afcSeeds = useMemo((): TeamWithSeed[] =>
    afcStandings
      .filter(s => s.seed !== null)
      .sort((a, b) => a.seed! - b.seed!)
      .map(s => ({ team: s.team, seed: s.seed! })),
    [afcStandings]
  );

  const nfcSeeds = useMemo((): TeamWithSeed[] =>
    nfcStandings
      .filter(s => s.seed !== null)
      .sort((a, b) => a.seed! - b.seed!)
      .map(s => ({ team: s.team, seed: s.seed! })),
    [nfcStandings]
  );

  // Get playoff games by conference and round
  const playoffGamesByConference = useMemo(() => {
    const results: Record<string, Record<string, PlayoffGame[]>> = {
      afc: { wildCard: [], divisional: [], championship: [] },
      nfc: { wildCard: [], divisional: [], championship: [] },
    };

    for (const game of playoffGames) {
      if (game.conference && game.round !== 'superBowl') {
        results[game.conference][game.round].push(game);
      }
    }

    return results;
  }, [playoffGames]);

  // Build brackets from actual games
  const afcBracket = useMemo(() =>
    buildBracketFromGames(playoffGamesByConference.afc, playoffPicks.afc, afcSeeds),
    [playoffGamesByConference.afc, playoffPicks.afc, afcSeeds]
  );

  const nfcBracket = useMemo(() =>
    buildBracketFromGames(playoffGamesByConference.nfc, playoffPicks.nfc, nfcSeeds),
    [playoffGamesByConference.nfc, playoffPicks.nfc, nfcSeeds]
  );

  // Get Super Bowl game and winner
  const superBowlGame = playoffGames.find(g => g.round === 'superBowl');
  const mergedSuperBowlWinner = superBowlGame?.winnerId || playoffPicks.superBowl;

  // Auto-apply real results to picks
  useEffect(() => {
    // Apply AFC wild card results
    playoffGamesByConference.afc.wildCard.forEach((game, i) => {
      if (game.winnerId && playoffPicks.afc.wildCard[i] !== game.winnerId) {
        onPlayoffWinnerChange('afc', 'wildCard', i, game.winnerId);
      }
    });

    // Apply AFC divisional results
    playoffGamesByConference.afc.divisional.forEach((game, i) => {
      if (game.winnerId && playoffPicks.afc.divisional[i] !== game.winnerId) {
        onPlayoffWinnerChange('afc', 'divisional', i, game.winnerId);
      }
    });

    // Apply AFC championship result
    const afcChamp = playoffGamesByConference.afc.championship[0];
    if (afcChamp?.winnerId && playoffPicks.afc.championship !== afcChamp.winnerId) {
      onPlayoffWinnerChange('afc', 'championship', 0, afcChamp.winnerId);
    }

    // Apply NFC wild card results
    playoffGamesByConference.nfc.wildCard.forEach((game, i) => {
      if (game.winnerId && playoffPicks.nfc.wildCard[i] !== game.winnerId) {
        onPlayoffWinnerChange('nfc', 'wildCard', i, game.winnerId);
      }
    });

    // Apply NFC divisional results
    playoffGamesByConference.nfc.divisional.forEach((game, i) => {
      if (game.winnerId && playoffPicks.nfc.divisional[i] !== game.winnerId) {
        onPlayoffWinnerChange('nfc', 'divisional', i, game.winnerId);
      }
    });

    // Apply NFC championship result
    const nfcChamp = playoffGamesByConference.nfc.championship[0];
    if (nfcChamp?.winnerId && playoffPicks.nfc.championship !== nfcChamp.winnerId) {
      onPlayoffWinnerChange('nfc', 'championship', 0, nfcChamp.winnerId);
    }

    // Apply Super Bowl result
    if (superBowlGame?.winnerId && playoffPicks.superBowl !== superBowlGame.winnerId) {
      onSuperBowlWinnerChange(superBowlGame.winnerId);
    }
  }, [playoffGamesByConference, playoffPicks, onPlayoffWinnerChange, onSuperBowlWinnerChange, superBowlGame]);

  // Check if games are locked (real results exist)
  const getLockedGames = useMemo(() => {
    const locked = {
      afc: { wildCard: [false, false, false], divisional: [false, false], championship: false },
      nfc: { wildCard: [false, false, false], divisional: [false, false], championship: false },
      superBowl: false,
    };

    playoffGamesByConference.afc.wildCard.forEach((game, i) => {
      if (game.status === 'final' && game.winnerId) locked.afc.wildCard[i] = true;
    });
    playoffGamesByConference.afc.divisional.forEach((game, i) => {
      if (game.status === 'final' && game.winnerId) locked.afc.divisional[i] = true;
    });
    if (playoffGamesByConference.afc.championship[0]?.status === 'final') {
      locked.afc.championship = true;
    }

    playoffGamesByConference.nfc.wildCard.forEach((game, i) => {
      if (game.status === 'final' && game.winnerId) locked.nfc.wildCard[i] = true;
    });
    playoffGamesByConference.nfc.divisional.forEach((game, i) => {
      if (game.status === 'final' && game.winnerId) locked.nfc.divisional[i] = true;
    });
    if (playoffGamesByConference.nfc.championship[0]?.status === 'final') {
      locked.nfc.championship = true;
    }

    if (superBowlGame?.status === 'final' && superBowlGame.winnerId) {
      locked.superBowl = true;
    }

    return locked;
  }, [playoffGamesByConference, superBowlGame]);

  const SuperBowlHeader = () => (
    <div className="flex items-center justify-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
      <span>Super</span>
      <img src="https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png" alt="NFL" className="h-4 w-4 object-contain" />
      <span>Bowl</span>
    </div>
  );

  return (
    <div className="p-2 @container">
      {/* Desktop layout - horizontal with Super Bowl in center (only when container is wide enough) */}
      <div className="hidden @[850px]:grid grid-cols-7 gap-3">
        {/* NFC Side (left) - 3 columns */}
        <div className="col-span-3">
          <ConferenceBracket
            bracket={nfcBracket}
            lockedGames={getLockedGames.nfc}
            conference="nfc"
            onWinnerChange={(round, index, winnerId) =>
              onPlayoffWinnerChange('nfc', round, index, winnerId)
            }
          />
        </div>

        {/* Super Bowl - 1 column, aligned with Divisional round */}
        <div className="col-span-1 flex flex-col justify-start mt-[52px]">
          <SuperBowlHeader />
          <SuperBowlMatchup
            afcChamp={afcBracket.champion}
            nfcChamp={nfcBracket.champion}
            winnerId={mergedSuperBowlWinner}
            onWinnerChange={onSuperBowlWinnerChange}
            locked={getLockedGames.superBowl}
          />
        </div>

        {/* AFC Side (right) - 3 columns */}
        <div className="col-span-3">
          <ConferenceBracket
            bracket={afcBracket}
            lockedGames={getLockedGames.afc}
            conference="afc"
            onWinnerChange={(round, index, winnerId) =>
              onPlayoffWinnerChange('afc', round, index, winnerId)
            }
            reverse
          />
        </div>
      </div>

      {/* Stacked layout - for narrower containers (mobile, tablet, narrow panels) */}
      <div className="@[850px]:hidden space-y-4">
        {/* NFC Bracket */}
        <div className="overflow-x-auto">
          <ConferenceBracket
            bracket={nfcBracket}
            lockedGames={getLockedGames.nfc}
            conference="nfc"
            onWinnerChange={(round, index, winnerId) =>
              onPlayoffWinnerChange('nfc', round, index, winnerId)
            }
          />
        </div>

        {/* Super Bowl - 1/3 width, right-aligned */}
        <div className="flex justify-end">
          <div className="w-1/3 flex flex-col">
            <SuperBowlHeader />
            <SuperBowlMatchup
              afcChamp={afcBracket.champion}
              nfcChamp={nfcBracket.champion}
              winnerId={mergedSuperBowlWinner}
              onWinnerChange={onSuperBowlWinnerChange}
              locked={getLockedGames.superBowl}
            />
          </div>
        </div>

        {/* AFC Bracket */}
        <div className="overflow-x-auto">
          <ConferenceBracket
            bracket={afcBracket}
            lockedGames={getLockedGames.afc}
            conference="afc"
            onWinnerChange={(round, index, winnerId) =>
              onPlayoffWinnerChange('afc', round, index, winnerId)
            }
          />
        </div>
      </div>
    </div>
  );
}

interface LockedGames {
  wildCard: boolean[];
  divisional: boolean[];
  championship: boolean;
}

interface ConferenceBracketProps {
  bracket: BracketState;
  lockedGames: LockedGames;
  conference: 'afc' | 'nfc';
  onWinnerChange: (
    round: 'wildCard' | 'divisional' | 'championship',
    matchupIndex: number,
    winnerId: string | null
  ) => void;
  reverse?: boolean;
}

function ConferenceBracket({
  bracket,
  lockedGames,
  conference,
  onWinnerChange,
  reverse,
}: ConferenceBracketProps) {
  const allWildCardDecided = bracket.wildCardWinners.every(w => w !== null);
  const allDivisionalDecided = bracket.divisionalWinners.every(w => w !== null);
  const logoUrl = `https://a.espncdn.com/i/teamlogos/nfl/500/${conference}.png`;

  const RoundHeader = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center justify-center gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">
      <img src={logoUrl} alt={conference.toUpperCase()} className="h-3 w-3 object-contain" />
      <span>{children}</span>
    </div>
  );

  // Get winner IDs for current picks
  const wildCardWinnerIds = bracket.wildCardWinners.map(w => w?.team.id || null);
  const divisionalWinnerIds = bracket.divisionalWinners.map(w => w?.team.id || null);
  const championId = bracket.champion?.team.id || null;

  return (
    <div className={`flex ${reverse ? 'flex-row-reverse' : ''} gap-3 flex-1`}>
      {/* Wild Card Round */}
      <div className="space-y-1.5 flex-1">
        <RoundHeader>Wild Card</RoundHeader>
        {bracket.wildCardMatchups.map((matchup, i) => (
          <Matchup
            key={`wc-${i}`}
            high={matchup[0]}
            low={matchup[1]}
            winnerId={wildCardWinnerIds[i]}
            onWinnerChange={(id) => onWinnerChange('wildCard', i, id)}
            showSeeds
            locked={lockedGames.wildCard[i]}
          />
        ))}
      </div>

      {/* Divisional Round */}
      <div className="flex flex-col justify-center space-y-1.5 flex-1">
        <RoundHeader>Divisional</RoundHeader>
        {bracket.divisionalMatchups.map((matchup, i) => (
          <Matchup
            key={`div-${i}`}
            high={matchup[0]}
            low={matchup[1]}
            winnerId={divisionalWinnerIds[i]}
            onWinnerChange={(id) => onWinnerChange('divisional', i, id)}
            showSeeds
            disabled={!allWildCardDecided && !matchup[0] && !matchup[1]}
            locked={lockedGames.divisional[i]}
          />
        ))}
      </div>

      {/* Conference Championship */}
      <div className="flex flex-col justify-center flex-1">
        <RoundHeader>Championship</RoundHeader>
        <Matchup
          high={bracket.championshipMatchup[0]}
          low={bracket.championshipMatchup[1]}
          winnerId={championId}
          onWinnerChange={(id) => onWinnerChange('championship', 0, id)}
          showSeeds
          disabled={!allDivisionalDecided && !bracket.championshipMatchup[0] && !bracket.championshipMatchup[1]}
          locked={lockedGames.championship}
        />
      </div>
    </div>
  );
}

interface MatchupProps {
  high: TeamWithSeed | null;
  low: TeamWithSeed | null;
  winnerId: string | null;
  onWinnerChange: (winnerId: string | null) => void;
  showSeeds?: boolean;
  disabled?: boolean;
  locked?: boolean;
}

function Matchup({ high, low, winnerId, onWinnerChange, showSeeds, disabled, locked }: MatchupProps) {
  const handleClick = (teamWithSeed: TeamWithSeed | null) => {
    if (!teamWithSeed || disabled || locked) return;
    if (winnerId === teamWithSeed.team.id) {
      onWinnerChange(null);
    } else {
      onWinnerChange(teamWithSeed.team.id);
    }
  };

  return (
    <div className={`bg-gray-100 dark:bg-gray-700 rounded p-1 space-y-0.5 ${disabled ? 'opacity-50' : ''} ${locked ? 'ring-1 ring-green-500' : ''}`}>
      <TeamSlot
        teamWithSeed={high}
        showSeed={showSeeds}
        isWinner={winnerId === high?.team.id}
        isLoser={winnerId !== null && winnerId !== high?.team.id}
        onClick={() => handleClick(high)}
        disabled={disabled}
        locked={locked}
      />
      <TeamSlot
        teamWithSeed={low}
        showSeed={showSeeds}
        isWinner={winnerId === low?.team.id}
        isLoser={winnerId !== null && winnerId !== low?.team.id}
        onClick={() => handleClick(low)}
        disabled={disabled}
        locked={locked}
      />
    </div>
  );
}

interface TeamSlotProps {
  teamWithSeed: TeamWithSeed | null;
  showSeed?: boolean;
  isWinner?: boolean;
  isLoser?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  locked?: boolean;
}

function TeamSlot({ teamWithSeed, showSeed, isWinner, isLoser, onClick, disabled, locked }: TeamSlotProps) {
  if (!teamWithSeed) {
    return (
      <div className="flex items-center gap-1.5 p-1.5 bg-gray-200 dark:bg-gray-600 rounded opacity-50 h-[32px]">
        {showSeed && <span className="text-[10px] font-bold text-gray-400 w-3 shrink-0">-</span>}
        <div className="w-5 h-5 bg-gray-300 dark:bg-gray-500 rounded shrink-0" />
        <span className="text-[10px] text-gray-400">TBD</span>
      </div>
    );
  }

  const { team, seed } = teamWithSeed;

  const isInteractive = !disabled && !locked;

  return (
    <motion.button
      whileHover={isInteractive ? { scale: 1.02 } : undefined}
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      onClick={onClick}
      disabled={disabled || locked}
      className={`w-full flex items-center gap-1.5 p-1.5 rounded h-[32px] transition-all ${
        isWinner
          ? 'bg-green-100 dark:bg-green-900/50 ring-2 ring-green-500'
          : isLoser
          ? 'opacity-40 bg-white dark:bg-gray-600'
          : 'bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500'
      } ${!isInteractive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {showSeed && (
        <span className="text-[10px] font-bold text-gray-400 w-3 shrink-0">{seed > 0 ? seed : '-'}</span>
      )}
      <img src={team.logo} alt={team.name} className="w-5 h-5 object-contain shrink-0" />
      <span className="text-xs font-medium text-gray-900 dark:text-white flex-1 truncate">
        {team.abbreviation}
      </span>
      {isWinner && (
        <svg className="w-3 h-3 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </motion.button>
  );
}

interface SuperBowlMatchupProps {
  afcChamp: TeamWithSeed | null;
  nfcChamp: TeamWithSeed | null;
  winnerId: string | null;
  onWinnerChange: (winnerId: string | null) => void;
  locked?: boolean;
}

function SuperBowlMatchup({ afcChamp, nfcChamp, winnerId, onWinnerChange, locked }: SuperBowlMatchupProps) {
  const handleClick = (teamWithSeed: TeamWithSeed | null) => {
    if (!teamWithSeed || locked) return;
    if (winnerId === teamWithSeed.team.id) {
      onWinnerChange(null);
    } else {
      onWinnerChange(teamWithSeed.team.id);
    }
  };

  const disabled = !afcChamp || !nfcChamp;

  return (
    <div className={`w-full bg-yellow-50 dark:bg-yellow-900/20 rounded p-1 space-y-0.5 ${disabled ? 'opacity-50' : ''} ${locked ? 'ring-1 ring-green-500' : ''}`}>
      <TeamSlot
        teamWithSeed={nfcChamp}
        showSeed
        isWinner={winnerId === nfcChamp?.team.id}
        isLoser={winnerId !== null && winnerId !== nfcChamp?.team.id}
        onClick={() => handleClick(nfcChamp)}
        disabled={disabled}
        locked={locked}
      />
      <TeamSlot
        teamWithSeed={afcChamp}
        showSeed
        isWinner={winnerId === afcChamp?.team.id}
        isLoser={winnerId !== null && winnerId !== afcChamp?.team.id}
        onClick={() => handleClick(afcChamp)}
        disabled={disabled}
        locked={locked}
      />
    </div>
  );
}
