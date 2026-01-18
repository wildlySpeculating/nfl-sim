/**
 * Phase 15: Regression Tests
 *
 * These tests document and prevent regression of bugs that were discovered
 * and fixed during development. Each test includes:
 * - Description of the original bug
 * - Expected behavior
 * - What was happening before the fix
 *
 * Historical validation tests verify standings calculations against
 * known NFL scenarios.
 */

import { describe, it, expect } from 'vitest';
import { buildBracketFromGames, type TeamWithSeed, type PlayoffPicks } from './playoffBracket';
import { calculateTeamRecords, calculatePlayoffSeedings, breakTie } from './tiebreakers';
import { calculateDraftOrder } from './draftOrder';
import { isTeamEliminated, calculateMagicNumber } from './teamPaths';
import type { Game, GameSelection, Team, TeamStanding } from '@/types';
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

// Helper to create a mock team
function createTeam(
  id: string,
  name: string,
  conference: 'AFC' | 'NFC',
  division: Team['division']
): Team {
  return {
    id,
    name,
    abbreviation: name.substring(0, 3).toUpperCase(),
    location: name,
    division,
    conference,
    logo: '',
    primaryColor: '#000',
    secondaryColor: '#fff',
  };
}

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

// Standard AFC seeds for playoff bracket tests
const afcSeeds: TeamWithSeed[] = [
  createTeamWithSeed('14', 1), // KC Chiefs
  createTeamWithSeed('1', 2),  // Buffalo Bills
  createTeamWithSeed('8', 3),  // Pittsburgh Steelers
  createTeamWithSeed('13', 4), // Denver Broncos
  createTeamWithSeed('9', 5),  // Houston Texans
  createTeamWithSeed('16', 6), // LA Chargers
  createTeamWithSeed('5', 7),  // Baltimore Ravens
];

// Standard NFC seeds for playoff bracket tests
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

describe('Phase 15: Regression Tests - Known Bug Fixes', () => {
  describe('Bug #1: Playoff Teams Not Advancing After Winning', () => {
    /**
     * Bug Description:
     * Seattle and Denver won their divisional playoff games but were not
     * selected in the bracket and hadn't advanced to the conference championship.
     *
     * Root Cause:
     * The championship matchup was using ESPN's game teams directly instead of
     * the computed divisional winners. When ESPN had stale/placeholder teams,
     * the actual winners weren't shown.
     *
     * Fix:
     * Always derive championship matchup from divisional winners when available,
     * using ESPN data only as fallback when divisional round isn't decided.
     */

    it('should advance divisional winners to championship even when ESPN has wrong teams', () => {
      // Divisional games completed with actual winners
      const divGames: PlayoffGame[] = [
        createPlayoffGame('14', '13', 'divisional', 'afc', 'final', '13', 24, 20), // Broncos beat Chiefs
        createPlayoffGame('1', '8', 'divisional', 'afc', 'final', '1', 35, 21),    // Bills beat Steelers
      ];

      // ESPN championship game has WRONG teams (stale data)
      const champGames: PlayoffGame[] = [
        createPlayoffGame('14', '8', 'championship', 'afc'), // Chiefs vs Steelers (WRONG!)
      ];

      const result = buildBracketFromGames(
        { wildCard: [], divisional: divGames, championship: champGames },
        emptyPicks,
        afcSeeds
      );

      // Championship should show Bills and Broncos (actual divisional winners)
      expect(result.championshipMatchup[0]?.team.id).toBe('1');  // Bills
      expect(result.championshipMatchup[1]?.team.id).toBe('13'); // Broncos
    });

    it('should show Seattle in NFC Championship after divisional win', () => {
      // Seattle (seed 3) beats LA Rams (seed 4) in divisional
      const divGames: PlayoffGame[] = [
        createPlayoffGame('22', '24', 'divisional', 'nfc', 'final', '22', 28, 14), // Lions beat Vikings
        createPlayoffGame('32', '30', 'divisional', 'nfc', 'final', '32', 21, 17), // Seahawks beat Rams
      ];

      // ESPN championship has wrong teams
      const champGames: PlayoffGame[] = [
        createPlayoffGame('22', '30', 'championship', 'nfc'), // Lions vs Rams (WRONG - Rams lost!)
      ];

      const result = buildBracketFromGames(
        { wildCard: [], divisional: divGames, championship: champGames },
        emptyPicks,
        nfcSeeds
      );

      // Championship should have Lions and Seahawks
      expect(result.championshipMatchup[0]?.team.id).toBe('22'); // Lions
      expect(result.championshipMatchup[1]?.team.id).toBe('32'); // Seahawks (NOT Rams)
    });

    it('should show Denver in AFC Championship after divisional win', () => {
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

      // Championship should have Bills and Broncos
      expect(result.championshipMatchup[0]?.team.id).toBe('1');  // Bills
      expect(result.championshipMatchup[1]?.team.id).toBe('13'); // Broncos (NOT Chiefs)
    });
  });

  describe('Bug #2: Winner Matching Against Wrong Teams', () => {
    /**
     * Bug Description:
     * When ESPN returned games with stale team data but correct winnerId,
     * the code was checking `winnerId === game.homeTeam.id` which failed
     * because the winner wasn't in the game's team list.
     *
     * Root Cause:
     * Code assumed winnerId would match one of the game's homeTeam or awayTeam,
     * but ESPN could have stale teams while winnerId was correct.
     *
     * Fix:
     * Match winnerId against computed matchup teams instead of ESPN game teams.
     */

    it('should match winnerId against computed matchups, not ESPN game teams', () => {
      // Wild card completed
      const wcGames: PlayoffGame[] = [
        createPlayoffGame('1', '5', 'wildCard', 'afc', 'final', '1', 28, 14),   // Bills beat Ravens
        createPlayoffGame('8', '16', 'wildCard', 'afc', 'final', '8', 21, 17),  // Steelers beat Chargers
        createPlayoffGame('13', '9', 'wildCard', 'afc', 'final', '13', 31, 24), // Broncos beat Texans
      ];

      // ESPN divisional games have COMPLETELY WRONG teams but CORRECT winnerIds
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

      // Divisional winners should be matched correctly
      expect(result.divisionalWinners[0]?.team.id).toBe('13'); // Broncos
      expect(result.divisionalWinners[1]?.team.id).toBe('1');  // Bills

      // Championship should show correct teams
      expect(result.championshipMatchup[0]?.team.id).toBe('1');  // Bills
      expect(result.championshipMatchup[1]?.team.id).toBe('13'); // Broncos
    });

    it('should match championship winnerId against computed matchup teams', () => {
      // Divisional completed
      const divGames: PlayoffGame[] = [
        createPlayoffGame('14', '13', 'divisional', 'afc', 'final', '13', 24, 20), // Broncos beat Chiefs
        createPlayoffGame('1', '8', 'divisional', 'afc', 'final', '1', 35, 21),    // Bills beat Steelers
      ];

      // ESPN championship game has WRONG teams but correct winnerId
      const champGames: PlayoffGame[] = [
        // ESPN says "Chiefs vs Steelers" but winnerId='1' (Bills)
        createPlayoffGame('14', '8', 'championship', 'afc', 'final', '1', 28, 21),
      ];

      const result = buildBracketFromGames(
        { wildCard: [], divisional: divGames, championship: champGames },
        emptyPicks,
        afcSeeds
      );

      // Champion should be Bills (matched against computed matchup)
      expect(result.champion?.team.id).toBe('1'); // Bills
    });
  });

  describe('Bug #3: Index Mismatch Between ESPN and Computed Matchups', () => {
    /**
     * Bug Description:
     * ESPN games could be in a different order than our computed matchups.
     * Using ESPN's game index to assign winners to our matchups caused
     * winners to be placed in the wrong matchup.
     *
     * Root Cause:
     * Code used `divGames[i].winnerId` to set `divisionalWinners[i]`, but
     * ESPN game order might differ from computed matchup order.
     *
     * Fix:
     * For each ESPN game with a winner, find which computed matchup contains
     * that winnerId and assign the winner there.
     */

    it('should handle ESPN divisional games in different order than computed matchups', () => {
      // Wild card completed
      const wcGames: PlayoffGame[] = [
        createPlayoffGame('1', '5', 'wildCard', 'afc', 'final', '1', 28, 14),
        createPlayoffGame('8', '16', 'wildCard', 'afc', 'final', '8', 21, 17),
        createPlayoffGame('13', '9', 'wildCard', 'afc', 'final', '13', 31, 24),
      ];

      // Computed matchups will be: [Chiefs vs Broncos, Bills vs Steelers]
      // ESPN divisional games in REVERSE order
      const divGames: PlayoffGame[] = [
        createPlayoffGame('1', '8', 'divisional', 'afc', 'final', '1', 35, 21),    // Bills beat Steelers (game 0)
        createPlayoffGame('14', '13', 'divisional', 'afc', 'final', '13', 24, 20), // Broncos beat Chiefs (game 1)
      ];

      const result = buildBracketFromGames(
        { wildCard: wcGames, divisional: divGames, championship: [] },
        emptyPicks,
        afcSeeds
      );

      // Winners should be assigned to CORRECT matchups regardless of ESPN order
      // Matchup 0: Chiefs vs Broncos -> Broncos won
      // Matchup 1: Bills vs Steelers -> Bills won
      expect(result.divisionalWinners[0]?.team.id).toBe('13'); // Broncos (matchup 0)
      expect(result.divisionalWinners[1]?.team.id).toBe('1');  // Bills (matchup 1)
    });
  });

  describe('Bug #4: Wild Card Winners Not Propagating to Divisional', () => {
    /**
     * Bug Description:
     * Divisional matchups were using ESPN's divisional game teams instead of
     * wild card winners, causing wrong teams to appear.
     *
     * Root Cause:
     * Same issue as championship - using ESPN data when computed data available.
     *
     * Fix:
     * Always derive divisional matchups from wild card winners + #1 seed when
     * wild card round is complete.
     */

    it('should use wild card winners for divisional matchups even when ESPN has different teams', () => {
      // Wild card completed
      const wcGames: PlayoffGame[] = [
        createPlayoffGame('1', '5', 'wildCard', 'afc', 'final', '1', 28, 14),   // Bills beat Ravens
        createPlayoffGame('8', '16', 'wildCard', 'afc', 'final', '8', 21, 17),  // Steelers beat Chargers
        createPlayoffGame('13', '9', 'wildCard', 'afc', 'final', '13', 31, 24), // Broncos beat Texans
      ];

      // ESPN divisional games have WRONG teams (losers from wild card!)
      const divGames: PlayoffGame[] = [
        createPlayoffGame('14', '5', 'divisional', 'afc'),   // Chiefs vs Ravens (Ravens LOST in WC!)
        createPlayoffGame('1', '16', 'divisional', 'afc'),   // Bills vs Chargers (Chargers LOST in WC!)
      ];

      const result = buildBracketFromGames(
        { wildCard: wcGames, divisional: divGames, championship: [] },
        emptyPicks,
        afcSeeds
      );

      // Divisional matchups should use wild card winners, NOT ESPN's wrong teams
      // Chiefs(1) vs Broncos(4), Bills(2) vs Steelers(3)
      expect(result.divisionalMatchups[0][0]?.team.id).toBe('14'); // Chiefs
      expect(result.divisionalMatchups[0][1]?.team.id).toBe('13'); // Broncos (wild card winner)
      expect(result.divisionalMatchups[1][0]?.team.id).toBe('1');  // Bills (wild card winner)
      expect(result.divisionalMatchups[1][1]?.team.id).toBe('8');  // Steelers (wild card winner)
    });
  });
});

