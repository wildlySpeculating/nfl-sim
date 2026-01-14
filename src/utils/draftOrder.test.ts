import { describe, it, expect } from 'vitest';
import { calculateDraftOrder } from './draftOrder';
import type { TeamStanding, PlayoffPicks, Team } from '@/types';
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
      expect(result[0].reason).toBe('Did not make playoffs');
      expect(result[1].reason).toBe('Did not make playoffs');
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
      const nonPlayoff = result.filter(p => p.reason === 'Did not make playoffs');
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
