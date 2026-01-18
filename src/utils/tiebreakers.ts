import type { Team, Game, GameSelection, TeamStanding, Conference, Division, LastFiveGame } from '@/types';
import { getTeamsByDivision, getTeamsByConference } from '@/data/teams';

interface TeamRecord {
  team: Team;
  wins: number;
  losses: number;
  ties: number;
  divisionWins: number;
  divisionLosses: number;
  divisionTies: number;
  conferenceWins: number;
  conferenceLosses: number;
  conferenceTies: number;
  pointsFor: number;
  pointsAgainst: number;
  gamesPlayed: Game[];
}

// Calculate win percentage
function winPct(wins: number, losses: number, ties: number): number {
  const total = wins + losses + ties;
  if (total === 0) return 0;
  return (wins + ties * 0.5) / total;
}

// Get head-to-head record between teams
function getHeadToHead(
  team: Team,
  opponents: Team[],
  games: Game[],
  selections: Record<string, GameSelection>
): { wins: number; losses: number; ties: number } {
  const opponentIds = new Set(opponents.map(t => t.id));
  let wins = 0, losses = 0, ties = 0;

  for (const game of games) {
    const isHome = game.homeTeam.id === team.id;
    const isAway = game.awayTeam.id === team.id;
    if (!isHome && !isAway) continue;

    const opponent = isHome ? game.awayTeam : game.homeTeam;
    if (!opponentIds.has(opponent.id)) continue;

    const result = getGameResult(game, team, selections);
    if (result === 'win') wins++;
    else if (result === 'loss') losses++;
    else if (result === 'tie') ties++;
  }

  return { wins, losses, ties };
}

// Get game result for a team
function getGameResult(
  game: Game,
  team: Team,
  selections: Record<string, GameSelection>
): 'win' | 'loss' | 'tie' | null {
  const isHome = game.homeTeam.id === team.id;

  if (game.status === 'final') {
    if (game.homeScore === game.awayScore) return 'tie';
    const homeWon = (game.homeScore ?? 0) > (game.awayScore ?? 0);
    return isHome ? (homeWon ? 'win' : 'loss') : (homeWon ? 'loss' : 'win');
  }

  const selection = selections[game.id];
  if (!selection) return null;

  if (selection === 'tie') return 'tie';
  if (selection === 'home') return isHome ? 'win' : 'loss';
  return isHome ? 'loss' : 'win';
}

// Calculate record in common games
// NFL rule: "Record against common opponents (minimum of four games)"
function getCommonGamesRecord(
  team: Team,
  opponents: Team[],
  allTeamRecords: Map<string, TeamRecord>,
  games: Game[],
  selections: Record<string, GameSelection>
): { wins: number; losses: number; ties: number } {
  // Find common opponents (teams all involved teams have played)
  const allTeams = [team, ...opponents];
  const opponentSets = allTeams.map(t => {
    const record = allTeamRecords.get(t.id);
    if (!record) return new Set<string>();
    return new Set(
      record.gamesPlayed
        .filter(g => g.status === 'final' || selections[g.id])
        .map(g => g.homeTeam.id === t.id ? g.awayTeam.id : g.homeTeam.id)
    );
  });

  // Intersection of all opponent sets (excluding the tying teams themselves)
  const tiedTeamIds = new Set(allTeams.map(t => t.id));
  let commonOpponents = opponentSets[0];
  for (let i = 1; i < opponentSets.length; i++) {
    commonOpponents = new Set([...commonOpponents].filter(id =>
      opponentSets[i].has(id) && !tiedTeamIds.has(id)
    ));
  }

  // Calculate record against common opponents
  let wins = 0, losses = 0, ties = 0;
  const record = allTeamRecords.get(team.id);
  if (!record) return { wins, losses, ties };

  for (const game of record.gamesPlayed) {
    const opponent = game.homeTeam.id === team.id ? game.awayTeam : game.homeTeam;
    if (!commonOpponents.has(opponent.id)) continue;

    const result = getGameResult(game, team, selections);
    if (result === 'win') wins++;
    else if (result === 'loss') losses++;
    else if (result === 'tie') ties++;
  }

  // Minimum 4 common GAMES required (not 4 common opponents)
  const totalGames = wins + losses + ties;
  if (totalGames < 4) {
    return { wins: 0, losses: 0, ties: 0 };
  }

  return { wins, losses, ties };
}