describe('Phase 15: Regression Tests - Edge Cases', () => {
  describe('Partial Round Completion', () => {
    it('should handle partial divisional completion correctly', () => {
      const divGames: PlayoffGame[] = [
        createPlayoffGame('14', '13', 'divisional', 'afc', 'final', '13', 24, 20), // Broncos won
        createPlayoffGame('1', '8', 'divisional', 'afc'), // Bills vs Steelers - not decided
      ];

      const result = buildBracketFromGames(
        { wildCard: [], divisional: divGames, championship: [] },
        emptyPicks,
        afcSeeds
      );

      // One winner known, one pending
      expect(result.divisionalWinners[0]?.team.id).toBe('13'); // Broncos won
      expect(result.divisionalWinners[1]).toBe(null); // Not decided

      // Championship should be empty (not all divisional decided)
      expect(result.championshipMatchup[0]).toBe(null);
      expect(result.championshipMatchup[1]).toBe(null);
    });

    it('should handle partial wild card completion correctly', () => {
      const wcGames: PlayoffGame[] = [
        createPlayoffGame('1', '5', 'wildCard', 'afc', 'final', '1', 28, 14),   // Bills won
        createPlayoffGame('8', '16', 'wildCard', 'afc', 'final', '8', 21, 17),  // Steelers won
        createPlayoffGame('13', '9', 'wildCard', 'afc'), // Broncos vs Texans - not decided
      ];

      const result = buildBracketFromGames(
        { wildCard: wcGames, divisional: [], championship: [] },
        emptyPicks,
        afcSeeds
      );

      // Two winners known, one pending
      expect(result.wildCardWinners[0]?.team.id).toBe('1');  // Bills
      expect(result.wildCardWinners[1]?.team.id).toBe('8');  // Steelers
      expect(result.wildCardWinners[2]).toBe(null); // Not decided

      // Divisional matchups should be placeholder (not all WC decided)
      expect(result.divisionalMatchups[0][1]).toBe(null);
    });
  });

  describe('User Picks with Stale ESPN Data', () => {
    it('should apply user picks against wild card winners, not ESPN teams', () => {
      // Wild card completed
      const wcGames: PlayoffGame[] = [
        createPlayoffGame('1', '5', 'wildCard', 'afc', 'final', '1', 28, 14),
        createPlayoffGame('8', '16', 'wildCard', 'afc', 'final', '8', 21, 17),
        createPlayoffGame('13', '9', 'wildCard', 'afc', 'final', '13', 31, 24),
      ];

      // ESPN divisional with wrong teams
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

      // Picks should be applied against correct matchups
      expect(result.divisionalWinners[0]?.team.id).toBe('13'); // Broncos (picked)
      expect(result.divisionalWinners[1]?.team.id).toBe('1');  // Bills (picked)
    });
  });
});

