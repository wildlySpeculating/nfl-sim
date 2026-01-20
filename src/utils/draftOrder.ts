import type { TeamStanding, PlayoffPicks, Team, Game } from '@/types';
import type { PlayoffGame } from '@/hooks/useEspnApi';

export interface DraftPick {
  pick: number;
  pickMax?: number; // If set, pick is uncertain and could be anywhere from pick to pickMax
  team: Team;
  record: string;
  reason: string;
}

// Calculate win percentage for sorting
function winPct(wins: number, losses: number, ties: number): number {
  const total = wins + losses + ties;
  if (total === 0) return 0;
  return (wins + ties * 0.5) / total;
}

// Format record string
function formatRecord(standing: TeamStanding): string {
  if (standing.ties > 0) {
    return `${standing.wins}-${standing.losses}-${standing.ties}`;
  }
  return `${standing.wins}-${standing.losses}`;
}

// Calculate Strength of Schedule (SOS) for all teams
// SOS = average win percentage of all opponents
function calculateSOS(
  standings: TeamStanding[],
  games: Game[]
): Map<string, number> {
  const sosMap = new Map<string, number>();

  // First, create a map of team records
  const teamRecords = new Map<string, { wins: number; losses: number; ties: number }>();
  for (const standing of standings) {
    teamRecords.set(standing.team.id, {
      wins: standing.wins,
      losses: standing.losses,
      ties: standing.ties,
    });
  }

  // For each team, calculate SOS
  for (const standing of standings) {
    const teamId = standing.team.id;
    const opponentIds = new Set<string>();

    // Find all opponents from completed games
    for (const game of games) {
      if (game.status !== 'final') continue;

      if (game.homeTeam.id === teamId) {
        opponentIds.add(game.awayTeam.id);
      } else if (game.awayTeam.id === teamId) {
        opponentIds.add(game.homeTeam.id);
      }
    }

    // Calculate average opponent win percentage
    let totalOpponentWinPct = 0;
    let opponentCount = 0;

    for (const oppId of opponentIds) {
      const oppRecord = teamRecords.get(oppId);
      if (oppRecord) {
        totalOpponentWinPct += winPct(oppRecord.wins, oppRecord.losses, oppRecord.ties);
        opponentCount++;
      }
    }

    // Lower SOS = weaker opponents = picks earlier
    const sos = opponentCount > 0 ? totalOpponentWinPct / opponentCount : 0.5;
    sosMap.set(teamId, sos);
  }

  return sosMap;
}

// Sort teams by record (worst first for draft order)
function sortByRecordWorstFirst(
  standings: TeamStanding[],
  sosMap: Map<string, number>
): TeamStanding[] {
  return [...standings].sort((a, b) => {
    // First by win percentage (ascending - worst first)
    const aWinPct = winPct(a.wins, a.losses, a.ties);
    const bWinPct = winPct(b.wins, b.losses, b.ties);
    if (Math.abs(aWinPct - bWinPct) > 0.0001) {
      return aWinPct - bWinPct;
    }
    // Then by strength of schedule (lower SOS = weaker opponents = picks earlier)
    const aSos = sosMap.get(a.team.id) ?? 0.5;
    const bSos = sosMap.get(b.team.id) ?? 0.5;
    return aSos - bSos;
  });
}

// Compare two teams for draft order (returns negative if a picks before b)
function compareForDraftOrder(
  a: TeamStanding,
  b: TeamStanding,
  sosMap: Map<string, number>
): number {
  const aWinPct = winPct(a.wins, a.losses, a.ties);
  const bWinPct = winPct(b.wins, b.losses, b.ties);
  if (Math.abs(aWinPct - bWinPct) > 0.0001) {
    return aWinPct - bWinPct;
  }
  const aSos = sosMap.get(a.team.id) ?? 0.5;
  const bSos = sosMap.get(b.team.id) ?? 0.5;
  return aSos - bSos;
}

