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

// Helper to find which matchup index a playoff game corresponds to
function findMatchupIndex(game: PlayoffGame, seeds: TeamWithSeed[], round: string): number {
  if (round !== 'wildCard') return -1;

  // Wild Card matchups: 2v7=0, 3v6=1, 4v5=2
  const matchups = [
    [2, 7],
    [3, 6],
    [4, 5],
  ];

  const homeTeamSeed = seeds.find(s => s.team.id === game.homeTeam.id)?.seed;
  const awayTeamSeed = seeds.find(s => s.team.id === game.awayTeam.id)?.seed;

  if (!homeTeamSeed || !awayTeamSeed) return -1;

  for (let i = 0; i < matchups.length; i++) {
    const [high, low] = matchups[i];
    if ((homeTeamSeed === high && awayTeamSeed === low) ||
        (homeTeamSeed === low && awayTeamSeed === high)) {
      return i;
    }
  }

  return -1;
}

interface BracketState {
  seeds: TeamWithSeed[];
  // Wild Card: 2v7, 3v6, 4v5
  wildCardMatchups: [TeamWithSeed | null, TeamWithSeed | null][];
  wildCardWinners: (TeamWithSeed | null)[];
  // Divisional after reseeding
  divisionalMatchups: [TeamWithSeed | null, TeamWithSeed | null][];
  divisionalWinners: (TeamWithSeed | null)[];
  // Championship
  championshipMatchup: [TeamWithSeed | null, TeamWithSeed | null];
  champion: TeamWithSeed | null;
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