// Calculate strength of victory (combined record of teams beaten)
// NFL rule: Sum the records of all teams you defeated, counting each WIN separately
// (if you beat a team twice, count their record twice)
function getStrengthOfVictory(
  team: Team,
  allTeamRecords: Map<string, TeamRecord>,
  games: Game[],
  selections: Record<string, GameSelection>
): number {
  const record = allTeamRecords.get(team.id);
  if (!record) return 0;

  let totalWins = 0, totalLosses = 0, totalTies = 0;

  for (const game of record.gamesPlayed) {
    const result = getGameResult(game, team, selections);
    if (result !== 'win') continue;

    const opponent = game.homeTeam.id === team.id ? game.awayTeam : game.homeTeam;
    const opponentRecord = allTeamRecords.get(opponent.id);
    if (opponentRecord) {
      // Count each win separately - if you beat a team twice, add their record twice
      totalWins += opponentRecord.wins;
      totalLosses += opponentRecord.losses;
      totalTies += opponentRecord.ties;
    }
  }

  return winPct(totalWins, totalLosses, totalTies);
}

// Calculate strength of schedule (combined record of all opponents)
// NFL rule: Sum the records of all opponents, counting each GAME separately
// (if you play a team twice, count their record twice)
function getStrengthOfSchedule(
  team: Team,
  allTeamRecords: Map<string, TeamRecord>
): number {
  const record = allTeamRecords.get(team.id);
  if (!record) return 0;

  let totalWins = 0, totalLosses = 0, totalTies = 0;

  for (const game of record.gamesPlayed) {
    const opponent = game.homeTeam.id === team.id ? game.awayTeam : game.homeTeam;
    const opponentRecord = allTeamRecords.get(opponent.id);
    if (opponentRecord) {
      // Count each game separately - if you play a team twice, add their record twice
      totalWins += opponentRecord.wins;
      totalLosses += opponentRecord.losses;
      totalTies += opponentRecord.ties;
    }
  }

  return winPct(totalWins, totalLosses, totalTies);
}

// Get points ranking (combined points for/against ranking)
function getPointsRanking(
  team: Team,
  teamsToRank: Team[],
  allTeamRecords: Map<string, TeamRecord>
): number {
  const rankings: { teamId: string; pf: number; pa: number }[] = [];

  for (const t of teamsToRank) {
    const record = allTeamRecords.get(t.id);
    if (record) {
      rankings.push({
        teamId: t.id,
        pf: record.pointsFor,
        pa: record.pointsAgainst,
      });
    }
  }

  // Sort by points for (descending) and points against (ascending)
  const pfRanking = [...rankings].sort((a, b) => b.pf - a.pf);
  const paRanking = [...rankings].sort((a, b) => a.pa - b.pa);

  const pfRank = pfRanking.findIndex(r => r.teamId === team.id) + 1;
  const paRank = paRanking.findIndex(r => r.teamId === team.id) + 1;

  return pfRank + paRank; // Lower is better
}

/**
 * Groups teams by a numeric value, recursively breaks ties within each group,
 * and returns teams ordered from best (highest value) to worst (lowest value).
 * Used to handle partial separation in multi-team ties.
 */
function groupAndResolveTies(
  teams: Team[],
  getValue: (team: Team) => number,
  recursiveBreak: (group: Team[]) => Team[]
): Team[] | null {
  if (teams.length <= 1) return teams;

  // Group teams by value
  const groups = new Map<number, Team[]>();
  for (const team of teams) {
    const value = getValue(team);
    // Round to avoid floating point issues
    const roundedValue = Math.round(value * 10000) / 10000;
    if (!groups.has(roundedValue)) {
      groups.set(roundedValue, []);
    }
    groups.get(roundedValue)!.push(team);
  }

  // If all teams have the same value, no separation occurred
  if (groups.size === 1) {
    return null;
  }

  // Sort group keys descending (best first)
  const sortedKeys = [...groups.keys()].sort((a, b) => b - a);

  // Recursively break ties within each group and concatenate
  const result: Team[] = [];
  for (const key of sortedKeys) {
    const group = groups.get(key)!;
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      result.push(...recursiveBreak(group));
    }
  }

  return result;
}