// Get all teams participating in a round's games (potential losers)
function getAllParticipants(
  games: PlayoffGame[],
  allStandings: TeamStanding[]
): TeamStanding[] {
  const participants: TeamStanding[] = [];
  const seenIds = new Set<string>();

  for (const game of games) {
    if (!seenIds.has(game.homeTeam.id)) {
      const standing = allStandings.find(s => s.team.id === game.homeTeam.id);
      if (standing) {
        participants.push(standing);
        seenIds.add(game.homeTeam.id);
      }
    }
    if (!seenIds.has(game.awayTeam.id)) {
      const standing = allStandings.find(s => s.team.id === game.awayTeam.id);
      if (standing) {
        participants.push(standing);
        seenIds.add(game.awayTeam.id);
      }
    }
  }

  return participants;
}

// Calculate pick range for a known loser considering all potential losers
// Returns [minPick, maxPick] relative to the round (0-indexed)
function calculatePickRange(
  loser: TeamStanding,
  knownLosers: TeamStanding[],
  allPotentialLosers: TeamStanding[],
  totalLosersInRound: number,
  sosMap: Map<string, number>
): { min: number; max: number } {
  // How many known losers have worse records than this loser?
  const knownWorse = knownLosers.filter(
    l => l.team.id !== loser.team.id && compareForDraftOrder(l, loser, sosMap) < 0
  ).length;

  // How many known losers have better records?
  const knownBetter = knownLosers.filter(
    l => l.team.id !== loser.team.id && compareForDraftOrder(l, loser, sosMap) > 0
  ).length;

  // How many potential losers (not yet known) have worse records?
  const unknownPotential = allPotentialLosers.filter(
    p => !knownLosers.some(k => k.team.id === p.team.id)
  );
  const unknownWorse = unknownPotential.filter(
    p => compareForDraftOrder(p, loser, sosMap) < 0
  ).length;
  const unknownBetter = unknownPotential.filter(
    p => compareForDraftOrder(p, loser, sosMap) > 0
  ).length;

  // Best case: all unknowns with worse records lose, pushing this loser back
  // Worst case: all unknowns with better records lose, this loser picks earlier

  // Min pick position = knownWorse (locked in) + 0 (no additional worse teams lose)
  // But capped by the number of slots available
  const minPosition = knownWorse;

  // Max pick position = could be pushed back by unknowns with worse records
  // But capped at totalLosersInRound - 1 - knownBetter
  const slotsRemaining = totalLosersInRound - knownLosers.length;
  const maxFromUnknown = Math.min(unknownWorse, slotsRemaining);
  const maxPosition = Math.min(
    knownWorse + maxFromUnknown,
    totalLosersInRound - 1 - knownBetter
  );

  return { min: minPosition, max: maxPosition };
}

// Get losers from actual playoff games
function getLosersFromGames(
  games: PlayoffGame[],
  allStandings: TeamStanding[]
): TeamStanding[] {
  const losers: TeamStanding[] = [];

  for (const game of games) {
    if (game.status === 'final' && game.winnerId) {
      // Find the loser
      const loserId = game.winnerId === game.homeTeam.id ? game.awayTeam.id : game.homeTeam.id;
      const loserStanding = allStandings.find(s => s.team.id === loserId);
      if (loserStanding) {
        losers.push(loserStanding);
      }
    }
  }

  return losers;
}