  // Get real playoff results by conference and round
  const getPlayoffResults = useMemo(() => {
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

  // Merge real results with user picks
  const mergedAfcPicks = useMemo(() => {
    const merged = { ...playoffPicks.afc };
    const afcResults = getPlayoffResults.afc;

    // Wild Card - match by teams involved
    afcResults.wildCard.forEach(game => {
      if (game.winnerId) {
        // Find which matchup index this corresponds to (2v7=0, 3v6=1, 4v5=2)
        const matchupIdx = findMatchupIndex(game, afcSeeds, 'wildCard');
        if (matchupIdx !== -1) {
          merged.wildCard[matchupIdx] = game.winnerId;
        }
      }
    });

    // Divisional
    afcResults.divisional.forEach((game, i) => {
      if (game.winnerId && i < 2) {
        merged.divisional[i] = game.winnerId;
      }
    });

    // Championship
    if (afcResults.championship[0]?.winnerId) {
      merged.championship = afcResults.championship[0].winnerId;
    }

    return merged;
  }, [playoffPicks.afc, getPlayoffResults.afc, afcSeeds]);

  const mergedNfcPicks = useMemo(() => {
    const merged = { ...playoffPicks.nfc };
    const nfcResults = getPlayoffResults.nfc;

    nfcResults.wildCard.forEach(game => {
      if (game.winnerId) {
        const matchupIdx = findMatchupIndex(game, nfcSeeds, 'wildCard');
        if (matchupIdx !== -1) {
          merged.wildCard[matchupIdx] = game.winnerId;
        }
      }
    });

    nfcResults.divisional.forEach((game, i) => {
      if (game.winnerId && i < 2) {
        merged.divisional[i] = game.winnerId;
      }
    });

    if (nfcResults.championship[0]?.winnerId) {
      merged.championship = nfcResults.championship[0].winnerId;
    }

    return merged;
  }, [playoffPicks.nfc, getPlayoffResults.nfc, nfcSeeds]);

  // Get Super Bowl result
  const superBowlGame = playoffGames.find(g => g.round === 'superBowl');
  const mergedSuperBowlWinner = superBowlGame?.winnerId || playoffPicks.superBowl;

  // Auto-apply real results to picks
  useEffect(() => {
    const afcResults = getPlayoffResults.afc;
    const nfcResults = getPlayoffResults.nfc;

    // Apply AFC results
    afcResults.wildCard.forEach(game => {
      if (game.winnerId) {
        const matchupIdx = findMatchupIndex(game, afcSeeds, 'wildCard');
        if (matchupIdx !== -1 && playoffPicks.afc.wildCard[matchupIdx] !== game.winnerId) {
          onPlayoffWinnerChange('afc', 'wildCard', matchupIdx, game.winnerId);
        }
      }
    });

    afcResults.divisional.forEach((game, i) => {
      if (game.winnerId && i < 2 && playoffPicks.afc.divisional[i] !== game.winnerId) {
        onPlayoffWinnerChange('afc', 'divisional', i, game.winnerId);
      }
    });

    if (afcResults.championship[0]?.winnerId && playoffPicks.afc.championship !== afcResults.championship[0].winnerId) {
      onPlayoffWinnerChange('afc', 'championship', 0, afcResults.championship[0].winnerId);
    }

    // Apply NFC results
    nfcResults.wildCard.forEach(game => {
      if (game.winnerId) {
        const matchupIdx = findMatchupIndex(game, nfcSeeds, 'wildCard');
        if (matchupIdx !== -1 && playoffPicks.nfc.wildCard[matchupIdx] !== game.winnerId) {
          onPlayoffWinnerChange('nfc', 'wildCard', matchupIdx, game.winnerId);
        }
      }
    });

    nfcResults.divisional.forEach((game, i) => {
      if (game.winnerId && i < 2 && playoffPicks.nfc.divisional[i] !== game.winnerId) {
        onPlayoffWinnerChange('nfc', 'divisional', i, game.winnerId);
      }
    });

    if (nfcResults.championship[0]?.winnerId && playoffPicks.nfc.championship !== nfcResults.championship[0].winnerId) {
      onPlayoffWinnerChange('nfc', 'championship', 0, nfcResults.championship[0].winnerId);
    }

    // Apply Super Bowl result
    if (superBowlGame?.winnerId && playoffPicks.superBowl !== superBowlGame.winnerId) {
      onSuperBowlWinnerChange(superBowlGame.winnerId);
    }
  }, [getPlayoffResults, afcSeeds, nfcSeeds, playoffPicks, onPlayoffWinnerChange, onSuperBowlWinnerChange, superBowlGame]);

  const afcBracket = useMemo(() => calculateBracket(afcSeeds, mergedAfcPicks), [afcSeeds, mergedAfcPicks]);
  const nfcBracket = useMemo(() => calculateBracket(nfcSeeds, mergedNfcPicks), [nfcSeeds, mergedNfcPicks]);

  // Check if games are locked (real results exist)
  const getLockedGames = useMemo(() => {
    const locked = {
      afc: { wildCard: [false, false, false], divisional: [false, false], championship: false },
      nfc: { wildCard: [false, false, false], divisional: [false, false], championship: false },
      superBowl: false,
    };

    for (const game of playoffGames) {
      if (game.status === 'final' && game.winnerId) {
        if (game.round === 'superBowl') {
          locked.superBowl = true;
        } else if (game.conference) {
          if (game.round === 'wildCard') {
            const seeds = game.conference === 'afc' ? afcSeeds : nfcSeeds;
            const idx = findMatchupIndex(game, seeds, 'wildCard');
            if (idx !== -1) locked[game.conference].wildCard[idx] = true;
          } else if (game.round === 'divisional') {
            const results = getPlayoffResults[game.conference].divisional;
            const idx = results.indexOf(game);
            if (idx !== -1 && idx < 2) locked[game.conference].divisional[idx] = true;
          } else if (game.round === 'championship') {
            locked[game.conference].championship = true;
          }
        }
      }
    }

    return locked;
  }, [playoffGames, afcSeeds, nfcSeeds, getPlayoffResults]);

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
      {/* 7 columns total: 3 NFC rounds + 1 Super Bowl + 3 AFC rounds */}
      <div className="hidden @[850px]:grid grid-cols-7 gap-3">
        {/* NFC Side (left) - 3 columns */}
        <div className="col-span-3">
          <ConferenceBracket
            bracket={nfcBracket}
            picks={mergedNfcPicks}
            lockedGames={getLockedGames.nfc}
            conference="nfc"
            onWinnerChange={(round, index, winnerId) =>
              onPlayoffWinnerChange('nfc', round, index, winnerId)
            }
          />
        </div>

        {/* Super Bowl - 1 column */}
        <div className="col-span-1 flex flex-col justify-start pt-0">
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
            picks={mergedAfcPicks}
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
            picks={mergedNfcPicks}
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
            picks={mergedAfcPicks}
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

function calculateBracket(
  seeds: TeamWithSeed[],
  picks: PlayoffPicks['afc']
): BracketState {
  const getSeed = (seedNum: number): TeamWithSeed | null => seeds[seedNum - 1] || null;
  const seed1 = getSeed(1);

  // Wild Card matchups: 2v7, 3v6, 4v5
  const wildCardMatchups: [TeamWithSeed | null, TeamWithSeed | null][] = [
    [getSeed(2), getSeed(7)],
    [getSeed(3), getSeed(6)],
    [getSeed(4), getSeed(5)],
  ];

  // Get wild card winners (null if not yet picked)
  const wildCardWinners: (TeamWithSeed | null)[] = picks.wildCard.map((winnerId, i) => {
    if (!winnerId) return null;
    const [high, low] = wildCardMatchups[i];
    if (high?.team.id === winnerId) return high;
    if (low?.team.id === winnerId) return low;
    return null;
  });

  // Check if all wild card games are decided
  const allWildCardDecided = wildCardWinners.every(w => w !== null);

  // Divisional matchups - show partial reseeding as wild card winners are determined
  // Matchup 0: 1 seed vs lowest remaining seed
  // Matchup 1: 2nd highest vs 3rd highest (the middle two)
  let divisionalMatchups: [TeamWithSeed | null, TeamWithSeed | null][] = [
    [seed1, null],  // 1 seed always in matchup 0
    [null, null],
  ];

  if (allWildCardDecided && seed1) {
    // All wild card games decided - full reseeding
    const divisionalTeams = [seed1, ...wildCardWinners.filter(Boolean) as TeamWithSeed[]]
      .sort((a, b) => a.seed - b.seed);

    divisionalMatchups = [
      [divisionalTeams[0], divisionalTeams[3]], // 1 vs lowest
      [divisionalTeams[1], divisionalTeams[2]], // 2nd vs 3rd
    ];
  } else if (seed1) {
    // For each decided winner, determine their guaranteed position among WC winners:
    // - 1st (highest): matchup 1 slot 0 (home/top)
    // - 2nd (middle): matchup 1 slot 1 (away/bottom)
    // - 3rd (lowest): matchup 0 slot 1 (vs 1 seed, away/bottom)
    //
    // A winner is guaranteed a position if their seed is higher/lower than
    // all other possible outcomes (both undecided games AND other decided winners)

    const decidedWinners = wildCardWinners.filter(Boolean) as TeamWithSeed[];

    // Get all possible seeds from undecided games
    const undecidedRanges: { min: number; max: number }[] = [];
    if (!wildCardWinners[0]) undecidedRanges.push({ min: 2, max: 7 }); // 2v7 undecided
    if (!wildCardWinners[1]) undecidedRanges.push({ min: 3, max: 6 }); // 3v6 undecided
    if (!wildCardWinners[2]) undecidedRanges.push({ min: 4, max: 5 }); // 4v5 undecided

    // For each decided winner, count how many "slots" are guaranteed above/below them
    // A slot is above if its MAX possible seed < winner's seed (definitely higher ranked)
    // A slot is below if its MIN possible seed > winner's seed (definitely lower ranked)

    const getGuaranteedPosition = (winner: TeamWithSeed): 1 | 2 | 3 | null => {
      let definitelyAbove = 0; // slots guaranteed to have higher rank (lower seed number)
      let definitelyBelow = 0; // slots guaranteed to have lower rank (higher seed number)

      // Check against undecided games
      for (const range of undecidedRanges) {
        if (range.max < winner.seed) {
          // This undecided game will definitely produce someone higher ranked
          definitelyAbove++;
        } else if (range.min > winner.seed) {
          // This undecided game will definitely produce someone lower ranked
          definitelyBelow++;
        }
      }

      // Check against other decided winners
      for (const other of decidedWinners) {
        if (other === winner) continue;
        if (other.seed < winner.seed) {
          definitelyAbove++;
        } else if (other.seed > winner.seed) {
          definitelyBelow++;
        }
      }

      // Determine position based on guaranteed counts
      // Position 1 (highest): no one definitely above
      // Position 3 (lowest): no one definitely below
      // Position 2 (middle): exactly 1 above and 1 below
      const totalSlots = undecidedRanges.length + decidedWinners.length - 1; // -1 for self

      if (definitelyAbove === 0) return 1; // Guaranteed highest
      if (definitelyBelow === 0) return 3; // Guaranteed lowest
      if (definitelyAbove >= 1 && definitelyBelow >= 1) return 2; // Guaranteed middle

      return null; // Position depends on undecided outcomes
    };

    // Place each decided winner in their guaranteed position
    for (const winner of decidedWinners) {
      const position = getGuaranteedPosition(winner);
      if (position === 1) {
        divisionalMatchups[1][0] = winner; // Highest WC → matchup 1 slot 0 (home)
      } else if (position === 2) {
        divisionalMatchups[1][1] = winner; // Middle → matchup 1 slot 1 (away)
      } else if (position === 3) {
        divisionalMatchups[0][1] = winner; // Lowest → matchup 0 slot 1 (vs 1 seed)
      }
    }
  }

  // Get divisional winners
  const divisionalWinners: (TeamWithSeed | null)[] = picks.divisional.map((winnerId, i) => {
    if (!winnerId) return null;
    const [high, low] = divisionalMatchups[i];
    if (high?.team.id === winnerId) return high;
    if (low?.team.id === winnerId) return low;
    return null;
  });

  // Championship matchup - show divisional winners as they're decided
  // Higher seed = home (slot 0/top), Lower seed = away (slot 1/bottom)
  const allDivisionalDecided = divisionalWinners.every(w => w !== null);
  let championshipMatchup: [TeamWithSeed | null, TeamWithSeed | null] = [null, null];

  if (allDivisionalDecided) {
    // Both divisional games decided - reseed: higher seed (top) vs lower seed (bottom)
    const champTeams = (divisionalWinners.filter(Boolean) as TeamWithSeed[])
      .sort((a, b) => a.seed - b.seed);
    championshipMatchup = [champTeams[0] || null, champTeams[1] || null];
  } else {
    // Apply same logic: if a winner is guaranteed highest or lowest, place them
    const decidedDivWinners = divisionalWinners.filter(Boolean) as TeamWithSeed[];

    // Get possible seeds from undecided divisional matchups
    const undecidedDivSeeds: number[] = [];
    if (!divisionalWinners[0]) {
      // Matchup 0 undecided - possible winners are whoever is in that matchup
      if (divisionalMatchups[0][0]) undecidedDivSeeds.push(divisionalMatchups[0][0].seed);
      if (divisionalMatchups[0][1]) undecidedDivSeeds.push(divisionalMatchups[0][1].seed);
    }
    if (!divisionalWinners[1]) {
      if (divisionalMatchups[1][0]) undecidedDivSeeds.push(divisionalMatchups[1][0].seed);
      if (divisionalMatchups[1][1]) undecidedDivSeeds.push(divisionalMatchups[1][1].seed);
    }

    const minUndecidedDiv = undecidedDivSeeds.length > 0 ? Math.min(...undecidedDivSeeds) : Infinity;
    const maxUndecidedDiv = undecidedDivSeeds.length > 0 ? Math.max(...undecidedDivSeeds) : -Infinity;

    for (const winner of decidedDivWinners) {
      if (winner.seed < minUndecidedDiv) {
        // Guaranteed highest seed - goes to slot 0 (home/top)
        championshipMatchup[0] = winner;
      } else if (winner.seed > maxUndecidedDiv) {
        // Guaranteed lowest seed - goes to slot 1 (away/bottom)
        championshipMatchup[1] = winner;
      }
      // If in between, position depends on other matchup result
    }
  }

  // Champion
  let champion: TeamWithSeed | null = null;
  if (picks.championship) {
    const winner = divisionalWinners.find(w => w?.team.id === picks.championship);
    if (winner) champion = winner;
  }

  return {
    seeds,
    wildCardMatchups,
    wildCardWinners,
    divisionalMatchups,
    divisionalWinners,
    championshipMatchup,
    champion,
  };
}

interface LockedGames {
  wildCard: boolean[];
  divisional: boolean[];
  championship: boolean;
}

interface ConferenceBracketProps {
  bracket: BracketState;
  picks: PlayoffPicks['afc'];
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
  picks,
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
            winnerId={picks.wildCard[i]}
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
            winnerId={picks.divisional[i]}
            onWinnerChange={(id) => onWinnerChange('divisional', i, id)}
            showSeeds
            disabled={!allWildCardDecided}
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
          winnerId={picks.championship}
          onWinnerChange={(id) => onWinnerChange('championship', 0, id)}
          showSeeds
          disabled={!allDivisionalDecided}
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
        <span className="text-[10px] font-bold text-gray-400 w-3 shrink-0">{seed}</span>
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
    <div className={`w-full bg-gray-100 dark:bg-gray-700 rounded p-1 space-y-0.5 ${disabled ? 'opacity-50' : ''} ${locked ? 'ring-1 ring-green-500' : ''}`}>
      <TeamSlot
        teamWithSeed={nfcChamp}
        isWinner={winnerId === nfcChamp?.team.id}
        isLoser={winnerId !== null && winnerId !== nfcChamp?.team.id}
        onClick={() => handleClick(nfcChamp)}
        disabled={disabled}
        locked={locked}
      />
      <TeamSlot
        teamWithSeed={afcChamp}
        isWinner={winnerId === afcChamp?.team.id}
        isLoser={winnerId !== null && winnerId !== afcChamp?.team.id}
        onClick={() => handleClick(afcChamp)}
        disabled={disabled}
        locked={locked}
      />
    </div>
  );
}
