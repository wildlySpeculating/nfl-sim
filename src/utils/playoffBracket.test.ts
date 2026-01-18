import { describe, it, expect } from 'vitest';
import { buildBracketFromGames, type TeamWithSeed, type PlayoffPicks } from './playoffBracket';
import type { PlayoffGame } from '@/hooks/useEspnApi';
import { getTeamById } from '@/data/teams';

// Helper to create TeamWithSeed
function createTeamWithSeed(teamId: string, seed: number): TeamWithSeed {
  const team = getTeamById(teamId);
  if (!team) throw new Error(`Team ${teamId} not found`);
  return { team, seed };
}

// Helper to create a playoff game
function createPlayoffGame(
  homeTeamId: string,
  awayTeamId: string,
  round: PlayoffGame['round'],
  conference: 'afc' | 'nfc' | null,
  status: 'scheduled' | 'in_progress' | 'final' = 'scheduled',
  winnerId: string | null = null,
  homeScore: number | null = null,
  awayScore: number | null = null
): PlayoffGame {
  const homeTeam = getTeamById(homeTeamId);
  const awayTeam = getTeamById(awayTeamId);
  if (!homeTeam || !awayTeam) throw new Error('Team not found');

  return {
    id: `${round}-${homeTeamId}-${awayTeamId}`,
    round,
    conference,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    status,
    winnerId,
  };
}