// Get losers from user picks (for games not yet played)
function getLosersFromPicks(
  conference: 'afc' | 'nfc',
  round: 'wildCard' | 'divisional' | 'championship',
  playoffPicks: PlayoffPicks,
  playoffGames: PlayoffGame[],
  allStandings: TeamStanding[]
): TeamStanding[] {
  const losers: TeamStanding[] = [];

  // Get games for this round and conference
  const roundGames = playoffGames.filter(
    g => g.round === round && g.conference === conference
  );

  if (round === 'wildCard') {
    // Get conference standings for fallback matchup determination
    const confStandings = conference === 'afc'
      ? allStandings.filter(s => s.team.conference === 'AFC')
      : allStandings.filter(s => s.team.conference === 'NFC');

    // Standard wild card matchups based on seeding: 2v7, 3v6, 4v5
    const wcMatchups = [
      { high: 2, low: 7 },
      { high: 3, low: 6 },
      { high: 4, low: 5 },
    ];

    for (let i = 0; i < (playoffPicks[conference].wildCard.length); i++) {
      const winnerId = playoffPicks[conference].wildCard[i];
      if (!winnerId) continue;

      // Check if this game already has a real result
      const game = roundGames[i];
      if (game && game.status === 'final' && game.winnerId) {
        continue; // Already counted in real results
      }

      // Use the pick - find the matchup teams
      if (game) {
        const loserId = winnerId === game.homeTeam.id ? game.awayTeam.id : game.homeTeam.id;
        const loserStanding = allStandings.find(s => s.team.id === loserId);
        if (loserStanding && !losers.some(l => l.team.id === loserStanding.team.id)) {
          losers.push(loserStanding);
        }
      } else {
        // No game defined - determine loser from seeding
        // Wild card matchups are 2v7, 3v6, 4v5
        const matchup = wcMatchups[i];
        if (matchup) {
          const highSeed = confStandings.find(s => s.seed === matchup.high);
          const lowSeed = confStandings.find(s => s.seed === matchup.low);

          let loserId: string | null = null;
          if (highSeed && highSeed.team.id === winnerId && lowSeed) {
            loserId = lowSeed.team.id;
          } else if (lowSeed && lowSeed.team.id === winnerId && highSeed) {
            loserId = highSeed.team.id;
          }

          if (loserId) {
            const loserStanding = allStandings.find(s => s.team.id === loserId);
            if (loserStanding && !losers.some(l => l.team.id === loserStanding.team.id)) {
              losers.push(loserStanding);
            }
          }
        }
      }
    }
  } else if (round === 'divisional') {
    // Get divisional winners from picks
    const divisionalWinners = playoffPicks[conference].divisional.filter(id => id !== null);

    for (let i = 0; i < (playoffPicks[conference].divisional.length); i++) {
      const winnerId = playoffPicks[conference].divisional[i];
      if (!winnerId) continue;

      const game = roundGames[i];
      if (game && game.status === 'final' && game.winnerId) {
        continue;
      }

      if (game) {
        const loserId = winnerId === game.homeTeam.id ? game.awayTeam.id : game.homeTeam.id;
        const loserStanding = allStandings.find(s => s.team.id === loserId);
        if (loserStanding && !losers.some(l => l.team.id === loserStanding.team.id)) {
          losers.push(loserStanding);
        }
      }
    }

    // If no games defined but we have picks, determine losers from participants
    // Divisional participants are: #1 seed + 3 wild card winners
    if (roundGames.length === 0 && divisionalWinners.length > 0) {
      // Get #1 seed
      const confStandings = conference === 'afc'
        ? allStandings.filter(s => s.team.conference === 'AFC')
        : allStandings.filter(s => s.team.conference === 'NFC');
      const seed1 = confStandings.find(s => s.seed === 1);

      // Get wild card winners
      const wcWinners = playoffPicks[conference].wildCard.filter(id => id !== null);

      // Divisional participants = seed 1 + wild card winners
      const participants = seed1 ? [seed1.team.id, ...wcWinners] : wcWinners;

      // Losers are participants that aren't divisional winners
      for (const participantId of participants) {
        if (!divisionalWinners.includes(participantId)) {
          const loserStanding = allStandings.find(s => s.team.id === participantId);
          if (loserStanding && !losers.some(l => l.team.id === loserStanding.team.id)) {
            losers.push(loserStanding);
          }
        }
      }
    }
  } else if (round === 'championship') {
    const winnerId = playoffPicks[conference].championship;
    if (!winnerId) return losers;

    const game = roundGames[0];
    if (game && game.status === 'final' && game.winnerId) {
      return losers;
    }

    if (game) {
      const loserId = winnerId === game.homeTeam.id ? game.awayTeam.id : game.homeTeam.id;
      const loserStanding = allStandings.find(s => s.team.id === loserId);
      if (loserStanding) {
        losers.push(loserStanding);
      }
    } else {
      // No game defined, but we have a pick - determine loser from divisional winners
      // The championship loser is the divisional winner that isn't the championship winner
      const divisionalWinners = playoffPicks[conference].divisional.filter(id => id !== null);
      for (const divWinnerId of divisionalWinners) {
        if (divWinnerId !== winnerId) {
          const loserStanding = allStandings.find(s => s.team.id === divWinnerId);
          if (loserStanding) {
            losers.push(loserStanding);
          }
        }
      }
    }
  }

  return losers;
}

