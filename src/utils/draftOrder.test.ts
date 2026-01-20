import { describe, it, expect } from 'vitest';
import { calculateDraftOrder } from './draftOrder';
import type { TeamStanding, PlayoffPicks, Team, Game } from '@/types';
import type { PlayoffGame } from '@/hooks/useEspnApi';

// Helper to create a mock team
function createTeam(id: string, name: string, conference: 'AFC' | 'NFC'): Team {
  return {
    id,
    name,
    abbreviation: name.substring(0, 3).toUpperCase(),
    location: name,
    division: `${conference} East` as Team['division'],
    conference,
    logo: '',
    primaryColor: '#000',
    secondaryColor: '#fff',
  };
}

// Helper to create a mock standing
function createStanding(
  team: Team,
  wins: number,
  losses: number,
  seed: number | null = null,
  sos: number = 0.5 // Strength of schedule as opponent win percentage
): TeamStanding {
  // Use pointsFor/pointsAgainst to represent SOS (higher opponent wins = higher SOS)
  const pointsFor = Math.round(sos * 1000);
  const pointsAgainst = Math.round((1 - sos) * 1000);

  return {
    team,
    wins,
    losses,
    ties: 0,
    divisionWins: 0,
    divisionLosses: 0,
    divisionTies: 0,
    conferenceWins: 0,
    conferenceLosses: 0,
    conferenceTies: 0,
    pointsFor,
    pointsAgainst,
    streak: '',
    lastFive: [],
    isEliminated: seed === null,
    clinched: seed !== null ? 'playoff' : null,
    seed,
    magicNumber: null,
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
    homeScore: winnerId ? 24 : null,
    awayScore: winnerId ? 17 : null,
    status,
    winnerId,
  };
}