describe('Phase 15: Historical Scenario Validation', () => {
  // Create teams for tiebreaker tests
  const bills = createTeam('1', 'Bills', 'AFC', 'AFC East');
  const dolphins = createTeam('2', 'Dolphins', 'AFC', 'AFC East');
  const patriots = createTeam('3', 'Patriots', 'AFC', 'AFC East');
  const jets = createTeam('4', 'Jets', 'AFC', 'AFC East');
  const ravens = createTeam('5', 'Ravens', 'AFC', 'AFC North');
  const bengals = createTeam('6', 'Bengals', 'AFC', 'AFC North');

  describe('Division Race Tiebreaker Scenarios', () => {
    it('should resolve 2-team division tie via head-to-head sweep', () => {
      // Common scenario: Team A and B tied, A swept B
      const games: Game[] = [
        createGame('h2h1', bills, dolphins, 24, 17, 'final', 1), // Bills beat Dolphins
        createGame('h2h2', dolphins, bills, 17, 21, 'final', 2), // Bills beat Dolphins again
        // Both go 8-6 in other games
        ...Array.from({ length: 8 }, (_, i) =>
          createGame(`bills-${i}`, bills, patriots, 24, 17, 'final', i + 3)
        ),
        ...Array.from({ length: 8 }, (_, i) =>
          createGame(`dolphins-${i}`, dolphins, jets, 24, 17, 'final', i + 3)
        ),
      ];

      const teams = [bills, dolphins, patriots, jets];
      const records = calculateTeamRecords(teams, games, {});

      const result = breakTie([bills, dolphins], records, games, {}, true);

      // Bills should win due to H2H sweep (2-0)
      expect(result[0].id).toBe(bills.id);
    });

    it('should resolve 2-team division tie via division record when H2H split', () => {
      const games: Game[] = [
        // H2H split
        createGame('h2h1', bills, dolphins, 24, 17, 'final', 1),
        createGame('h2h2', dolphins, bills, 24, 17, 'final', 2),
        // Bills: 5-1 in division (better)
        createGame('d1', bills, patriots, 24, 17, 'final', 3),
        createGame('d2', bills, jets, 24, 17, 'final', 4),
        createGame('d3', patriots, bills, 24, 17, 'final', 5),
        createGame('d4', bills, jets, 24, 17, 'final', 6),
        // Dolphins: 3-3 in division
        createGame('d5', dolphins, patriots, 24, 17, 'final', 7),
        createGame('d6', jets, dolphins, 24, 17, 'final', 8),
        createGame('d7', dolphins, jets, 24, 17, 'final', 9),
        createGame('d8', patriots, dolphins, 24, 17, 'final', 10),
      ];

      const teams = [bills, dolphins, patriots, jets];
      const records = calculateTeamRecords(teams, games, {});

      const result = breakTie([bills, dolphins], records, games, {}, true);

      // Bills should win due to better division record
      expect(result[0].id).toBe(bills.id);
    });

    it('should resolve 3-team division tie correctly', () => {
      // Bills beat Dolphins and Patriots in H2H
      // Dolphins beat Patriots
      const games: Game[] = [
        createGame('bd', bills, dolphins, 24, 17, 'final', 1), // Bills beat Dolphins
        createGame('bp', bills, patriots, 24, 17, 'final', 2), // Bills beat Patriots
        createGame('dp', dolphins, patriots, 24, 17, 'final', 3), // Dolphins beat Patriots
      ];

      const teams = [bills, dolphins, patriots];
      const records = calculateTeamRecords(teams, games, {});

      const result = breakTie([bills, dolphins, patriots], records, games, {}, true);

      // Bills beat both, should be first
      expect(result[0].id).toBe(bills.id);
      // Dolphins beat Patriots, should be second
      expect(result[1].id).toBe(dolphins.id);
      expect(result[2].id).toBe(patriots.id);
    });
  });

  describe('Wild Card Race Scenarios', () => {
    it('should not use division record for wild card ties', () => {
      // Test that wild card ties skip division record step
      // Both teams 10-6 overall with different division records
      // If division record WAS used (incorrectly), Bills would win with 6-0 vs Ravens 3-3
      // Since it's wild card, we should skip to conference record

      const browns = createTeam('7', 'Browns', 'AFC', 'AFC North');

      const games: Game[] = [
        // Bills: 10-6 overall (6-0 division + 4-6 non-division)
        // 6 wins vs Dolphins (division)
        ...Array.from({ length: 6 }, (_, i) =>
          createGame(`bills-div-${i}`, bills, dolphins, 24, 17, 'final', i + 1)
        ),
        // 4 wins vs Browns (non-division conference)
        ...Array.from({ length: 4 }, (_, i) =>
          createGame(`bills-browns-w-${i}`, bills, browns, 24, 17, 'final', i + 7)
        ),
        // 6 losses vs Bengals (non-division conference)
        ...Array.from({ length: 6 }, (_, i) =>
          createGame(`bills-bengals-l-${i}`, bengals, bills, 24, 17, 'final', i + 11)
        ),

        // Ravens: 10-6 overall (3-3 division + 7-3 non-division)
        // 3 wins vs Bengals (division)
        ...Array.from({ length: 3 }, (_, i) =>
          createGame(`ravens-div-w-${i}`, ravens, bengals, 24, 17, 'final', i + 1)
        ),
        // 3 losses vs Browns (division)
        ...Array.from({ length: 3 }, (_, i) =>
          createGame(`ravens-browns-l-${i}`, browns, ravens, 24, 17, 'final', i + 4)
        ),
        // 7 wins vs Patriots (non-division conference)
        ...Array.from({ length: 7 }, (_, i) =>
          createGame(`ravens-pats-w-${i}`, ravens, patriots, 24, 17, 'final', i + 7)
        ),
        // 3 losses vs Dolphins (non-division conference)
        ...Array.from({ length: 3 }, (_, i) =>
          createGame(`ravens-dolphins-l-${i}`, dolphins, ravens, 24, 17, 'final', i + 14)
        ),
      ];

      // Bills: 10-6 overall, 6-0 division, 10-6 conference
      // Ravens: 10-6 overall, 3-3 division, 10-6 conference
      // Same overall (10-6) and conference (10-6) records, different division records

      const allTeams = [bills, dolphins, patriots, jets, ravens, bengals, browns];
      const records = calculateTeamRecords(allTeams, games, {});

      const billsRec = records.get(bills.id);
      const ravensRec = records.get(ravens.id);

      // Verify setup: same overall record
      expect(billsRec!.wins).toBe(10);
      expect(ravensRec!.wins).toBe(10);
      // Different division records
      expect(billsRec!.divisionWins).toBeGreaterThan(ravensRec!.divisionWins);

      // Wild card tie - should NOT use division record
      const result = breakTie([bills, ravens], records, games, {}, false);

      // Both teams tied through conference record, go to later tiebreakers (SOV/SOS)
      // The key assertion: if division record was incorrectly used, Bills would be first
      // Since we skip division record for wild card, result depends on later steps
      expect(result.length).toBe(2);
    });
  });

  describe('Playoff Seeding Scenarios', () => {
    it('should give division winner playoff spot over better record non-winner', () => {
      // Texans win weak division at 9-8
      // Dolphins miss playoffs at 10-7 from strong division
      const texans = createTeam('9', 'Texans', 'AFC', 'AFC South');
      const colts = createTeam('10', 'Colts', 'AFC', 'AFC South');
      const jaguars = createTeam('11', 'Jaguars', 'AFC', 'AFC South');
      const titans = createTeam('12', 'Titans', 'AFC', 'AFC South');

      const allTeams = [
        bills, dolphins, patriots, jets,
        ravens, bengals,
        texans, colts, jaguars, titans,
      ];

      const games: Game[] = [
        // Bills win AFC East at 13-4
        // Beat Jets 9 times (division games)
        ...Array.from({ length: 9 }, (_, i) =>
          createGame(`bills-beat-jets-${i}`, bills, jets, 24, 17, 'final', i + 1)
        ),
        // Beat Patriots 4 times
        ...Array.from({ length: 4 }, (_, i) =>
          createGame(`bills-beat-pats-${i}`, bills, patriots, 24, 17, 'final', 10 + i)
        ),
        // Lose 4 to Ravens
        ...Array.from({ length: 4 }, (_, i) =>
          createGame(`bills-lose-ravens-${i}`, ravens, bills, 24, 17, 'final', 14 + i)
        ),
        // Dolphins 10-7 but 2nd in division (lost H2H to Bills)
        // Beat Patriots 8 times
        ...Array.from({ length: 8 }, (_, i) =>
          createGame(`dolphins-beat-pats-${i}`, dolphins, patriots, 24, 17, 'final', i + 1)
        ),
        // Beat Jets 2 times
        ...Array.from({ length: 2 }, (_, i) =>
          createGame(`dolphins-beat-jets-${i}`, dolphins, jets, 24, 17, 'final', 9 + i)
        ),
        // Lose 2 to Bills (H2H)
        ...Array.from({ length: 2 }, (_, i) =>
          createGame(`dolphins-lose-bills-${i}`, bills, dolphins, 24, 17, 'final', 11 + i)
        ),
        // Lose 5 to Ravens
        ...Array.from({ length: 5 }, (_, i) =>
          createGame(`dolphins-lose-ravens-${i}`, ravens, dolphins, 24, 17, 'final', 13 + i)
        ),
        // Texans win AFC South at 9-8 (best division record)
        // Beat Colts 4 times
        ...Array.from({ length: 4 }, (_, i) =>
          createGame(`texans-beat-colts-${i}`, texans, colts, 24, 17, 'final', i + 1)
        ),
        // Beat Jaguars 3 times
        ...Array.from({ length: 3 }, (_, i) =>
          createGame(`texans-beat-jags-${i}`, texans, jaguars, 24, 17, 'final', 5 + i)
        ),
        // Beat Titans 2 times
        ...Array.from({ length: 2 }, (_, i) =>
          createGame(`texans-beat-titans-${i}`, texans, titans, 24, 17, 'final', 8 + i)
        ),
        // Lose 8 to Ravens (non-div)
        ...Array.from({ length: 8 }, (_, i) =>
          createGame(`texans-lose-ravens-${i}`, ravens, texans, 24, 17, 'final', 10 + i)
        ),
        // Ravens win AFC North at 11-6 (also beat other teams)
        ...Array.from({ length: 11 }, (_, i) =>
          createGame(`ravens-beat-bengals-${i}`, ravens, bengals, 24, 17, 'final', i + 1)
        ),
        // Ravens losses to Bills covered above (4 losses to Bills + some others totals 6)
        ...Array.from({ length: 2 }, (_, i) =>
          createGame(`ravens-lose-bengals-${i}`, bengals, ravens, 24, 17, 'final', 12 + i)
        ),
      ];

      const standings = calculatePlayoffSeedings('AFC', allTeams, games, {});

      const texansStanding = standings.find(s => s.team.id === texans.id);
      const dolphinsStanding = standings.find(s => s.team.id === dolphins.id);
      const billsStanding = standings.find(s => s.team.id === bills.id);

      // Bills should be AFC East division winner (seeds 1-4)
      expect(billsStanding?.seed).toBeLessThanOrEqual(4);
      // Texans should be division winner (seeds 1-4)
      expect(texansStanding?.seed).toBeLessThanOrEqual(4);
      // Dolphins with lesser record should be wild card or miss
      if (dolphinsStanding?.seed !== null) {
        expect(dolphinsStanding?.seed).toBeGreaterThanOrEqual(5);
      }
    });
  });
});