describe('buildBracketFromGames', () => {
  // Create sample AFC seeds for testing (using real team IDs)
  const afcSeeds: TeamWithSeed[] = [
    createTeamWithSeed('14', 1), // KC Chiefs
    createTeamWithSeed('1', 2),  // Buffalo Bills
    createTeamWithSeed('8', 3),  // Pittsburgh Steelers
    createTeamWithSeed('13', 4), // Denver Broncos
    createTeamWithSeed('9', 5),  // Houston Texans
    createTeamWithSeed('16', 6), // LA Chargers
    createTeamWithSeed('5', 7),  // Baltimore Ravens
  ];

  // Create sample NFC seeds
  const nfcSeeds: TeamWithSeed[] = [
    createTeamWithSeed('22', 1), // Detroit Lions
    createTeamWithSeed('19', 2), // Philadelphia Eagles
    createTeamWithSeed('32', 3), // Seattle Seahawks
    createTeamWithSeed('30', 4), // LA Rams
    createTeamWithSeed('24', 5), // Minnesota Vikings
    createTeamWithSeed('23', 6), // Green Bay Packers
    createTeamWithSeed('20', 7), // Washington Commanders
  ];

  const emptyPicks: PlayoffPicks = {
    wildCard: [null, null, null],
    divisional: [null, null],
    championship: null,
  };

  describe('Wild Card Round', () => {
    it('should create wild card matchups from standings when no games exist', () => {
      const result = buildBracketFromGames(
        { wildCard: [], divisional: [], championship: [] },
        emptyPicks,
        afcSeeds
      );

      // 2v7, 3v6, 4v5
      expect(result.wildCardMatchups[0][0]?.seed).toBe(2);
      expect(result.wildCardMatchups[0][1]?.seed).toBe(7);
      expect(result.wildCardMatchups[1][0]?.seed).toBe(3);
      expect(result.wildCardMatchups[1][1]?.seed).toBe(6);
      expect(result.wildCardMatchups[2][0]?.seed).toBe(4);
      expect(result.wildCardMatchups[2][1]?.seed).toBe(5);
    });

    it('should use actual playoff games when available', () => {
      const wcGames: PlayoffGame[] = [
        createPlayoffGame('1', '5', 'wildCard', 'afc'),   // Bills vs Ravens
        createPlayoffGame('8', '16', 'wildCard', 'afc'),  // Steelers vs Chargers
        createPlayoffGame('13', '9', 'wildCard', 'afc'),  // Broncos vs Texans
      ];

      const result = buildBracketFromGames(
        { wildCard: wcGames, divisional: [], championship: [] },
        emptyPicks,
        afcSeeds
      );

      expect(result.wildCardMatchups[0][0]?.team.id).toBe('1'); // Bills
      expect(result.wildCardMatchups[0][1]?.team.id).toBe('5'); // Ravens
    });

    it('should determine wild card winners from game results', () => {
      const wcGames: PlayoffGame[] = [
        createPlayoffGame('1', '5', 'wildCard', 'afc', 'final', '1', 28, 14),   // Bills win
        createPlayoffGame('8', '16', 'wildCard', 'afc', 'final', '8', 21, 17),  // Steelers win
        createPlayoffGame('13', '9', 'wildCard', 'afc', 'final', '13', 31, 24), // Broncos win
      ];

      const result = buildBracketFromGames(
        { wildCard: wcGames, divisional: [], championship: [] },
        emptyPicks,
        afcSeeds
      );

      expect(result.wildCardWinners[0]?.team.id).toBe('1');  // Bills
      expect(result.wildCardWinners[1]?.team.id).toBe('8');  // Steelers
      expect(result.wildCardWinners[2]?.team.id).toBe('13'); // Broncos
    });

    it('should use picks when games have no winner', () => {
      const wcGames: PlayoffGame[] = [
        createPlayoffGame('1', '5', 'wildCard', 'afc'),  // Bills vs Ravens - scheduled
      ];

      const picks: PlayoffPicks = {
        wildCard: ['5', null, null], // User picked Ravens
        divisional: [null, null],
        championship: null,
      };

      const result = buildBracketFromGames(
        { wildCard: wcGames, divisional: [], championship: [] },
        picks,
        afcSeeds
      );

      expect(result.wildCardWinners[0]?.team.id).toBe('5'); // Ravens (picked)
    });
  });

  describe('Divisional Round', () => {
    it('should build divisional matchups from wild card winners + 1 seed', () => {
      const picks: PlayoffPicks = {
        wildCard: ['1', '8', '13'], // Bills, Steelers, Broncos win
        divisional: [null, null],
        championship: null,
      };

      const result = buildBracketFromGames(
        { wildCard: [], divisional: [], championship: [] },
        picks,
        afcSeeds
      );

      // 1 seed vs lowest winner (seed 4 -> Broncos)
      // Actually sorted: Chiefs(1), Bills(2), Steelers(3), Broncos(4)
      // Matchup 1: Chiefs(1) vs Broncos(4)
      // Matchup 2: Bills(2) vs Steelers(3)
      expect(result.divisionalMatchups[0][0]?.seed).toBe(1); // Chiefs
      expect(result.divisionalMatchups[0][1]?.seed).toBe(4); // Broncos (lowest seed winner)
      expect(result.divisionalMatchups[1][0]?.seed).toBe(2); // Bills
      expect(result.divisionalMatchups[1][1]?.seed).toBe(3); // Steelers
    });

    it('should use actual divisional games when available', () => {
      const divGames: PlayoffGame[] = [
        createPlayoffGame('14', '13', 'divisional', 'afc', 'final', '13', 24, 20), // Broncos beat Chiefs
        createPlayoffGame('1', '8', 'divisional', 'afc', 'final', '1', 35, 21),    // Bills beat Steelers
      ];

      const result = buildBracketFromGames(
        { wildCard: [], divisional: divGames, championship: [] },
        emptyPicks,
        afcSeeds
      );

      expect(result.divisionalWinners[0]?.team.id).toBe('13'); // Broncos
      expect(result.divisionalWinners[1]?.team.id).toBe('1');  // Bills
    });

    it('should use wild card winners even when divisional games exist with different teams', () => {
      // Wild card games completed with winners
      const wcGames: PlayoffGame[] = [
        createPlayoffGame('1', '5', 'wildCard', 'afc', 'final', '1', 28, 14),   // Bills beat Ravens
        createPlayoffGame('8', '16', 'wildCard', 'afc', 'final', '8', 21, 17),  // Steelers beat Chargers
        createPlayoffGame('13', '9', 'wildCard', 'afc', 'final', '13', 31, 24), // Broncos beat Texans
      ];

      // ESPN divisional games have wrong teams (maybe from last year or placeholders)
      const divGames: PlayoffGame[] = [
        createPlayoffGame('14', '5', 'divisional', 'afc'),   // Chiefs vs Ravens (wrong - Ravens lost!)
        createPlayoffGame('1', '16', 'divisional', 'afc'),   // Bills vs Chargers (wrong - Chargers lost!)
      ];

      const result = buildBracketFromGames(
        { wildCard: wcGames, divisional: divGames, championship: [] },
        emptyPicks,
        afcSeeds
      );

      // Should use wild card winners, not ESPN's wrong divisional teams
      // Chiefs(1) vs Broncos(4), Bills(2) vs Steelers(3)
      expect(result.divisionalMatchups[0][0]?.team.id).toBe('14'); // Chiefs
      expect(result.divisionalMatchups[0][1]?.team.id).toBe('13'); // Broncos (wild card winner)
      expect(result.divisionalMatchups[1][0]?.team.id).toBe('1');  // Bills (wild card winner)
      expect(result.divisionalMatchups[1][1]?.team.id).toBe('8');  // Steelers (wild card winner)
    });

    it('should use ESPN divisional teams only when wild card not decided', () => {
      // Wild card games scheduled but not decided
      const wcGames: PlayoffGame[] = [
        createPlayoffGame('1', '5', 'wildCard', 'afc'),  // Bills vs Ravens - scheduled
        createPlayoffGame('8', '16', 'wildCard', 'afc'), // Steelers vs Chargers - scheduled
        createPlayoffGame('13', '9', 'wildCard', 'afc'), // Broncos vs Texans - scheduled
      ];

      // Divisional games have teams (from seeding predictions)
      const divGames: PlayoffGame[] = [
        createPlayoffGame('14', '9', 'divisional', 'afc'),  // Chiefs vs Texans
        createPlayoffGame('1', '8', 'divisional', 'afc'),   // Bills vs Steelers
      ];

      const result = buildBracketFromGames(
        { wildCard: wcGames, divisional: divGames, championship: [] },
        emptyPicks,
        afcSeeds
      );

      // Should use ESPN divisional teams since wild card isn't decided
      expect(result.divisionalMatchups[0][0]?.team.id).toBe('14'); // Chiefs
      expect(result.divisionalMatchups[0][1]?.team.id).toBe('9');  // Texans
      expect(result.divisionalMatchups[1][0]?.team.id).toBe('1');  // Bills
      expect(result.divisionalMatchups[1][1]?.team.id).toBe('8');  // Steelers
    });

    it('should apply divisional pick against wild card winners', () => {
      // Wild card games completed
      const wcGames: PlayoffGame[] = [
        createPlayoffGame('1', '5', 'wildCard', 'afc', 'final', '1', 28, 14),   // Bills win
        createPlayoffGame('8', '16', 'wildCard', 'afc', 'final', '8', 21, 17),  // Steelers win
        createPlayoffGame('13', '9', 'wildCard', 'afc', 'final', '13', 31, 24), // Broncos win
      ];

      // Divisional games scheduled (with potentially wrong ESPN teams)
      const divGames: PlayoffGame[] = [
        createPlayoffGame('14', '5', 'divisional', 'afc'),  // Wrong teams
        createPlayoffGame('1', '16', 'divisional', 'afc'),  // Wrong teams
      ];

      const picks: PlayoffPicks = {
        wildCard: [null, null, null],
        divisional: ['13', '1'], // User picked Broncos and Bills
        championship: null,
      };

      const result = buildBracketFromGames(
        { wildCard: wcGames, divisional: divGames, championship: [] },
        picks,
        afcSeeds
      );

      // Picks should match against the correct divisional matchups (from wild card winners)
      expect(result.divisionalWinners[0]?.team.id).toBe('13'); // Broncos (picked)
      expect(result.divisionalWinners[1]?.team.id).toBe('1');  // Bills (picked)
    });
  });

  describe('Championship Round - Team Advancement', () => {
    it('should advance divisional winners to championship matchup', () => {
      const divGames: PlayoffGame[] = [
        createPlayoffGame('14', '13', 'divisional', 'afc', 'final', '13', 24, 20), // Broncos beat Chiefs
        createPlayoffGame('1', '8', 'divisional', 'afc', 'final', '1', 35, 21),    // Bills beat Steelers
      ];

      const result = buildBracketFromGames(
        { wildCard: [], divisional: divGames, championship: [] },
        emptyPicks,
        afcSeeds
      );

      // Championship should have Bills (seed 2) and Broncos (seed 4)
      // Sorted by seed: Bills first, then Broncos
      expect(result.championshipMatchup[0]?.team.id).toBe('1');  // Bills (seed 2)
      expect(result.championshipMatchup[1]?.team.id).toBe('13'); // Broncos (seed 4)
    });

    it('should use divisional winners even when championship games exist with different teams', () => {
      // This is the critical test - ESPN might have old/placeholder championship teams
      const divGames: PlayoffGame[] = [
        createPlayoffGame('14', '13', 'divisional', 'afc', 'final', '13', 24, 20), // Broncos beat Chiefs
        createPlayoffGame('1', '8', 'divisional', 'afc', 'final', '1', 35, 21),    // Bills beat Steelers
      ];

      // Championship game from ESPN has wrong teams (maybe from last year or placeholders)
      const champGames: PlayoffGame[] = [
        createPlayoffGame('14', '8', 'championship', 'afc'), // Chiefs vs Steelers (wrong!)
      ];

      const result = buildBracketFromGames(
        { wildCard: [], divisional: divGames, championship: champGames },
        emptyPicks,
        afcSeeds
      );

      // Should still show Bills and Broncos (the actual divisional winners)
      expect(result.championshipMatchup[0]?.team.id).toBe('1');  // Bills
      expect(result.championshipMatchup[1]?.team.id).toBe('13'); // Broncos
    });

    it('should use ESPN championship teams only when divisional not decided', () => {
      // Divisional games scheduled but not decided
      const divGames: PlayoffGame[] = [
        createPlayoffGame('14', '13', 'divisional', 'afc'),  // Scheduled
        createPlayoffGame('1', '8', 'divisional', 'afc'),    // Scheduled
      ];

      // Championship already has teams (from seeding)
      const champGames: PlayoffGame[] = [
        createPlayoffGame('14', '1', 'championship', 'afc'),
      ];

      const result = buildBracketFromGames(
        { wildCard: [], divisional: divGames, championship: champGames },
        emptyPicks,
        afcSeeds
      );

      // Should use ESPN championship teams since divisional isn't decided
      expect(result.championshipMatchup[0]?.team.id).toBe('14'); // Chiefs
      expect(result.championshipMatchup[1]?.team.id).toBe('1');  // Bills
    });

    it('should apply championship winner from game result', () => {
      const divGames: PlayoffGame[] = [
        createPlayoffGame('14', '13', 'divisional', 'afc', 'final', '13', 24, 20),
        createPlayoffGame('1', '8', 'divisional', 'afc', 'final', '1', 35, 21),
      ];

      const champGames: PlayoffGame[] = [
        createPlayoffGame('1', '13', 'championship', 'afc', 'final', '1', 28, 21), // Bills win
      ];

      const result = buildBracketFromGames(
        { wildCard: [], divisional: divGames, championship: champGames },
        emptyPicks,
        afcSeeds
      );

      expect(result.champion?.team.id).toBe('1'); // Bills
    });

    it('should apply championship pick against divisional winners', () => {
      const divGames: PlayoffGame[] = [
        createPlayoffGame('14', '13', 'divisional', 'afc', 'final', '13', 24, 20),
        createPlayoffGame('1', '8', 'divisional', 'afc', 'final', '1', 35, 21),
      ];

      // Championship game scheduled
      const champGames: PlayoffGame[] = [
        createPlayoffGame('1', '13', 'championship', 'afc'), // Bills vs Broncos (matches divisional winners)
      ];

      const picks: PlayoffPicks = {
        wildCard: [null, null, null],
        divisional: [null, null],
        championship: '13', // User picked Broncos
      };

      const result = buildBracketFromGames(
        { wildCard: [], divisional: divGames, championship: champGames },
        picks,
        afcSeeds
      );

      expect(result.champion?.team.id).toBe('13'); // Broncos (picked)
    });
  });

  describe('NFC Bracket - Real World Scenario', () => {
    it('should advance Seattle correctly after divisional win', () => {
      // Seattle (seed 3) beats LA Rams (seed 4) in divisional
      const divGames: PlayoffGame[] = [
        createPlayoffGame('22', '24', 'divisional', 'nfc', 'final', '22', 28, 14), // Lions beat Vikings
        createPlayoffGame('32', '30', 'divisional', 'nfc', 'final', '32', 21, 17), // Seahawks beat Rams
      ];

      const result = buildBracketFromGames(
        { wildCard: [], divisional: divGames, championship: [] },
        emptyPicks,
        nfcSeeds
      );

      // Lions (seed 1) and Seahawks (seed 3) in championship
      expect(result.championshipMatchup[0]?.team.id).toBe('22'); // Lions
      expect(result.championshipMatchup[1]?.team.id).toBe('32'); // Seahawks
    });
  });

  describe('AFC Bracket - Denver Advancement', () => {
    it('should advance Denver correctly after divisional win', () => {
      // Denver (seed 4) beats Chiefs (seed 1) in divisional
      const divGames: PlayoffGame[] = [
        createPlayoffGame('14', '13', 'divisional', 'afc', 'final', '13', 24, 20), // Broncos beat Chiefs
        createPlayoffGame('1', '8', 'divisional', 'afc', 'final', '1', 35, 21),    // Bills beat Steelers
      ];

      const result = buildBracketFromGames(
        { wildCard: [], divisional: divGames, championship: [] },
        emptyPicks,
        afcSeeds
      );

      // Bills (seed 2) and Broncos (seed 4) in championship
      expect(result.championshipMatchup[0]?.team.id).toBe('1');  // Bills
      expect(result.championshipMatchup[1]?.team.id).toBe('13'); // Broncos
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty conference games', () => {
      const result = buildBracketFromGames(
        { wildCard: [], divisional: [], championship: [] },
        emptyPicks,
        afcSeeds
      );

      expect(result.wildCardMatchups).toHaveLength(3);
      expect(result.divisionalMatchups).toHaveLength(2);
      expect(result.championshipMatchup).toHaveLength(2);
    });

    it('should handle missing seeds gracefully', () => {
      const result = buildBracketFromGames(
        { wildCard: [], divisional: [], championship: [] },
        emptyPicks,
        [] // No seeds!
      );

      expect(result.wildCardMatchups[0][0]).toBe(null);
      expect(result.wildCardMatchups[0][1]).toBe(null);
    });

    it('should handle partial divisional completion', () => {
      const divGames: PlayoffGame[] = [
        createPlayoffGame('14', '13', 'divisional', 'afc', 'final', '13', 24, 20), // Broncos won
        createPlayoffGame('1', '8', 'divisional', 'afc'), // Bills vs Steelers - not decided
      ];

      const result = buildBracketFromGames(
        { wildCard: [], divisional: divGames, championship: [] },
        emptyPicks,
        afcSeeds
      );

      // Divisional not all decided, so championship matchup should be [null, null]
      expect(result.divisionalWinners[0]?.team.id).toBe('13'); // Broncos won
      expect(result.divisionalWinners[1]).toBe(null); // Not decided
      expect(result.championshipMatchup[0]).toBe(null);
      expect(result.championshipMatchup[1]).toBe(null);
    });
  });

  describe('Winner Matching - Critical Bug Fixes', () => {
    it('should match divisional winnerId against computed matchups, not ESPN game teams', () => {
      // Wild card completed: Bills, Steelers, Broncos won
      const wcGames: PlayoffGame[] = [
        createPlayoffGame('1', '5', 'wildCard', 'afc', 'final', '1', 28, 14),   // Bills beat Ravens
        createPlayoffGame('8', '16', 'wildCard', 'afc', 'final', '8', 21, 17),  // Steelers beat Chargers
        createPlayoffGame('13', '9', 'wildCard', 'afc', 'final', '13', 31, 24), // Broncos beat Texans
      ];

      // ESPN divisional games have COMPLETELY WRONG teams (stale data from last year)
      // But the winnerId is CORRECT (matches the actual winner)
      const divGames: PlayoffGame[] = [
        // ESPN says "Ravens vs Texans" but winnerId='13' (Broncos - who actually won)
        createPlayoffGame('5', '9', 'divisional', 'afc', 'final', '13', 24, 20),
        // ESPN says "Chargers vs Bengals" but winnerId='1' (Bills - who actually won)
        createPlayoffGame('16', '6', 'divisional', 'afc', 'final', '1', 35, 21),
      ];

      const result = buildBracketFromGames(
        { wildCard: wcGames, divisional: divGames, championship: [] },
        emptyPicks,
        afcSeeds
      );

      // Computed divisional matchups from wild card winners:
      // Matchup 0: Chiefs(1) vs Broncos(4)
      // Matchup 1: Bills(2) vs Steelers(3)
      expect(result.divisionalMatchups[0][0]?.team.id).toBe('14'); // Chiefs
      expect(result.divisionalMatchups[0][1]?.team.id).toBe('13'); // Broncos
      expect(result.divisionalMatchups[1][0]?.team.id).toBe('1');  // Bills
      expect(result.divisionalMatchups[1][1]?.team.id).toBe('8');  // Steelers

      // Winners should be matched correctly despite ESPN having wrong teams
      expect(result.divisionalWinners[0]?.team.id).toBe('13'); // Broncos won (matched to matchup 0)
      expect(result.divisionalWinners[1]?.team.id).toBe('1');  // Bills won (matched to matchup 1)

      // Championship should show the correct winners
      expect(result.championshipMatchup[0]?.team.id).toBe('1');  // Bills (seed 2)
      expect(result.championshipMatchup[1]?.team.id).toBe('13'); // Broncos (seed 4)
    });

    it('should handle ESPN divisional games in different order than computed matchups', () => {
      // Wild card completed
      const wcGames: PlayoffGame[] = [
        createPlayoffGame('1', '5', 'wildCard', 'afc', 'final', '1', 28, 14),
        createPlayoffGame('8', '16', 'wildCard', 'afc', 'final', '8', 21, 17),
        createPlayoffGame('13', '9', 'wildCard', 'afc', 'final', '13', 31, 24),
      ];

      // ESPN divisional games in REVERSE order compared to our computed matchups
      // Our computed: [Chiefs vs Broncos, Bills vs Steelers]
      // ESPN order: [Bills vs Steelers, Chiefs vs Broncos]
      const divGames: PlayoffGame[] = [
        createPlayoffGame('1', '8', 'divisional', 'afc', 'final', '1', 35, 21),    // Bills beat Steelers
        createPlayoffGame('14', '13', 'divisional', 'afc', 'final', '13', 24, 20), // Broncos beat Chiefs
      ];

      const result = buildBracketFromGames(
        { wildCard: wcGames, divisional: divGames, championship: [] },
        emptyPicks,
        afcSeeds
      );

      // Winners should be assigned to correct matchups regardless of ESPN order
      expect(result.divisionalWinners[0]?.team.id).toBe('13'); // Broncos (matchup 0: Chiefs vs Broncos)
      expect(result.divisionalWinners[1]?.team.id).toBe('1');  // Bills (matchup 1: Bills vs Steelers)
    });

    it('should match championship winnerId against computed matchup, not ESPN game teams', () => {
      // Divisional completed
      const divGames: PlayoffGame[] = [
        createPlayoffGame('14', '13', 'divisional', 'afc', 'final', '13', 24, 20), // Broncos beat Chiefs
        createPlayoffGame('1', '8', 'divisional', 'afc', 'final', '1', 35, 21),    // Bills beat Steelers
      ];

      // ESPN championship game has WRONG teams but correct winnerId
      const champGames: PlayoffGame[] = [
        // ESPN says "Chiefs vs Steelers" but winnerId='1' (Bills - who actually won)
        createPlayoffGame('14', '8', 'championship', 'afc', 'final', '1', 28, 21),
      ];

      const result = buildBracketFromGames(
        { wildCard: [], divisional: divGames, championship: champGames },
        emptyPicks,
        afcSeeds
      );

      // Championship matchup should be from divisional winners
      expect(result.championshipMatchup[0]?.team.id).toBe('1');  // Bills
      expect(result.championshipMatchup[1]?.team.id).toBe('13'); // Broncos

      // Champion should be matched correctly
      expect(result.champion?.team.id).toBe('1'); // Bills
    });

    it('should handle full playoff flow with ESPN having stale data at every round', () => {
      // Wild card games - ESPN has correct data here
      const wcGames: PlayoffGame[] = [
        createPlayoffGame('1', '5', 'wildCard', 'afc', 'final', '1', 28, 14),   // Bills beat Ravens
        createPlayoffGame('8', '16', 'wildCard', 'afc', 'final', '8', 21, 17),  // Steelers beat Chargers
        createPlayoffGame('13', '9', 'wildCard', 'afc', 'final', '13', 31, 24), // Broncos beat Texans
      ];

      // ESPN divisional games have wrong teams but correct winnerIds
      const divGames: PlayoffGame[] = [
        createPlayoffGame('5', '9', 'divisional', 'afc', 'final', '13', 24, 20), // Wrong teams, but Broncos won
        createPlayoffGame('16', '6', 'divisional', 'afc', 'final', '1', 35, 21), // Wrong teams, but Bills won
      ];

      // ESPN championship game has wrong teams but correct winnerId
      const champGames: PlayoffGame[] = [
        createPlayoffGame('14', '8', 'championship', 'afc', 'final', '13', 28, 21), // Wrong teams, but Broncos won
      ];

      const result = buildBracketFromGames(
        { wildCard: wcGames, divisional: divGames, championship: champGames },
        emptyPicks,
        afcSeeds
      );

      // Wild card winners
      expect(result.wildCardWinners[0]?.team.id).toBe('1');  // Bills
      expect(result.wildCardWinners[1]?.team.id).toBe('8');  // Steelers
      expect(result.wildCardWinners[2]?.team.id).toBe('13'); // Broncos

      // Divisional matchups from wild card winners
      expect(result.divisionalMatchups[0][0]?.team.id).toBe('14'); // Chiefs (bye)
      expect(result.divisionalMatchups[0][1]?.team.id).toBe('13'); // Broncos
      expect(result.divisionalMatchups[1][0]?.team.id).toBe('1');  // Bills
      expect(result.divisionalMatchups[1][1]?.team.id).toBe('8');  // Steelers

      // Divisional winners matched correctly
      expect(result.divisionalWinners[0]?.team.id).toBe('13'); // Broncos
      expect(result.divisionalWinners[1]?.team.id).toBe('1');  // Bills

      // Championship from divisional winners
      expect(result.championshipMatchup[0]?.team.id).toBe('1');  // Bills (seed 2)
      expect(result.championshipMatchup[1]?.team.id).toBe('13'); // Broncos (seed 4)

      // Champion matched correctly
      expect(result.champion?.team.id).toBe('13'); // Broncos
    });

    it('should handle NFC scenario - Seattle advancing correctly', () => {
      // Wild card games for NFC
      const wcGames: PlayoffGame[] = [
        createPlayoffGame('19', '20', 'wildCard', 'nfc', 'final', '19', 28, 14), // Eagles beat Commanders
        createPlayoffGame('32', '23', 'wildCard', 'nfc', 'final', '32', 21, 17), // Seahawks beat Packers
        createPlayoffGame('30', '24', 'wildCard', 'nfc', 'final', '30', 31, 24), // Rams beat Vikings
      ];

      // ESPN divisional has wrong teams but Seattle (32) won
      const divGames: PlayoffGame[] = [
        // ESPN might have old teams, but winnerId='22' (Lions)
        createPlayoffGame('20', '24', 'divisional', 'nfc', 'final', '22', 24, 20),
        // ESPN might have old teams, but winnerId='32' (Seahawks)
        createPlayoffGame('23', '20', 'divisional', 'nfc', 'final', '32', 35, 21),
      ];

      const result = buildBracketFromGames(
        { wildCard: wcGames, divisional: divGames, championship: [] },
        emptyPicks,
        nfcSeeds
      );

      // Computed divisional matchups: Lions(1) vs Rams(4), Eagles(2) vs Seahawks(3)
      expect(result.divisionalMatchups[0][0]?.team.id).toBe('22'); // Lions (bye)
      expect(result.divisionalMatchups[0][1]?.team.id).toBe('30'); // Rams
      expect(result.divisionalMatchups[1][0]?.team.id).toBe('19'); // Eagles
      expect(result.divisionalMatchups[1][1]?.team.id).toBe('32'); // Seahawks

      // Winners matched correctly
      expect(result.divisionalWinners[0]?.team.id).toBe('22'); // Lions
      expect(result.divisionalWinners[1]?.team.id).toBe('32'); // Seahawks (CORRECTLY ADVANCED!)

      // Championship has correct teams
      expect(result.championshipMatchup[0]?.team.id).toBe('22'); // Lions (seed 1)
      expect(result.championshipMatchup[1]?.team.id).toBe('32'); // Seahawks (seed 3)
    });

    it('should handle AFC scenario - Denver advancing correctly', () => {
      // Wild card games for AFC - Broncos won
      const wcGames: PlayoffGame[] = [
        createPlayoffGame('1', '5', 'wildCard', 'afc', 'final', '1', 28, 14),   // Bills beat Ravens
        createPlayoffGame('8', '16', 'wildCard', 'afc', 'final', '8', 21, 17),  // Steelers beat Chargers
        createPlayoffGame('13', '9', 'wildCard', 'afc', 'final', '13', 31, 24), // Broncos beat Texans
      ];

      // ESPN divisional has wrong teams but Denver (13) won
      const divGames: PlayoffGame[] = [
        // ESPN might have old teams, but winnerId='13' (Broncos/Denver)
        createPlayoffGame('5', '9', 'divisional', 'afc', 'final', '13', 24, 20),
        // ESPN might have old teams, but winnerId='1' (Bills)
        createPlayoffGame('16', '6', 'divisional', 'afc', 'final', '1', 35, 21),
      ];

      const result = buildBracketFromGames(
        { wildCard: wcGames, divisional: divGames, championship: [] },
        emptyPicks,
        afcSeeds
      );

      // Winners matched correctly
      expect(result.divisionalWinners[0]?.team.id).toBe('13'); // Broncos/Denver (CORRECTLY ADVANCED!)
      expect(result.divisionalWinners[1]?.team.id).toBe('1');  // Bills

      // Championship has correct teams
      expect(result.championshipMatchup[0]?.team.id).toBe('1');  // Bills (seed 2)
      expect(result.championshipMatchup[1]?.team.id).toBe('13'); // Broncos (seed 4)
    });
  });
});
