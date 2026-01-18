import type { Team } from '@/types';
import type { PlayoffGame } from '@/hooks/useEspnApi';

export interface TeamWithSeed {
  team: Team;
  seed: number;
}

export interface PlayoffPicks {
  wildCard: (string | null)[];
  divisional: (string | null)[];
  championship: string | null;
}

export interface BracketState {
  seeds: TeamWithSeed[];
  wildCardMatchups: [TeamWithSeed | null, TeamWithSeed | null][];
  wildCardWinners: (TeamWithSeed | null)[];
  divisionalMatchups: [TeamWithSeed | null, TeamWithSeed | null][];
  divisionalWinners: (TeamWithSeed | null)[];
  championshipMatchup: [TeamWithSeed | null, TeamWithSeed | null];
  champion: TeamWithSeed | null;
}

/**
 * Build bracket from actual playoff games
 *
 * This function constructs a bracket state from ESPN playoff game data,
 * user picks, and fallback seeds from standings.
 *
 * Key behavior: Each round's matchups are always derived from the previous
 * round's winners when available, ensuring teams advance correctly even if
 * ESPN hasn't updated the game teams yet:
 * - Divisional matchups derived from wild card winners + #1 seed
 * - Championship matchup derived from divisional winners
 *
 * ESPN's game teams are only used as fallback when the previous round
 * isn't decided yet.
 */
export function buildBracketFromGames(
  conferenceGames: Record<string, PlayoffGame[]>,
  picks: PlayoffPicks,
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

  // Build divisional matchups from wild card winners + 1 seed when available
  // This ensures teams advance correctly even if ESPN hasn't updated divisional game teams
  let divisionalMatchups: [TeamWithSeed | null, TeamWithSeed | null][] = [];
  let divisionalWinners: (TeamWithSeed | null)[] = [];

  const seed1 = fallbackSeeds.find(s => s.seed === 1) || null;
  const allWcDecided = wildCardWinners.every(w => w !== null);

  // Always derive divisional matchups from wild card winners when available
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

  if (divGames.length > 0) {
    // Only use ESPN's divisional game teams if wild card isn't decided yet
    if (!allWcDecided) {
      divisionalMatchups = divGames.map(game => [
        toTeamWithSeed(game.homeTeam),
        toTeamWithSeed(game.awayTeam),
      ]);
    }

    // Initialize divisional winners
    divisionalWinners = [null, null];

    // Apply winners from ESPN games by matching winnerId against computed matchups
    // This handles both team mismatch (ESPN has wrong teams) and index mismatch (ESPN orders games differently)
    for (const game of divGames) {
      if (game.winnerId) {
        // Find which computed matchup contains a team with this winnerId
        const matchupIndex = divisionalMatchups.findIndex(matchup =>
          matchup.some(team => team?.team.id === game.winnerId)
        );
        if (matchupIndex !== -1) {
          const winner = divisionalMatchups[matchupIndex].find(t => t?.team.id === game.winnerId);
          if (winner) {
            divisionalWinners[matchupIndex] = winner;
          }
        }
      }
    }

    // Apply picks for matchups without winners (by computed matchup index)
    divisionalMatchups.forEach((matchup, i) => {
      if (divisionalWinners[i] === null && picks.divisional[i]) {
        const pickedId = picks.divisional[i];
        const winner = matchup.find(t => t?.team.id === pickedId);
        if (winner) {
          divisionalWinners[i] = winner;
        }
      }
    });
  } else {
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

  // Always derive championship matchup from divisional winners when available
  // This ensures teams advance correctly even if ESPN hasn't updated championship game teams
  const allDivDecided = divisionalWinners.every(w => w !== null);
  if (allDivDecided) {
    const champTeams = (divisionalWinners.filter(Boolean) as TeamWithSeed[])
      .sort((a, b) => a.seed - b.seed);
    championshipMatchup = [champTeams[0] || null, champTeams[1] || null];
  }

  if (champGames.length > 0) {
    const game = champGames[0];
    // Only use ESPN's championship game teams if divisional isn't decided yet
    if (!allDivDecided) {
      championshipMatchup = [toTeamWithSeed(game.homeTeam), toTeamWithSeed(game.awayTeam)];
    }
    if (game.winnerId) {
      // Match winnerId against computed championship matchup teams (not ESPN's game teams)
      // This handles the case where ESPN's game has stale/wrong teams
      const matchedWinner = championshipMatchup.find(t => t?.team.id === game.winnerId);
      if (matchedWinner) {
        champion = matchedWinner;
      } else {
        // Fallback to ESPN's game teams if winner not in computed matchup
        const winner = game.winnerId === game.homeTeam.id ? game.homeTeam : game.awayTeam;
        champion = toTeamWithSeed(winner);
      }
    } else if (picks.championship) {
      // Match pick against the championship matchup teams (which could be from divisional winners)
      const matchedTeam = championshipMatchup.find(t => t?.team.id === picks.championship);
      if (matchedTeam) {
        champion = matchedTeam;
      }
    }
  } else {
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