// Main tiebreaker function
export function breakTie(
  teams: Team[],
  allTeamRecords: Map<string, TeamRecord>,
  games: Game[],
  selections: Record<string, GameSelection>,
  isDivisionTie: boolean
): Team[] {
  if (teams.length <= 1) return teams;

  // Step 1: Head-to-head (if all teams have played each other)
  const h2hResults: Map<string, { wins: number; losses: number; ties: number }> = new Map();
  let allPlayedEachOther = true;

  for (const team of teams) {
    const others = teams.filter(t => t.id !== team.id);
    const h2h = getHeadToHead(team, others, games, selections);
    h2hResults.set(team.id, h2h);

    // Check if they've played all opponents
    // For division ties: need to have played each opponent (at least once)
    // For wild card ties: need to have played each opponent (at least once)
    // This ensures head-to-head only applies when ALL teams have played EACH OTHER
    const minGamesRequired = others.length;
    if (h2h.wins + h2h.losses + h2h.ties < minGamesRequired) {
      allPlayedEachOther = false;
    }
  }

  if (allPlayedEachOther) {
    const h2hResult = groupAndResolveTies(
      teams,
      (team) => {
        const h2h = h2hResults.get(team.id)!;
        return winPct(h2h.wins, h2h.losses, h2h.ties);
      },
      (group) => breakTie(group, allTeamRecords, games, selections, isDivisionTie)
    );
    if (h2hResult) return h2hResult;
  }

  // Step 2: Division record (for division ties only)
  if (isDivisionTie) {
    const divResult = groupAndResolveTies(
      teams,
      (team) => {
        const rec = allTeamRecords.get(team.id)!;
        return winPct(rec.divisionWins, rec.divisionLosses, rec.divisionTies);
      },
      (group) => breakTie(group, allTeamRecords, games, selections, isDivisionTie)
    );
    if (divResult) return divResult;
  }

  // Step 3 (wild card) / Step 4 (division): Conference record
  // For wild card ties, conference record comes BEFORE common games per NFL rules
  if (!isDivisionTie) {
    const confResult = groupAndResolveTies(
      teams,
      (team) => {
        const rec = allTeamRecords.get(team.id)!;
        return winPct(rec.conferenceWins, rec.conferenceLosses, rec.conferenceTies);
      },
      (group) => breakTie(group, allTeamRecords, games, selections, isDivisionTie)
    );
    if (confResult) return confResult;
  }

  // Step 3 (division) / Step 4 (wild card): Common games
  const commonResults: Map<string, { wins: number; losses: number; ties: number }> = new Map();
  for (const team of teams) {
    const others = teams.filter(t => t.id !== team.id);
    commonResults.set(team.id, getCommonGamesRecord(team, others, allTeamRecords, games, selections));
  }

  const hasCommonGames = [...commonResults.values()].some(r => r.wins + r.losses + r.ties >= 4);
  if (hasCommonGames) {
    const commonResult = groupAndResolveTies(
      teams,
      (team) => {
        const common = commonResults.get(team.id)!;
        return winPct(common.wins, common.losses, common.ties);
      },
      (group) => breakTie(group, allTeamRecords, games, selections, isDivisionTie)
    );
    if (commonResult) return commonResult;
  }

  // Step 4 (division only): Conference record (already handled above for wild card)
  if (isDivisionTie) {
    const confResult = groupAndResolveTies(
      teams,
      (team) => {
        const rec = allTeamRecords.get(team.id)!;
        return winPct(rec.conferenceWins, rec.conferenceLosses, rec.conferenceTies);
      },
      (group) => breakTie(group, allTeamRecords, games, selections, isDivisionTie)
    );
    if (confResult) return confResult;
  }

  // Step 5: Strength of victory
  const sovResult = groupAndResolveTies(
    teams,
    (team) => getStrengthOfVictory(team, allTeamRecords, games, selections),
    (group) => breakTie(group, allTeamRecords, games, selections, isDivisionTie)
  );
  if (sovResult) return sovResult;

  // Step 6: Strength of schedule
  const sosResult = groupAndResolveTies(
    teams,
    (team) => getStrengthOfSchedule(team, allTeamRecords),
    (group) => breakTie(group, allTeamRecords, games, selections, isDivisionTie)
  );
  if (sosResult) return sosResult;

  // Step 7: Conference points ranking (lower is better, so negate)
  const conferenceTeams = getTeamsByConference(teams[0].conference);
  const rankingResult = groupAndResolveTies(
    teams,
    (team) => -getPointsRanking(team, conferenceTeams, allTeamRecords), // Negate because lower ranking is better
    (group) => breakTie(group, allTeamRecords, games, selections, isDivisionTie)
  );
  if (rankingResult) return rankingResult;

  // Step 8-11: Net points tiebreakers (simplified to point differential)
  const pointDiffResult = groupAndResolveTies(
    teams,
    (team) => {
      const rec = allTeamRecords.get(team.id)!;
      return rec.pointsFor - rec.pointsAgainst;
    },
    (group) => breakTie(group, allTeamRecords, games, selections, isDivisionTie)
  );
  if (pointDiffResult) return pointDiffResult;

  // Final fallback: sort by point differential (if still tied, order is arbitrary)
  return [...teams].sort((a, b) => {
    const aRec = allTeamRecords.get(a.id)!;
    const bRec = allTeamRecords.get(b.id)!;
    return (bRec.pointsFor - bRec.pointsAgainst) - (aRec.pointsFor - aRec.pointsAgainst);
  });
}

