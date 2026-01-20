import { describe, it, expect } from 'vitest';
import { calculateTeamRecords, calculatePlayoffSeedings } from './tiebreakers';
import { calculateDraftOrder } from './draftOrder';
import { teams, getTeamsByConference } from '@/data/teams';
import type { Game, GameSelection, Team, TeamStanding, PlayoffPicks } from '@/types';
import type { PlayoffGame } from '@/hooks/useEspnApi';

// Helper to create a mock game
function createGame(
  id: string,
  homeTeam: Team,
  awayTeam: Team,
  homeScore: number | null = null,
  awayScore: number | null = null,
  status: 'final' | 'scheduled' | 'in_progress' = 'final',
  week: number = 1
): Game {
  return {
    id,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    status,
    week,
    kickoffTime: new Date(),
  };
}

// Helper to create empty playoff picks
function createEmptyPlayoffPicks(): PlayoffPicks {
  return {
    afc: {
      wildCard: [null, null, null],
      divisional: [null, null],
      championship: null,
    },
    nfc: {
      wildCard: [null, null, null],
      divisional: [null, null],
      championship: null,
    },
    superBowl: null,
  };
}

// Helper to create a playoff game
function createPlayoffGame(
  id: string,
  round: PlayoffGame['round'],
  conference: 'afc' | 'nfc' | null,
  homeTeam: Team,
  awayTeam: Team,
  winnerId: string | null = null,
  status: 'final' | 'scheduled' | 'in_progress' = 'scheduled'
): PlayoffGame {
  return {
    id,
    round,
    conference,
    homeTeam,
    awayTeam,
    homeScore: winnerId === homeTeam.id ? 24 : winnerId === awayTeam.id ? 17 : null,
    awayScore: winnerId === awayTeam.id ? 24 : winnerId === homeTeam.id ? 17 : null,
    status,
    winnerId,
  };
}

// Generate a complete 17-week regular season schedule
function generateFullSeasonSchedule(allTeams: Team[]): Game[] {
  const games: Game[] = [];
  let gameId = 1;

  // Group teams by division
  const divisionTeams: Record<string, Team[]> = {};
  for (const team of allTeams) {
    if (!divisionTeams[team.division]) {
      divisionTeams[team.division] = [];
    }
    divisionTeams[team.division].push(team);
  }

  // Generate division games (6 per team - play each divisional rival twice)
  for (const division of Object.values(divisionTeams)) {
    for (let i = 0; i < division.length; i++) {
      for (let j = i + 1; j < division.length; j++) {
        // Home and away
        games.push(createGame(
          `g${gameId++}`,
          division[i],
          division[j],
          null,
          null,
          'scheduled',
          Math.ceil(gameId / 16) // Spread across weeks
        ));
        games.push(createGame(
          `g${gameId++}`,
          division[j],
          division[i],
          null,
          null,
          'scheduled',
          Math.ceil(gameId / 16) + 8
        ));
      }
    }
  }

  // Generate some inter-division conference games
  const conferences = ['AFC', 'NFC'];
  for (const conf of conferences) {
    const confTeams = allTeams.filter(t => t.conference === conf);
    // Each team plays some teams from other divisions
    for (let i = 0; i < confTeams.length; i++) {
      for (let j = i + 1; j < confTeams.length; j++) {
        if (confTeams[i].division !== confTeams[j].division) {
          // Only add some games (not all possible matchups)
          if (Math.abs(i - j) <= 4) {
            games.push(createGame(
              `g${gameId++}`,
              confTeams[i],
              confTeams[j],
              null,
              null,
              'scheduled',
              Math.ceil(gameId / 16)
            ));
          }
        }
      }
    }
  }

  // Generate some inter-conference games
  const afcTeams = allTeams.filter(t => t.conference === 'AFC');
  const nfcTeams = allTeams.filter(t => t.conference === 'NFC');
  for (let i = 0; i < Math.min(afcTeams.length, nfcTeams.length); i++) {
    games.push(createGame(
      `g${gameId++}`,
      afcTeams[i],
      nfcTeams[i],
      null,
      null,
      'scheduled',
      Math.ceil(gameId / 16)
    ));
  }

  return games;
}

// Generate deterministic selections (home team wins for even game indices, away for odd)
function generateDeterministicSelections(games: Game[]): Record<string, GameSelection> {
  const selections: Record<string, GameSelection> = {};
  games.forEach((game, index) => {
    selections[game.id] = index % 2 === 0 ? 'home' : 'away';
  });
  return selections;
}

// Generate random selections for simulation
function generateRandomSelections(games: Game[], seed: number): Record<string, GameSelection> {
  const selections: Record<string, GameSelection> = {};
  // Simple seeded random for reproducibility
  let currentSeed = seed;
  const random = () => {
    currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
    return currentSeed / 0x7fffffff;
  };

  games.forEach((game) => {
    const rand = random();
    if (rand < 0.45) {
      selections[game.id] = 'home';
    } else if (rand < 0.9) {
      selections[game.id] = 'away';
    } else {
      selections[game.id] = 'tie';
    }
  });
  return selections;
}