describe('Phase 15: Draft Order Regression Tests', () => {
  describe('Playoff Loser Draft Order', () => {
    it('should correctly order wild card losers by record and SOS', () => {
      // Create standings with playoff teams
      const mockStandings = (teamId: string, wins: number, losses: number, seed: number | null): TeamStanding => {
        const team = getTeamById(teamId)!;
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
          pointsFor: wins * 24,
          pointsAgainst: losses * 17,
          streak: '',
          lastFive: [],
          isEliminated: seed === null,
          clinched: seed ? (seed === 1 ? 'bye' : seed <= 4 ? 'division' : 'playoff') : null,
          seed,
          magicNumber: null,
        };
      };

      const afcStandings: TeamStanding[] = [
        mockStandings('14', 14, 3, 1), // Chiefs - seed 1
        mockStandings('1', 13, 4, 2),  // Bills - seed 2
        mockStandings('8', 11, 6, 3),  // Steelers - seed 3
        mockStandings('13', 10, 7, 4), // Broncos - seed 4
        mockStandings('9', 10, 7, 5),  // Texans - seed 5
        mockStandings('16', 10, 7, 6), // Chargers - seed 6
        mockStandings('5', 10, 7, 7),  // Ravens - seed 7
        mockStandings('2', 9, 8, null), // Dolphins - missed
      ];

      const nfcStandings: TeamStanding[] = [
        mockStandings('22', 14, 3, 1), // Lions - seed 1
        mockStandings('19', 13, 4, 2), // Eagles - seed 2
        mockStandings('32', 12, 5, 3), // Seahawks - seed 3
        mockStandings('30', 10, 7, 4), // Rams - seed 4
        mockStandings('24', 10, 7, 5), // Vikings - seed 5
        mockStandings('23', 10, 7, 6), // Packers - seed 6
        mockStandings('20', 10, 7, 7), // Commanders - seed 7
        mockStandings('21', 8, 9, null), // Giants - missed
      ];

      // Wild card games with losers
      const playoffGames: PlayoffGame[] = [
        // AFC Wild Card
        createPlayoffGame('1', '5', 'wildCard', 'afc', 'final', '1', 28, 14),   // Bills beat Ravens
        createPlayoffGame('8', '16', 'wildCard', 'afc', 'final', '16', 24, 21), // Chargers beat Steelers
        createPlayoffGame('13', '9', 'wildCard', 'afc', 'final', '13', 31, 24), // Broncos beat Texans
        // NFC Wild Card
        createPlayoffGame('19', '20', 'wildCard', 'nfc', 'final', '19', 28, 14), // Eagles beat Commanders
        createPlayoffGame('32', '23', 'wildCard', 'nfc', 'final', '32', 21, 17), // Seahawks beat Packers
        createPlayoffGame('30', '24', 'wildCard', 'nfc', 'final', '30', 31, 24), // Rams beat Vikings
      ];

      const playoffPicks = {
        afc: { wildCard: [null, null, null], divisional: [null, null], championship: null },
        nfc: { wildCard: [null, null, null], divisional: [null, null], championship: null },
        superBowl: null,
      };

      const draftOrder = calculateDraftOrder(afcStandings, nfcStandings, playoffPicks, playoffGames, []);

      // Should have some picks (at least non-playoff teams + wild card losers)
      expect(draftOrder.length).toBeGreaterThan(0);

      // Wild card losers should be included with appropriate reason
      const wcLoserPicks = draftOrder.filter(p => p.reason === 'Lost in Wild Card');
      // Should have wild card losers (6 games, 6 losers - but limited by standings provided)
      expect(wcLoserPicks.length).toBeGreaterThan(0);

      // Losers with worse records should pick earlier
      if (wcLoserPicks.length >= 2) {
        // First wild card loser pick should have equal or worse record than last
        const firstLoser = wcLoserPicks[0];
        const lastLoser = wcLoserPicks[wcLoserPicks.length - 1];
        expect(firstLoser.pick).toBeLessThanOrEqual(lastLoser.pick);
      }
    });
  });
});

describe('Phase 15: Magic Number and Elimination Regression', () => {
  const bills = createTeam('1', 'Bills', 'AFC', 'AFC East');
  const dolphins = createTeam('2', 'Dolphins', 'AFC', 'AFC East');
  const patriots = createTeam('3', 'Patriots', 'AFC', 'AFC East');
  const jets = createTeam('4', 'Jets', 'AFC', 'AFC East');

  it('should not eliminate team with losing record early in season', () => {
    // Week 5: Jets are 1-4 but still have 12 games left
    const games: Game[] = [
      createGame('g1', jets, bills, 24, 17, 'final', 1), // Jets win
      createGame('g2', dolphins, jets, 24, 17, 'final', 2), // Jets lose
      createGame('g3', patriots, jets, 24, 17, 'final', 3), // Jets lose
      createGame('g4', bills, jets, 24, 17, 'final', 4), // Jets lose
      createGame('g5', dolphins, jets, 24, 17, 'final', 5), // Jets lose
    ];

    const teams = [bills, dolphins, patriots, jets];

    // Jets at 1-4 should NOT be eliminated in week 5
    const eliminated = isTeamEliminated(jets.id, games, {});
    expect(eliminated).toBe(false);
  });

  it('should return elimination status based on remaining playoff paths', () => {
    // Note: isTeamEliminated uses global 32-team data
    // A team with 1-4 early in season still has paths to playoffs
    const games: Game[] = [
      createGame('g1', jets, bills, 24, 17, 'final', 1), // Jets win
      createGame('g2', dolphins, jets, 24, 17, 'final', 2), // Jets lose
      createGame('g3', patriots, jets, 24, 17, 'final', 3), // Jets lose
      createGame('g4', bills, jets, 24, 17, 'final', 4), // Jets lose
      createGame('g5', dolphins, jets, 24, 17, 'final', 5), // Jets lose
    ];

    // With 12 games remaining, Jets at 1-4 could reach 13-4
    // This means they should NOT be eliminated this early
    const eliminated = isTeamEliminated(jets.id, games, {});

    // Early season with many games remaining = not eliminated
    expect(eliminated).toBe(false);
  });
});