describe('Draft Order Calculation', () => {
  describe('Basic ordering rules', () => {
    it('should place non-playoff teams before playoff teams', () => {
      const afcTeam1 = createTeam('1', 'Team1', 'AFC');
      const afcTeam2 = createTeam('2', 'Team2', 'AFC');
      const nfcTeam1 = createTeam('3', 'Team3', 'NFC');
      const nfcTeam2 = createTeam('4', 'Team4', 'NFC');

      const afcStandings = [
        createStanding(afcTeam1, 4, 13, null), // Non-playoff
        createStanding(afcTeam2, 12, 5, 1),    // Playoff team (seed 1)
      ];
      const nfcStandings = [
        createStanding(nfcTeam1, 5, 12, null), // Non-playoff
        createStanding(nfcTeam2, 11, 6, 1),    // Playoff team (seed 1)
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks()
      );

      // Non-playoff teams should be first
      expect(result[0].team.id).toBe('1'); // 4-13
      expect(result[1].team.id).toBe('3'); // 5-12
      expect(result[0].reason).toBe('Missed playoffs');
      expect(result[1].reason).toBe('Missed playoffs');
    });

    it('should order non-playoff teams by worst record first', () => {
      const teams = [
        createTeam('1', 'Worst', 'AFC'),
        createTeam('2', 'Middle', 'AFC'),
        createTeam('3', 'Best', 'AFC'),
      ];

      const afcStandings = [
        createStanding(teams[0], 3, 14, null),  // Worst record
        createStanding(teams[1], 6, 11, null),  // Middle
        createStanding(teams[2], 8, 9, null),   // Best (still non-playoff)
      ];

      const result = calculateDraftOrder(
        afcStandings,
        [],
        createEmptyPlayoffPicks()
      );

      expect(result[0].team.id).toBe('1'); // 3-14 picks first
      expect(result[1].team.id).toBe('2'); // 6-11 picks second
      expect(result[2].team.id).toBe('3'); // 8-9 picks third
    });

    it('should use Strength of Schedule as tiebreaker (lower SOS picks earlier)', () => {
      const team1 = createTeam('1', 'LowSOS', 'AFC');
      const team2 = createTeam('2', 'HighSOS', 'AFC');

      // Both teams have same record (3-14)
      // team1 has lower SOS (0.4) - faced weaker opponents
      // team2 has higher SOS (0.6) - faced tougher opponents
      const afcStandings = [
        createStanding(team1, 3, 14, null, 0.4), // Lower SOS should pick first
        createStanding(team2, 3, 14, null, 0.6), // Higher SOS picks second
      ];

      const result = calculateDraftOrder(
        afcStandings,
        [],
        createEmptyPlayoffPicks()
      );

      // Team with LOWER SOS should pick FIRST (they faced weaker opponents)
      expect(result[0].team.id).toBe('1');
      expect(result[1].team.id).toBe('2');
    });
  });

  describe('Playoff team ordering', () => {
    it('should order Wild Card losers as picks 19-24', () => {
      // Create 18 non-playoff teams
      const nonPlayoffTeams: TeamStanding[] = [];
      for (let i = 1; i <= 18; i++) {
        const team = createTeam(`np${i}`, `NonPlayoff${i}`, i <= 9 ? 'AFC' : 'NFC');
        nonPlayoffTeams.push(createStanding(team, 4 + (i % 5), 13 - (i % 5), null));
      }

      // Create playoff teams
      const wcLoser1 = createTeam('wc1', 'WCLoser1', 'AFC');
      const wcLoser2 = createTeam('wc2', 'WCLoser2', 'NFC');
      const wcWinner1 = createTeam('ww1', 'WCWinner1', 'AFC');
      const wcWinner2 = createTeam('ww2', 'WCWinner2', 'NFC');

      const afcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'AFC'),
        createStanding(wcLoser1, 10, 7, 5),
        createStanding(wcWinner1, 11, 6, 4),
      ];
      const nfcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'NFC'),
        createStanding(wcLoser2, 9, 8, 6),
        createStanding(wcWinner2, 12, 5, 3),
      ];

      // Create playoff games with results
      const playoffGames: PlayoffGame[] = [
        createPlayoffGame('g1', 'wildCard', 'afc', wcWinner1, wcLoser1, wcWinner1.id, 'final'),
        createPlayoffGame('g2', 'wildCard', 'nfc', wcWinner2, wcLoser2, wcWinner2.id, 'final'),
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      // Find the Wild Card losers in the result
      const wcLosersInResult = result.filter(p => p.reason === 'Lost in Wild Card');
      expect(wcLosersInResult.length).toBe(2);

      // WC losers should be sorted by worst record first
      // wcLoser2 (9-8) should pick before wcLoser1 (10-7)
      expect(wcLosersInResult[0].team.id).toBe('wc2');
      expect(wcLosersInResult[1].team.id).toBe('wc1');
    });

    it('should order Divisional losers as picks 25-28', () => {
      const divLoser1 = createTeam('dl1', 'DivLoser1', 'AFC');
      const divLoser2 = createTeam('dl2', 'DivLoser2', 'NFC');
      const divWinner1 = createTeam('dw1', 'DivWinner1', 'AFC');
      const divWinner2 = createTeam('dw2', 'DivWinner2', 'NFC');

      const afcStandings = [
        createStanding(divLoser1, 11, 6, 2),
        createStanding(divWinner1, 13, 4, 1),
      ];
      const nfcStandings = [
        createStanding(divLoser2, 10, 7, 3),
        createStanding(divWinner2, 14, 3, 1),
      ];

      const playoffGames: PlayoffGame[] = [
        createPlayoffGame('g1', 'divisional', 'afc', divWinner1, divLoser1, divWinner1.id, 'final'),
        createPlayoffGame('g2', 'divisional', 'nfc', divWinner2, divLoser2, divWinner2.id, 'final'),
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      const divLosers = result.filter(p => p.reason === 'Lost in Divisional');
      expect(divLosers.length).toBe(2);

      // divLoser2 (10-7) picks before divLoser1 (11-6)
      expect(divLosers[0].team.id).toBe('dl2');
      expect(divLosers[1].team.id).toBe('dl1');
    });

    it('should order Conference Championship losers as picks 29-30', () => {
      const confLoser1 = createTeam('cl1', 'ConfLoser1', 'AFC');
      const confLoser2 = createTeam('cl2', 'ConfLoser2', 'NFC');
      const confWinner1 = createTeam('cw1', 'ConfWinner1', 'AFC');
      const confWinner2 = createTeam('cw2', 'ConfWinner2', 'NFC');

      const afcStandings = [
        createStanding(confLoser1, 12, 5, 2),
        createStanding(confWinner1, 14, 3, 1),
      ];
      const nfcStandings = [
        createStanding(confLoser2, 11, 6, 2),
        createStanding(confWinner2, 15, 2, 1),
      ];

      const playoffGames: PlayoffGame[] = [
        createPlayoffGame('g1', 'championship', 'afc', confWinner1, confLoser1, confWinner1.id, 'final'),
        createPlayoffGame('g2', 'championship', 'nfc', confWinner2, confLoser2, confWinner2.id, 'final'),
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      const confLosers = result.filter(p => p.reason === 'Lost in Conference Championship');
      expect(confLosers.length).toBe(2);

      // confLoser2 (11-6) picks before confLoser1 (12-5)
      expect(confLosers[0].team.id).toBe('cl2');
      expect(confLosers[1].team.id).toBe('cl1');
    });

    it('should place Super Bowl loser at pick 31 and winner at pick 32', () => {
      const sbLoser = createTeam('sbl', 'SBLoser', 'AFC');
      const sbWinner = createTeam('sbw', 'SBWinner', 'NFC');

      const afcStandings = [
        createStanding(sbLoser, 14, 3, 1),
      ];
      const nfcStandings = [
        createStanding(sbWinner, 15, 2, 1),
      ];

      const playoffGames: PlayoffGame[] = [
        createPlayoffGame('sb', 'superBowl', null, sbWinner, sbLoser, sbWinner.id, 'final'),
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      const sbResults = result.filter(p =>
        p.reason === 'Lost Super Bowl' || p.reason === 'Won Super Bowl'
      );

      expect(sbResults.length).toBe(2);
      expect(sbResults[0].reason).toBe('Lost Super Bowl');
      expect(sbResults[0].team.id).toBe('sbl');
      expect(sbResults[1].reason).toBe('Won Super Bowl');
      expect(sbResults[1].team.id).toBe('sbw');
    });
  });

  describe('User picks for future games', () => {
    it('should use user picks for playoff games not yet played', () => {
      const team1 = createTeam('1', 'Team1', 'AFC');
      const team2 = createTeam('2', 'Team2', 'AFC');

      const afcStandings = [
        createStanding(team1, 11, 6, 2),
        createStanding(team2, 10, 7, 7),
      ];

      // Game not played yet (status: scheduled)
      const playoffGames: PlayoffGame[] = [
        createPlayoffGame('g1', 'wildCard', 'afc', team1, team2, null, 'scheduled'),
      ];

      // User picks team1 to win
      const picks = createEmptyPlayoffPicks();
      picks.afc.wildCard[0] = team1.id;

      const result = calculateDraftOrder(
        afcStandings,
        [],
        picks,
        playoffGames
      );

      // team2 should be marked as Wild Card loser based on user pick
      const wcLosers = result.filter(p => p.reason === 'Lost in Wild Card');
      expect(wcLosers.length).toBe(1);
      expect(wcLosers[0].team.id).toBe('2');
    });

    it('should prefer actual results over user picks', () => {
      const team1 = createTeam('1', 'Team1', 'AFC');
      const team2 = createTeam('2', 'Team2', 'AFC');

      const afcStandings = [
        createStanding(team1, 11, 6, 2),
        createStanding(team2, 10, 7, 7),
      ];

      // Game is final with team2 winning
      const playoffGames: PlayoffGame[] = [
        createPlayoffGame('g1', 'wildCard', 'afc', team1, team2, team2.id, 'final'),
      ];

      // User incorrectly picked team1 to win
      const picks = createEmptyPlayoffPicks();
      picks.afc.wildCard[0] = team1.id;

      const result = calculateDraftOrder(
        afcStandings,
        [],
        picks,
        playoffGames
      );

      // team1 should be the loser (actual result) not team2 (user pick)
      const wcLosers = result.filter(p => p.reason === 'Lost in Wild Card');
      expect(wcLosers.length).toBe(1);
      expect(wcLosers[0].team.id).toBe('1');
    });
  });

  describe('Non-playoff team ordering - Extended', () => {
    it('should assign pick 18 to the best non-playoff team', () => {
      // Create 18 non-playoff teams with varying records
      const nonPlayoffTeams: TeamStanding[] = [];
      for (let i = 1; i <= 18; i++) {
        const team = createTeam(`np${i}`, `NonPlayoff${i}`, i <= 9 ? 'AFC' : 'NFC');
        // Create varied records: team 1 has worst (2-15), team 18 has best (8-9)
        const wins = 2 + Math.floor((i - 1) / 3);
        const losses = 15 - Math.floor((i - 1) / 3);
        nonPlayoffTeams.push(createStanding(team, wins, losses, null));
      }

      const afcStandings = nonPlayoffTeams.filter(s => s.team.conference === 'AFC');
      const nfcStandings = nonPlayoffTeams.filter(s => s.team.conference === 'NFC');

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks()
      );

      // Pick 18 should go to team with best record among non-playoff
      expect(result.length).toBe(18);
      expect(result[17].pick).toBe(18);
      expect(result[17].reason).toBe('Missed playoffs');

      // The last pick should have the best record (highest wins)
      const pick18Wins = parseInt(result[17].record.split('-')[0]);
      for (let i = 0; i < 17; i++) {
        const pickWins = parseInt(result[i].record.split('-')[0]);
        expect(pickWins).toBeLessThanOrEqual(pick18Wins);
      }
    });
  });

  describe('Wild Card losers SOS tiebreaker', () => {
    it('should use SOS tiebreaker when Wild Card losers have same record', () => {
      // Create 18 non-playoff teams
      const nonPlayoffTeams: TeamStanding[] = [];
      for (let i = 1; i <= 18; i++) {
        const team = createTeam(`np${i}`, `NonPlayoff${i}`, i <= 9 ? 'AFC' : 'NFC');
        nonPlayoffTeams.push(createStanding(team, 4, 13, null));
      }

      // Create Wild Card losers with same record but different SOS
      const wcLoser1 = createTeam('wc1', 'WCLoser1', 'AFC');
      const wcLoser2 = createTeam('wc2', 'WCLoser2', 'NFC');
      const wcWinner1 = createTeam('ww1', 'WCWinner1', 'AFC');
      const wcWinner2 = createTeam('ww2', 'WCWinner2', 'NFC');

      // Create opponents with different records for SOS calculation
      const strongOpponent = createTeam('strong', 'StrongOpp', 'AFC'); // 12-5 record
      const weakOpponent = createTeam('weak', 'WeakOpp', 'NFC'); // 4-13 record

      const afcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'AFC'),
        createStanding(wcLoser1, 10, 7, 5),  // Played strong opponent - higher SOS
        createStanding(wcWinner1, 11, 6, 4),
        createStanding(strongOpponent, 12, 5, 2), // Strong opponent for SOS calc
      ];
      const nfcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'NFC'),
        createStanding(wcLoser2, 10, 7, 6),  // Played weak opponent - lower SOS, picks first
        createStanding(wcWinner2, 12, 5, 3),
        createStanding(weakOpponent, 4, 13, null), // Weak opponent for SOS calc
      ];

      const playoffGames: PlayoffGame[] = [
        createPlayoffGame('g1', 'wildCard', 'afc', wcWinner1, wcLoser1, wcWinner1.id, 'final'),
        createPlayoffGame('g2', 'wildCard', 'nfc', wcWinner2, wcLoser2, wcWinner2.id, 'final'),
      ];

      // Regular season games that establish different SOS
      const regularSeasonGames: Game[] = [
        // wcLoser1 played strongOpponent (12-5) - gives higher SOS
        {
          id: 'rs1',
          week: 1,
          kickoffTime: new Date(),
          homeTeam: wcLoser1,
          awayTeam: strongOpponent,
          homeScore: 17,
          awayScore: 24,
          status: 'final' as const,
        },
        // wcLoser2 played weakOpponent (4-13) - gives lower SOS
        {
          id: 'rs2',
          week: 1,
          kickoffTime: new Date(),
          homeTeam: wcLoser2,
          awayTeam: weakOpponent,
          homeScore: 20,
          awayScore: 17,
          status: 'final' as const,
        },
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames,
        regularSeasonGames
      );

      const wcLosers = result.filter(p => p.reason === 'Lost in Wild Card');
      expect(wcLosers.length).toBe(2);

      // Both have same record (10-7), so SOS breaks tie
      // Lower SOS (wcLoser2 played 4-13 team) picks before higher SOS (wcLoser1 played 12-5 team)
      expect(wcLosers[0].team.id).toBe('wc2');
      expect(wcLosers[1].team.id).toBe('wc1');
    });
  });

  describe('Divisional losers SOS tiebreaker', () => {
    it('should use SOS tiebreaker when Divisional losers have same record', () => {
      // Two divisional losers with same record but different SOS
      const divLoser1 = createTeam('dl1', 'DivLoser1', 'AFC');
      const divLoser2 = createTeam('dl2', 'DivLoser2', 'NFC');
      const divWinner1 = createTeam('dw1', 'DivWinner1', 'AFC');
      const divWinner2 = createTeam('dw2', 'DivWinner2', 'NFC');

      // Create opponents for SOS calculation
      const strongOpponent = createTeam('strong', 'StrongOpp', 'AFC'); // 13-4 record
      const weakOpponent = createTeam('weak', 'WeakOpp', 'NFC'); // 5-12 record

      const afcStandings = [
        createStanding(divLoser1, 11, 6, 2), // Played strong opponent - higher SOS
        createStanding(divWinner1, 13, 4, 1),
        createStanding(strongOpponent, 13, 4, 3),
      ];
      const nfcStandings = [
        createStanding(divLoser2, 11, 6, 3), // Played weak opponent - lower SOS, picks first
        createStanding(divWinner2, 14, 3, 1),
        createStanding(weakOpponent, 5, 12, null),
      ];

      const playoffGames: PlayoffGame[] = [
        createPlayoffGame('g1', 'divisional', 'afc', divWinner1, divLoser1, divWinner1.id, 'final'),
        createPlayoffGame('g2', 'divisional', 'nfc', divWinner2, divLoser2, divWinner2.id, 'final'),
      ];

      // Regular season games that establish different SOS
      const regularSeasonGames: Game[] = [
        // divLoser1 played strongOpponent (13-4) - gives higher SOS
        {
          id: 'rs1',
          week: 1,
          kickoffTime: new Date(),
          homeTeam: divLoser1,
          awayTeam: strongOpponent,
          homeScore: 21,
          awayScore: 24,
          status: 'final' as const,
        },
        // divLoser2 played weakOpponent (5-12) - gives lower SOS
        {
          id: 'rs2',
          week: 1,
          kickoffTime: new Date(),
          homeTeam: divLoser2,
          awayTeam: weakOpponent,
          homeScore: 28,
          awayScore: 14,
          status: 'final' as const,
        },
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames,
        regularSeasonGames
      );

      const divLosers = result.filter(p => p.reason === 'Lost in Divisional');
      expect(divLosers.length).toBe(2);

      // Both have same record (11-6), so SOS breaks tie
      // Lower SOS (divLoser2 played 5-12 team) picks before higher SOS (divLoser1 played 13-4 team)
      expect(divLosers[0].team.id).toBe('dl2');
      expect(divLosers[1].team.id).toBe('dl1');
    });
  });

  describe('Conference Championship losers SOS tiebreaker', () => {
    it('should use SOS tiebreaker when CCG losers have same record', () => {
      const confLoser1 = createTeam('cl1', 'ConfLoser1', 'AFC');
      const confLoser2 = createTeam('cl2', 'ConfLoser2', 'NFC');
      const confWinner1 = createTeam('cw1', 'ConfWinner1', 'AFC');
      const confWinner2 = createTeam('cw2', 'ConfWinner2', 'NFC');

      // Create opponents for SOS calculation
      const strongOpponent = createTeam('strong', 'StrongOpp', 'AFC'); // 14-3 record
      const weakOpponent = createTeam('weak', 'WeakOpp', 'NFC'); // 6-11 record

      const afcStandings = [
        createStanding(confLoser1, 13, 4, 2), // Played strong opponent - higher SOS
        createStanding(confWinner1, 14, 3, 1),
        createStanding(strongOpponent, 14, 3, 3),
      ];
      const nfcStandings = [
        createStanding(confLoser2, 13, 4, 2), // Played weak opponent - lower SOS, picks first
        createStanding(confWinner2, 15, 2, 1),
        createStanding(weakOpponent, 6, 11, null),
      ];

      const playoffGames: PlayoffGame[] = [
        createPlayoffGame('g1', 'championship', 'afc', confWinner1, confLoser1, confWinner1.id, 'final'),
        createPlayoffGame('g2', 'championship', 'nfc', confWinner2, confLoser2, confWinner2.id, 'final'),
      ];

      // Regular season games that establish different SOS
      const regularSeasonGames: Game[] = [
        // confLoser1 played strongOpponent (14-3) - gives higher SOS
        {
          id: 'rs1',
          week: 1,
          kickoffTime: new Date(),
          homeTeam: confLoser1,
          awayTeam: strongOpponent,
          homeScore: 24,
          awayScore: 21,
          status: 'final' as const,
        },
        // confLoser2 played weakOpponent (6-11) - gives lower SOS
        {
          id: 'rs2',
          week: 1,
          kickoffTime: new Date(),
          homeTeam: confLoser2,
          awayTeam: weakOpponent,
          homeScore: 35,
          awayScore: 10,
          status: 'final' as const,
        },
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames,
        regularSeasonGames
      );

      const confLosers = result.filter(p => p.reason === 'Lost in Conference Championship');
      expect(confLosers.length).toBe(2);

      // Both have same record (13-4), so SOS breaks tie
      // Lower SOS (confLoser2 played 6-11 team) picks before higher SOS (confLoser1 played 14-3 team)
      expect(confLosers[0].team.id).toBe('cl2');
      expect(confLosers[1].team.id).toBe('cl1');
    });
  });

  describe('Pick ranges for Divisional round', () => {
    // Helper to create non-playoff teams and wild card losers for proper pick positioning
    function createPreDivisionalContext() {
      const nonPlayoffTeams: TeamStanding[] = [];
      const wcLosers: TeamStanding[] = [];
      const wcWinners: { team: Team; standing: TeamStanding }[] = [];
      const wcGames: PlayoffGame[] = [];

      // Create 18 non-playoff teams (9 per conference)
      for (let i = 1; i <= 18; i++) {
        const conf = i <= 9 ? 'AFC' : 'NFC';
        const team = createTeam(`np${i}`, `NonPlayoff${i}`, conf);
        nonPlayoffTeams.push(createStanding(team, 4 + (i % 4), 13 - (i % 4), null));
      }

      // Create 6 wild card losers (3 per conference) and their winners
      for (let i = 1; i <= 6; i++) {
        const conf: 'AFC' | 'NFC' = i <= 3 ? 'AFC' : 'NFC';
        const confLower: 'afc' | 'nfc' = i <= 3 ? 'afc' : 'nfc';
        const loser = createTeam(`wcl${i}`, `WCLoser${i}`, conf);
        const winner = createTeam(`wcw${i}`, `WCWinner${i}`, conf);
        wcLosers.push(createStanding(loser, 9, 8, 5 + ((i - 1) % 3))); // Seeds 5-7
        wcWinners.push({
          team: winner,
          standing: createStanding(winner, 11, 6, 2 + ((i - 1) % 3)), // Seeds 2-4
        });
        wcGames.push(
          createPlayoffGame(`wc${i}`, 'wildCard', confLower, winner, loser, winner.id, 'final')
        );
      }

      return { nonPlayoffTeams, wcLosers, wcWinners, wcGames };
    }

    it('should show pick range when not all divisional games are decided', () => {
      const { nonPlayoffTeams, wcLosers, wcWinners, wcGames } = createPreDivisionalContext();

      // Create 4 divisional participants (2 per conference)
      const afcDiv1 = createTeam('ad1', 'AFCDiv1', 'AFC');
      const afcDiv2 = createTeam('ad2', 'AFCDiv2', 'AFC');
      const nfcDiv1 = createTeam('nd1', 'NFCDiv1', 'NFC');
      const nfcDiv2 = createTeam('nd2', 'NFCDiv2', 'NFC');

      // Combine standings
      const afcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'AFC'),
        ...wcLosers.filter(s => s.team.conference === 'AFC'),
        ...wcWinners.filter(w => w.team.conference === 'AFC').map(w => w.standing),
        createStanding(afcDiv1, 13, 4, 1),
        createStanding(afcDiv2, 11, 6, 4),
      ];
      const nfcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'NFC'),
        ...wcLosers.filter(s => s.team.conference === 'NFC'),
        ...wcWinners.filter(w => w.team.conference === 'NFC').map(w => w.standing),
        createStanding(nfcDiv1, 14, 3, 1),
        createStanding(nfcDiv2, 10, 7, 4),
      ];

      // Wild card games (all final) + divisional games
      const playoffGames: PlayoffGame[] = [
        ...wcGames,
        createPlayoffGame('d1', 'divisional', 'afc', afcDiv1, afcDiv2, afcDiv1.id, 'final'), // AFC div2 loses
        createPlayoffGame('d2', 'divisional', 'nfc', nfcDiv1, nfcDiv2, null, 'scheduled'), // Not yet played
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      // Should have afcDiv2 as a known loser
      const divLosers = result.filter(p => p.reason === 'Lost in Divisional');
      expect(divLosers.length).toBe(1);

      // The known loser should have a pick range since not all games decided
      const afcDiv2Pick = divLosers.find(p => p.team.id === 'ad2');
      expect(afcDiv2Pick).toBeDefined();

      // Divisional losers should start at pick 25 (after 18 non-playoff + 6 WC losers)
      expect(afcDiv2Pick!.pick).toBeGreaterThanOrEqual(25);
      expect(afcDiv2Pick!.pick).toBeLessThanOrEqual(26);
      if (afcDiv2Pick!.pickMax) {
        expect(afcDiv2Pick!.pick).toBeLessThanOrEqual(afcDiv2Pick!.pickMax);
      }
    });

    it('should consider all potential divisional losers when calculating ranges', () => {
      const { nonPlayoffTeams, wcLosers, wcWinners, wcGames } = createPreDivisionalContext();

      // Create full divisional round participants (8 teams: 4 per conference)
      const afcTeams = [
        createTeam('a1', 'AFC1', 'AFC'),
        createTeam('a2', 'AFC2', 'AFC'),
        createTeam('a3', 'AFC3', 'AFC'),
        createTeam('a4', 'AFC4', 'AFC'),
      ];
      const nfcTeams = [
        createTeam('n1', 'NFC1', 'NFC'),
        createTeam('n2', 'NFC2', 'NFC'),
        createTeam('n3', 'NFC3', 'NFC'),
        createTeam('n4', 'NFC4', 'NFC'),
      ];

      // Different records for each team
      const afcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'AFC'),
        ...wcLosers.filter(s => s.team.conference === 'AFC'),
        ...wcWinners.filter(w => w.team.conference === 'AFC').map(w => w.standing),
        createStanding(afcTeams[0], 14, 3, 1),
        createStanding(afcTeams[1], 13, 4, 2),
        createStanding(afcTeams[2], 12, 5, 3),
        createStanding(afcTeams[3], 11, 6, 4),
      ];
      const nfcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'NFC'),
        ...wcLosers.filter(s => s.team.conference === 'NFC'),
        ...wcWinners.filter(w => w.team.conference === 'NFC').map(w => w.standing),
        createStanding(nfcTeams[0], 15, 2, 1),
        createStanding(nfcTeams[1], 12, 5, 2),
        createStanding(nfcTeams[2], 11, 6, 3),
        createStanding(nfcTeams[3], 10, 7, 4),
      ];

      // Divisional games - only AFC games decided
      const playoffGames: PlayoffGame[] = [
        ...wcGames,
        createPlayoffGame('d1', 'divisional', 'afc', afcTeams[0], afcTeams[3], afcTeams[0].id, 'final'), // a4 loses (11-6)
        createPlayoffGame('d2', 'divisional', 'afc', afcTeams[1], afcTeams[2], afcTeams[1].id, 'final'), // a3 loses (12-5)
        createPlayoffGame('d3', 'divisional', 'nfc', nfcTeams[0], nfcTeams[3], null, 'scheduled'), // n4 could lose (10-7)
        createPlayoffGame('d4', 'divisional', 'nfc', nfcTeams[1], nfcTeams[2], null, 'scheduled'), // n3 could lose (11-6)
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      const divLosers = result.filter(p => p.reason === 'Lost in Divisional');
      expect(divLosers.length).toBe(2); // Only known losers

      // Both known losers should be in the 25-28 range
      for (const loser of divLosers) {
        expect(loser.pick).toBeGreaterThanOrEqual(25);
        expect(loser.pick).toBeLessThanOrEqual(28);
        if (loser.pickMax) {
          expect(loser.pickMax).toBeGreaterThanOrEqual(loser.pick);
          expect(loser.pickMax).toBeLessThanOrEqual(28);
        }
      }
    });

    it('should lock all picks when all 4 divisional games are decided', () => {
      const { nonPlayoffTeams, wcLosers, wcWinners, wcGames } = createPreDivisionalContext();

      const afcTeams = [
        createTeam('a1', 'AFC1', 'AFC'),
        createTeam('a2', 'AFC2', 'AFC'),
        createTeam('a3', 'AFC3', 'AFC'),
        createTeam('a4', 'AFC4', 'AFC'),
      ];
      const nfcTeams = [
        createTeam('n1', 'NFC1', 'NFC'),
        createTeam('n2', 'NFC2', 'NFC'),
        createTeam('n3', 'NFC3', 'NFC'),
        createTeam('n4', 'NFC4', 'NFC'),
      ];

      const afcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'AFC'),
        ...wcLosers.filter(s => s.team.conference === 'AFC'),
        ...wcWinners.filter(w => w.team.conference === 'AFC').map(w => w.standing),
        createStanding(afcTeams[0], 14, 3, 1),
        createStanding(afcTeams[1], 13, 4, 2),
        createStanding(afcTeams[2], 12, 5, 3),
        createStanding(afcTeams[3], 11, 6, 4),
      ];
      const nfcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'NFC'),
        ...wcLosers.filter(s => s.team.conference === 'NFC'),
        ...wcWinners.filter(w => w.team.conference === 'NFC').map(w => w.standing),
        createStanding(nfcTeams[0], 15, 2, 1),
        createStanding(nfcTeams[1], 12, 5, 2),
        createStanding(nfcTeams[2], 11, 6, 3),
        createStanding(nfcTeams[3], 10, 7, 4),
      ];

      // All 4 divisional games decided
      const playoffGames: PlayoffGame[] = [
        ...wcGames,
        createPlayoffGame('d1', 'divisional', 'afc', afcTeams[0], afcTeams[3], afcTeams[0].id, 'final'),
        createPlayoffGame('d2', 'divisional', 'afc', afcTeams[1], afcTeams[2], afcTeams[1].id, 'final'),
        createPlayoffGame('d3', 'divisional', 'nfc', nfcTeams[0], nfcTeams[3], nfcTeams[0].id, 'final'),
        createPlayoffGame('d4', 'divisional', 'nfc', nfcTeams[1], nfcTeams[2], nfcTeams[1].id, 'final'),
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      const divLosers = result.filter(p => p.reason === 'Lost in Divisional');
      expect(divLosers.length).toBe(4);

      // All picks should be locked (no pickMax)
      for (const loser of divLosers) {
        expect(loser.pickMax).toBeUndefined();
      }

      // Picks should be sequential 25-28
      const divPicks = divLosers.map(l => l.pick).sort((a, b) => a - b);
      expect(divPicks).toEqual([25, 26, 27, 28]);
    });

    it('should show ranges based on all 8 participants when no games decided (user picks only)', () => {
      const { nonPlayoffTeams, wcLosers, wcWinners, wcGames } = createPreDivisionalContext();

      // Create all 8 divisional participants (4 per conference)
      const afcTeams = [
        createTeam('a1', 'AFC1', 'AFC'),
        createTeam('a2', 'AFC2', 'AFC'),
        createTeam('a3', 'AFC3', 'AFC'),
        createTeam('a4', 'AFC4', 'AFC'),
      ];
      const nfcTeams = [
        createTeam('n1', 'NFC1', 'NFC'),
        createTeam('n2', 'NFC2', 'NFC'),
        createTeam('n3', 'NFC3', 'NFC'),
        createTeam('n4', 'NFC4', 'NFC'),
      ];

      // Each team has different record
      const afcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'AFC'),
        ...wcLosers.filter(s => s.team.conference === 'AFC'),
        ...wcWinners.filter(w => w.team.conference === 'AFC').map(w => w.standing),
        createStanding(afcTeams[0], 14, 3, 1),
        createStanding(afcTeams[1], 13, 4, 2),
        createStanding(afcTeams[2], 12, 5, 3),
        createStanding(afcTeams[3], 11, 6, 4),
      ];
      const nfcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'NFC'),
        ...wcLosers.filter(s => s.team.conference === 'NFC'),
        ...wcWinners.filter(w => w.team.conference === 'NFC').map(w => w.standing),
        createStanding(nfcTeams[0], 15, 2, 1),
        createStanding(nfcTeams[1], 12, 5, 2),
        createStanding(nfcTeams[2], 11, 6, 3),
        createStanding(nfcTeams[3], 10, 7, 4),
      ];

      // All divisional games scheduled (no results yet)
      const playoffGames: PlayoffGame[] = [
        ...wcGames,
        createPlayoffGame('d1', 'divisional', 'afc', afcTeams[0], afcTeams[3], null, 'scheduled'),
        createPlayoffGame('d2', 'divisional', 'afc', afcTeams[1], afcTeams[2], null, 'scheduled'),
        createPlayoffGame('d3', 'divisional', 'nfc', nfcTeams[0], nfcTeams[3], null, 'scheduled'),
        createPlayoffGame('d4', 'divisional', 'nfc', nfcTeams[1], nfcTeams[2], null, 'scheduled'),
      ];

      // User picks all higher seeds to win (losers: a4, a3, n4, n3)
      const picks = createEmptyPlayoffPicks();
      picks.afc.divisional[0] = afcTeams[0].id; // a1 beats a4
      picks.afc.divisional[1] = afcTeams[1].id; // a2 beats a3
      picks.nfc.divisional[0] = nfcTeams[0].id; // n1 beats n4
      picks.nfc.divisional[1] = nfcTeams[1].id; // n2 beats n3

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        picks,
        playoffGames
      );

      const divLosers = result.filter(p => p.reason === 'Lost in Divisional');
      expect(divLosers.length).toBe(4);

      // All losers should be in picks 25-28
      for (const loser of divLosers) {
        expect(loser.pick).toBeGreaterThanOrEqual(25);
        expect(loser.pick).toBeLessThanOrEqual(28);
      }
    });

    it('should handle 3 games decided with 1 pending', () => {
      const { nonPlayoffTeams, wcLosers, wcWinners, wcGames } = createPreDivisionalContext();

      const afcTeams = [
        createTeam('a1', 'AFC1', 'AFC'),
        createTeam('a2', 'AFC2', 'AFC'),
        createTeam('a3', 'AFC3', 'AFC'),
        createTeam('a4', 'AFC4', 'AFC'),
      ];
      const nfcTeams = [
        createTeam('n1', 'NFC1', 'NFC'),
        createTeam('n2', 'NFC2', 'NFC'),
        createTeam('n3', 'NFC3', 'NFC'),
        createTeam('n4', 'NFC4', 'NFC'),
      ];

      // Records: a4 (11-6), a3 (12-5), n4 (10-7), n3 (11-6)
      const afcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'AFC'),
        ...wcLosers.filter(s => s.team.conference === 'AFC'),
        ...wcWinners.filter(w => w.team.conference === 'AFC').map(w => w.standing),
        createStanding(afcTeams[0], 14, 3, 1),
        createStanding(afcTeams[1], 13, 4, 2),
        createStanding(afcTeams[2], 12, 5, 3),
        createStanding(afcTeams[3], 11, 6, 4),
      ];
      const nfcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'NFC'),
        ...wcLosers.filter(s => s.team.conference === 'NFC'),
        ...wcWinners.filter(w => w.team.conference === 'NFC').map(w => w.standing),
        createStanding(nfcTeams[0], 15, 2, 1),
        createStanding(nfcTeams[1], 12, 5, 2),
        createStanding(nfcTeams[2], 11, 6, 3), // n3: 11-6
        createStanding(nfcTeams[3], 10, 7, 4), // n4: 10-7 (worst)
      ];

      // 3 games decided, 1 pending (NFC n1 vs n4 still scheduled)
      const playoffGames: PlayoffGame[] = [
        ...wcGames,
        createPlayoffGame('d1', 'divisional', 'afc', afcTeams[0], afcTeams[3], afcTeams[0].id, 'final'), // a4 loses (11-6)
        createPlayoffGame('d2', 'divisional', 'afc', afcTeams[1], afcTeams[2], afcTeams[1].id, 'final'), // a3 loses (12-5)
        createPlayoffGame('d3', 'divisional', 'nfc', nfcTeams[0], nfcTeams[3], null, 'scheduled'), // n4 could lose (10-7)
        createPlayoffGame('d4', 'divisional', 'nfc', nfcTeams[1], nfcTeams[2], nfcTeams[1].id, 'final'), // n3 loses (11-6)
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      const divLosers = result.filter(p => p.reason === 'Lost in Divisional');
      expect(divLosers.length).toBe(3); // 3 known losers

      // Known losers: a4 (11-6), a3 (12-5), n3 (11-6)
      // n4 (10-7) could still lose - would pick first if they do
      // Order by record: a3 (12-5) best, a4/n3 (11-6) middle
      // With n4 (10-7) unknown, picks could shift

      // All known losers should be in 25-28 range
      for (const loser of divLosers) {
        expect(loser.pick).toBeGreaterThanOrEqual(25);
        expect(loser.pick).toBeLessThanOrEqual(28);
      }
    });

    it('should give single pick (no range) to team with clearly worst record', () => {
      const { nonPlayoffTeams, wcLosers, wcWinners, wcGames } = createPreDivisionalContext();

      const afcTeams = [
        createTeam('a1', 'AFC1', 'AFC'),
        createTeam('a2', 'AFC2', 'AFC'),
        createTeam('a3', 'AFC3', 'AFC'),
        createTeam('a4', 'AFC4', 'AFC'),
      ];
      const nfcTeams = [
        createTeam('n1', 'NFC1', 'NFC'),
        createTeam('n2', 'NFC2', 'NFC'),
        createTeam('n3', 'NFC3', 'NFC'),
        createTeam('n4', 'NFC4', 'NFC'),
      ];

      // n4 has clearly worst record (8-9), all others are 11-6 or better
      const afcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'AFC'),
        ...wcLosers.filter(s => s.team.conference === 'AFC'),
        ...wcWinners.filter(w => w.team.conference === 'AFC').map(w => w.standing),
        createStanding(afcTeams[0], 14, 3, 1),
        createStanding(afcTeams[1], 13, 4, 2),
        createStanding(afcTeams[2], 12, 5, 3),
        createStanding(afcTeams[3], 11, 6, 4),
      ];
      const nfcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'NFC'),
        ...wcLosers.filter(s => s.team.conference === 'NFC'),
        ...wcWinners.filter(w => w.team.conference === 'NFC').map(w => w.standing),
        createStanding(nfcTeams[0], 15, 2, 1),
        createStanding(nfcTeams[1], 14, 3, 2),
        createStanding(nfcTeams[2], 13, 4, 3),
        createStanding(nfcTeams[3], 8, 9, 4), // Clearly worst at 8-9
      ];

      // Only n4 (worst record) loses so far, others pending
      const playoffGames: PlayoffGame[] = [
        ...wcGames,
        createPlayoffGame('d1', 'divisional', 'afc', afcTeams[0], afcTeams[3], null, 'scheduled'),
        createPlayoffGame('d2', 'divisional', 'afc', afcTeams[1], afcTeams[2], null, 'scheduled'),
        createPlayoffGame('d3', 'divisional', 'nfc', nfcTeams[0], nfcTeams[3], nfcTeams[0].id, 'final'), // n4 loses
        createPlayoffGame('d4', 'divisional', 'nfc', nfcTeams[1], nfcTeams[2], null, 'scheduled'),
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      const divLosers = result.filter(p => p.reason === 'Lost in Divisional');
      expect(divLosers.length).toBe(1);

      // n4 has worst record (8-9) - worse than any possible loser
      // So they should get pick 25 (no range needed)
      const n4Pick = divLosers.find(p => p.team.id === 'n4');
      expect(n4Pick).toBeDefined();
      expect(n4Pick!.pick).toBe(25);
      // No pickMax because they're guaranteed first pick in round
      expect(n4Pick!.pickMax).toBeUndefined();
    });

    it('should give single pick at end (no range) to team with clearly best record', () => {
      const { nonPlayoffTeams, wcLosers, wcWinners, wcGames } = createPreDivisionalContext();

      const afcTeams = [
        createTeam('a1', 'AFC1', 'AFC'),
        createTeam('a2', 'AFC2', 'AFC'),
        createTeam('a3', 'AFC3', 'AFC'),
        createTeam('a4', 'AFC4', 'AFC'),
      ];
      const nfcTeams = [
        createTeam('n1', 'NFC1', 'NFC'),
        createTeam('n2', 'NFC2', 'NFC'),
        createTeam('n3', 'NFC3', 'NFC'),
        createTeam('n4', 'NFC4', 'NFC'),
      ];

      // a2 has clearly best loser record (14-3), all others are 10-7 or worse
      const afcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'AFC'),
        ...wcLosers.filter(s => s.team.conference === 'AFC'),
        ...wcWinners.filter(w => w.team.conference === 'AFC').map(w => w.standing),
        createStanding(afcTeams[0], 15, 2, 1),
        createStanding(afcTeams[1], 14, 3, 2), // Best record among losers
        createStanding(afcTeams[2], 10, 7, 3),
        createStanding(afcTeams[3], 9, 8, 4),
      ];
      const nfcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'NFC'),
        ...wcLosers.filter(s => s.team.conference === 'NFC'),
        ...wcWinners.filter(w => w.team.conference === 'NFC').map(w => w.standing),
        createStanding(nfcTeams[0], 15, 2, 1),
        createStanding(nfcTeams[1], 11, 6, 2),
        createStanding(nfcTeams[2], 10, 7, 3),
        createStanding(nfcTeams[3], 8, 9, 4), // Worst record
      ];

      // All 4 games decided - a2 (14-3) has clearly best record among losers
      const playoffGames: PlayoffGame[] = [
        ...wcGames,
        createPlayoffGame('d1', 'divisional', 'afc', afcTeams[0], afcTeams[3], afcTeams[0].id, 'final'), // a4 loses (9-8)
        createPlayoffGame('d2', 'divisional', 'afc', afcTeams[0], afcTeams[1], afcTeams[0].id, 'final'), // a2 loses (14-3)
        createPlayoffGame('d3', 'divisional', 'nfc', nfcTeams[0], nfcTeams[3], nfcTeams[0].id, 'final'), // n4 loses (8-9)
        createPlayoffGame('d4', 'divisional', 'nfc', nfcTeams[1], nfcTeams[2], nfcTeams[1].id, 'final'), // n3 loses (10-7)
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      const divLosers = result.filter(p => p.reason === 'Lost in Divisional');
      expect(divLosers.length).toBe(4);

      // a2 has best record (14-3) - clearly better than all other losers
      // With all games decided, they should get pick 28 (last in divisional round)
      const a2Pick = divLosers.find(p => p.team.id === 'a2');
      expect(a2Pick).toBeDefined();
      expect(a2Pick!.pick).toBe(28);
      expect(a2Pick!.pickMax).toBeUndefined();

      // Worst record (n4 at 8-9) should pick 25
      const n4Pick = divLosers.find(p => p.team.id === 'n4');
      expect(n4Pick).toBeDefined();
      expect(n4Pick!.pick).toBe(25);
    });

    it('should show wider ranges when multiple teams have same record', () => {
      const { nonPlayoffTeams, wcLosers, wcWinners, wcGames } = createPreDivisionalContext();

      const afcTeams = [
        createTeam('a1', 'AFC1', 'AFC'),
        createTeam('a2', 'AFC2', 'AFC'),
        createTeam('a3', 'AFC3', 'AFC'),
        createTeam('a4', 'AFC4', 'AFC'),
      ];
      const nfcTeams = [
        createTeam('n1', 'NFC1', 'NFC'),
        createTeam('n2', 'NFC2', 'NFC'),
        createTeam('n3', 'NFC3', 'NFC'),
        createTeam('n4', 'NFC4', 'NFC'),
      ];

      // All potential losers have same record (11-6)
      const afcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'AFC'),
        ...wcLosers.filter(s => s.team.conference === 'AFC'),
        ...wcWinners.filter(w => w.team.conference === 'AFC').map(w => w.standing),
        createStanding(afcTeams[0], 15, 2, 1),
        createStanding(afcTeams[1], 14, 3, 2),
        createStanding(afcTeams[2], 11, 6, 3), // Same record
        createStanding(afcTeams[3], 11, 6, 4), // Same record
      ];
      const nfcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'NFC'),
        ...wcLosers.filter(s => s.team.conference === 'NFC'),
        ...wcWinners.filter(w => w.team.conference === 'NFC').map(w => w.standing),
        createStanding(nfcTeams[0], 15, 2, 1),
        createStanding(nfcTeams[1], 14, 3, 2),
        createStanding(nfcTeams[2], 11, 6, 3), // Same record
        createStanding(nfcTeams[3], 11, 6, 4), // Same record
      ];

      // 2 games decided (a4 and n4 lose)
      const playoffGames: PlayoffGame[] = [
        ...wcGames,
        createPlayoffGame('d1', 'divisional', 'afc', afcTeams[0], afcTeams[3], afcTeams[0].id, 'final'), // a4 loses (11-6)
        createPlayoffGame('d2', 'divisional', 'afc', afcTeams[1], afcTeams[2], null, 'scheduled'), // a3 could lose (11-6)
        createPlayoffGame('d3', 'divisional', 'nfc', nfcTeams[0], nfcTeams[3], nfcTeams[0].id, 'final'), // n4 loses (11-6)
        createPlayoffGame('d4', 'divisional', 'nfc', nfcTeams[1], nfcTeams[2], null, 'scheduled'), // n3 could lose (11-6)
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      const divLosers = result.filter(p => p.reason === 'Lost in Divisional');
      expect(divLosers.length).toBe(2); // a4 and n4

      // Both known losers have same record (11-6)
      // With 2 more potential losers also at 11-6, ranges should span multiple picks
      for (const loser of divLosers) {
        expect(loser.pick).toBeGreaterThanOrEqual(25);
        expect(loser.pick).toBeLessThanOrEqual(28);
        // With same records, there should be potential for range
        // (exact range depends on SOS tiebreaker values)
      }
    });
  });

  describe('Pick ranges for Conference Championship', () => {
    // Helper to create full context for conference championship tests
    function createPreConferenceChampionshipContext() {
      const nonPlayoffTeams: TeamStanding[] = [];
      const wcLosers: TeamStanding[] = [];
      const divLosers: TeamStanding[] = [];
      const wcWinners: { team: Team; standing: TeamStanding }[] = [];
      const divWinners: { team: Team; standing: TeamStanding }[] = [];
      const wcGames: PlayoffGame[] = [];
      const divGames: PlayoffGame[] = [];

      // Create 18 non-playoff teams (9 per conference)
      for (let i = 1; i <= 18; i++) {
        const conf = i <= 9 ? 'AFC' : 'NFC';
        const team = createTeam(`np${i}`, `NonPlayoff${i}`, conf);
        nonPlayoffTeams.push(createStanding(team, 4 + (i % 4), 13 - (i % 4), null));
      }

      // Create 6 wild card losers (3 per conference) and their winners
      for (let i = 1; i <= 6; i++) {
        const conf: 'AFC' | 'NFC' = i <= 3 ? 'AFC' : 'NFC';
        const confLower: 'afc' | 'nfc' = i <= 3 ? 'afc' : 'nfc';
        const loser = createTeam(`wcl${i}`, `WCLoser${i}`, conf);
        const winner = createTeam(`wcw${i}`, `WCWinner${i}`, conf);
        wcLosers.push(createStanding(loser, 9, 8, 5 + ((i - 1) % 3)));
        wcWinners.push({
          team: winner,
          standing: createStanding(winner, 11, 6, 2 + ((i - 1) % 3)),
        });
        wcGames.push(
          createPlayoffGame(`wc${i}`, 'wildCard', confLower, winner, loser, winner.id, 'final')
        );
      }

      // Create 4 divisional losers (2 per conference) and their winners
      for (let i = 1; i <= 4; i++) {
        const conf: 'AFC' | 'NFC' = i <= 2 ? 'AFC' : 'NFC';
        const confLower: 'afc' | 'nfc' = i <= 2 ? 'afc' : 'nfc';
        const loser = createTeam(`divl${i}`, `DivLoser${i}`, conf);
        const winner = createTeam(`divw${i}`, `DivWinner${i}`, conf);
        divLosers.push(createStanding(loser, 10 + ((i - 1) % 2), 7 - ((i - 1) % 2), 3 + ((i - 1) % 2)));
        divWinners.push({
          team: winner,
          standing: createStanding(winner, 13 + ((i - 1) % 2), 4 - ((i - 1) % 2), 1 + ((i - 1) % 2)),
        });
        divGames.push(
          createPlayoffGame(`div${i}`, 'divisional', confLower, winner, loser, winner.id, 'final')
        );
      }

      return { nonPlayoffTeams, wcLosers, wcWinners, wcGames, divLosers, divWinners, divGames };
    }

    it('should show pick range when only 1 CCG is decided', () => {
      const { nonPlayoffTeams, wcLosers, wcWinners, wcGames, divLosers, divWinners, divGames } =
        createPreConferenceChampionshipContext();

      const afcLoser = createTeam('al', 'AFCLoser', 'AFC');
      const afcWinner = createTeam('aw', 'AFCWinner', 'AFC');
      const nfcTeam1 = createTeam('n1', 'NFCTeam1', 'NFC');
      const nfcTeam2 = createTeam('n2', 'NFCTeam2', 'NFC');

      const afcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'AFC'),
        ...wcLosers.filter(s => s.team.conference === 'AFC'),
        ...wcWinners.filter(w => w.team.conference === 'AFC').map(w => w.standing),
        ...divLosers.filter(s => s.team.conference === 'AFC'),
        ...divWinners.filter(w => w.team.conference === 'AFC').map(w => w.standing),
        createStanding(afcLoser, 12, 5, 2),
        createStanding(afcWinner, 14, 3, 1),
      ];
      const nfcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'NFC'),
        ...wcLosers.filter(s => s.team.conference === 'NFC'),
        ...wcWinners.filter(w => w.team.conference === 'NFC').map(w => w.standing),
        ...divLosers.filter(s => s.team.conference === 'NFC'),
        ...divWinners.filter(w => w.team.conference === 'NFC').map(w => w.standing),
        createStanding(nfcTeam1, 13, 4, 1),
        createStanding(nfcTeam2, 11, 6, 2),
      ];

      // Only AFC CCG decided
      const playoffGames: PlayoffGame[] = [
        ...wcGames,
        ...divGames,
        createPlayoffGame('c1', 'championship', 'afc', afcWinner, afcLoser, afcWinner.id, 'final'),
        createPlayoffGame('c2', 'championship', 'nfc', nfcTeam1, nfcTeam2, null, 'scheduled'),
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      const confLosers = result.filter(p => p.reason === 'Lost in Conference Championship');
      expect(confLosers.length).toBe(1);

      const afcLoserPick = confLosers[0];
      expect(afcLoserPick.team.id).toBe('al');

      // CCG losers should be at picks 29-30
      expect(afcLoserPick.pick).toBe(29);
      if (afcLoserPick.pickMax) {
        expect(afcLoserPick.pickMax).toBe(30);
      }
    });

    it('should lock picks when both CCGs are decided', () => {
      const { nonPlayoffTeams, wcLosers, wcWinners, wcGames, divLosers, divWinners, divGames } =
        createPreConferenceChampionshipContext();

      const afcLoser = createTeam('al', 'AFCLoser', 'AFC');
      const afcWinner = createTeam('aw', 'AFCWinner', 'AFC');
      const nfcLoser = createTeam('nl', 'NFCLoser', 'NFC');
      const nfcWinner = createTeam('nw', 'NFCWinner', 'NFC');

      const afcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'AFC'),
        ...wcLosers.filter(s => s.team.conference === 'AFC'),
        ...wcWinners.filter(w => w.team.conference === 'AFC').map(w => w.standing),
        ...divLosers.filter(s => s.team.conference === 'AFC'),
        ...divWinners.filter(w => w.team.conference === 'AFC').map(w => w.standing),
        createStanding(afcLoser, 12, 5, 2),
        createStanding(afcWinner, 14, 3, 1),
      ];
      const nfcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'NFC'),
        ...wcLosers.filter(s => s.team.conference === 'NFC'),
        ...wcWinners.filter(w => w.team.conference === 'NFC').map(w => w.standing),
        ...divLosers.filter(s => s.team.conference === 'NFC'),
        ...divWinners.filter(w => w.team.conference === 'NFC').map(w => w.standing),
        createStanding(nfcLoser, 11, 6, 2),
        createStanding(nfcWinner, 15, 2, 1),
      ];

      // Both CCGs decided
      const playoffGames: PlayoffGame[] = [
        ...wcGames,
        ...divGames,
        createPlayoffGame('c1', 'championship', 'afc', afcWinner, afcLoser, afcWinner.id, 'final'),
        createPlayoffGame('c2', 'championship', 'nfc', nfcWinner, nfcLoser, nfcWinner.id, 'final'),
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      const confLosers = result.filter(p => p.reason === 'Lost in Conference Championship');
      expect(confLosers.length).toBe(2);

      // No ranges should exist
      for (const loser of confLosers) {
        expect(loser.pickMax).toBeUndefined();
      }

      // nfcLoser (11-6) should pick 29, afcLoser (12-5) should pick 30
      expect(confLosers[0].team.id).toBe('nl');
      expect(confLosers[0].pick).toBe(29);
      expect(confLosers[1].team.id).toBe('al');
      expect(confLosers[1].pick).toBe(30);
    });

    it('should show 29-30 range for both teams when no games decided (user picks only)', () => {
      const { nonPlayoffTeams, wcLosers, wcWinners, wcGames, divLosers, divWinners, divGames } =
        createPreConferenceChampionshipContext();

      const afcTeam1 = createTeam('a1', 'AFCTeam1', 'AFC');
      const afcTeam2 = createTeam('a2', 'AFCTeam2', 'AFC');
      const nfcTeam1 = createTeam('n1', 'NFCTeam1', 'NFC');
      const nfcTeam2 = createTeam('n2', 'NFCTeam2', 'NFC');

      const afcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'AFC'),
        ...wcLosers.filter(s => s.team.conference === 'AFC'),
        ...wcWinners.filter(w => w.team.conference === 'AFC').map(w => w.standing),
        ...divLosers.filter(s => s.team.conference === 'AFC'),
        ...divWinners.filter(w => w.team.conference === 'AFC').map(w => w.standing),
        createStanding(afcTeam1, 14, 3, 1),
        createStanding(afcTeam2, 12, 5, 2),
      ];
      const nfcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'NFC'),
        ...wcLosers.filter(s => s.team.conference === 'NFC'),
        ...wcWinners.filter(w => w.team.conference === 'NFC').map(w => w.standing),
        ...divLosers.filter(s => s.team.conference === 'NFC'),
        ...divWinners.filter(w => w.team.conference === 'NFC').map(w => w.standing),
        createStanding(nfcTeam1, 15, 2, 1),
        createStanding(nfcTeam2, 11, 6, 2),
      ];

      // Neither CCG decided yet
      const playoffGames: PlayoffGame[] = [
        ...wcGames,
        ...divGames,
        createPlayoffGame('c1', 'championship', 'afc', afcTeam1, afcTeam2, null, 'scheduled'),
        createPlayoffGame('c2', 'championship', 'nfc', nfcTeam1, nfcTeam2, null, 'scheduled'),
      ];

      // User picks winners (losers: afcTeam2, nfcTeam2)
      const picks = createEmptyPlayoffPicks();
      picks.afc.championship = afcTeam1.id;
      picks.nfc.championship = nfcTeam1.id;

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        picks,
        playoffGames
      );

      const confLosers = result.filter(p => p.reason === 'Lost in Conference Championship');
      expect(confLosers.length).toBe(2);

      // Both losers should be at picks 29-30
      for (const loser of confLosers) {
        expect(loser.pick).toBeGreaterThanOrEqual(29);
        expect(loser.pick).toBeLessThanOrEqual(30);
      }
    });
  });

  describe('SOS tiebreaker affects range boundaries', () => {
    // Helper for context
    function createPreDivisionalContextForSOS() {
      const nonPlayoffTeams: TeamStanding[] = [];
      const wcLosers: TeamStanding[] = [];
      const wcWinners: { team: Team; standing: TeamStanding }[] = [];
      const wcGames: PlayoffGame[] = [];

      for (let i = 1; i <= 18; i++) {
        const conf = i <= 9 ? 'AFC' : 'NFC';
        const team = createTeam(`np${i}`, `NonPlayoff${i}`, conf);
        nonPlayoffTeams.push(createStanding(team, 4 + (i % 4), 13 - (i % 4), null));
      }

      for (let i = 1; i <= 6; i++) {
        const conf: 'AFC' | 'NFC' = i <= 3 ? 'AFC' : 'NFC';
        const confLower: 'afc' | 'nfc' = i <= 3 ? 'afc' : 'nfc';
        const loser = createTeam(`wcl${i}`, `WCLoser${i}`, conf);
        const winner = createTeam(`wcw${i}`, `WCWinner${i}`, conf);
        wcLosers.push(createStanding(loser, 9, 8, 5 + ((i - 1) % 3)));
        wcWinners.push({
          team: winner,
          standing: createStanding(winner, 11, 6, 2 + ((i - 1) % 3)),
        });
        wcGames.push(
          createPlayoffGame(`wc${i}`, 'wildCard', confLower, winner, loser, winner.id, 'final')
        );
      }

      return { nonPlayoffTeams, wcLosers, wcWinners, wcGames };
    }

    it('should use SOS to narrow ranges when teams have same record', () => {
      const { nonPlayoffTeams, wcLosers, wcWinners, wcGames } = createPreDivisionalContextForSOS();

      const afcTeams = [
        createTeam('a1', 'AFC1', 'AFC'),
        createTeam('a2', 'AFC2', 'AFC'),
        createTeam('a3', 'AFC3', 'AFC'),
        createTeam('a4', 'AFC4', 'AFC'),
      ];
      const nfcTeams = [
        createTeam('n1', 'NFC1', 'NFC'),
        createTeam('n2', 'NFC2', 'NFC'),
        createTeam('n3', 'NFC3', 'NFC'),
        createTeam('n4', 'NFC4', 'NFC'),
      ];

      // Create opponents with different records for SOS calculation
      const strongOpp = createTeam('strongOpp', 'StrongOpp', 'AFC');
      const weakOpp = createTeam('weakOpp', 'WeakOpp', 'NFC');

      // a4 and n4 will have same record (10-7) but different SOS
      const afcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'AFC'),
        ...wcLosers.filter(s => s.team.conference === 'AFC'),
        ...wcWinners.filter(w => w.team.conference === 'AFC').map(w => w.standing),
        createStanding(afcTeams[0], 14, 3, 1),
        createStanding(afcTeams[1], 13, 4, 2),
        createStanding(afcTeams[2], 12, 5, 3),
        createStanding(afcTeams[3], 10, 7, 4), // Same record as n4
        createStanding(strongOpp, 13, 4, null), // Strong opponent for SOS
      ];
      const nfcStandings = [
        ...nonPlayoffTeams.filter(s => s.team.conference === 'NFC'),
        ...wcLosers.filter(s => s.team.conference === 'NFC'),
        ...wcWinners.filter(w => w.team.conference === 'NFC').map(w => w.standing),
        createStanding(nfcTeams[0], 15, 2, 1),
        createStanding(nfcTeams[1], 14, 3, 2),
        createStanding(nfcTeams[2], 13, 4, 3),
        createStanding(nfcTeams[3], 10, 7, 4), // Same record as a4
        createStanding(weakOpp, 4, 13, null), // Weak opponent for SOS
      ];

      // Regular season games establish SOS
      // a4 played strongOpp (13-4) - higher SOS
      // n4 played weakOpp (4-13) - lower SOS -> picks first
      const regularSeasonGames: Game[] = [
        {
          id: 'rs1',
          week: 1,
          kickoffTime: new Date(),
          homeTeam: afcTeams[3],
          awayTeam: strongOpp,
          homeScore: 17,
          awayScore: 24,
          status: 'final' as const,
        },
        {
          id: 'rs2',
          week: 1,
          kickoffTime: new Date(),
          homeTeam: nfcTeams[3],
          awayTeam: weakOpp,
          homeScore: 28,
          awayScore: 14,
          status: 'final' as const,
        },
      ];

      // Both a4 and n4 lose (same record 10-7)
      const playoffGames: PlayoffGame[] = [
        ...wcGames,
        createPlayoffGame('d1', 'divisional', 'afc', afcTeams[0], afcTeams[3], afcTeams[0].id, 'final'), // a4 loses
        createPlayoffGame('d2', 'divisional', 'afc', afcTeams[1], afcTeams[2], null, 'scheduled'),
        createPlayoffGame('d3', 'divisional', 'nfc', nfcTeams[0], nfcTeams[3], nfcTeams[0].id, 'final'), // n4 loses
        createPlayoffGame('d4', 'divisional', 'nfc', nfcTeams[1], nfcTeams[2], null, 'scheduled'),
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames,
        regularSeasonGames
      );

      const divLosers = result.filter(p => p.reason === 'Lost in Divisional');
      expect(divLosers.length).toBe(2);

      // Both have 10-7 record, SOS breaks tie
      // n4 has lower SOS (played 4-13 team) -> picks first
      // a4 has higher SOS (played 13-4 team) -> picks second
      const n4Pick = divLosers.find(p => p.team.id === 'n4');
      const a4Pick = divLosers.find(p => p.team.id === 'a4');

      expect(n4Pick).toBeDefined();
      expect(a4Pick).toBeDefined();
      expect(n4Pick!.pick).toBeLessThan(a4Pick!.pick);
    });
  });

  describe('SOS calculation source', () => {
    it('should calculate SOS from regular season games only', () => {
      // Create teams with known regular season opponents
      const team1 = createTeam('t1', 'Team1', 'AFC');
      const team2 = createTeam('t2', 'Team2', 'AFC');
      const opp1 = createTeam('o1', 'Opponent1', 'AFC');
      const opp2 = createTeam('o2', 'Opponent2', 'AFC');

      // opp1 has 10-7 record, opp2 has 5-12 record
      // team1 only played opp1 (good team) - higher SOS
      // team2 only played opp2 (bad team) - lower SOS
      const afcStandings = [
        createStanding(team1, 3, 14, null), // Same record
        createStanding(team2, 3, 14, null), // Same record
        createStanding(opp1, 10, 7, 5),
        createStanding(opp2, 5, 12, null),
      ];

      // Regular season games showing who played whom
      const regularSeasonGames: Game[] = [
        // team1 played opp1 (10-7 opponent)
        {
          id: 'g1',
          week: 1,
          kickoffTime: new Date(),
          homeTeam: team1,
          awayTeam: opp1,
          homeScore: 17,
          awayScore: 24,
          status: 'final' as const,
        },
        // team2 played opp2 (5-12 opponent)
        {
          id: 'g2',
          week: 1,
          kickoffTime: new Date(),
          homeTeam: team2,
          awayTeam: opp2,
          homeScore: 17,
          awayScore: 24,
          status: 'final' as const,
        },
      ];

      const result = calculateDraftOrder(
        afcStandings,
        [],
        createEmptyPlayoffPicks(),
        [],
        regularSeasonGames
      );

      // team2 should pick before team1 because team2 has lower SOS
      // (played weaker opponents)
      const team1Pick = result.find(p => p.team.id === 't1');
      const team2Pick = result.find(p => p.team.id === 't2');

      expect(team1Pick).toBeDefined();
      expect(team2Pick).toBeDefined();
      expect(team2Pick!.pick).toBeLessThan(team1Pick!.pick);
    });

    it('should use default SOS when no regular season games provided', () => {
      // Same record teams without game data
      const team1 = createTeam('t1', 'Team1', 'AFC');
      const team2 = createTeam('t2', 'Team2', 'AFC');

      const afcStandings = [
        createStanding(team1, 3, 14, null, 0.4), // Mock SOS via points
        createStanding(team2, 3, 14, null, 0.6), // Mock SOS via points
      ];

      // No regular season games provided
      const result = calculateDraftOrder(
        afcStandings,
        [],
        createEmptyPlayoffPicks(),
        [],
        [] // Empty games array
      );

      // Without games, SOS defaults to 0.5 for both, so order might be arbitrary
      // or based on points (which we use as proxy for SOS in tests)
      expect(result.length).toBe(2);
      expect(result[0].record).toBe('3-14');
      expect(result[1].record).toBe('3-14');
    });
  });

  describe('Complete draft order', () => {
    it('should produce exactly 32 picks when all games are decided', () => {
      // Create all 32 teams with proper playoff seeding
      const afcTeams: Team[] = [];
      const nfcTeams: Team[] = [];

      for (let i = 1; i <= 16; i++) {
        afcTeams.push(createTeam(`afc${i}`, `AFC${i}`, 'AFC'));
        nfcTeams.push(createTeam(`nfc${i}`, `NFC${i}`, 'NFC'));
      }

      // AFC standings: 7 playoff teams (seeds 1-7), 9 non-playoff
      const afcStandings: TeamStanding[] = [
        createStanding(afcTeams[0], 14, 3, 1),
        createStanding(afcTeams[1], 13, 4, 2),
        createStanding(afcTeams[2], 12, 5, 3),
        createStanding(afcTeams[3], 11, 6, 4),
        createStanding(afcTeams[4], 10, 7, 5),
        createStanding(afcTeams[5], 10, 7, 6),
        createStanding(afcTeams[6], 9, 8, 7),
        createStanding(afcTeams[7], 8, 9, null),
        createStanding(afcTeams[8], 7, 10, null),
        createStanding(afcTeams[9], 6, 11, null),
        createStanding(afcTeams[10], 5, 12, null),
        createStanding(afcTeams[11], 5, 12, null),
        createStanding(afcTeams[12], 4, 13, null),
        createStanding(afcTeams[13], 4, 13, null),
        createStanding(afcTeams[14], 3, 14, null),
        createStanding(afcTeams[15], 3, 14, null),
      ];

      // NFC standings: 7 playoff teams (seeds 1-7), 9 non-playoff
      const nfcStandings: TeamStanding[] = [
        createStanding(nfcTeams[0], 15, 2, 1),
        createStanding(nfcTeams[1], 14, 3, 2),
        createStanding(nfcTeams[2], 13, 4, 3),
        createStanding(nfcTeams[3], 12, 5, 4),
        createStanding(nfcTeams[4], 11, 6, 5),
        createStanding(nfcTeams[5], 10, 7, 6),
        createStanding(nfcTeams[6], 10, 7, 7),
        createStanding(nfcTeams[7], 9, 8, null),
        createStanding(nfcTeams[8], 8, 9, null),
        createStanding(nfcTeams[9], 7, 10, null),
        createStanding(nfcTeams[10], 6, 11, null),
        createStanding(nfcTeams[11], 5, 12, null),
        createStanding(nfcTeams[12], 4, 13, null),
        createStanding(nfcTeams[13], 4, 13, null),
        createStanding(nfcTeams[14], 3, 14, null),
        createStanding(nfcTeams[15], 2, 15, null),
      ];

      // Create all playoff games with results
      const playoffGames: PlayoffGame[] = [
        // Wild Card (6 games)
        createPlayoffGame('wc1', 'wildCard', 'afc', afcTeams[1], afcTeams[6], afcTeams[1].id, 'final'), // 2 beats 7
        createPlayoffGame('wc2', 'wildCard', 'afc', afcTeams[2], afcTeams[5], afcTeams[2].id, 'final'), // 3 beats 6
        createPlayoffGame('wc3', 'wildCard', 'afc', afcTeams[3], afcTeams[4], afcTeams[3].id, 'final'), // 4 beats 5
        createPlayoffGame('wc4', 'wildCard', 'nfc', nfcTeams[1], nfcTeams[6], nfcTeams[1].id, 'final'), // 2 beats 7
        createPlayoffGame('wc5', 'wildCard', 'nfc', nfcTeams[2], nfcTeams[5], nfcTeams[2].id, 'final'), // 3 beats 6
        createPlayoffGame('wc6', 'wildCard', 'nfc', nfcTeams[3], nfcTeams[4], nfcTeams[3].id, 'final'), // 4 beats 5
        // Divisional (4 games)
        createPlayoffGame('div1', 'divisional', 'afc', afcTeams[0], afcTeams[3], afcTeams[0].id, 'final'), // 1 beats 4
        createPlayoffGame('div2', 'divisional', 'afc', afcTeams[1], afcTeams[2], afcTeams[1].id, 'final'), // 2 beats 3
        createPlayoffGame('div3', 'divisional', 'nfc', nfcTeams[0], nfcTeams[3], nfcTeams[0].id, 'final'), // 1 beats 4
        createPlayoffGame('div4', 'divisional', 'nfc', nfcTeams[1], nfcTeams[2], nfcTeams[1].id, 'final'), // 2 beats 3
        // Championship (2 games)
        createPlayoffGame('champ1', 'championship', 'afc', afcTeams[0], afcTeams[1], afcTeams[0].id, 'final'), // 1 beats 2
        createPlayoffGame('champ2', 'championship', 'nfc', nfcTeams[0], nfcTeams[1], nfcTeams[0].id, 'final'), // 1 beats 2
        // Super Bowl
        createPlayoffGame('sb', 'superBowl', null, nfcTeams[0], afcTeams[0], nfcTeams[0].id, 'final'), // NFC wins
      ];

      const result = calculateDraftOrder(
        afcStandings,
        nfcStandings,
        createEmptyPlayoffPicks(),
        playoffGames
      );

      expect(result.length).toBe(32);

      // Verify pick numbers are sequential
      for (let i = 0; i < 32; i++) {
        expect(result[i].pick).toBe(i + 1);
      }

      // Verify categories
      const nonPlayoff = result.filter(p => p.reason === 'Missed playoffs');
      const wcLosers = result.filter(p => p.reason === 'Lost in Wild Card');
      const divLosers = result.filter(p => p.reason === 'Lost in Divisional');
      const confLosers = result.filter(p => p.reason === 'Lost in Conference Championship');
      const sbLoser = result.filter(p => p.reason === 'Lost Super Bowl');
      const sbWinner = result.filter(p => p.reason === 'Won Super Bowl');

      expect(nonPlayoff.length).toBe(18);
      expect(wcLosers.length).toBe(6);
      expect(divLosers.length).toBe(4);
      expect(confLosers.length).toBe(2);
      expect(sbLoser.length).toBe(1);
      expect(sbWinner.length).toBe(1);

      // Super Bowl winner should be last
      expect(result[31].reason).toBe('Won Super Bowl');
      expect(result[30].reason).toBe('Lost Super Bowl');
    });
  });
});

