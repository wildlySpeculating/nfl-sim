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

  // Minimum 4 common games required
  if (commonOpponents.size < 4) {
    return { wins: 0, losses: 0, ties: 0 };
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

  return { wins, losses, ties };
}

// Calculate strength of victory (combined record of teams beaten)
function getStrengthOfVictory(
  team: Team,
  allTeamRecords: Map<string, TeamRecord>,
  games: Game[],
  selections: Record<string, GameSelection>
): number {
  const record = allTeamRecords.get(team.id);
  if (!record) return 0;

  let totalWins = 0, totalLosses = 0, totalTies = 0;
  const beatenTeams = new Set<string>();

  for (const game of record.gamesPlayed) {
    const result = getGameResult(game, team, selections);
    if (result !== 'win') continue;

    const opponent = game.homeTeam.id === team.id ? game.awayTeam : game.homeTeam;
    if (beatenTeams.has(opponent.id)) continue;
    beatenTeams.add(opponent.id);

    const opponentRecord = allTeamRecords.get(opponent.id);
    if (opponentRecord) {
      totalWins += opponentRecord.wins;
      totalLosses += opponentRecord.losses;
      totalTies += opponentRecord.ties;
    }
  }

  return winPct(totalWins, totalLosses, totalTies);
}

// Calculate strength of schedule (combined record of all opponents)
function getStrengthOfSchedule(
  team: Team,
  allTeamRecords: Map<string, TeamRecord>
): number {
  const record = allTeamRecords.get(team.id);
  if (!record) return 0;

  let totalWins = 0, totalLosses = 0, totalTies = 0;
  const opponents = new Set<string>();

  for (const game of record.gamesPlayed) {
    const opponent = game.homeTeam.id === team.id ? game.awayTeam : game.homeTeam;
    if (opponents.has(opponent.id)) continue;
    opponents.add(opponent.id);

    const opponentRecord = allTeamRecords.get(opponent.id);
    if (opponentRecord) {
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
    const expectedGames = isDivisionTie ? others.length * 2 : others.length; // Division teams play twice
    if (h2h.wins + h2h.losses + h2h.ties < (isDivisionTie ? others.length : 1)) {
      allPlayedEachOther = false;
    }
  }

  if (allPlayedEachOther) {
    const sorted = [...teams].sort((a, b) => {
      const aH2h = h2hResults.get(a.id)!;
      const bH2h = h2hResults.get(b.id)!;
      return winPct(bH2h.wins, bH2h.losses, bH2h.ties) -
             winPct(aH2h.wins, aH2h.losses, aH2h.ties);
    });

    // If there's a clear winner, return
    const firstH2h = h2hResults.get(sorted[0].id)!;
    const secondH2h = h2hResults.get(sorted[1].id)!;
    if (winPct(firstH2h.wins, firstH2h.losses, firstH2h.ties) >
        winPct(secondH2h.wins, secondH2h.losses, secondH2h.ties)) {
      return sorted;
    }
  }

  // Step 2: Division record (for division ties only)
  if (isDivisionTie) {
    const sorted = [...teams].sort((a, b) => {
      const aRec = allTeamRecords.get(a.id)!;
      const bRec = allTeamRecords.get(b.id)!;
      return winPct(bRec.divisionWins, bRec.divisionLosses, bRec.divisionTies) -
             winPct(aRec.divisionWins, aRec.divisionLosses, aRec.divisionTies);
    });

    const first = allTeamRecords.get(sorted[0].id)!;
    const second = allTeamRecords.get(sorted[1].id)!;
    if (winPct(first.divisionWins, first.divisionLosses, first.divisionTies) >
        winPct(second.divisionWins, second.divisionLosses, second.divisionTies)) {
      return sorted;
    }
  }

  // Step 3: Common games
  const commonResults: Map<string, { wins: number; losses: number; ties: number }> = new Map();
  for (const team of teams) {
    const others = teams.filter(t => t.id !== team.id);
    commonResults.set(team.id, getCommonGamesRecord(team, others, allTeamRecords, games, selections));
  }

  const hasCommonGames = [...commonResults.values()].some(r => r.wins + r.losses + r.ties >= 4);
  if (hasCommonGames) {
    const sorted = [...teams].sort((a, b) => {
      const aCommon = commonResults.get(a.id)!;
      const bCommon = commonResults.get(b.id)!;
      return winPct(bCommon.wins, bCommon.losses, bCommon.ties) -
             winPct(aCommon.wins, aCommon.losses, aCommon.ties);
    });

    const firstCommon = commonResults.get(sorted[0].id)!;
    const secondCommon = commonResults.get(sorted[1].id)!;
    if (winPct(firstCommon.wins, firstCommon.losses, firstCommon.ties) >
        winPct(secondCommon.wins, secondCommon.losses, secondCommon.ties)) {
      return sorted;
    }
  }

  // Step 4: Conference record
  const sorted = [...teams].sort((a, b) => {
    const aRec = allTeamRecords.get(a.id)!;
    const bRec = allTeamRecords.get(b.id)!;
    return winPct(bRec.conferenceWins, bRec.conferenceLosses, bRec.conferenceTies) -
           winPct(aRec.conferenceWins, aRec.conferenceLosses, aRec.conferenceTies);
  });

  const firstConf = allTeamRecords.get(sorted[0].id)!;
  const secondConf = allTeamRecords.get(sorted[1].id)!;
  if (winPct(firstConf.conferenceWins, firstConf.conferenceLosses, firstConf.conferenceTies) >
      winPct(secondConf.conferenceWins, secondConf.conferenceLosses, secondConf.conferenceTies)) {
    return sorted;
  }

  // Step 5: Strength of victory
  const sovSorted = [...teams].sort((a, b) => {
    return getStrengthOfVictory(b, allTeamRecords, games, selections) -
           getStrengthOfVictory(a, allTeamRecords, games, selections);
  });

  const firstSov = getStrengthOfVictory(sovSorted[0], allTeamRecords, games, selections);
  const secondSov = getStrengthOfVictory(sovSorted[1], allTeamRecords, games, selections);
  if (Math.abs(firstSov - secondSov) > 0.001) {
    return sovSorted;
  }

  // Step 6: Strength of schedule
  const sosSorted = [...teams].sort((a, b) => {
    return getStrengthOfSchedule(b, allTeamRecords) -
           getStrengthOfSchedule(a, allTeamRecords);
  });

  const firstSos = getStrengthOfSchedule(sosSorted[0], allTeamRecords);
  const secondSos = getStrengthOfSchedule(sosSorted[1], allTeamRecords);
  if (Math.abs(firstSos - secondSos) > 0.001) {
    return sosSorted;
  }

  // Step 7: Conference points ranking
  const conferenceTeams = getTeamsByConference(teams[0].conference);
  const rankingSorted = [...teams].sort((a, b) => {
    return getPointsRanking(a, conferenceTeams, allTeamRecords) -
           getPointsRanking(b, conferenceTeams, allTeamRecords);
  });

  // Step 8-11: Net points tiebreakers (simplified to point differential)
  const pointDiffSorted = [...teams].sort((a, b) => {
    const aRec = allTeamRecords.get(a.id)!;
    const bRec = allTeamRecords.get(b.id)!;
    return (bRec.pointsFor - bRec.pointsAgainst) - (aRec.pointsFor - aRec.pointsAgainst);
  });

  // Return point differential sorted (or random if still tied)
  return pointDiffSorted;
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

  // Sort division winners by record
  const sortedDivisionWinners = [...divisionWinners].sort((a, b) => {
    const aRec = allRecords.get(a.id)!;
    const bRec = allRecords.get(b.id)!;
    return winPct(bRec.wins, bRec.losses, bRec.ties) -
           winPct(aRec.wins, aRec.losses, aRec.ties);
  });

  // Handle ties among division winners
  // ... (simplified for now)

  // Sort wild card teams
  const sortedWildCard = [...wildCardTeams].sort((a, b) => {
    const aRec = allRecords.get(a.id)!;
    const bRec = allRecords.get(b.id)!;
    return winPct(bRec.wins, bRec.losses, bRec.ties) -
           winPct(aRec.wins, aRec.losses, aRec.ties);
  });

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