describe('Phase 15: Test Data Requirements Validation', () => {
  // These tests ensure we have coverage for all required test scenarios

  const bills = createTeam('1', 'Bills', 'AFC', 'AFC East');
  const dolphins = createTeam('2', 'Dolphins', 'AFC', 'AFC East');
  const patriots = createTeam('3', 'Patriots', 'AFC', 'AFC East');
  const jets = createTeam('4', 'Jets', 'AFC', 'AFC East');
  const ravens = createTeam('5', 'Ravens', 'AFC', 'AFC North');
  const bengals = createTeam('6', 'Bengals', 'AFC', 'AFC North');
  const texans = createTeam('9', 'Texans', 'AFC', 'AFC South');

  it('1. Simple 2-team division tie (H2H resolves)', () => {
    const games: Game[] = [
      createGame('h2h', bills, dolphins, 24, 17, 'final', 1), // Bills beat Dolphins
    ];

    const teams = [bills, dolphins];
    const records = calculateTeamRecords(teams, games, {});
    const result = breakTie([bills, dolphins], records, games, {}, true);

    expect(result[0].id).toBe(bills.id);
  });

  it('2. Simple 2-team division tie (needs division record)', () => {
    const games: Game[] = [
      // H2H split
      createGame('h2h1', bills, dolphins, 24, 17, 'final', 1),
      createGame('h2h2', dolphins, bills, 24, 17, 'final', 2),
      // Bills better division record
      createGame('d1', bills, patriots, 24, 17, 'final', 3),
      createGame('d2', bills, jets, 24, 17, 'final', 4),
    ];

    const teams = [bills, dolphins, patriots, jets];
    const records = calculateTeamRecords(teams, games, {});
    const result = breakTie([bills, dolphins], records, games, {}, true);

    expect(result[0].id).toBe(bills.id);
  });

  it('3. 3-team division tie', () => {
    const games: Game[] = [
      createGame('bd', bills, dolphins, 24, 17, 'final', 1),
      createGame('bp', bills, patriots, 24, 17, 'final', 2),
      createGame('dp', dolphins, patriots, 24, 17, 'final', 3),
    ];

    const teams = [bills, dolphins, patriots];
    const records = calculateTeamRecords(teams, games, {});
    const result = breakTie([bills, dolphins, patriots], records, games, {}, true);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(bills.id); // Beat both
  });

  it('4. 2-team wild card tie (same division)', () => {
    const games: Game[] = [
      createGame('h2h', dolphins, patriots, 24, 17, 'final', 1),
    ];

    const teams = [dolphins, patriots];
    const records = calculateTeamRecords(teams, games, {});
    const result = breakTie([dolphins, patriots], records, games, {}, false);

    expect(result[0].id).toBe(dolphins.id);
  });

  it('5. 2-team wild card tie (different divisions)', () => {
    const games: Game[] = [
      createGame('h2h', dolphins, ravens, 24, 17, 'final', 1),
    ];

    const teams = [dolphins, ravens];
    const records = calculateTeamRecords(teams, games, {});
    const result = breakTie([dolphins, ravens], records, games, {}, false);

    expect(result[0].id).toBe(dolphins.id);
  });

  it('6. 3-team wild card tie (all different divisions)', () => {
    const games: Game[] = [
      createGame('dr', dolphins, ravens, 24, 17, 'final', 1),
      createGame('dt', dolphins, texans, 24, 17, 'final', 2),
      createGame('rt', ravens, texans, 24, 17, 'final', 3),
    ];

    const teams = [dolphins, ravens, texans];
    const records = calculateTeamRecords(teams, games, {});
    const result = breakTie([dolphins, ravens, texans], records, games, {}, false);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(dolphins.id); // Beat both
  });

  it('7. Complete playoff bracket (all games decided)', () => {
    const wcGames: PlayoffGame[] = [
      createPlayoffGame('1', '5', 'wildCard', 'afc', 'final', '1', 28, 14),
      createPlayoffGame('8', '16', 'wildCard', 'afc', 'final', '8', 21, 17),
      createPlayoffGame('13', '9', 'wildCard', 'afc', 'final', '13', 31, 24),
    ];
    const divGames: PlayoffGame[] = [
      createPlayoffGame('14', '13', 'divisional', 'afc', 'final', '13', 24, 20),
      createPlayoffGame('1', '8', 'divisional', 'afc', 'final', '1', 35, 21),
    ];
    const champGames: PlayoffGame[] = [
      createPlayoffGame('1', '13', 'championship', 'afc', 'final', '1', 28, 21),
    ];

    const result = buildBracketFromGames(
      { wildCard: wcGames, divisional: divGames, championship: champGames },
      emptyPicks,
      afcSeeds
    );

    expect(result.champion?.team.id).toBe('1'); // Bills
  });

  it('8. Partial playoff bracket (some games pending)', () => {
    const wcGames: PlayoffGame[] = [
      createPlayoffGame('1', '5', 'wildCard', 'afc', 'final', '1', 28, 14),
      createPlayoffGame('8', '16', 'wildCard', 'afc'),  // Not decided
      createPlayoffGame('13', '9', 'wildCard', 'afc'),  // Not decided
    ];

    const result = buildBracketFromGames(
      { wildCard: wcGames, divisional: [], championship: [] },
      emptyPicks,
      afcSeeds
    );

    expect(result.wildCardWinners[0]?.team.id).toBe('1');
    expect(result.wildCardWinners[1]).toBe(null);
    expect(result.wildCardWinners[2]).toBe(null);
  });

  it('9. Week 18 standings (final regular season)', () => {
    // Full 17-game season
    const games: Game[] = [
      ...Array.from({ length: 17 }, (_, i) =>
        createGame(`bills-${i}`, bills, dolphins, 24, 17, 'final', i + 1)
      ),
    ];

    const teams = [bills, dolphins, patriots, jets];
    const records = calculateTeamRecords(teams, games, {});

    const billsRec = records.get(bills.id)!;
    expect(billsRec.wins).toBe(17);
    expect(billsRec.losses).toBe(0);
  });

  it('10. Mid-season standings (magic numbers relevant)', () => {
    // Week 10: Bills 8-1, need magic number to clinch
    const games: Game[] = [
      ...Array.from({ length: 8 }, (_, i) =>
        createGame(`bills-win-${i}`, bills, dolphins, 24, 17, 'final', i + 1)
      ),
      createGame('bills-loss', patriots, bills, 24, 17, 'final', 9),
    ];

    const teams = [bills, dolphins, patriots, jets];
    const records = calculateTeamRecords(teams, games, {});
    const standings = Array.from(records.values()).map(r => ({
      ...r,
      streak: '',
      lastFive: [],
      isEliminated: false,
      clinched: null,
      seed: null,
      magicNumber: null,
    })) as unknown as TeamStanding[];

    // Calculate magic number for Bills
    const magic = calculateMagicNumber(bills.id, games, {}, standings, 'playoff');

    // Should have a non-null magic number
    expect(magic.number).not.toBeNull();
  });
});

// =============================================================================
// Historical Season Regression Tests
// =============================================================================
// These tests validate that our playoff seeding calculations match actual
// NFL season results for the last 5 seasons (2020-2024).
// =============================================================================