describe('Phase 12: Integration Tests', () => {
  describe('Full Season Simulation', () => {
    it('should produce exactly 14 playoff teams (7 per conference)', () => {
      const allTeams = teams;
      const games = generateFullSeasonSchedule(allTeams);
      const selections = generateDeterministicSelections(games);

      const afcSeedings = calculatePlayoffSeedings('AFC', allTeams, games, selections);
      const nfcSeedings = calculatePlayoffSeedings('NFC', allTeams, games, selections);

      const afcPlayoffTeams = afcSeedings.filter(s => s.seed !== null);
      const nfcPlayoffTeams = nfcSeedings.filter(s => s.seed !== null);

      expect(afcPlayoffTeams.length).toBe(7);
      expect(nfcPlayoffTeams.length).toBe(7);
    });

    it('should produce exactly 8 division winners (4 per conference)', () => {
      const allTeams = teams;
      const games = generateFullSeasonSchedule(allTeams);
      const selections = generateDeterministicSelections(games);

      const afcSeedings = calculatePlayoffSeedings('AFC', allTeams, games, selections);
      const nfcSeedings = calculatePlayoffSeedings('NFC', allTeams, games, selections);

      // Division winners are seeds 1-4
      const afcDivisionWinners = afcSeedings.filter(s => s.seed !== null && s.seed <= 4);
      const nfcDivisionWinners = nfcSeedings.filter(s => s.seed !== null && s.seed <= 4);

      expect(afcDivisionWinners.length).toBe(4);
      expect(nfcDivisionWinners.length).toBe(4);
    });

    it('should produce deterministic standings (same inputs = same outputs)', () => {
      const allTeams = teams;
      const games = generateFullSeasonSchedule(allTeams);
      const selections = generateDeterministicSelections(games);

      // Run calculation twice
      const afcSeedings1 = calculatePlayoffSeedings('AFC', allTeams, games, selections);
      const afcSeedings2 = calculatePlayoffSeedings('AFC', allTeams, games, selections);

      const nfcSeedings1 = calculatePlayoffSeedings('NFC', allTeams, games, selections);
      const nfcSeedings2 = calculatePlayoffSeedings('NFC', allTeams, games, selections);

      // Compare results
      expect(afcSeedings1.length).toBe(afcSeedings2.length);
      expect(nfcSeedings1.length).toBe(nfcSeedings2.length);

      for (let i = 0; i < afcSeedings1.length; i++) {
        expect(afcSeedings1[i].team.id).toBe(afcSeedings2[i].team.id);
        expect(afcSeedings1[i].seed).toBe(afcSeedings2[i].seed);
        expect(afcSeedings1[i].wins).toBe(afcSeedings2[i].wins);
        expect(afcSeedings1[i].losses).toBe(afcSeedings2[i].losses);
      }

      for (let i = 0; i < nfcSeedings1.length; i++) {
        expect(nfcSeedings1[i].team.id).toBe(nfcSeedings2[i].team.id);
        expect(nfcSeedings1[i].seed).toBe(nfcSeedings2[i].seed);
      }
    });

    it('should handle random simulation with multiple seeds producing valid results', () => {
      const allTeams = teams;
      const games = generateFullSeasonSchedule(allTeams);

      // Test with different random seeds
      for (const seed of [12345, 67890, 11111]) {
        const selections = generateRandomSelections(games, seed);

        const afcSeedings = calculatePlayoffSeedings('AFC', allTeams, games, selections);
        const nfcSeedings = calculatePlayoffSeedings('NFC', allTeams, games, selections);

        // Should always have valid structure
        const afcPlayoffTeams = afcSeedings.filter(s => s.seed !== null);
        const nfcPlayoffTeams = nfcSeedings.filter(s => s.seed !== null);

        expect(afcPlayoffTeams.length).toBe(7);
        expect(nfcPlayoffTeams.length).toBe(7);
      }
    });
  });

  describe('Playoff Bracket Flow', () => {
    // Helper to set up full playoff bracket with playoff games
    function setupPlayoffBracket() {
      const afcTeams = getTeamsByConference('AFC').slice(0, 7);
      const nfcTeams = getTeamsByConference('NFC').slice(0, 7);

      const afcStandings: TeamStanding[] = afcTeams.map((team, i) => ({
        team,
        wins: 12 - i,
        losses: 5 + i,
        ties: 0,
        divisionWins: 4,
        divisionLosses: 2,
        divisionTies: 0,
        conferenceWins: 8,
        conferenceLosses: 5,
        conferenceTies: 0,
        pointsFor: 400 - i * 10,
        pointsAgainst: 300 + i * 10,
        streak: 'W1',
        lastFive: [],
        isEliminated: false,
        clinched: i === 0 ? 'bye' : i < 4 ? 'division' : 'playoff',
        seed: i + 1,
        magicNumber: null,
      }));

      const nfcStandings: TeamStanding[] = nfcTeams.map((team, i) => ({
        team,
        wins: 13 - i,
        losses: 4 + i,
        ties: 0,
        divisionWins: 5,
        divisionLosses: 1,
        divisionTies: 0,
        conferenceWins: 9,
        conferenceLosses: 4,
        conferenceTies: 0,
        pointsFor: 420 - i * 10,
        pointsAgainst: 280 + i * 10,
        streak: 'W2',
        lastFive: [],
        isEliminated: false,
        clinched: i === 0 ? 'bye' : i < 4 ? 'division' : 'playoff',
        seed: i + 1,
        magicNumber: null,
      }));

      return { afcStandings, nfcStandings, afcTeams, nfcTeams };
    }

    it('should show picks 1-18 for non-playoff teams without any playoff picks', () => {
      const { afcStandings, nfcStandings } = setupPlayoffBracket();

      // Add non-playoff teams
      const afcNonPlayoff = getTeamsByConference('AFC').slice(7, 16);
      const nfcNonPlayoff = getTeamsByConference('NFC').slice(7, 16);

      const fullAfcStandings = [
        ...afcStandings,
        ...afcNonPlayoff.map((team, i) => ({
          team,
          wins: 6 - Math.floor(i / 2),
          losses: 11 + Math.floor(i / 2),
          ties: 0,
          divisionWins: 2,
          divisionLosses: 4,
          divisionTies: 0,
          conferenceWins: 4,
          conferenceLosses: 9,
          conferenceTies: 0,
          pointsFor: 280 - i * 5,
          pointsAgainst: 340 + i * 5,
          streak: 'L1',
          lastFive: [],
          isEliminated: true,
          clinched: null,
          seed: null,
          magicNumber: null,
        })),
      ];

      const fullNfcStandings = [
        ...nfcStandings,
        ...nfcNonPlayoff.map((team, i) => ({
          team,
          wins: 7 - Math.floor(i / 2),
          losses: 10 + Math.floor(i / 2),
          ties: 0,
          divisionWins: 2,
          divisionLosses: 4,
          divisionTies: 0,
          conferenceWins: 5,
          conferenceLosses: 8,
          conferenceTies: 0,
          pointsFor: 290 - i * 5,
          pointsAgainst: 330 + i * 5,
          streak: 'L2',
          lastFive: [],
          isEliminated: true,
          clinched: null,
          seed: null,
          magicNumber: null,
        })),
      ];

      const draftOrder = calculateDraftOrder(
        fullAfcStandings,
        fullNfcStandings,
        createEmptyPlayoffPicks()
      );

      // Should only have non-playoff teams (picks 1-18)
      expect(draftOrder.length).toBe(18);
      expect(draftOrder.every(p => p.reason === 'Missed playoffs')).toBe(true);
      expect(draftOrder[0].pick).toBe(1);
      expect(draftOrder[17].pick).toBe(18);
    });

    it('should show picks 19-24 for Wild Card losers from final games', () => {
      const { afcStandings, nfcStandings, afcTeams, nfcTeams } = setupPlayoffBracket();

      // Wild Card matchups: 2v7, 3v6, 4v5 with final results
      const playoffGames: PlayoffGame[] = [
        // AFC Wild Card - higher seeds win
        createPlayoffGame('afc-wc-1', 'wildCard', 'afc', afcTeams[1], afcTeams[6], afcTeams[1].id, 'final'), // 2 beats 7
        createPlayoffGame('afc-wc-2', 'wildCard', 'afc', afcTeams[2], afcTeams[5], afcTeams[2].id, 'final'), // 3 beats 6
        createPlayoffGame('afc-wc-3', 'wildCard', 'afc', afcTeams[3], afcTeams[4], afcTeams[3].id, 'final'), // 4 beats 5
        // NFC Wild Card - higher seeds win
        createPlayoffGame('nfc-wc-1', 'wildCard', 'nfc', nfcTeams[1], nfcTeams[6], nfcTeams[1].id, 'final'), // 2 beats 7
        createPlayoffGame('nfc-wc-2', 'wildCard', 'nfc', nfcTeams[2], nfcTeams[5], nfcTeams[2].id, 'final'), // 3 beats 6
        createPlayoffGame('nfc-wc-3', 'wildCard', 'nfc', nfcTeams[3], nfcTeams[4], nfcTeams[3].id, 'final'), // 4 beats 5
      ];

      const draftOrder = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      // Should include Wild Card losers (seeds 5, 6, 7 from each conference)
      const wcLosers = draftOrder.filter(p => p.reason === 'Lost in Wild Card');
      expect(wcLosers.length).toBe(6);

      // Check picks are in range 1-6 (since no non-playoff teams included)
      wcLosers.forEach(loser => {
        expect(loser.pick).toBeGreaterThanOrEqual(1);
        expect(loser.pick).toBeLessThanOrEqual(6);
      });
    });

    it('should show Divisional losers after Wild Card final games', () => {
      const { afcStandings, nfcStandings, afcTeams, nfcTeams } = setupPlayoffBracket();

      const playoffGames: PlayoffGame[] = [
        // Wild Card
        createPlayoffGame('afc-wc-1', 'wildCard', 'afc', afcTeams[1], afcTeams[6], afcTeams[1].id, 'final'),
        createPlayoffGame('afc-wc-2', 'wildCard', 'afc', afcTeams[2], afcTeams[5], afcTeams[2].id, 'final'),
        createPlayoffGame('afc-wc-3', 'wildCard', 'afc', afcTeams[3], afcTeams[4], afcTeams[3].id, 'final'),
        createPlayoffGame('nfc-wc-1', 'wildCard', 'nfc', nfcTeams[1], nfcTeams[6], nfcTeams[1].id, 'final'),
        createPlayoffGame('nfc-wc-2', 'wildCard', 'nfc', nfcTeams[2], nfcTeams[5], nfcTeams[2].id, 'final'),
        createPlayoffGame('nfc-wc-3', 'wildCard', 'nfc', nfcTeams[3], nfcTeams[4], nfcTeams[3].id, 'final'),
        // Divisional - 1 beats lowest seed (4), 2 beats 3
        createPlayoffGame('afc-div-1', 'divisional', 'afc', afcTeams[0], afcTeams[3], afcTeams[0].id, 'final'),
        createPlayoffGame('afc-div-2', 'divisional', 'afc', afcTeams[1], afcTeams[2], afcTeams[1].id, 'final'),
        createPlayoffGame('nfc-div-1', 'divisional', 'nfc', nfcTeams[0], nfcTeams[3], nfcTeams[0].id, 'final'),
        createPlayoffGame('nfc-div-2', 'divisional', 'nfc', nfcTeams[1], nfcTeams[2], nfcTeams[1].id, 'final'),
      ];

      const draftOrder = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      const divLosers = draftOrder.filter(p => p.reason === 'Lost in Divisional');
      expect(divLosers.length).toBe(4);

      // Divisional losers are seeds 3 and 4 (index 2 and 3) from each conference
      const divLoserIds = divLosers.map(l => l.team.id);
      expect(divLoserIds).toContain(afcTeams[2].id);
      expect(divLoserIds).toContain(afcTeams[3].id);
      expect(divLoserIds).toContain(nfcTeams[2].id);
      expect(divLoserIds).toContain(nfcTeams[3].id);
    });

    it('should show Conference Championship losers after CCG final games', () => {
      const { afcStandings, nfcStandings, afcTeams, nfcTeams } = setupPlayoffBracket();

      const playoffGames: PlayoffGame[] = [
        // Wild Card
        createPlayoffGame('afc-wc-1', 'wildCard', 'afc', afcTeams[1], afcTeams[6], afcTeams[1].id, 'final'),
        createPlayoffGame('afc-wc-2', 'wildCard', 'afc', afcTeams[2], afcTeams[5], afcTeams[2].id, 'final'),
        createPlayoffGame('afc-wc-3', 'wildCard', 'afc', afcTeams[3], afcTeams[4], afcTeams[3].id, 'final'),
        createPlayoffGame('nfc-wc-1', 'wildCard', 'nfc', nfcTeams[1], nfcTeams[6], nfcTeams[1].id, 'final'),
        createPlayoffGame('nfc-wc-2', 'wildCard', 'nfc', nfcTeams[2], nfcTeams[5], nfcTeams[2].id, 'final'),
        createPlayoffGame('nfc-wc-3', 'wildCard', 'nfc', nfcTeams[3], nfcTeams[4], nfcTeams[3].id, 'final'),
        // Divisional
        createPlayoffGame('afc-div-1', 'divisional', 'afc', afcTeams[0], afcTeams[3], afcTeams[0].id, 'final'),
        createPlayoffGame('afc-div-2', 'divisional', 'afc', afcTeams[1], afcTeams[2], afcTeams[1].id, 'final'),
        createPlayoffGame('nfc-div-1', 'divisional', 'nfc', nfcTeams[0], nfcTeams[3], nfcTeams[0].id, 'final'),
        createPlayoffGame('nfc-div-2', 'divisional', 'nfc', nfcTeams[1], nfcTeams[2], nfcTeams[1].id, 'final'),
        // Conference Championship - 1 beats 2
        createPlayoffGame('afc-ccg', 'championship', 'afc', afcTeams[0], afcTeams[1], afcTeams[0].id, 'final'),
        createPlayoffGame('nfc-ccg', 'championship', 'nfc', nfcTeams[0], nfcTeams[1], nfcTeams[0].id, 'final'),
      ];

      const draftOrder = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      const ccgLosers = draftOrder.filter(p => p.reason === 'Lost in Conference Championship');
      expect(ccgLosers.length).toBe(2);

      // CCG losers are seed 2 (index 1) from each conference
      const ccgLoserIds = ccgLosers.map(l => l.team.id);
      expect(ccgLoserIds).toContain(afcTeams[1].id);
      expect(ccgLoserIds).toContain(nfcTeams[1].id);
    });

    it('should show Super Bowl winner and loser after Super Bowl final', () => {
      const { afcStandings, nfcStandings, afcTeams, nfcTeams } = setupPlayoffBracket();

      const playoffGames: PlayoffGame[] = [
        // Wild Card
        createPlayoffGame('afc-wc-1', 'wildCard', 'afc', afcTeams[1], afcTeams[6], afcTeams[1].id, 'final'),
        createPlayoffGame('afc-wc-2', 'wildCard', 'afc', afcTeams[2], afcTeams[5], afcTeams[2].id, 'final'),
        createPlayoffGame('afc-wc-3', 'wildCard', 'afc', afcTeams[3], afcTeams[4], afcTeams[3].id, 'final'),
        createPlayoffGame('nfc-wc-1', 'wildCard', 'nfc', nfcTeams[1], nfcTeams[6], nfcTeams[1].id, 'final'),
        createPlayoffGame('nfc-wc-2', 'wildCard', 'nfc', nfcTeams[2], nfcTeams[5], nfcTeams[2].id, 'final'),
        createPlayoffGame('nfc-wc-3', 'wildCard', 'nfc', nfcTeams[3], nfcTeams[4], nfcTeams[3].id, 'final'),
        // Divisional
        createPlayoffGame('afc-div-1', 'divisional', 'afc', afcTeams[0], afcTeams[3], afcTeams[0].id, 'final'),
        createPlayoffGame('afc-div-2', 'divisional', 'afc', afcTeams[1], afcTeams[2], afcTeams[1].id, 'final'),
        createPlayoffGame('nfc-div-1', 'divisional', 'nfc', nfcTeams[0], nfcTeams[3], nfcTeams[0].id, 'final'),
        createPlayoffGame('nfc-div-2', 'divisional', 'nfc', nfcTeams[1], nfcTeams[2], nfcTeams[1].id, 'final'),
        // Conference Championship
        createPlayoffGame('afc-ccg', 'championship', 'afc', afcTeams[0], afcTeams[1], afcTeams[0].id, 'final'),
        createPlayoffGame('nfc-ccg', 'championship', 'nfc', nfcTeams[0], nfcTeams[1], nfcTeams[0].id, 'final'),
        // Super Bowl - AFC wins
        createPlayoffGame('sb', 'superBowl', null, afcTeams[0], nfcTeams[0], afcTeams[0].id, 'final'),
      ];

      const draftOrder = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      const sbLoser = draftOrder.find(p => p.reason === 'Lost Super Bowl');
      const sbWinner = draftOrder.find(p => p.reason === 'Won Super Bowl');

      expect(sbLoser).toBeDefined();
      expect(sbWinner).toBeDefined();
      expect(sbWinner?.team.id).toBe(afcTeams[0].id);
      expect(sbLoser?.team.id).toBe(nfcTeams[0].id);
    });

    it('should complete 14-pick order for playoff teams when all games decided', () => {
      const { afcStandings, nfcStandings, afcTeams, nfcTeams } = setupPlayoffBracket();

      const playoffGames: PlayoffGame[] = [
        // Wild Card
        createPlayoffGame('afc-wc-1', 'wildCard', 'afc', afcTeams[1], afcTeams[6], afcTeams[1].id, 'final'),
        createPlayoffGame('afc-wc-2', 'wildCard', 'afc', afcTeams[2], afcTeams[5], afcTeams[2].id, 'final'),
        createPlayoffGame('afc-wc-3', 'wildCard', 'afc', afcTeams[3], afcTeams[4], afcTeams[3].id, 'final'),
        createPlayoffGame('nfc-wc-1', 'wildCard', 'nfc', nfcTeams[1], nfcTeams[6], nfcTeams[1].id, 'final'),
        createPlayoffGame('nfc-wc-2', 'wildCard', 'nfc', nfcTeams[2], nfcTeams[5], nfcTeams[2].id, 'final'),
        createPlayoffGame('nfc-wc-3', 'wildCard', 'nfc', nfcTeams[3], nfcTeams[4], nfcTeams[3].id, 'final'),
        // Divisional
        createPlayoffGame('afc-div-1', 'divisional', 'afc', afcTeams[0], afcTeams[3], afcTeams[0].id, 'final'),
        createPlayoffGame('afc-div-2', 'divisional', 'afc', afcTeams[1], afcTeams[2], afcTeams[1].id, 'final'),
        createPlayoffGame('nfc-div-1', 'divisional', 'nfc', nfcTeams[0], nfcTeams[3], nfcTeams[0].id, 'final'),
        createPlayoffGame('nfc-div-2', 'divisional', 'nfc', nfcTeams[1], nfcTeams[2], nfcTeams[1].id, 'final'),
        // Conference Championship
        createPlayoffGame('afc-ccg', 'championship', 'afc', afcTeams[0], afcTeams[1], afcTeams[0].id, 'final'),
        createPlayoffGame('nfc-ccg', 'championship', 'nfc', nfcTeams[0], nfcTeams[1], nfcTeams[0].id, 'final'),
        // Super Bowl
        createPlayoffGame('sb', 'superBowl', null, afcTeams[0], nfcTeams[0], afcTeams[0].id, 'final'),
      ];

      const draftOrder = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      // 14 playoff teams (7 per conference)
      expect(draftOrder.length).toBe(14);
      expect(draftOrder[0].pick).toBe(1);
      expect(draftOrder[13].pick).toBe(14);

      // Verify pick distribution
      const wcLosers = draftOrder.filter(p => p.reason === 'Lost in Wild Card');
      const divLosers = draftOrder.filter(p => p.reason === 'Lost in Divisional');
      const ccgLosers = draftOrder.filter(p => p.reason === 'Lost in Conference Championship');
      const sbLoser = draftOrder.filter(p => p.reason === 'Lost Super Bowl');
      const sbWinner = draftOrder.filter(p => p.reason === 'Won Super Bowl');

      expect(wcLosers.length).toBe(6);
      expect(divLosers.length).toBe(4);
      expect(ccgLosers.length).toBe(2);
      expect(sbLoser.length).toBe(1);
      expect(sbWinner.length).toBe(1);
    });

    it('should handle partial bracket with mix of final and scheduled games', () => {
      const { afcStandings, nfcStandings, afcTeams, nfcTeams } = setupPlayoffBracket();

      // Some Wild Card games are final, some are scheduled
      const playoffGames: PlayoffGame[] = [
        // AFC Wild Card - 2 final, 1 scheduled
        createPlayoffGame('afc-wc-1', 'wildCard', 'afc', afcTeams[1], afcTeams[6], afcTeams[1].id, 'final'),
        createPlayoffGame('afc-wc-2', 'wildCard', 'afc', afcTeams[2], afcTeams[5], afcTeams[2].id, 'final'),
        createPlayoffGame('afc-wc-3', 'wildCard', 'afc', afcTeams[3], afcTeams[4], null, 'scheduled'),
        // NFC Wild Card - all final
        createPlayoffGame('nfc-wc-1', 'wildCard', 'nfc', nfcTeams[1], nfcTeams[6], nfcTeams[1].id, 'final'),
        createPlayoffGame('nfc-wc-2', 'wildCard', 'nfc', nfcTeams[2], nfcTeams[5], nfcTeams[2].id, 'final'),
        createPlayoffGame('nfc-wc-3', 'wildCard', 'nfc', nfcTeams[3], nfcTeams[4], nfcTeams[3].id, 'final'),
      ];

      // User picks the scheduled game
      const playoffPicks: PlayoffPicks = {
        afc: {
          wildCard: [null, null, afcTeams[3].id], // Only pick for scheduled game
          divisional: [null, null],
          championship: null,
        },
        nfc: {
          wildCard: [null, null, null], // All games already final
          divisional: [null, null],
          championship: null,
        },
        superBowl: null,
      };

      const draftOrder = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        playoffPicks,
        playoffGames
      );

      // Should have 6 Wild Card losers (3 from final games + 3 from user picks)
      const wcLosers = draftOrder.filter(p => p.reason === 'Lost in Wild Card');
      expect(wcLosers.length).toBe(6);
    });
  });

  describe('Draft Order Flow', () => {
    function createFullStandings() {
      const afcTeams = getTeamsByConference('AFC');
      const nfcTeams = getTeamsByConference('NFC');

      const createStanding = (team: Team, i: number, isPlayoff: boolean): TeamStanding => ({
        team,
        wins: isPlayoff ? 12 - i : 6 - Math.floor(i / 2),
        losses: isPlayoff ? 5 + i : 11 + Math.floor(i / 2),
        ties: 0,
        divisionWins: isPlayoff ? 4 : 2,
        divisionLosses: isPlayoff ? 2 : 4,
        divisionTies: 0,
        conferenceWins: isPlayoff ? 8 : 4,
        conferenceLosses: isPlayoff ? 5 : 9,
        conferenceTies: 0,
        pointsFor: isPlayoff ? 400 - i * 10 : 280 - i * 5,
        pointsAgainst: isPlayoff ? 300 + i * 10 : 340 + i * 5,
        streak: isPlayoff ? 'W1' : 'L1',
        lastFive: [],
        isEliminated: !isPlayoff,
        clinched: isPlayoff ? (i === 0 ? 'bye' : i < 4 ? 'division' : 'playoff') : null,
        seed: isPlayoff ? i + 1 : null,
        magicNumber: null,
      });

      const afcStandings = afcTeams.map((team, i) =>
        createStanding(team, i < 7 ? i : i - 7, i < 7)
      );
      const nfcStandings = nfcTeams.map((team, i) =>
        createStanding(team, i < 7 ? i : i - 7, i < 7)
      );

      return { afcStandings, nfcStandings, afcTeams, nfcTeams };
    }

    it('should provide non-playoff picks after regular season (no playoff picks needed)', () => {
      const { afcStandings, nfcStandings } = createFullStandings();

      const draftOrder = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks()
      );

      // Only non-playoff teams should be available
      expect(draftOrder.length).toBe(18);
      expect(draftOrder.every(p => p.reason === 'Missed playoffs')).toBe(true);
    });

    it('should progressively unlock picks as rounds complete', () => {
      const { afcStandings, nfcStandings, afcTeams, nfcTeams } = createFullStandings();

      // Stage 1: No playoff games
      const picks0 = calculateDraftOrder(
        afcStandings, nfcStandings, createEmptyPlayoffPicks(), []
      );
      expect(picks0.length).toBe(18);

      // Stage 2: Wild Card complete (using final games)
      const wcGames: PlayoffGame[] = [
        createPlayoffGame('afc-wc-1', 'wildCard', 'afc', afcTeams[1], afcTeams[6], afcTeams[1].id, 'final'),
        createPlayoffGame('afc-wc-2', 'wildCard', 'afc', afcTeams[2], afcTeams[5], afcTeams[2].id, 'final'),
        createPlayoffGame('afc-wc-3', 'wildCard', 'afc', afcTeams[3], afcTeams[4], afcTeams[3].id, 'final'),
        createPlayoffGame('nfc-wc-1', 'wildCard', 'nfc', nfcTeams[1], nfcTeams[6], nfcTeams[1].id, 'final'),
        createPlayoffGame('nfc-wc-2', 'wildCard', 'nfc', nfcTeams[2], nfcTeams[5], nfcTeams[2].id, 'final'),
        createPlayoffGame('nfc-wc-3', 'wildCard', 'nfc', nfcTeams[3], nfcTeams[4], nfcTeams[3].id, 'final'),
      ];
      const picks1 = calculateDraftOrder(afcStandings, nfcStandings, createEmptyPlayoffPicks(), wcGames);
      expect(picks1.length).toBe(24); // 18 + 6 WC losers

      // Stage 3: Divisional complete
      const divGames: PlayoffGame[] = [
        ...wcGames,
        createPlayoffGame('afc-div-1', 'divisional', 'afc', afcTeams[0], afcTeams[3], afcTeams[0].id, 'final'),
        createPlayoffGame('afc-div-2', 'divisional', 'afc', afcTeams[1], afcTeams[2], afcTeams[1].id, 'final'),
        createPlayoffGame('nfc-div-1', 'divisional', 'nfc', nfcTeams[0], nfcTeams[3], nfcTeams[0].id, 'final'),
        createPlayoffGame('nfc-div-2', 'divisional', 'nfc', nfcTeams[1], nfcTeams[2], nfcTeams[1].id, 'final'),
      ];
      const picks2 = calculateDraftOrder(afcStandings, nfcStandings, createEmptyPlayoffPicks(), divGames);
      expect(picks2.length).toBe(28); // 24 + 4 DIV losers

      // Stage 4: Conference Championship complete
      const ccgGames: PlayoffGame[] = [
        ...divGames,
        createPlayoffGame('afc-ccg', 'championship', 'afc', afcTeams[0], afcTeams[1], afcTeams[0].id, 'final'),
        createPlayoffGame('nfc-ccg', 'championship', 'nfc', nfcTeams[0], nfcTeams[1], nfcTeams[0].id, 'final'),
      ];
      const picks3 = calculateDraftOrder(afcStandings, nfcStandings, createEmptyPlayoffPicks(), ccgGames);
      expect(picks3.length).toBe(30); // 28 + 2 CCG losers

      // Stage 5: Super Bowl complete
      const sbGames: PlayoffGame[] = [
        ...ccgGames,
        createPlayoffGame('sb', 'superBowl', null, afcTeams[0], nfcTeams[0], afcTeams[0].id, 'final'),
      ];
      const picks4 = calculateDraftOrder(afcStandings, nfcStandings, createEmptyPlayoffPicks(), sbGames);
      expect(picks4.length).toBe(32); // Complete
    });
  });

  describe('Real Game Data Integration', () => {
    it('should use final game results over user selections', () => {
      const team1 = teams.find(t => t.id === '1')!;
      const team2 = teams.find(t => t.id === '2')!;

      const games: Game[] = [
        createGame('g1', team1, team2, 28, 17, 'final'), // team1 wins (final)
      ];

      // User selection says team2 wins (away)
      const selections: Record<string, GameSelection> = {
        'g1': 'away',
      };

      const recordsMap = calculateTeamRecords([team1, team2], games, selections);

      const team1Record = recordsMap.get('1');
      const team2Record = recordsMap.get('2');

      // Final result should override selection
      expect(team1Record?.wins).toBe(1);
      expect(team1Record?.losses).toBe(0);
      expect(team2Record?.wins).toBe(0);
      expect(team2Record?.losses).toBe(1);
    });

    it('should handle mix of final games and selections', () => {
      const team1 = teams.find(t => t.id === '1')!;
      const team2 = teams.find(t => t.id === '2')!;
      const team3 = teams.find(t => t.id === '3')!;

      const games: Game[] = [
        createGame('g1', team1, team2, 28, 17, 'final', 1), // Final: team1 wins
        createGame('g2', team1, team3, null, null, 'scheduled', 2), // Scheduled
        createGame('g3', team2, team3, null, null, 'scheduled', 3), // Scheduled
      ];

      const selections: Record<string, GameSelection> = {
        'g2': 'away', // team3 wins
        'g3': 'home', // team2 wins
      };

      const recordsMap = calculateTeamRecords([team1, team2, team3], games, selections);

      expect(recordsMap.get('1')?.wins).toBe(1); // 1 win from final
      expect(recordsMap.get('1')?.losses).toBe(1); // 1 loss from selection
      expect(recordsMap.get('2')?.wins).toBe(1); // 1 win from selection
      expect(recordsMap.get('2')?.losses).toBe(1); // 1 loss from final
      expect(recordsMap.get('3')?.wins).toBe(1); // 1 win from selection
      expect(recordsMap.get('3')?.losses).toBe(1); // 1 loss from selection
    });
  });

  describe('Performance Tests', () => {
    it('should calculate standings in under 100ms', () => {
      const allTeams = teams;
      const games = generateFullSeasonSchedule(allTeams);
      const selections = generateDeterministicSelections(games);

      const startTime = performance.now();

      calculatePlayoffSeedings('AFC', allTeams, games, selections);
      calculatePlayoffSeedings('NFC', allTeams, games, selections);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should calculate draft order in under 100ms', () => {
      const allTeams = teams;
      const games = generateFullSeasonSchedule(allTeams);
      const selections = generateDeterministicSelections(games);

      const afcStandings = calculatePlayoffSeedings('AFC', allTeams, games, selections);
      const nfcStandings = calculatePlayoffSeedings('NFC', allTeams, games, selections);

      const playoffPicks: PlayoffPicks = {
        afc: {
          wildCard: [afcStandings[1]?.team.id || null, afcStandings[2]?.team.id || null, afcStandings[3]?.team.id || null],
          divisional: [afcStandings[0]?.team.id || null, afcStandings[1]?.team.id || null],
          championship: afcStandings[0]?.team.id || null,
        },
        nfc: {
          wildCard: [nfcStandings[1]?.team.id || null, nfcStandings[2]?.team.id || null, nfcStandings[3]?.team.id || null],
          divisional: [nfcStandings[0]?.team.id || null, nfcStandings[1]?.team.id || null],
          championship: nfcStandings[0]?.team.id || null,
        },
        superBowl: afcStandings[0]?.team.id || null,
      };

      const startTime = performance.now();

      calculateDraftOrder(afcStandings, nfcStandings, playoffPicks, [], games);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should handle repeated calculations without memory issues', () => {
      const allTeams = teams;
      const games = generateFullSeasonSchedule(allTeams);

      // Run multiple times with different selections
      for (let i = 0; i < 50; i++) {
        const selections = generateRandomSelections(games, i * 1000);
        calculatePlayoffSeedings('AFC', allTeams, games, selections);
        calculatePlayoffSeedings('NFC', allTeams, games, selections);
      }

      // If we get here without error, no memory issues
      expect(true).toBe(true);
    });

    it('should handle 272+ games efficiently', () => {
      const allTeams = teams;

      // Create a schedule with 272+ games (real NFL season has 272)
      const games: Game[] = [];
      let gameId = 1;

      // Generate 17 weeks of 16 games each = 272 games
      for (let week = 1; week <= 17; week++) {
        for (let gameNum = 0; gameNum < 16; gameNum++) {
          const homeTeamIndex = (week * 16 + gameNum) % 32;
          const awayTeamIndex = (homeTeamIndex + 1 + gameNum) % 32;

          games.push(createGame(
            `g${gameId++}`,
            allTeams[homeTeamIndex],
            allTeams[awayTeamIndex],
            null,
            null,
            'scheduled',
            week
          ));
        }
      }

      expect(games.length).toBeGreaterThanOrEqual(272);

      const selections = generateDeterministicSelections(games);

      const startTime = performance.now();

      calculatePlayoffSeedings('AFC', allTeams, games, selections);
      calculatePlayoffSeedings('NFC', allTeams, games, selections);

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200); // 200ms for full season
    });
  });
});