// Calculate all team records from games and selections
export function calculateTeamRecords(
  teams: Team[],
  games: Game[],
  selections: Record<string, GameSelection>
): Map<string, TeamRecord> {
  const records = new Map<string, TeamRecord>();

  // Initialize records
  for (const team of teams) {
    records.set(team.id, {
      team,
      wins: 0,
      losses: 0,
      ties: 0,
      divisionWins: 0,
      divisionLosses: 0,
      divisionTies: 0,
      conferenceWins: 0,
      conferenceLosses: 0,
      conferenceTies: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      gamesPlayed: [],
    });
  }

  // Process each game
  for (const game of games) {
    const homeRecord = records.get(game.homeTeam.id);
    const awayRecord = records.get(game.awayTeam.id);
    if (!homeRecord || !awayRecord) continue;

    // Add to games played
    homeRecord.gamesPlayed.push(game);
    awayRecord.gamesPlayed.push(game);

    // Get result
    let homeResult: 'win' | 'loss' | 'tie' | null = null;

    if (game.status === 'final') {
      if (game.homeScore === game.awayScore) {
        homeResult = 'tie';
      } else {
        homeResult = (game.homeScore ?? 0) > (game.awayScore ?? 0) ? 'win' : 'loss';
      }
      homeRecord.pointsFor += game.homeScore ?? 0;
      homeRecord.pointsAgainst += game.awayScore ?? 0;
      awayRecord.pointsFor += game.awayScore ?? 0;
      awayRecord.pointsAgainst += game.homeScore ?? 0;
    } else {
      const selection = selections[game.id];
      if (selection === 'home') homeResult = 'win';
      else if (selection === 'away') homeResult = 'loss';
      else if (selection === 'tie') homeResult = 'tie';
      // For selections, estimate scores for point differential
      if (selection === 'home') {
        homeRecord.pointsFor += 24;
        homeRecord.pointsAgainst += 17;
        awayRecord.pointsFor += 17;
        awayRecord.pointsAgainst += 24;
      } else if (selection === 'away') {
        homeRecord.pointsFor += 17;
        homeRecord.pointsAgainst += 24;
        awayRecord.pointsFor += 24;
        awayRecord.pointsAgainst += 17;
      } else if (selection === 'tie') {
        homeRecord.pointsFor += 20;
        homeRecord.pointsAgainst += 20;
        awayRecord.pointsFor += 20;
        awayRecord.pointsAgainst += 20;
      }
    }

    if (homeResult === null) continue;

    const awayResult = homeResult === 'win' ? 'loss' : homeResult === 'loss' ? 'win' : 'tie';
    const isDivision = game.homeTeam.division === game.awayTeam.division;
    const isConference = game.homeTeam.conference === game.awayTeam.conference;

    // Update home team
    if (homeResult === 'win') {
      homeRecord.wins++;
      if (isDivision) homeRecord.divisionWins++;
      if (isConference) homeRecord.conferenceWins++;
    } else if (homeResult === 'loss') {
      homeRecord.losses++;
      if (isDivision) homeRecord.divisionLosses++;
      if (isConference) homeRecord.conferenceLosses++;
    } else {
      homeRecord.ties++;
      if (isDivision) homeRecord.divisionTies++;
      if (isConference) homeRecord.conferenceTies++;
    }

    // Update away team
    if (awayResult === 'win') {
      awayRecord.wins++;
      if (isDivision) awayRecord.divisionWins++;
      if (isConference) awayRecord.conferenceWins++;
    } else if (awayResult === 'loss') {
      awayRecord.losses++;
      if (isDivision) awayRecord.divisionLosses++;
      if (isConference) awayRecord.conferenceLosses++;
    } else {
      awayRecord.ties++;
      if (isDivision) awayRecord.divisionTies++;
      if (isConference) awayRecord.conferenceTies++;
    }
  }

  return records;
}