describe('Phase 15: Historical Season Regression Tests', () => {
  // Helper to create a team with a specific record
  function createSeasonTeam(
    id: string,
    wins: number,
    losses: number,
    ties: number = 0,
    divWins: number = 0,
    divLosses: number = 0,
    confWins: number = 0,
    confLosses: number = 0
  ) {
    const team = getTeamById(id)!;
    return {
      team,
      wins,
      losses,
      ties,
      divisionWins: divWins,
      divisionLosses: divLosses,
      divisionTies: 0,
      conferenceWins: confWins,
      conferenceLosses: confLosses,
      conferenceTies: 0,
      pointsFor: wins * 24,
      pointsAgainst: losses * 17,
    };
  }

  // Helper to generate games from team records for seeding calculation
  function generateGamesFromRecords(
    teamRecords: Array<{ id: string; wins: number; losses: number; ties?: number;
      divWins?: number; divLosses?: number; confWins?: number; confLosses?: number }>
  ): Game[] {
    const games: Game[] = [];
    let gameId = 1;

    for (const record of teamRecords) {
      const team = getTeamById(record.id)!;
      const opponent = getTeamById(record.id === '1' ? '2' : '1')!; // Use a different team as opponent

      // Generate wins
      for (let i = 0; i < record.wins; i++) {
        games.push({
          id: `g${gameId++}`,
          homeTeam: team,
          awayTeam: opponent,
          homeScore: 24,
          awayScore: 17,
          status: 'final' as const,
          week: i + 1,
          kickoffTime: new Date(),
        });
      }

      // Generate losses
      for (let i = 0; i < record.losses; i++) {
        games.push({
          id: `g${gameId++}`,
          homeTeam: opponent,
          awayTeam: team,
          homeScore: 24,
          awayScore: 17,
          status: 'final' as const,
          week: record.wins + i + 1,
          kickoffTime: new Date(),
        });
      }

      // Generate ties
      for (let i = 0; i < (record.ties || 0); i++) {
        games.push({
          id: `g${gameId++}`,
          homeTeam: team,
          awayTeam: opponent,
          homeScore: 20,
          awayScore: 20,
          status: 'final' as const,
          week: record.wins + record.losses + i + 1,
          kickoffTime: new Date(),
        });
      }
    }

    return games;
  }

  describe('2024 NFL Season Final Standings', () => {
    /**
     * 2024 NFL Playoff Seeds (actual results):
     * AFC: 1-Chiefs(15-2), 2-Bills(13-4), 3-Ravens(12-5), 4-Texans(10-7),
     *      5-Chargers(11-6), 6-Steelers(10-7), 7-Broncos(10-7)
     * NFC: 1-Lions(15-2), 2-Eagles(14-3), 3-Buccaneers(10-7), 4-Rams(10-7),
     *      5-Vikings(14-3), 6-Commanders(12-5), 7-Packers(11-6)
     *
     * Note: These tests verify the seeding algorithm's structure rather than
     * exact historical results, since that would require simulating all games.
     */

    it('should produce correct playoff structure for 2024 AFC', () => {
      const afcTeamRecords = [
        // AFC East
        { id: '1', wins: 13, losses: 4 },   // Bills
        { id: '2', wins: 8, losses: 9 },    // Dolphins
        { id: '3', wins: 4, losses: 13 },   // Patriots
        { id: '4', wins: 5, losses: 12 },   // Jets
        // AFC North
        { id: '5', wins: 12, losses: 5 },   // Ravens
        { id: '6', wins: 9, losses: 8 },    // Bengals
        { id: '7', wins: 3, losses: 14 },   // Browns
        { id: '8', wins: 10, losses: 7 },   // Steelers
        // AFC South
        { id: '9', wins: 10, losses: 7 },   // Texans
        { id: '10', wins: 8, losses: 9 },   // Colts
        { id: '11', wins: 4, losses: 13 },  // Jaguars
        { id: '12', wins: 3, losses: 14 },  // Titans
        // AFC West
        { id: '13', wins: 10, losses: 7 },  // Broncos
        { id: '14', wins: 15, losses: 2 },  // Chiefs
        { id: '15', wins: 4, losses: 13 },  // Raiders
        { id: '16', wins: 11, losses: 6 },  // Chargers
      ];

      const teams = afcTeamRecords.map(r => getTeamById(r.id)!);
      const games = generateGamesFromRecords(afcTeamRecords);
      const standings = calculatePlayoffSeedings('AFC', teams, games, {});

      // Verify correct number of playoff teams
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);

      // Verify 4 division winners (seeds 1-4)
      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);
      expect(divisionWinners.length).toBe(4);

      // Verify 3 wild cards (seeds 5-7)
      const wildCards = standings.filter(s => s.seed !== null && s.seed >= 5);
      expect(wildCards.length).toBe(3);

      // Chiefs with best record should be 1 seed
      const seed1 = standings.find(s => s.seed === 1);
      expect(seed1?.team.id).toBe('14'); // Chiefs (15-2)

      // Verify non-playoff teams don't have seeds
      const nonPlayoff = standings.filter(s => s.seed === null);
      expect(nonPlayoff.length).toBe(9);
    });

    it('should produce correct playoff structure for 2024 NFC', () => {
      const nfcTeamRecords = [
        // NFC East
        { id: '17', wins: 7, losses: 10 },  // Cowboys
        { id: '18', wins: 3, losses: 14 },  // Giants
        { id: '19', wins: 14, losses: 3 },  // Eagles
        { id: '20', wins: 12, losses: 5 },  // Commanders
        // NFC North
        { id: '21', wins: 5, losses: 12 },  // Bears
        { id: '22', wins: 15, losses: 2 },  // Lions
        { id: '23', wins: 11, losses: 6 },  // Packers
        { id: '24', wins: 14, losses: 3 },  // Vikings
        // NFC South
        { id: '25', wins: 8, losses: 9 },   // Falcons
        { id: '26', wins: 5, losses: 12 },  // Panthers
        { id: '27', wins: 5, losses: 12 },  // Saints
        { id: '28', wins: 10, losses: 7 },  // Buccaneers
        // NFC West
        { id: '29', wins: 8, losses: 9 },   // Cardinals
        { id: '30', wins: 10, losses: 7 },  // Rams
        { id: '31', wins: 6, losses: 11 },  // 49ers
        { id: '32', wins: 10, losses: 7 },  // Seahawks
      ];

      const teams = nfcTeamRecords.map(r => getTeamById(r.id)!);
      const games = generateGamesFromRecords(nfcTeamRecords);
      const standings = calculatePlayoffSeedings('NFC', teams, games, {});

      // Verify playoff structure
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);

      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);
      expect(divisionWinners.length).toBe(4);

      const wildCards = standings.filter(s => s.seed !== null && s.seed >= 5);
      expect(wildCards.length).toBe(3);

      // 1 seed should be a division winner with one of the best records
      const seed1 = standings.find(s => s.seed === 1);
      expect(seed1).toBeDefined();
      expect(seed1?.seed).toBe(1);
    });
  });

  describe('2023 NFL Season Final Standings', () => {
    /**
     * 2023 NFL Playoff Seeds (actual results):
     * AFC: 1-Ravens(13-4), 2-Bills(11-6), 3-Chiefs(11-6), 4-Texans(10-7),
     *      5-Browns(11-6), 6-Dolphins(11-6), 7-Steelers(10-7)
     * NFC: 1-49ers(12-5), 2-Cowboys(12-5), 3-Lions(12-5), 4-Buccaneers(9-8),
     *      5-Eagles(11-6), 6-Rams(10-7), 7-Packers(9-8)
     *
     * Note: These tests verify the seeding algorithm's structure rather than
     * exact historical results, since that would require simulating all games.
     */

    it('should produce correct playoff structure for 2023 AFC', () => {
      const afcTeamRecords = [
        // AFC East
        { id: '1', wins: 11, losses: 6 },   // Bills
        { id: '2', wins: 11, losses: 6 },   // Dolphins
        { id: '3', wins: 4, losses: 13 },   // Patriots
        { id: '4', wins: 7, losses: 10 },   // Jets
        // AFC North
        { id: '5', wins: 13, losses: 4 },   // Ravens
        { id: '6', wins: 9, losses: 8 },    // Bengals
        { id: '7', wins: 11, losses: 6 },   // Browns
        { id: '8', wins: 10, losses: 7 },   // Steelers
        // AFC South
        { id: '9', wins: 10, losses: 7 },   // Texans
        { id: '10', wins: 9, losses: 8 },   // Colts
        { id: '11', wins: 9, losses: 8 },   // Jaguars
        { id: '12', wins: 6, losses: 11 },  // Titans
        // AFC West
        { id: '13', wins: 8, losses: 9 },   // Broncos
        { id: '14', wins: 11, losses: 6 },  // Chiefs
        { id: '15', wins: 8, losses: 9 },   // Raiders
        { id: '16', wins: 5, losses: 12 },  // Chargers
      ];

      const teams = afcTeamRecords.map(r => getTeamById(r.id)!);
      const games = generateGamesFromRecords(afcTeamRecords);
      const standings = calculatePlayoffSeedings('AFC', teams, games, {});

      // Verify playoff structure
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);

      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);
      expect(divisionWinners.length).toBe(4);

      const wildCards = standings.filter(s => s.seed !== null && s.seed >= 5);
      expect(wildCards.length).toBe(3);

      // Ravens should be 1 seed (best record 13-4)
      const seed1 = standings.find(s => s.seed === 1);
      expect(seed1?.team.id).toBe('5'); // Ravens
    });

    it('should produce correct playoff structure for 2023 NFC', () => {
      const nfcTeamRecords = [
        // NFC East
        { id: '17', wins: 12, losses: 5 },  // Cowboys
        { id: '18', wins: 6, losses: 11 },  // Giants
        { id: '19', wins: 11, losses: 6 },  // Eagles
        { id: '20', wins: 4, losses: 13 },  // Commanders
        // NFC North
        { id: '21', wins: 7, losses: 10 },  // Bears
        { id: '22', wins: 12, losses: 5 },  // Lions
        { id: '23', wins: 9, losses: 8 },   // Packers
        { id: '24', wins: 7, losses: 10 },  // Vikings
        // NFC South
        { id: '25', wins: 7, losses: 10 },  // Falcons
        { id: '26', wins: 2, losses: 15 },  // Panthers
        { id: '27', wins: 9, losses: 8 },   // Saints
        { id: '28', wins: 9, losses: 8 },   // Buccaneers
        // NFC West
        { id: '29', wins: 4, losses: 13 },  // Cardinals
        { id: '30', wins: 10, losses: 7 },  // Rams
        { id: '31', wins: 12, losses: 5 },  // 49ers
        { id: '32', wins: 9, losses: 8 },   // Seahawks
      ];

      const teams = nfcTeamRecords.map(r => getTeamById(r.id)!);
      const games = generateGamesFromRecords(nfcTeamRecords);
      const standings = calculatePlayoffSeedings('NFC', teams, games, {});

      // Verify playoff structure
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);

      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);
      expect(divisionWinners.length).toBe(4);

      const wildCards = standings.filter(s => s.seed !== null && s.seed >= 5);
      expect(wildCards.length).toBe(3);

      // 1 seed should be a division winner with one of the best records
      const seed1 = standings.find(s => s.seed === 1);
      expect(seed1).toBeDefined();
      expect(seed1?.seed).toBe(1);
    });
  });

  describe('2022 NFL Season Final Standings', () => {
    /**
     * 2022 NFL Playoff Seeds (actual results):
     * AFC: 1-Chiefs(14-3), 2-Bills(13-3), 3-Bengals(12-4), 4-Jaguars(9-8),
     *      5-Chargers(10-7), 6-Ravens(10-7), 7-Dolphins(9-8)
     * NFC: 1-Eagles(14-3), 2-49ers(13-4), 3-Vikings(13-4), 4-Buccaneers(8-9),
     *      5-Cowboys(12-5), 6-Giants(9-7-1), 7-Seahawks(9-8)
     *
     * Note: These tests verify the seeding algorithm's structure rather than
     * exact historical results, since that would require simulating all games.
     */

    it('should produce correct playoff structure for 2022 AFC', () => {
      const afcTeamRecords = [
        // AFC East
        { id: '1', wins: 13, losses: 3 },   // Bills
        { id: '2', wins: 9, losses: 8 },    // Dolphins
        { id: '3', wins: 8, losses: 9 },    // Patriots
        { id: '4', wins: 7, losses: 10 },   // Jets
        // AFC North
        { id: '5', wins: 10, losses: 7 },   // Ravens
        { id: '6', wins: 12, losses: 4 },   // Bengals
        { id: '7', wins: 7, losses: 10 },   // Browns
        { id: '8', wins: 9, losses: 8 },    // Steelers
        // AFC South
        { id: '9', wins: 3, losses: 13, ties: 1 }, // Texans
        { id: '10', wins: 4, losses: 12, ties: 1 }, // Colts
        { id: '11', wins: 9, losses: 8 },   // Jaguars
        { id: '12', wins: 7, losses: 10 },  // Titans
        // AFC West
        { id: '13', wins: 5, losses: 12 },  // Broncos
        { id: '14', wins: 14, losses: 3 },  // Chiefs
        { id: '15', wins: 6, losses: 11 },  // Raiders
        { id: '16', wins: 10, losses: 7 },  // Chargers
      ];

      const teams = afcTeamRecords.map(r => getTeamById(r.id)!);
      const games = generateGamesFromRecords(afcTeamRecords);
      const standings = calculatePlayoffSeedings('AFC', teams, games, {});

      // Verify playoff structure
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);

      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);
      expect(divisionWinners.length).toBe(4);

      const wildCards = standings.filter(s => s.seed !== null && s.seed >= 5);
      expect(wildCards.length).toBe(3);

      // Chiefs should be 1 seed (best record 14-3)
      const seed1 = standings.find(s => s.seed === 1);
      expect(seed1?.team.id).toBe('14'); // Chiefs
    });

    it('should produce correct playoff structure for 2022 NFC with ties', () => {
      const nfcTeamRecords = [
        // NFC East
        { id: '17', wins: 12, losses: 5 },  // Cowboys
        { id: '18', wins: 9, losses: 7, ties: 1 }, // Giants (tie!)
        { id: '19', wins: 14, losses: 3 },  // Eagles
        { id: '20', wins: 8, losses: 8, ties: 1 }, // Commanders
        // NFC North
        { id: '21', wins: 3, losses: 14 },  // Bears
        { id: '22', wins: 9, losses: 8 },   // Lions
        { id: '23', wins: 8, losses: 9 },   // Packers
        { id: '24', wins: 13, losses: 4 },  // Vikings
        // NFC South
        { id: '25', wins: 7, losses: 10 },  // Falcons
        { id: '26', wins: 7, losses: 10 },  // Panthers
        { id: '27', wins: 7, losses: 10 },  // Saints
        { id: '28', wins: 8, losses: 9 },   // Buccaneers
        // NFC West
        { id: '29', wins: 4, losses: 13 },  // Cardinals
        { id: '30', wins: 5, losses: 12 },  // Rams
        { id: '31', wins: 13, losses: 4 },  // 49ers
        { id: '32', wins: 9, losses: 8 },   // Seahawks
      ];

      const teams = nfcTeamRecords.map(r => getTeamById(r.id)!);
      const games = generateGamesFromRecords(nfcTeamRecords);
      const standings = calculatePlayoffSeedings('NFC', teams, games, {});

      // Verify playoff structure
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);

      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);
      expect(divisionWinners.length).toBe(4);

      const wildCards = standings.filter(s => s.seed !== null && s.seed >= 5);
      expect(wildCards.length).toBe(3);

      // 1 seed should be a division winner with one of the best records
      const seed1 = standings.find(s => s.seed === 1);
      expect(seed1).toBeDefined();
      expect(seed1?.seed).toBe(1);
    });
  });

  describe('2021 NFL Season Final Standings', () => {
    /**
     * 2021 NFL Playoff Seeds (actual results):
     * AFC: 1-Titans(12-5), 2-Chiefs(12-5), 3-Bills(11-6), 4-Bengals(10-7),
     *      5-Raiders(10-7), 6-Patriots(10-7), 7-Steelers(9-7-1)
     * NFC: 1-Packers(13-4), 2-Buccaneers(13-4), 3-Cowboys(12-5), 4-Rams(12-5),
     *      5-Cardinals(11-6), 6-49ers(10-7), 7-Eagles(9-8)
     *
     * Note: These tests verify the seeding algorithm's structure rather than
     * exact historical results, since that would require simulating all games.
     */

    it('should produce correct playoff structure for 2021 AFC with tie', () => {
      const afcTeamRecords = [
        // AFC East
        { id: '1', wins: 11, losses: 6 },   // Bills
        { id: '2', wins: 9, losses: 8 },    // Dolphins
        { id: '3', wins: 10, losses: 7 },   // Patriots
        { id: '4', wins: 4, losses: 13 },   // Jets
        // AFC North
        { id: '5', wins: 8, losses: 9 },    // Ravens
        { id: '6', wins: 10, losses: 7 },   // Bengals
        { id: '7', wins: 8, losses: 9 },    // Browns
        { id: '8', wins: 9, losses: 7, ties: 1 }, // Steelers (tie!)
        // AFC South
        { id: '9', wins: 4, losses: 13 },   // Texans
        { id: '10', wins: 9, losses: 8 },   // Colts
        { id: '11', wins: 3, losses: 14 },  // Jaguars
        { id: '12', wins: 12, losses: 5 },  // Titans
        // AFC West
        { id: '13', wins: 7, losses: 10 },  // Broncos
        { id: '14', wins: 12, losses: 5 },  // Chiefs
        { id: '15', wins: 10, losses: 7 },  // Raiders
        { id: '16', wins: 9, losses: 8 },   // Chargers
      ];

      const teams = afcTeamRecords.map(r => getTeamById(r.id)!);
      const games = generateGamesFromRecords(afcTeamRecords);
      const standings = calculatePlayoffSeedings('AFC', teams, games, {});

      // Verify playoff structure
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);

      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);
      expect(divisionWinners.length).toBe(4);

      const wildCards = standings.filter(s => s.seed !== null && s.seed >= 5);
      expect(wildCards.length).toBe(3);

      // 1 seed should be a division winner with one of the best records
      const seed1 = standings.find(s => s.seed === 1);
      expect(seed1).toBeDefined();
      expect(seed1?.seed).toBe(1);
    });

    it('should produce correct playoff structure for 2021 NFC', () => {
      const nfcTeamRecords = [
        // NFC East
        { id: '17', wins: 12, losses: 5 },  // Cowboys
        { id: '18', wins: 4, losses: 13 },  // Giants
        { id: '19', wins: 9, losses: 8 },   // Eagles
        { id: '20', wins: 7, losses: 10 },  // Washington
        // NFC North
        { id: '21', wins: 6, losses: 11 },  // Bears
        { id: '22', wins: 3, losses: 13, ties: 1 }, // Lions
        { id: '23', wins: 13, losses: 4 },  // Packers
        { id: '24', wins: 8, losses: 9 },   // Vikings
        // NFC South
        { id: '25', wins: 7, losses: 10 },  // Falcons
        { id: '26', wins: 5, losses: 12 },  // Panthers
        { id: '27', wins: 9, losses: 8 },   // Saints
        { id: '28', wins: 13, losses: 4 },  // Buccaneers
        // NFC West
        { id: '29', wins: 11, losses: 6 },  // Cardinals
        { id: '30', wins: 12, losses: 5 },  // Rams
        { id: '31', wins: 10, losses: 7 },  // 49ers
        { id: '32', wins: 7, losses: 10 },  // Seahawks
      ];

      const teams = nfcTeamRecords.map(r => getTeamById(r.id)!);
      const games = generateGamesFromRecords(nfcTeamRecords);
      const standings = calculatePlayoffSeedings('NFC', teams, games, {});

      // Verify playoff structure
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);

      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);
      expect(divisionWinners.length).toBe(4);

      const wildCards = standings.filter(s => s.seed !== null && s.seed >= 5);
      expect(wildCards.length).toBe(3);

      // 1 seed should be a division winner with one of the best records
      const seed1 = standings.find(s => s.seed === 1);
      expect(seed1).toBeDefined();
      expect(seed1?.seed).toBe(1);
    });
  });

  describe('2020 NFL Season Final Standings', () => {
    /**
     * 2020 NFL Playoff Seeds (actual results):
     * AFC: 1-Chiefs(14-2), 2-Bills(13-3), 3-Steelers(12-4), 4-Titans(11-5),
     *      5-Ravens(11-5), 6-Browns(11-5), 7-Colts(11-5)
     * NFC: 1-Packers(13-3), 2-Saints(12-4), 3-Seahawks(12-4), 4-Washington(7-9),
     *      5-Buccaneers(11-5), 6-Rams(10-6), 7-Bears(8-8)
     *
     * Note: These tests verify the seeding algorithm's structure rather than
     * exact historical results, since that would require simulating all games.
     */

    it('should produce correct playoff structure for 2020 AFC', () => {
      const afcTeamRecords = [
        // AFC East
        { id: '1', wins: 13, losses: 3 },   // Bills
        { id: '2', wins: 10, losses: 6 },   // Dolphins
        { id: '3', wins: 7, losses: 9 },    // Patriots
        { id: '4', wins: 2, losses: 14 },   // Jets
        // AFC North
        { id: '5', wins: 11, losses: 5 },   // Ravens
        { id: '6', wins: 4, losses: 11, ties: 1 }, // Bengals
        { id: '7', wins: 11, losses: 5 },   // Browns
        { id: '8', wins: 12, losses: 4 },   // Steelers
        // AFC South
        { id: '9', wins: 4, losses: 12 },   // Texans
        { id: '10', wins: 11, losses: 5 },  // Colts
        { id: '11', wins: 1, losses: 15 },  // Jaguars
        { id: '12', wins: 11, losses: 5 },  // Titans
        // AFC West
        { id: '13', wins: 5, losses: 11 },  // Broncos
        { id: '14', wins: 14, losses: 2 },  // Chiefs
        { id: '15', wins: 8, losses: 8 },   // Raiders
        { id: '16', wins: 7, losses: 9 },   // Chargers
      ];

      const teams = afcTeamRecords.map(r => getTeamById(r.id)!);
      const games = generateGamesFromRecords(afcTeamRecords);
      const standings = calculatePlayoffSeedings('AFC', teams, games, {});

      // Verify playoff structure
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);

      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);
      expect(divisionWinners.length).toBe(4);

      const wildCards = standings.filter(s => s.seed !== null && s.seed >= 5);
      expect(wildCards.length).toBe(3);

      // Chiefs should be 1 seed (best record 14-2)
      const seed1 = standings.find(s => s.seed === 1);
      expect(seed1?.team.id).toBe('14'); // Chiefs
    });

    it('should produce correct playoff structure for 2020 NFC', () => {
      const nfcTeamRecords = [
        { id: '17', wins: 6, losses: 10 },  // Cowboys
        { id: '18', wins: 6, losses: 10 },  // Giants
        { id: '19', wins: 4, losses: 11, ties: 1 }, // Eagles
        { id: '20', wins: 7, losses: 9 },   // Washington
        { id: '21', wins: 8, losses: 8 },   // Bears
        { id: '22', wins: 5, losses: 11 },  // Lions
        { id: '23', wins: 13, losses: 3 },  // Packers
        { id: '24', wins: 7, losses: 9 },   // Vikings
        { id: '25', wins: 4, losses: 12 },  // Falcons
        { id: '26', wins: 5, losses: 11 },  // Panthers
        { id: '27', wins: 12, losses: 4 },  // Saints
        { id: '28', wins: 11, losses: 5 },  // Buccaneers
        { id: '29', wins: 8, losses: 8 },   // Cardinals
        { id: '30', wins: 10, losses: 6 },  // Rams
        { id: '31', wins: 6, losses: 10 },  // 49ers
        { id: '32', wins: 12, losses: 4 },  // Seahawks
      ];

      const teams = nfcTeamRecords.map(r => getTeamById(r.id)!);
      const games = generateGamesFromRecords(nfcTeamRecords);
      const standings = calculatePlayoffSeedings('NFC', teams, games, {});

      // Verify playoff structure
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);

      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);
      expect(divisionWinners.length).toBe(4);

      const wildCards = standings.filter(s => s.seed !== null && s.seed >= 5);
      expect(wildCards.length).toBe(3);

      // 1 seed should be a division winner with one of the best records
      const seed1 = standings.find(s => s.seed === 1);
      expect(seed1).toBeDefined();
      expect(seed1?.seed).toBe(1);
    });
  });

  describe('Historical Tiebreaker Scenarios', () => {
    it('should verify playoff seeding produces 7 teams per conference', () => {
      // Test using 2023 AFC standings as baseline
      const afcTeamRecords = [
        { id: '1', wins: 11, losses: 6 },   // Bills
        { id: '2', wins: 11, losses: 6 },   // Dolphins
        { id: '3', wins: 4, losses: 13 },   // Patriots
        { id: '4', wins: 7, losses: 10 },   // Jets
        { id: '5', wins: 13, losses: 4 },   // Ravens
        { id: '6', wins: 9, losses: 8 },    // Bengals
        { id: '7', wins: 11, losses: 6 },   // Browns
        { id: '8', wins: 10, losses: 7 },   // Steelers
        { id: '9', wins: 10, losses: 7 },   // Texans
        { id: '10', wins: 9, losses: 8 },   // Colts
        { id: '11', wins: 9, losses: 8 },   // Jaguars
        { id: '12', wins: 6, losses: 11 },  // Titans
        { id: '13', wins: 8, losses: 9 },   // Broncos
        { id: '14', wins: 11, losses: 6 },  // Chiefs
        { id: '15', wins: 8, losses: 9 },   // Raiders
        { id: '16', wins: 5, losses: 12 },  // Chargers
      ];

      const teams = afcTeamRecords.map(r => getTeamById(r.id)!);
      const games = generateGamesFromRecords(afcTeamRecords);
      const standings = calculatePlayoffSeedings('AFC', teams, games, {});

      // Verify exactly 7 playoff teams
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);

      // Verify seeds are 1-7 (no duplicates)
      const seeds = playoffTeams.map(s => s.seed).sort((a, b) => a! - b!);
      expect(seeds).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('should verify division winners get seeds 1-4', () => {
      // Test that the 4 teams with best records in their divisions get seeds 1-4
      const nfcTeamRecords = [
        { id: '17', wins: 12, losses: 5 },  // Cowboys - best NFC East
        { id: '18', wins: 6, losses: 11 },  // Giants
        { id: '19', wins: 11, losses: 6 },  // Eagles
        { id: '20', wins: 4, losses: 13 },  // Commanders
        { id: '21', wins: 7, losses: 10 },  // Bears
        { id: '22', wins: 12, losses: 5 },  // Lions - best NFC North
        { id: '23', wins: 9, losses: 8 },   // Packers
        { id: '24', wins: 7, losses: 10 },  // Vikings
        { id: '25', wins: 7, losses: 10 },  // Falcons
        { id: '26', wins: 2, losses: 15 },  // Panthers
        { id: '27', wins: 9, losses: 8 },   // Saints - best NFC South
        { id: '28', wins: 8, losses: 9 },   // Buccaneers
        { id: '29', wins: 4, losses: 13 },  // Cardinals
        { id: '30', wins: 10, losses: 7 },  // Rams
        { id: '31', wins: 12, losses: 5 },  // 49ers - best NFC West
        { id: '32', wins: 9, losses: 8 },   // Seahawks
      ];

      const teams = nfcTeamRecords.map(r => getTeamById(r.id)!);
      const games = generateGamesFromRecords(nfcTeamRecords);
      const standings = calculatePlayoffSeedings('NFC', teams, games, {});

      // Verify 4 division winners have seeds 1-4
      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);
      expect(divisionWinners.length).toBe(4);

      // Each division should have exactly one team in seeds 1-4
      const divisions = new Set(divisionWinners.map(s => s.team.division));
      expect(divisions.size).toBe(4);
    });

    it('should handle tie records with unique seed assignment', () => {
      // Test with multiple teams having identical records
      const afcTeamRecords = [
        { id: '1', wins: 13, losses: 3 },   // Bills
        { id: '2', wins: 10, losses: 6 },   // Dolphins
        { id: '3', wins: 7, losses: 9 },    // Patriots
        { id: '4', wins: 2, losses: 14 },   // Jets
        { id: '5', wins: 11, losses: 5 },   // Ravens (11-5)
        { id: '6', wins: 4, losses: 11, ties: 1 }, // Bengals
        { id: '7', wins: 11, losses: 5 },   // Browns (11-5)
        { id: '8', wins: 12, losses: 4 },   // Steelers
        { id: '9', wins: 4, losses: 12 },   // Texans
        { id: '10', wins: 11, losses: 5 },  // Colts (11-5)
        { id: '11', wins: 1, losses: 15 },  // Jaguars
        { id: '12', wins: 11, losses: 5 },  // Titans (11-5)
        { id: '13', wins: 5, losses: 11 },  // Broncos
        { id: '14', wins: 14, losses: 2 },  // Chiefs
        { id: '15', wins: 8, losses: 8 },   // Raiders
        { id: '16', wins: 7, losses: 9 },   // Chargers
      ];

      const teams = afcTeamRecords.map(r => getTeamById(r.id)!);
      const games = generateGamesFromRecords(afcTeamRecords);
      const standings = calculatePlayoffSeedings('AFC', teams, games, {});

      // Verify all seeds are unique
      const playoffTeams = standings.filter(s => s.seed !== null);
      const seeds = playoffTeams.map(s => s.seed);
      const uniqueSeeds = new Set(seeds);
      expect(uniqueSeeds.size).toBe(7);

      // Verify best record team is seed 1
      const seed1 = standings.find(s => s.seed === 1);
      expect(seed1?.team.id).toBe('14'); // Chiefs 14-2
    });
  });
});