export function calculateDraftOrder(
  afcStandings: TeamStanding[],
  nfcStandings: TeamStanding[],
  playoffPicks: PlayoffPicks,
  playoffGames: PlayoffGame[] = [],
  regularSeasonGames: Game[] = []
): DraftPick[] {
  const draftOrder: DraftPick[] = [];
  let pickNumber = 1;

  // Combine all standings
  const allStandings = [...afcStandings, ...nfcStandings];

  // Calculate SOS for all teams
  const sosMap = calculateSOS(allStandings, regularSeasonGames);

  // Organize playoff games by round
  const gamesByRound = {
    wildCard: playoffGames.filter(g => g.round === 'wildCard'),
    divisional: playoffGames.filter(g => g.round === 'divisional'),
    championship: playoffGames.filter(g => g.round === 'championship'),
    superBowl: playoffGames.filter(g => g.round === 'superBowl'),
  };

  // 1. Non-playoff teams (picks 1-18) - worst record first
  const nonPlayoffTeams = allStandings.filter(s => s.seed === null);
  const sortedNonPlayoff = sortByRecordWorstFirst(nonPlayoffTeams, sosMap);

  for (const standing of sortedNonPlayoff) {
    draftOrder.push({
      pick: pickNumber++,
      team: standing.team,
      record: formatRecord(standing),
      reason: 'Missed playoffs',
    });
  }

  // 2. Wild Card losers (picks 19-24)
  // First get losers from actual game results
  const wcLosersFromGames = getLosersFromGames(gamesByRound.wildCard, allStandings);
  // Then get losers from user picks for games not yet played
  const wcLosersFromPicks = [
    ...getLosersFromPicks('afc', 'wildCard', playoffPicks, playoffGames, allStandings),
    ...getLosersFromPicks('nfc', 'wildCard', playoffPicks, playoffGames, allStandings),
  ];
  // Combine and dedupe
  const allWcLosers = [...wcLosersFromGames];
  for (const loser of wcLosersFromPicks) {
    if (!allWcLosers.some(l => l.team.id === loser.team.id)) {
      allWcLosers.push(loser);
    }
  }
  const sortedWcLosers = sortByRecordWorstFirst(allWcLosers, sosMap);

  for (const standing of sortedWcLosers) {
    draftOrder.push({
      pick: pickNumber++,
      team: standing.team,
      record: formatRecord(standing),
      reason: 'Lost in Wild Card',
    });
  }

  // 3. Divisional losers (picks 25-28)
  const divLosersFromGames = getLosersFromGames(gamesByRound.divisional, allStandings);
  const divLosersFromPicks = [
    ...getLosersFromPicks('afc', 'divisional', playoffPicks, playoffGames, allStandings),
    ...getLosersFromPicks('nfc', 'divisional', playoffPicks, playoffGames, allStandings),
  ];
  const allDivLosers = [...divLosersFromGames];
  for (const loser of divLosersFromPicks) {
    if (!allDivLosers.some(l => l.team.id === loser.team.id)) {
      allDivLosers.push(loser);
    }
  }

  // Get all potential divisional losers for range calculation
  const allDivParticipants = getAllParticipants(gamesByRound.divisional, allStandings);
  const divRoundStartPick = pickNumber;

  // Sort known losers and calculate ranges
  const sortedDivLosers = sortByRecordWorstFirst(allDivLosers, sosMap);
  const haveAllDivLosers = allDivLosers.length === 4;

  for (const standing of sortedDivLosers) {
    if (haveAllDivLosers) {
      // All losers known, pick is definitive
      draftOrder.push({
        pick: pickNumber++,
        team: standing.team,
        record: formatRecord(standing),
        reason: 'Lost in Divisional',
      });
    } else {
      // Calculate range considering all potential losers
      const range = calculatePickRange(standing, allDivLosers, allDivParticipants, 4, sosMap);
      const minPick = divRoundStartPick + range.min;
      const maxPick = divRoundStartPick + range.max;

      draftOrder.push({
        pick: minPick,
        pickMax: minPick !== maxPick ? maxPick : undefined,
        team: standing.team,
        record: formatRecord(standing),
        reason: 'Lost in Divisional',
      });
      pickNumber++;
    }
  }

  // 4. Conference Championship losers (picks 29-30)
  // Advance pickNumber to account for remaining divisional slots
  pickNumber = divRoundStartPick + 4;

  const confLosersFromGames = getLosersFromGames(gamesByRound.championship, allStandings);
  const confLosersFromPicks = [
    ...getLosersFromPicks('afc', 'championship', playoffPicks, playoffGames, allStandings),
    ...getLosersFromPicks('nfc', 'championship', playoffPicks, playoffGames, allStandings),
  ];
  const allConfLosers = [...confLosersFromGames];
  for (const loser of confLosersFromPicks) {
    if (!allConfLosers.some(l => l.team.id === loser.team.id)) {
      allConfLosers.push(loser);
    }
  }

  // Get all potential conference championship losers
  const allConfParticipants = getAllParticipants(gamesByRound.championship, allStandings);
  const confRoundStartPick = pickNumber;

  const sortedConfLosers = sortByRecordWorstFirst(allConfLosers, sosMap);
  const haveAllConfLosers = allConfLosers.length === 2;

  for (const standing of sortedConfLosers) {
    if (haveAllConfLosers) {
      draftOrder.push({
        pick: pickNumber++,
        team: standing.team,
        record: formatRecord(standing),
        reason: 'Lost in Conference Championship',
      });
    } else {
      const range = calculatePickRange(standing, allConfLosers, allConfParticipants, 2, sosMap);
      const minPick = confRoundStartPick + range.min;
      const maxPick = confRoundStartPick + range.max;

      draftOrder.push({
        pick: minPick,
        pickMax: minPick !== maxPick ? maxPick : undefined,
        team: standing.team,
        record: formatRecord(standing),
        reason: 'Lost in Conference Championship',
      });
      pickNumber++;
    }
  }

  // 5. Super Bowl loser (pick 31) and winner (pick 32)
  const superBowlGame = gamesByRound.superBowl[0];
  let sbWinnerId: string | null = null;
  let sbLoserId: string | null = null;

  if (superBowlGame?.status === 'final' && superBowlGame.winnerId) {
    // Use actual Super Bowl result
    sbWinnerId = superBowlGame.winnerId;
    sbLoserId = sbWinnerId === superBowlGame.homeTeam.id
      ? superBowlGame.awayTeam.id
      : superBowlGame.homeTeam.id;
  } else if (playoffPicks.superBowl) {
    // Use user's pick
    sbWinnerId = playoffPicks.superBowl;
    const afcChamp = playoffPicks.afc.championship;
    const nfcChamp = playoffPicks.nfc.championship;
    sbLoserId = sbWinnerId === afcChamp ? nfcChamp : afcChamp;
  }

  if (sbLoserId) {
    const loserStanding = allStandings.find(s => s.team.id === sbLoserId);
    if (loserStanding) {
      draftOrder.push({
        pick: pickNumber++,
        team: loserStanding.team,
        record: formatRecord(loserStanding),
        reason: 'Lost Super Bowl',
      });
    }
  }

  if (sbWinnerId) {
    const winnerStanding = allStandings.find(s => s.team.id === sbWinnerId);
    if (winnerStanding) {
      draftOrder.push({
        pick: pickNumber++,
        team: winnerStanding.team,
        record: formatRecord(winnerStanding),
        reason: 'Won Super Bowl',
      });
    }
  }

  return draftOrder;
}