// Helper function to sort teams with proper tiebreaker application
function sortTeamsWithTiebreakers(
  teams: Team[],
  allRecords: Map<string, TeamRecord>,
  games: Game[],
  selections: Record<string, GameSelection>,
  isDivisionTie: boolean
): Team[] {
  if (teams.length <= 1) return teams;

  // First sort by win percentage
  const sorted = [...teams].sort((a, b) => {
    const aRec = allRecords.get(a.id)!;
    const bRec = allRecords.get(b.id)!;
    return winPct(bRec.wins, bRec.losses, bRec.ties) -
           winPct(aRec.wins, aRec.losses, aRec.ties);
  });

  // Group teams by win percentage
  const groups: Team[][] = [];
  let currentGroup: Team[] = [];
  let currentPct = -1;

  for (const team of sorted) {
    const rec = allRecords.get(team.id)!;
    const pct = winPct(rec.wins, rec.losses, rec.ties);

    if (Math.abs(pct - currentPct) < 0.001) {
      currentGroup.push(team);
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [team];
      currentPct = pct;
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // Apply tiebreakers to each group and flatten
  const result: Team[] = [];
  for (const group of groups) {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      // For wild card seeding, check if any teams are from the same division
      // If so, apply division tiebreaker first between those teams
      if (!isDivisionTie) {
        const resolved = resolveWildCardTies(group, allRecords, games, selections);
        result.push(...resolved);
      } else {
        const broken = breakTie(group, allRecords, games, selections, isDivisionTie);
        result.push(...broken);
      }
    }
  }

  return result;
}

// Resolve wild card ties, handling same-division teams specially
function resolveWildCardTies(
  teams: Team[],
  allRecords: Map<string, TeamRecord>,
  games: Game[],
  selections: Record<string, GameSelection>
): Team[] {
  if (teams.length <= 1) return teams;

  // Group teams by division
  const byDivision = new Map<string, Team[]>();
  for (const team of teams) {
    const div = team.division;
    if (!byDivision.has(div)) {
      byDivision.set(div, []);
    }
    byDivision.get(div)!.push(team);
  }

  // If all teams from different divisions, use standard wild card tiebreaker
  if (byDivision.size === teams.length) {
    return breakTie(teams, allRecords, games, selections, false);
  }

  // Handle same-division teams: apply division tiebreaker to rank them
  // Store the full ranked order for each division
  const divisionRankings = new Map<string, Team[]>();

  for (const [div, divTeams] of byDivision) {
    if (divTeams.length === 1) {
      divisionRankings.set(div, divTeams);
    } else {
      // Apply division tiebreaker to same-division teams
      const ranked = breakTie(divTeams, allRecords, games, selections, true);
      divisionRankings.set(div, ranked);
    }
  }

  // Get the best team from each division for wild card comparison
  const divisionBests: Team[] = [];
  for (const [, ranked] of divisionRankings) {
    divisionBests.push(ranked[0]);
  }

  // Sort division bests using wild card tiebreaker
  const sortedBests = divisionBests.length > 1
    ? breakTie(divisionBests, allRecords, games, selections, false)
    : divisionBests;

  // Build final result: for each division best, add all teams from that division
  // in their division-tiebreaker order
  const result: Team[] = [];
  for (const best of sortedBests) {
    const divRanking = divisionRankings.get(best.division)!;
    result.push(...divRanking);
  }

  return result;
}

// Calculate playoff seedings for a conference
export function calculatePlayoffSeedings(
  conference: Conference,
  teams: Team[],
  games: Game[],
  selections: Record<string, GameSelection>
): TeamStanding[] {
  const conferenceTeams = teams.filter(t => t.conference === conference);
  const allRecords = calculateTeamRecords(teams, games, selections);

  // Get division winners
  const divisions = [...new Set(conferenceTeams.map(t => t.division))];
  const divisionWinners: Team[] = [];
  const wildCardTeams: Team[] = [];

  for (const division of divisions) {
    const divisionTeams = conferenceTeams.filter(t => t.division === division);

    // Sort by win percentage
    const sorted = divisionTeams.sort((a, b) => {
      const aRec = allRecords.get(a.id)!;
      const bRec = allRecords.get(b.id)!;
      return winPct(bRec.wins, bRec.losses, bRec.ties) -
             winPct(aRec.wins, aRec.losses, aRec.ties);
    });

    // Find teams tied for first
    const bestPct = winPct(
      allRecords.get(sorted[0].id)!.wins,
      allRecords.get(sorted[0].id)!.losses,
      allRecords.get(sorted[0].id)!.ties
    );

    const tiedForFirst = sorted.filter(t => {
      const rec = allRecords.get(t.id)!;
      return Math.abs(winPct(rec.wins, rec.losses, rec.ties) - bestPct) < 0.001;
    });

    // Break ties
    const rankedFirst = tiedForFirst.length > 1
      ? breakTie(tiedForFirst, allRecords, games, selections, true)
      : tiedForFirst;

    divisionWinners.push(rankedFirst[0]);

    // Rest go to wild card pool
    for (const team of sorted) {
      if (team.id !== rankedFirst[0].id) {
        wildCardTeams.push(team);
      }
    }
  }

  // Sort division winners by record, applying tiebreakers for teams with same record
  // Division winners are from different divisions, so use wild card tiebreaker rules (isDivisionTie: false)
  const sortedDivisionWinners = sortTeamsWithTiebreakers(
    divisionWinners,
    allRecords,
    games,
    selections,
    false // Division winners use wild card tiebreaker rules for seeding
  );

  // Sort wild card teams by record, applying tiebreakers for teams with same record
  const sortedWildCard = sortTeamsWithTiebreakers(
    wildCardTeams,
    allRecords,
    games,
    selections,
    false // Wild card teams use wild card tiebreaker rules
  );

  // Take top 3 wild cards
  const playoffWildCards = sortedWildCard.slice(0, 3);

  // Create standings
  const standings: TeamStanding[] = [];

  // Seeds 1-4: Division winners
  for (let i = 0; i < sortedDivisionWinners.length; i++) {
    const team = sortedDivisionWinners[i];
    const rec = allRecords.get(team.id)!;
    standings.push(createStanding(team, rec, i + 1, 'division'));
  }

  // Seeds 5-7: Wild cards
  for (let i = 0; i < playoffWildCards.length; i++) {
    const team = playoffWildCards[i];
    const rec = allRecords.get(team.id)!;
    standings.push(createStanding(team, rec, 5 + i, 'playoff'));
  }

  // Rest of conference (not in playoffs)
  for (const team of sortedWildCard.slice(3)) {
    const rec = allRecords.get(team.id)!;
    standings.push(createStanding(team, rec, null, null));
  }

  return standings;
}

function createStanding(
  team: Team,
  record: TeamRecord,
  seed: number | null,
  clinched: 'division' | 'playoff' | 'bye' | null
): TeamStanding {
  // lastFive is calculated separately in useStandings
  const lastFive: LastFiveGame[] = [];

  return {
    team,
    wins: record.wins,
    losses: record.losses,
    ties: record.ties,
    divisionWins: record.divisionWins,
    divisionLosses: record.divisionLosses,
    divisionTies: record.divisionTies,
    conferenceWins: record.conferenceWins,
    conferenceLosses: record.conferenceLosses,
    conferenceTies: record.conferenceTies,
    pointsFor: record.pointsFor,
    pointsAgainst: record.pointsAgainst,
    streak: '', // Would calculate from recent games
    lastFive,
    isEliminated: seed === null && clinched === null,
    clinched: seed === 1 ? 'bye' : clinched,
    seed,
    magicNumber: null, // Calculated separately
  };
}