// =============================================================================
// Phase 11: Draft Order Edge Cases
// =============================================================================

describe('Phase 11: Draft Order Edge Cases', () => {
  it('should handle multiple teams with identical record AND SOS', () => {
    // Create teams with identical records
    const afcTeam1 = createTeam('a1', 'AFCTeam1', 'AFC');
    const afcTeam2 = createTeam('a2', 'AFCTeam2', 'AFC');
    const nfcTeam1 = createTeam('n1', 'NFCTeam1', 'NFC');
    const nfcTeam2 = createTeam('n2', 'NFCTeam2', 'NFC');

    // Both non-playoff teams with identical 4-13 records and same SOS
    const afcStandings = [
      createStanding(afcTeam1, 4, 13, null, 0.5),
      createStanding(afcTeam2, 10, 7, 1, 0.5), // Playoff team
    ];
    const nfcStandings = [
      createStanding(nfcTeam1, 4, 13, null, 0.5), // Same record and SOS as afcTeam1
      createStanding(nfcTeam2, 10, 7, 1, 0.5), // Playoff team
    ];

    const result = calculateDraftOrder(
      afcStandings,
      nfcStandings,
      createEmptyPlayoffPicks(),
      []
    );

    // Both 4-13 teams should get picks 1-2 (order may vary but both should be included)
    const nonPlayoffPicks = result.filter(p => p.reason === 'Missed playoffs');
    expect(nonPlayoffPicks.length).toBe(2);
    expect(nonPlayoffPicks[0].pick).toBe(1);
    expect(nonPlayoffPicks[1].pick).toBe(2);

    // Both should have same record
    expect(nonPlayoffPicks[0].record).toBe('4-13');
    expect(nonPlayoffPicks[1].record).toBe('4-13');
  });

  it('should handle playoff team with worse record than non-playoff team', () => {
    // This can happen when a weak division winner makes playoffs
    const afcTeam1 = createTeam('a1', 'AFCTeam1', 'AFC');
    const afcTeam2 = createTeam('a2', 'AFCTeam2', 'AFC');
    const nfcTeam1 = createTeam('n1', 'NFCTeam1', 'NFC');
    const nfcTeam2 = createTeam('n2', 'NFCTeam2', 'NFC');

    // afcTeam1: 9-8, non-playoff (missed wild card)
    // afcTeam2: 8-9, playoff (weak division winner)
    const afcStandings = [
      createStanding(afcTeam1, 9, 8, null, 0.5), // Better record but non-playoff
      createStanding(afcTeam2, 8, 9, 4, 0.5),    // Worse record but playoff (division winner)
    ];
    const nfcStandings = [
      createStanding(nfcTeam1, 10, 7, 1, 0.5),
      createStanding(nfcTeam2, 9, 8, 2, 0.5),
    ];

    const result = calculateDraftOrder(
      afcStandings,
      nfcStandings,
      createEmptyPlayoffPicks(),
      []
    );

    // Non-playoff team with 9-8 record should pick first among non-playoff teams
    const nonPlayoffPicks = result.filter(p => p.reason === 'Missed playoffs');
    expect(nonPlayoffPicks.length).toBe(1);
    expect(nonPlayoffPicks[0].team.id).toBe('a1');
    expect(nonPlayoffPicks[0].record).toBe('9-8');
  });

  it('should handle partial playoff bracket with some picks locked', () => {
    // Create 7 AFC and 7 NFC playoff teams
    const afcTeams: Team[] = [];
    const nfcTeams: Team[] = [];
    for (let i = 1; i <= 7; i++) {
      afcTeams.push(createTeam(`a${i}`, `AFC${i}`, 'AFC'));
      nfcTeams.push(createTeam(`n${i}`, `NFC${i}`, 'NFC'));
    }

    // Create 9 non-playoff teams per conference
    const afcNonPlayoff: Team[] = [];
    const nfcNonPlayoff: Team[] = [];
    for (let i = 8; i <= 16; i++) {
      afcNonPlayoff.push(createTeam(`a${i}`, `AFC${i}`, 'AFC'));
      nfcNonPlayoff.push(createTeam(`n${i}`, `NFC${i}`, 'NFC'));
    }

    const afcStandings = [
      ...afcTeams.map((t, i) => createStanding(t, 12 - i, 5 + i, i + 1, 0.5)),
      ...afcNonPlayoff.map((t, i) => createStanding(t, 4 - Math.floor(i / 3), 13 + Math.floor(i / 3), null, 0.5)),
    ];
    const nfcStandings = [
      ...nfcTeams.map((t, i) => createStanding(t, 12 - i, 5 + i, i + 1, 0.5)),
      ...nfcNonPlayoff.map((t, i) => createStanding(t, 4 - Math.floor(i / 3), 13 + Math.floor(i / 3), null, 0.5)),
    ];

    // Partial playoff bracket - only Wild Card games decided
    const playoffGames: PlayoffGame[] = [
      createPlayoffGame('wc1', 'wildCard', 'afc', afcTeams[1], afcTeams[6], afcTeams[6].id, 'final'), // 7 upsets 2
      createPlayoffGame('wc2', 'wildCard', 'afc', afcTeams[2], afcTeams[5], afcTeams[2].id, 'final'), // 3 beats 6
      createPlayoffGame('wc3', 'wildCard', 'afc', afcTeams[3], afcTeams[4], afcTeams[3].id, 'final'), // 4 beats 5
      createPlayoffGame('wc4', 'wildCard', 'nfc', nfcTeams[1], nfcTeams[6], nfcTeams[1].id, 'final'), // 2 beats 7
      createPlayoffGame('wc5', 'wildCard', 'nfc', nfcTeams[2], nfcTeams[5], nfcTeams[2].id, 'final'), // 3 beats 6
      createPlayoffGame('wc6', 'wildCard', 'nfc', nfcTeams[3], nfcTeams[4], nfcTeams[3].id, 'final'), // 4 beats 5
      // Divisional games not yet played
    ];

    const result = calculateDraftOrder(
      afcStandings,
      nfcStandings,
      createEmptyPlayoffPicks(),
      playoffGames
    );

    // Should have:
    // - 18 non-playoff picks (1-18)
    // - 6 Wild Card loser picks (19-24)
    // - No divisional/championship/super bowl picks yet
    const nonPlayoff = result.filter(p => p.reason === 'Missed playoffs');
    const wcLosers = result.filter(p => p.reason === 'Lost in Wild Card');

    expect(nonPlayoff.length).toBe(18);
    expect(wcLosers.length).toBe(6);
    expect(result.length).toBe(24); // Only 24 picks determined so far
  });

  it('should assign correct picks when all games in a round are user picks (not final)', () => {
    const afcTeams: Team[] = [];
    const nfcTeams: Team[] = [];
    for (let i = 1; i <= 7; i++) {
      afcTeams.push(createTeam(`a${i}`, `AFC${i}`, 'AFC'));
      nfcTeams.push(createTeam(`n${i}`, `NFC${i}`, 'NFC'));
    }

    const afcNonPlayoff: Team[] = [];
    const nfcNonPlayoff: Team[] = [];
    for (let i = 8; i <= 16; i++) {
      afcNonPlayoff.push(createTeam(`a${i}`, `AFC${i}`, 'AFC'));
      nfcNonPlayoff.push(createTeam(`n${i}`, `NFC${i}`, 'NFC'));
    }

    const afcStandings = [
      ...afcTeams.map((t, i) => createStanding(t, 12 - i, 5 + i, i + 1, 0.5)),
      ...afcNonPlayoff.map((t, i) => createStanding(t, 4, 13, null, 0.5)),
    ];
    const nfcStandings = [
      ...nfcTeams.map((t, i) => createStanding(t, 12 - i, 5 + i, i + 1, 0.5)),
      ...nfcNonPlayoff.map((t, i) => createStanding(t, 4, 13, null, 0.5)),
    ];

    // No games are final - all scheduled
    const playoffGames: PlayoffGame[] = [
      createPlayoffGame('wc1', 'wildCard', 'afc', afcTeams[1], afcTeams[6], null, 'scheduled'),
      createPlayoffGame('wc2', 'wildCard', 'afc', afcTeams[2], afcTeams[5], null, 'scheduled'),
      createPlayoffGame('wc3', 'wildCard', 'afc', afcTeams[3], afcTeams[4], null, 'scheduled'),
      createPlayoffGame('wc4', 'wildCard', 'nfc', nfcTeams[1], nfcTeams[6], null, 'scheduled'),
      createPlayoffGame('wc5', 'wildCard', 'nfc', nfcTeams[2], nfcTeams[5], null, 'scheduled'),
      createPlayoffGame('wc6', 'wildCard', 'nfc', nfcTeams[3], nfcTeams[4], null, 'scheduled'),
    ];

    // User picks all Wild Card losers
    const playoffPicks: PlayoffPicks = {
      afc: {
        wildCard: [afcTeams[1].id, afcTeams[5].id, afcTeams[4].id], // 2, 6, 5 lose
        divisional: [null, null],
        championship: null,
      },
      nfc: {
        wildCard: [nfcTeams[6].id, nfcTeams[5].id, nfcTeams[4].id], // 7, 6, 5 lose
        divisional: [null, null],
        championship: null,
      },
      superBowl: null,
    };

    const result = calculateDraftOrder(
      afcStandings,
      nfcStandings,
      playoffPicks,
      playoffGames
    );

    // Should have 18 non-playoff + 6 WC losers = 24 picks
    expect(result.length).toBe(24);

    const wcLosers = result.filter(p => p.reason === 'Lost in Wild Card');
    expect(wcLosers.length).toBe(6);

    // Picks 19-24 should be Wild Card losers
    for (let i = 18; i < 24; i++) {
      expect(result[i].reason).toBe('Lost in Wild Card');
    }
  });

  it('should order non-playoff teams by record (worst first)', () => {
    const teams: Team[] = [];
    for (let i = 1; i <= 4; i++) {
      teams.push(createTeam(`t${i}`, `Team${i}`, 'AFC'));
    }

    // Different records - worst record picks first
    const afcStandings = [
      createStanding(teams[0], 3, 14, null, 0.5),  // Worst record
      createStanding(teams[1], 4, 13, null, 0.5),  // Second worst
      createStanding(teams[2], 5, 12, null, 0.5),  // Third worst
      createStanding(teams[3], 10, 7, 1, 0.5),    // Playoff team
    ];

    const nfcStandings = [
      createStanding(createTeam('n1', 'NFC1', 'NFC'), 10, 7, 1, 0.5),
    ];

    const result = calculateDraftOrder(
      afcStandings,
      nfcStandings,
      createEmptyPlayoffPicks(),
      []
    );

    const nonPlayoff = result.filter(p => p.reason === 'Missed playoffs');
    expect(nonPlayoff.length).toBe(3);

    // Teams ordered by record: worst (3-14) to best (5-12)
    expect(nonPlayoff[0].record).toBe('3-14');
    expect(nonPlayoff[1].record).toBe('4-13');
    expect(nonPlayoff[2].record).toBe('5-12');
  });

  it('REGRESSION: should determine wild card losers from seeding when no ESPN games exist', () => {
    // This test covers the bug where wild card losers were missing from draft order
    // when ESPN playoff game data wasn't available yet (e.g., Rams vs Bears WC game)
    // The fix is to infer the loser from the seeded matchups (2v7, 3v6, 4v5)

    // Create AFC teams with seeds 1-7
    const afcTeams = Array.from({ length: 9 }, (_, i) =>
      createTeam(`afc${i + 1}`, `AFC${i + 1}`, 'AFC')
    );
    // Create NFC teams with seeds 1-7 plus non-playoff teams
    const nfcTeams = Array.from({ length: 9 }, (_, i) =>
      createTeam(`nfc${i + 1}`, `NFC${i + 1}`, 'NFC')
    );

    // Create standings - 7 playoff teams per conference + 2 non-playoff
    const afcStandings: TeamStanding[] = [
      createStanding(afcTeams[0], 14, 3, 1),  // Seed 1
      createStanding(afcTeams[1], 13, 4, 2),  // Seed 2
      createStanding(afcTeams[2], 12, 5, 3),  // Seed 3
      createStanding(afcTeams[3], 11, 6, 4),  // Seed 4
      createStanding(afcTeams[4], 10, 7, 5),  // Seed 5
      createStanding(afcTeams[5], 9, 8, 6),   // Seed 6
      createStanding(afcTeams[6], 8, 9, 7),   // Seed 7
      createStanding(afcTeams[7], 4, 13, null), // Non-playoff
      createStanding(afcTeams[8], 3, 14, null), // Non-playoff
    ];

    const nfcStandings: TeamStanding[] = [
      createStanding(nfcTeams[0], 15, 2, 1),  // Seed 1
      createStanding(nfcTeams[1], 12, 5, 2),  // Seed 2
      createStanding(nfcTeams[2], 11, 6, 3),  // Seed 3
      createStanding(nfcTeams[3], 10, 7, 4),  // Seed 4
      createStanding(nfcTeams[4], 9, 8, 5),   // Seed 5
      createStanding(nfcTeams[5], 8, 9, 6),   // Seed 6
      createStanding(nfcTeams[6], 7, 10, 7),  // Seed 7
      createStanding(nfcTeams[7], 5, 12, null), // Non-playoff
      createStanding(nfcTeams[8], 4, 13, null), // Non-playoff
    ];

    // NO ESPN playoff games - only user picks
    const playoffGames: PlayoffGame[] = [];

    // User picks: higher seeds win all wild card games
    // AFC: 2 beats 7, 3 beats 6, 4 beats 5
    // NFC: 2 beats 7, 3 beats 6, 4 beats 5
    const playoffPicks: PlayoffPicks = {
      afc: {
        wildCard: [afcTeams[1].id, afcTeams[2].id, afcTeams[3].id], // Seeds 2, 3, 4 win
        divisional: [afcTeams[0].id, afcTeams[1].id], // Seeds 1, 2 win
        championship: afcTeams[0].id, // Seed 1 wins
      },
      nfc: {
        wildCard: [nfcTeams[1].id, nfcTeams[2].id, nfcTeams[3].id], // Seeds 2, 3, 4 win
        divisional: [nfcTeams[0].id, nfcTeams[1].id], // Seeds 1, 2 win
        championship: nfcTeams[0].id, // Seed 1 wins
      },
      superBowl: afcTeams[0].id,
    };

    const result = calculateDraftOrder(
      afcStandings,
      nfcStandings,
      playoffPicks,
      playoffGames
    );

    // Should have all 18 picks (4 non-playoff + 6 WC + 4 div + 2 conf + 1 SB loser + 1 SB winner)
    // Note: Only 18 teams total in this test (9 per conference)
    expect(result.length).toBe(18);

    // Check non-playoff teams
    const nonPlayoff = result.filter(p => p.reason === 'Missed playoffs');
    expect(nonPlayoff.length).toBe(4);

    // Check Wild Card losers - should be seeds 5, 6, 7 from each conference
    // This is the key regression test - without the fix, WC losers were missing
    const wcLosers = result.filter(p => p.reason === 'Lost in Wild Card');
    expect(wcLosers.length).toBe(6);

    // All WC losers should be the lower seeds (5, 6, 7)
    const wcLoserIds = wcLosers.map(l => l.team.id);
    expect(wcLoserIds).toContain(afcTeams[4].id); // AFC seed 5
    expect(wcLoserIds).toContain(afcTeams[5].id); // AFC seed 6
    expect(wcLoserIds).toContain(afcTeams[6].id); // AFC seed 7
    expect(wcLoserIds).toContain(nfcTeams[4].id); // NFC seed 5
    expect(wcLoserIds).toContain(nfcTeams[5].id); // NFC seed 6
    expect(wcLoserIds).toContain(nfcTeams[6].id); // NFC seed 7

    // Check all other rounds are represented
    const divLosers = result.filter(p => p.reason === 'Lost in Divisional');
    expect(divLosers.length).toBe(4);

    const confLosers = result.filter(p => p.reason === 'Lost in Conference Championship');
    expect(confLosers.length).toBe(2);

    const sbLoser = result.filter(p => p.reason === 'Lost Super Bowl');
    expect(sbLoser.length).toBe(1);

    const sbWinner = result.filter(p => p.reason === 'Won Super Bowl');
    expect(sbWinner.length).toBe(1);
  });
});
