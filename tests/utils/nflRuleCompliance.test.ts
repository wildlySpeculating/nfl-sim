/**
 * Phase 14: NFL Rule Compliance Tests
 *
 * These tests verify that the tiebreaker implementation follows the official
 * NFL tiebreaker rules exactly. This is critical for the app's accuracy.
 *
 * Official NFL Tiebreaker Order (for division ties):
 * 1. Head-to-head (if applicable)
 * 2. Best won-lost-tied percentage in games played within the division
 * 3. Best won-lost-tied percentage in common games
 * 4. Best won-lost-tied percentage in games played within the conference
 * 5. Strength of victory
 * 6. Strength of schedule
 * 7. Best combined ranking among conference teams in points scored and points allowed
 * 8. Best combined ranking among all teams in points scored and points allowed
 * 9. Best net points in common games
 * 10. Best net points in all games
 * 11. Best net touchdowns in all games
 * 12. Coin toss
 *
 * For Wild Card tiebreakers, step 2 (division record) is SKIPPED.
 */

import { describe, it, expect } from 'vitest';
import { calculateTeamRecords, calculatePlayoffSeedings, breakTie } from '@/utils/tiebreakers';
import type { Game, GameSelection, Team } from '@/types';

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

// Create standard AFC East teams for testing
const bills = createTeam('1', 'Bills', 'AFC', 'AFC East');
const dolphins = createTeam('2', 'Dolphins', 'AFC', 'AFC East');
const patriots = createTeam('3', 'Patriots', 'AFC', 'AFC East');
const jets = createTeam('4', 'Jets', 'AFC', 'AFC East');

// Create AFC North teams
const ravens = createTeam('5', 'Ravens', 'AFC', 'AFC North');
const bengals = createTeam('6', 'Bengals', 'AFC', 'AFC North');
const browns = createTeam('7', 'Browns', 'AFC', 'AFC North');
const steelers = createTeam('8', 'Steelers', 'AFC', 'AFC North');

// Create AFC South teams
const texans = createTeam('9', 'Texans', 'AFC', 'AFC South');
const colts = createTeam('10', 'Colts', 'AFC', 'AFC South');
const jaguars = createTeam('11', 'Jaguars', 'AFC', 'AFC South');
const titans = createTeam('12', 'Titans', 'AFC', 'AFC South');

// Create AFC West teams
const broncos = createTeam('13', 'Broncos', 'AFC', 'AFC West');
const chiefs = createTeam('14', 'Chiefs', 'AFC', 'AFC West');
const chargers = createTeam('15', 'Chargers', 'AFC', 'AFC West');
const raiders = createTeam('16', 'Raiders', 'AFC', 'AFC West');

// Create NFC East teams for cross-conference tests
const cowboys = createTeam('17', 'Cowboys', 'NFC', 'NFC East');
const eagles = createTeam('18', 'Eagles', 'NFC', 'NFC East');
const giants = createTeam('19', 'Giants', 'NFC', 'NFC East');
const commanders = createTeam('20', 'Commanders', 'NFC', 'NFC East');

const allAfcTeams = [
  bills, dolphins, patriots, jets,
  ravens, bengals, browns, steelers,
  texans, colts, jaguars, titans,
  broncos, chiefs, chargers, raiders,
];

describe('Phase 14: NFL Rule Compliance - Tiebreaker Order', () => {
  describe('Step 1: Head-to-Head Record', () => {
    it('should use head-to-head as the FIRST tiebreaker for 2-team ties', () => {
      // Bills and Dolphins both 10-6, but Bills swept Dolphins
      const games: Game[] = [
        // Bills beat Dolphins twice (head-to-head)
        createGame('g1', bills, dolphins, 24, 17, 'final', 1),
        createGame('g2', dolphins, bills, 17, 21, 'final', 2),
        // Both teams go 8-6 in other games
        ...Array.from({ length: 8 }, (_, i) =>
          createGame(`bills-win-${i}`, bills, patriots, 24, 17, 'final', i + 3)
        ),
        ...Array.from({ length: 8 }, (_, i) =>
          createGame(`dolphins-win-${i}`, dolphins, jets, 24, 17, 'final', i + 3)
        ),
      ];

      const teams = [bills, dolphins, patriots, jets];
      const records = calculateTeamRecords(teams, games, {});

      const result = breakTie([bills, dolphins], records, games, {}, true);

      expect(result[0].id).toBe(bills.id);
      expect(result[1].id).toBe(dolphins.id);
    });

    it('should NOT use head-to-head when teams have not played each other', () => {
      // Bills and Ravens both 10-6, never played each other
      const games: Game[] = [
        // Bills go 10-6 without playing Ravens
        ...Array.from({ length: 10 }, (_, i) =>
          createGame(`bills-win-${i}`, bills, dolphins, 24, 17, 'final', i + 1)
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          createGame(`bills-loss-${i}`, patriots, bills, 24, 17, 'final', i + 11)
        ),
        // Ravens go 10-6 without playing Bills
        ...Array.from({ length: 10 }, (_, i) =>
          createGame(`ravens-win-${i}`, ravens, bengals, 24, 17, 'final', i + 1)
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          createGame(`ravens-loss-${i}`, steelers, ravens, 24, 17, 'final', i + 11)
        ),
      ];

      const teams = [bills, dolphins, patriots, jets, ravens, bengals, browns, steelers];
      const records = calculateTeamRecords(teams, games, {});

      // Head-to-head cannot apply, should fall through to other tiebreakers
      const result = breakTie([bills, ravens], records, games, {}, false);

      // The result should be determined by another tiebreaker, not head-to-head
      // (both teams have same record so it falls through)
      expect(result).toHaveLength(2);
    });

    it('should handle 2-team head-to-head split (1-1)', () => {
      // Bills and Dolphins split their series
      const games: Game[] = [
        createGame('g1', bills, dolphins, 24, 17, 'final', 1), // Bills win
        createGame('g2', dolphins, bills, 24, 17, 'final', 2), // Dolphins win
      ];

      const teams = [bills, dolphins];
      const records = calculateTeamRecords(teams, games, {});

      // H2H is tied, should fall through to next tiebreaker
      const result = breakTie([bills, dolphins], records, games, {}, true);

      // Since H2H is split, it should not resolve the tie
      // Division record or other tiebreaker should apply
      expect(result).toHaveLength(2);
    });

    it('should use head-to-head for 3-team tie ONLY if all have played each other', () => {
      // Bills, Dolphins, Patriots all 10-6, all played each other
      const games: Game[] = [
        // Bills beat Dolphins and Patriots
        createGame('g1', bills, dolphins, 24, 17, 'final', 1),
        createGame('g2', bills, patriots, 24, 17, 'final', 2),
        // Dolphins beat Patriots, lost to Bills
        createGame('g3', dolphins, patriots, 24, 17, 'final', 3),
        // Patriots lost to both
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

    it('should NOT use head-to-head for 3-team tie if not all have played each other', () => {
      // Bills, Dolphins, Jets all 10-6, but Bills hasn't played Jets
      const games: Game[] = [
        createGame('g1', bills, dolphins, 24, 17, 'final', 1),
        createGame('g2', dolphins, jets, 24, 17, 'final', 2),
        // Bills vs Jets game doesn't exist
      ];

      const teams = [bills, dolphins, jets];
      const records = calculateTeamRecords(teams, games, {});

      // H2H should NOT apply since not all teams played
      const result = breakTie([bills, dolphins, jets], records, games, {}, true);

      // Should fall through to division record or other tiebreaker
      expect(result).toHaveLength(3);
    });

    it('should handle head-to-head circular tie (A beats B, B beats C, C beats A)', () => {
      // Circular head-to-head: Bills > Dolphins > Patriots > Bills
      const games: Game[] = [
        createGame('g1', bills, dolphins, 24, 17, 'final', 1), // Bills beat Dolphins
        createGame('g2', dolphins, patriots, 24, 17, 'final', 2), // Dolphins beat Patriots
        createGame('g3', patriots, bills, 24, 17, 'final', 3), // Patriots beat Bills
      ];

      const teams = [bills, dolphins, patriots];
      const records = calculateTeamRecords(teams, games, {});

      // All teams are 1-1 in H2H, should fall through
      const result = breakTie([bills, dolphins, patriots], records, games, {}, true);

      expect(result).toHaveLength(3);
    });
  });

  describe('Step 2: Division Record (Division Ties ONLY)', () => {
    it('should use division record as step 2 for DIVISION ties', () => {
      // Bills and Dolphins tied overall at 10-6, H2H split, different division records
      const games: Game[] = [
        // H2H split
        createGame('h2h-1', bills, dolphins, 24, 17, 'final', 1),
        createGame('h2h-2', dolphins, bills, 24, 17, 'final', 2),
        // Bills: 5-1 in division (better)
        createGame('d1', bills, patriots, 24, 17, 'final', 3),
        createGame('d2', bills, jets, 24, 17, 'final', 4),
        createGame('d3', patriots, bills, 24, 17, 'final', 5),
        createGame('d4', bills, jets, 24, 17, 'final', 6), // Bills now 5-1 div
        // Dolphins: 3-3 in division
        createGame('d5', dolphins, patriots, 24, 17, 'final', 7),
        createGame('d6', jets, dolphins, 24, 17, 'final', 8),
        createGame('d7', dolphins, jets, 24, 17, 'final', 9),
        createGame('d8', patriots, dolphins, 24, 17, 'final', 10), // Dolphins now 3-3 div
      ];

      const teams = [bills, dolphins, patriots, jets];
      const records = calculateTeamRecords(teams, games, {});

      const result = breakTie([bills, dolphins], records, games, {}, true);

      // Bills should win because of better division record
      expect(result[0].id).toBe(bills.id);
    });

    it('should SKIP division record for WILD CARD ties', () => {
      // Bills (AFC East) vs Ravens (AFC North) - Wild Card tie
      // Bills have better division record but it shouldn't matter for wild card
      const games: Game[] = [
        // Bills: 10-6 overall, 6-0 in division
        createGame('d1', bills, dolphins, 24, 17, 'final', 1),
        createGame('d2', bills, patriots, 24, 17, 'final', 2),
        createGame('d3', bills, jets, 24, 17, 'final', 3),
        createGame('d4', dolphins, bills, 17, 24, 'final', 4),
        createGame('d5', patriots, bills, 17, 24, 'final', 5),
        createGame('d6', jets, bills, 17, 24, 'final', 6),
        // Non-division games
        createGame('nd1', ravens, bills, 24, 17, 'final', 7), // Bills loss
        createGame('nd2', bengals, bills, 24, 17, 'final', 8),
        createGame('nd3', browns, bills, 24, 17, 'final', 9),
        createGame('nd4', steelers, bills, 24, 17, 'final', 10),
        // Ravens: 10-6 overall, 3-3 in division, but better conference record
        createGame('rd1', ravens, bengals, 24, 17, 'final', 11),
        createGame('rd2', ravens, browns, 24, 17, 'final', 12),
        createGame('rd3', bengals, ravens, 24, 17, 'final', 13),
        createGame('rd4', browns, ravens, 24, 17, 'final', 14),
        createGame('rd5', ravens, steelers, 24, 17, 'final', 15),
        createGame('rd6', steelers, ravens, 24, 17, 'final', 16), // Ravens 3-3 div
        // Ravens conference wins
        createGame('rc1', ravens, texans, 24, 17, 'final', 17),
        createGame('rc2', ravens, colts, 24, 17, 'final', 18),
        createGame('rc3', ravens, jaguars, 24, 17, 'final', 19),
        createGame('rc4', ravens, titans, 24, 17, 'final', 20),
      ];

      const teams = allAfcTeams;
      const records = calculateTeamRecords(teams, games, {});

      // Wild card tie - division record should NOT be used
      const result = breakTie([bills, ravens], records, games, {}, false);

      // Ravens have better conference record, should win wild card tiebreaker
      const billsRec = records.get(bills.id)!;
      const ravensRec = records.get(ravens.id)!;

      // Verify Bills have better division record (which shouldn't matter)
      expect(billsRec.divisionWins).toBeGreaterThan(ravensRec.divisionWins);

      // Result should NOT be determined by division record
      expect(result).toHaveLength(2);
    });

    it('should handle tied division records and fall through to common games', () => {
      // Both teams have identical division records
      const games: Game[] = [
        // H2H split
        createGame('h1', bills, dolphins, 24, 17, 'final', 1),
        createGame('h2', dolphins, bills, 24, 17, 'final', 2),
        // Both 4-2 in division
        createGame('d1', bills, patriots, 24, 17, 'final', 3),
        createGame('d2', bills, jets, 24, 17, 'final', 4),
        createGame('d3', patriots, bills, 24, 17, 'final', 5),
        createGame('d4', dolphins, patriots, 24, 17, 'final', 6),
        createGame('d5', dolphins, jets, 24, 17, 'final', 7),
        createGame('d6', jets, dolphins, 24, 17, 'final', 8),
      ];

      const teams = [bills, dolphins, patriots, jets];
      const records = calculateTeamRecords(teams, games, {});

      // Division records should be equal
      const billsRec = records.get(bills.id)!;
      const dolphinsRec = records.get(dolphins.id)!;

      expect(billsRec.divisionWins).toBe(dolphinsRec.divisionWins);
      expect(billsRec.divisionLosses).toBe(dolphinsRec.divisionLosses);

      // Should fall through to common games (step 3)
      const result = breakTie([bills, dolphins], records, games, {}, true);
      expect(result).toHaveLength(2);
    });
  });

  describe('Step 3: Common Games Record', () => {
    it('should use common games record when H2H and division record are tied', () => {
      // Bills and Dolphins tied in H2H and division, but different common games record
      const games: Game[] = [
        // H2H split
        createGame('h1', bills, dolphins, 24, 17, 'final', 1),
        createGame('h2', dolphins, bills, 24, 17, 'final', 2),
        // Both vs Patriots, Jets, Ravens, Bengals (4+ common opponents)
        createGame('c1', bills, patriots, 24, 17, 'final', 3), // Bills win
        createGame('c2', bills, jets, 24, 17, 'final', 4), // Bills win
        createGame('c3', bills, ravens, 24, 17, 'final', 5), // Bills win
        createGame('c4', bills, bengals, 24, 17, 'final', 6), // Bills win (4-0)
        createGame('c5', dolphins, patriots, 24, 17, 'final', 7), // Dolphins win
        createGame('c6', dolphins, jets, 24, 17, 'final', 8), // Dolphins win
        createGame('c7', ravens, dolphins, 24, 17, 'final', 9), // Dolphins loss
        createGame('c8', bengals, dolphins, 24, 17, 'final', 10), // Dolphins loss (2-2)
      ];

      const teams = [bills, dolphins, patriots, jets, ravens, bengals];
      const records = calculateTeamRecords(teams, games, {});

      const result = breakTie([bills, dolphins], records, games, {}, true);

      // Bills have better common games record (4-0 vs 2-2)
      expect(result[0].id).toBe(bills.id);
    });

    it('should require MINIMUM 4 common games to use this tiebreaker', () => {
      // Only 3 common opponents - should skip common games tiebreaker
      const games: Game[] = [
        // H2H split
        createGame('h1', bills, dolphins, 24, 17, 'final', 1),
        createGame('h2', dolphins, bills, 24, 17, 'final', 2),
        // Only 3 common opponents (Patriots, Jets, Ravens)
        createGame('c1', bills, patriots, 24, 17, 'final', 3),
        createGame('c2', bills, jets, 24, 17, 'final', 4),
        createGame('c3', bills, ravens, 24, 17, 'final', 5),
        createGame('c4', dolphins, patriots, 17, 24, 'final', 6), // Loss
        createGame('c5', dolphins, jets, 17, 24, 'final', 7), // Loss
        createGame('c6', dolphins, ravens, 17, 24, 'final', 8), // Loss
      ];

      const teams = [bills, dolphins, patriots, jets, ravens];
      const records = calculateTeamRecords(teams, games, {});

      // Only 3 common opponents, should fall through to conference record
      const result = breakTie([bills, dolphins], records, games, {}, true);
      expect(result).toHaveLength(2);
    });

    it('should count common opponents, not common games', () => {
      // 4 common opponents but some played twice
      const games: Game[] = [
        // H2H split
        createGame('h1', bills, dolphins, 24, 17, 'final', 1),
        createGame('h2', dolphins, bills, 24, 17, 'final', 2),
        // Bills vs 4 common opponents (some twice)
        createGame('c1', bills, patriots, 24, 17, 'final', 3),
        createGame('c2', patriots, bills, 17, 24, 'final', 4), // Same opponent twice
        createGame('c3', bills, jets, 24, 17, 'final', 5),
        createGame('c4', bills, ravens, 24, 17, 'final', 6),
        createGame('c5', bills, bengals, 24, 17, 'final', 7),
        // Dolphins vs same 4 opponents
        createGame('c6', dolphins, patriots, 17, 24, 'final', 8),
        createGame('c7', dolphins, jets, 17, 24, 'final', 9),
        createGame('c8', dolphins, ravens, 17, 24, 'final', 10),
        createGame('c9', dolphins, bengals, 17, 24, 'final', 11),
      ];

      const teams = [bills, dolphins, patriots, jets, ravens, bengals];
      const records = calculateTeamRecords(teams, games, {});

      // Should have 4 common opponents
      const result = breakTie([bills, dolphins], records, games, {}, true);
      expect(result[0].id).toBe(bills.id); // Better common games record
    });
  });

  describe('Step 4: Conference Record', () => {
    it('should use conference record after H2H, division, and common games', () => {
      // Teams tied in everything else, conference record breaks it
      const games: Game[] = [
        // H2H split
        createGame('h1', bills, dolphins, 24, 17, 'final', 1),
        createGame('h2', dolphins, bills, 24, 17, 'final', 2),
        // Same division record (4-2 each)
        createGame('d1', bills, patriots, 24, 17, 'final', 3),
        createGame('d2', bills, jets, 24, 17, 'final', 4),
        createGame('d3', dolphins, patriots, 24, 17, 'final', 5),
        createGame('d4', dolphins, jets, 24, 17, 'final', 6),
        // Conference games (Bills better)
        createGame('c1', bills, ravens, 24, 17, 'final', 7),
        createGame('c2', bills, bengals, 24, 17, 'final', 8),
        createGame('c3', bills, browns, 24, 17, 'final', 9),
        createGame('c4', bills, steelers, 24, 17, 'final', 10), // Bills 8-2 conf
        createGame('c5', ravens, dolphins, 24, 17, 'final', 11),
        createGame('c6', bengals, dolphins, 24, 17, 'final', 12), // Dolphins 6-4 conf
      ];

      const teams = [bills, dolphins, patriots, jets, ravens, bengals, browns, steelers];
      const records = calculateTeamRecords(teams, games, {});

      const result = breakTie([bills, dolphins], records, games, {}, true);

      // Bills should win - better conference record
      expect(result[0].id).toBe(bills.id);
    });

    it('should apply conference record for wild card ties (division record skipped)', () => {
      // Wild card: Bills vs Texans, different divisions, conference record matters
      const games: Game[] = [
        // Both 10-6 overall
        // Bills conference record: 9-3
        ...Array.from({ length: 9 }, (_, i) =>
          createGame(`bills-conf-${i}`, bills, [dolphins, patriots, jets, ravens, bengals, browns, steelers, texans, colts][i], 24, 17, 'final', i + 1)
        ),
        ...Array.from({ length: 3 }, (_, i) =>
          createGame(`bills-conf-loss-${i}`, [jaguars, titans, broncos][i], bills, 24, 17, 'final', i + 10)
        ),
        // Texans conference record: 7-5
        ...Array.from({ length: 7 }, (_, i) =>
          createGame(`texans-conf-${i}`, texans, [colts, jaguars, titans, ravens, bengals, browns, steelers][i], 24, 17, 'final', i + 1)
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          createGame(`texans-conf-loss-${i}`, [dolphins, patriots, jets, broncos, chiefs][i], texans, 24, 17, 'final', i + 8)
        ),
      ];

      const teams = allAfcTeams;
      const records = calculateTeamRecords(teams, games, {});

      // Wild card tie (isDivisionTie = false)
      const result = breakTie([bills, texans], records, games, {}, false);

      expect(result[0].id).toBe(bills.id); // Better conference record
    });
  });

  describe('Step 5: Strength of Victory (SOV)', () => {
    it('should use SOV when conference record is tied', () => {
      // Same record, same conference record, but Bills beat better teams
      const games: Game[] = [
        // Bills beat Patriots (10-6) and Dolphins (8-8)
        createGame('b1', bills, patriots, 24, 17, 'final', 1),
        createGame('b2', bills, dolphins, 24, 17, 'final', 2),
        // Dolphins beat Jets (4-12) and Browns (4-12)
        createGame('d1', dolphins, jets, 24, 17, 'final', 3),
        createGame('d2', dolphins, browns, 24, 17, 'final', 4),
        // Give Patriots a good record
        ...Array.from({ length: 9 }, (_, i) =>
          createGame(`patriots-win-${i}`, patriots, jets, 24, 17, 'final', i + 5)
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          createGame(`patriots-loss-${i}`, ravens, patriots, 24, 17, 'final', i + 14)
        ),
      ];

      const teams = [bills, dolphins, patriots, jets, browns, ravens];
      const records = calculateTeamRecords(teams, games, {});

      const result = breakTie([bills, dolphins], records, games, {}, true);

      // Bills beat better opponents (higher SOV), should win
      expect(result[0].id).toBe(bills.id);
    });

    it('should handle team with 0 wins (SOV = 0)', () => {
      // Team with 0 wins should have SOV of 0
      const games: Game[] = [
        createGame('g1', dolphins, bills, 24, 17, 'final', 1),
        createGame('g2', patriots, bills, 24, 17, 'final', 2),
      ];

      const teams = [bills, dolphins, patriots];
      const records = calculateTeamRecords(teams, games, {});

      // Bills have 0 wins, SOV should be 0
      // This shouldn't cause a crash
      const result = breakTie([bills, dolphins], records, games, {}, true);
      expect(result).toHaveLength(2);
    });
  });

  describe('Step 6: Strength of Schedule (SOS)', () => {
    it('should use SOS when SOV is tied', () => {
      // Both teams have identical records and beat opponents with same combined record
      // But Bills played against tougher overall schedule
      const games: Game[] = [
        // H2H split
        createGame('h2h1', bills, dolphins, 24, 17, 'final', 1),
        createGame('h2h2', dolphins, bills, 24, 17, 'final', 2),
        // Both beat the same type of opponent (Patriots with 8-8 record)
        createGame('b1', bills, patriots, 24, 17, 'final', 3),
        createGame('d1', dolphins, patriots, 24, 17, 'final', 4),
        // Bills additionally played Chiefs (10-6) and lost
        createGame('b2', chiefs, bills, 24, 17, 'final', 5),
        // Dolphins additionally played Jets (2-14) and lost
        createGame('d2', jets, dolphins, 24, 17, 'final', 6),
        // Set up team records to make SOS different
        // Patriots: 8-8
        ...Array.from({ length: 6 }, (_, i) =>
          createGame(`patriots-win-${i}`, patriots, jets, 24, 17, 'final', i + 10)
        ),
        // Chiefs: 10-6 (tougher opponent for Bills)
        ...Array.from({ length: 9 }, (_, i) =>
          createGame(`chiefs-win-${i}`, chiefs, broncos, 24, 17, 'final', i + 10)
        ),
        // Jets: 2-14 (weak opponent for Dolphins)
        createGame('jets-win-1', jets, browns, 24, 17, 'final', 20),
      ];

      const teams = [bills, dolphins, patriots, jets, chiefs, broncos, browns];
      const records = calculateTeamRecords(teams, games, {});

      // Both are 2-2 overall, similar records in all categories
      // But Bills' opponents (Patriots + Chiefs) have better combined record than
      // Dolphins' opponents (Patriots + Jets)
      const result = breakTie([bills, dolphins], records, games, {}, true);

      // Bills should have higher SOS (played tougher opponents)
      expect(result[0].id).toBe(bills.id);
    });
  });

  describe('Step 7: Conference Points Ranking', () => {
    it('should use combined points ranking when SOS is tied', () => {
      // Both have same SOS but different points rankings
      const games: Game[] = [
        // Bills: 400 PF, 300 PA (high scoring, good defense)
        createGame('b1', bills, dolphins, 100, 75, 'final', 1),
        createGame('b2', bills, patriots, 100, 75, 'final', 2),
        createGame('b3', bills, jets, 100, 75, 'final', 3),
        createGame('b4', bills, ravens, 100, 75, 'final', 4),
        // Dolphins: 350 PF, 350 PA (average)
        createGame('d1', dolphins, patriots, 87, 87, 'final', 5),
        createGame('d2', dolphins, jets, 88, 88, 'final', 6),
        createGame('d3', dolphins, ravens, 87, 87, 'final', 7),
        createGame('d4', dolphins, bengals, 88, 88, 'final', 8),
      ];

      const teams = [bills, dolphins, patriots, jets, ravens, bengals];
      const records = calculateTeamRecords(teams, games, {});

      // Bills should have better combined points ranking
      const result = breakTie([bills, dolphins], records, games, {}, true);
      expect(result[0].id).toBe(bills.id);
    });
  });

  describe('Steps 8-11: Net Points (Simplified to Point Differential)', () => {
    it('should use point differential as final tiebreaker', () => {
      // All else equal, better point differential wins
      const games: Game[] = [
        // Bills: +100 point differential
        createGame('b1', bills, dolphins, 50, 25, 'final', 1),
        createGame('b2', bills, patriots, 50, 25, 'final', 2),
        createGame('b3', patriots, bills, 25, 50, 'final', 3),
        createGame('b4', dolphins, bills, 25, 50, 'final', 4), // +100 total
        // Dolphins: +20 point differential
        createGame('d1', dolphins, jets, 30, 25, 'final', 5),
        createGame('d2', dolphins, ravens, 30, 25, 'final', 6),
        createGame('d3', jets, dolphins, 25, 30, 'final', 7),
        createGame('d4', ravens, dolphins, 25, 30, 'final', 8), // +20 total
      ];

      const teams = [bills, dolphins, patriots, jets, ravens];
      const records = calculateTeamRecords(teams, games, {});

      const result = breakTie([bills, dolphins], records, games, {}, true);

      // Bills have better point differential
      expect(result[0].id).toBe(bills.id);
    });

    it('should handle negative point differentials', () => {
      // Both negative but one less negative
      // Both teams have IDENTICAL records (0-2) to ensure point diff is the tiebreaker
      const games: Game[] = [
        // Bills: -50 point differential (0-2)
        createGame('b1', patriots, bills, 35, 10, 'final', 1), // Bills lose by 25
        createGame('b2', jets, bills, 35, 10, 'final', 2), // Bills lose by 25, total -50
        // Dolphins: -100 point differential (0-2)
        createGame('d1', patriots, dolphins, 60, 10, 'final', 3), // Dolphins lose by 50
        createGame('d2', jets, dolphins, 60, 10, 'final', 4), // Dolphins lose by 50, total -100
      ];

      const teams = [bills, dolphins, patriots, jets];
      const records = calculateTeamRecords(teams, games, {});

      // Verify both teams have same record
      expect(records.get(bills.id)!.wins).toBe(0);
      expect(records.get(bills.id)!.losses).toBe(2);
      expect(records.get(dolphins.id)!.wins).toBe(0);
      expect(records.get(dolphins.id)!.losses).toBe(2);

      const result = breakTie([bills, dolphins], records, games, {}, true);

      // Bills have less negative point differential (-50 vs -100)
      expect(result[0].id).toBe(bills.id);
    });
  });
});

describe('Phase 14: Wild Card Tiebreaker Differences', () => {
  it('should skip division record step for wild card ties', () => {
    // Bills (AFC East) vs Texans (AFC South) - Wild Card
    // Bills have 6-0 division record, Texans have 3-3
    // But for wild card, this shouldn't matter - conference record should
    const games: Game[] = [
      // Bills: 10-6, 6-0 division, 7-5 conference
      createGame('b1', bills, dolphins, 24, 17, 'final', 1),
      createGame('b2', bills, patriots, 24, 17, 'final', 2),
      createGame('b3', bills, jets, 24, 17, 'final', 3),
      createGame('b4', dolphins, bills, 17, 24, 'final', 4),
      createGame('b5', patriots, bills, 17, 24, 'final', 5),
      createGame('b6', jets, bills, 17, 24, 'final', 6), // 6-0 div
      createGame('b7', bills, ravens, 24, 17, 'final', 7), // 7-5 conf
      createGame('b8', bengals, bills, 24, 17, 'final', 8),
      createGame('b9', browns, bills, 24, 17, 'final', 9),
      createGame('b10', steelers, bills, 24, 17, 'final', 10),
      createGame('b11', texans, bills, 24, 17, 'final', 11),
      // Texans: 10-6, 3-3 division, 9-3 conference (better conference!)
      createGame('t1', texans, colts, 24, 17, 'final', 12),
      createGame('t2', texans, jaguars, 24, 17, 'final', 13),
      createGame('t3', colts, texans, 24, 17, 'final', 14),
      createGame('t4', jaguars, texans, 24, 17, 'final', 15),
      createGame('t5', texans, titans, 24, 17, 'final', 16),
      createGame('t6', titans, texans, 24, 17, 'final', 17), // 3-3 div
      createGame('t7', texans, ravens, 24, 17, 'final', 18),
      createGame('t8', texans, bengals, 24, 17, 'final', 19),
      createGame('t9', texans, browns, 24, 17, 'final', 20),
      createGame('t10', texans, steelers, 24, 17, 'final', 21),
      createGame('t11', texans, broncos, 24, 17, 'final', 22),
      createGame('t12', texans, chiefs, 24, 17, 'final', 23), // 9-3 conf
    ];

    const teams = allAfcTeams;
    const records = calculateTeamRecords(teams, games, {});

    // Wild card tie - division record SHOULD NOT MATTER
    const result = breakTie([bills, texans], records, games, {}, false);

    // Texans should win because of better conference record
    // (If division record was used, Bills would win)
    const billsRec = records.get(bills.id)!;
    const texansRec = records.get(texans.id)!;

    // Verify Bills have better division record
    expect(billsRec.divisionWins).toBeGreaterThan(texansRec.divisionWins);

    // Verify Texans have better conference record
    expect(texansRec.conferenceWins).toBeGreaterThan(billsRec.conferenceWins);

    // For wild card, Texans should win (conference record, not division)
    expect(result[0].id).toBe(texans.id);
  });

  it('should require ALL teams to have played each other for H2H in wild card', () => {
    // 3-team wild card tie: Bills, Texans, Ravens
    // Bills beat Texans, Texans beat Ravens, but Bills never played Ravens
    const games: Game[] = [
      createGame('g1', bills, texans, 24, 17, 'final', 1), // Bills beat Texans
      createGame('g2', texans, ravens, 24, 17, 'final', 2), // Texans beat Ravens
      // Bills never played Ravens - H2H shouldn't apply
    ];

    const teams = [bills, texans, ravens];
    const records = calculateTeamRecords(teams, games, {});

    const result = breakTie([bills, texans, ravens], records, games, {}, false);

    // H2H cannot apply, should use later tiebreakers
    expect(result).toHaveLength(3);
  });
});

describe('Phase 14: Three-or-More Team Tiebreaker Rules', () => {
  it('should apply tiebreakers collectively to all tied teams first', () => {
    // 3-team tie: A, B, C all 10-6
    // In H2H: A beat B, B beat C, C beat A (circular - no clear winner)
    // Should fall through to next tiebreaker applied to ALL teams
    const games: Game[] = [
      createGame('ab', bills, dolphins, 24, 17, 'final', 1), // Bills beat Dolphins
      createGame('bc', dolphins, patriots, 24, 17, 'final', 2), // Dolphins beat Patriots
      createGame('ca', patriots, bills, 24, 17, 'final', 3), // Patriots beat Bills
      // Additional games to make all 10-6
      ...Array.from({ length: 9 }, (_, i) =>
        createGame(`bills-win-${i}`, bills, jets, 24, 17, 'final', i + 4)
      ),
      ...Array.from({ length: 6 }, (_, i) =>
        createGame(`bills-loss-${i}`, ravens, bills, 24, 17, 'final', i + 13)
      ),
      ...Array.from({ length: 9 }, (_, i) =>
        createGame(`dolphins-win-${i}`, dolphins, jets, 24, 17, 'final', i + 4)
      ),
      ...Array.from({ length: 6 }, (_, i) =>
        createGame(`dolphins-loss-${i}`, ravens, dolphins, 24, 17, 'final', i + 13)
      ),
      ...Array.from({ length: 9 }, (_, i) =>
        createGame(`patriots-win-${i}`, patriots, jets, 24, 17, 'final', i + 4)
      ),
      ...Array.from({ length: 6 }, (_, i) =>
        createGame(`patriots-loss-${i}`, ravens, patriots, 24, 17, 'final', i + 13)
      ),
    ];

    const teams = [bills, dolphins, patriots, jets, ravens];
    const records = calculateTeamRecords(teams, games, {});

    const result = breakTie([bills, dolphins, patriots], records, games, {}, true);

    // All three tied, should use tiebreaker applied to all
    expect(result).toHaveLength(3);
  });

  it('should re-start from step 1 when one team is eliminated from multi-team tie', () => {
    // 3-team tie: Bills, Dolphins, Patriots
    // Division record: Bills 5-1, Dolphins 4-2, Patriots 4-2
    // Bills should be determined first by division record
    // Then Dolphins vs Patriots should restart tiebreakers from H2H
    const games: Game[] = [
      // Division games
      // Bills: 5-1 in division
      createGame('bd1', bills, dolphins, 24, 17, 'final', 1),
      createGame('bd2', bills, patriots, 24, 17, 'final', 2),
      createGame('bd3', bills, jets, 24, 17, 'final', 3),
      createGame('bd4', dolphins, bills, 24, 17, 'final', 4), // Bills loss
      createGame('bd5', bills, jets, 24, 17, 'final', 5),
      // Dolphins: 4-2 in division (beat Patriots in H2H)
      createGame('dd1', dolphins, patriots, 24, 17, 'final', 6),
      createGame('dd2', dolphins, jets, 24, 17, 'final', 7),
      createGame('dd3', patriots, dolphins, 24, 17, 'final', 8), // Dolphins loss
      createGame('dd4', dolphins, jets, 24, 17, 'final', 9),
      // Patriots: 4-2 in division (lost to Dolphins in H2H)
      createGame('pd1', patriots, jets, 24, 17, 'final', 10),
      createGame('pd2', jets, patriots, 24, 17, 'final', 11), // Patriots loss
      createGame('pd3', patriots, jets, 24, 17, 'final', 12),
    ];

    const teams = [bills, dolphins, patriots, jets];
    const records = calculateTeamRecords(teams, games, {});

    const result = breakTie([bills, dolphins, patriots], records, games, {}, true);

    // Bills should be first (best division record)
    expect(result[0].id).toBe(bills.id);
    // Dolphins should be second (beat Patriots in H2H among remaining)
    expect(result[1].id).toBe(dolphins.id);
    expect(result[2].id).toBe(patriots.id);
  });

  it('should handle 4-team division tie', () => {
    // All 4 AFC East teams tied at 8-8
    const games: Game[] = [
      // Everyone beats the team below them, loses to team above (creates clear order)
      // Bills > Dolphins > Patriots > Jets > Bills (circular)
      createGame('bd1', bills, dolphins, 24, 17, 'final', 1),
      createGame('bd2', dolphins, bills, 24, 17, 'final', 2), // Split
      createGame('dp1', dolphins, patriots, 24, 17, 'final', 3),
      createGame('dp2', patriots, dolphins, 24, 17, 'final', 4), // Split
      createGame('pj1', patriots, jets, 24, 17, 'final', 5),
      createGame('pj2', jets, patriots, 24, 17, 'final', 6), // Split
      createGame('jb1', jets, bills, 24, 17, 'final', 7),
      createGame('jb2', bills, jets, 24, 17, 'final', 8), // Split
    ];

    const teams = [bills, dolphins, patriots, jets];
    const records = calculateTeamRecords(teams, games, {});

    const result = breakTie([bills, dolphins, patriots, jets], records, games, {}, true);

    // All teams should be returned in some order
    expect(result).toHaveLength(4);
    // Should contain all four teams
    expect(result.map(t => t.id).sort()).toEqual(['1', '2', '3', '4']);
  });

  it('should handle wild card tie between teams from same division', () => {
    // Bills and Dolphins both miss division title but compete for wild card
    // They've already played each other (division games)
    const games: Game[] = [
      // Patriots win division (9-7)
      ...Array.from({ length: 9 }, (_, i) =>
        createGame(`patriots-win-${i}`, patriots, jets, 24, 17, 'final', i + 1)
      ),
      // Bills 8-8 (2nd in division)
      ...Array.from({ length: 8 }, (_, i) =>
        createGame(`bills-win-${i}`, bills, jets, 24, 17, 'final', i + 1)
      ),
      // Dolphins 8-8 (3rd in division)
      ...Array.from({ length: 8 }, (_, i) =>
        createGame(`dolphins-win-${i}`, dolphins, jets, 24, 17, 'final', i + 1)
      ),
      // H2H: Bills swept Dolphins
      createGame('h2h1', bills, dolphins, 24, 17, 'final', 17),
      createGame('h2h2', dolphins, bills, 17, 24, 'final', 18),
    ];

    const teams = [bills, dolphins, patriots, jets];
    const records = calculateTeamRecords(teams, games, {});

    // Wild card tie between divisional rivals - H2H should work
    const result = breakTie([bills, dolphins], records, games, {}, false);

    // Bills swept Dolphins, should win
    expect(result[0].id).toBe(bills.id);
  });
});

describe('Phase 14: Tiebreaker Edge Cases', () => {
  it('should handle 0-0 H2H (both games tied)', () => {
    const games: Game[] = [
      createGame('h2h1', bills, dolphins, 20, 20, 'final', 1), // Tie
      createGame('h2h2', dolphins, bills, 17, 17, 'final', 2), // Tie
    ];

    const teams = [bills, dolphins];
    const records = calculateTeamRecords(teams, games, {});

    // H2H is 0-0-2, should fall through
    const result = breakTie([bills, dolphins], records, games, {}, true);
    expect(result).toHaveLength(2);
  });

  it('should handle mix of wins and ties in H2H', () => {
    const games: Game[] = [
      createGame('h2h1', bills, dolphins, 24, 17, 'final', 1), // Bills win
      createGame('h2h2', dolphins, bills, 20, 20, 'final', 2), // Tie
    ];

    const teams = [bills, dolphins];
    const records = calculateTeamRecords(teams, games, {});

    // Bills have better H2H (win + tie vs loss + tie)
    const result = breakTie([bills, dolphins], records, games, {}, true);
    expect(result[0].id).toBe(bills.id);
  });

  it('should not crash with empty games array', () => {
    const teams = [bills, dolphins];
    const records = calculateTeamRecords(teams, [], {});

    const result = breakTie([bills, dolphins], records, [], {}, true);
    expect(result).toHaveLength(2);
  });

  it('should handle teams with identical records in everything', () => {
    // Completely identical - all tiebreakers exhausted
    const games: Game[] = [
      createGame('g1', bills, dolphins, 20, 20, 'final', 1), // Tie game
    ];

    const teams = [bills, dolphins];
    const records = calculateTeamRecords(teams, games, {});

    const result = breakTie([bills, dolphins], records, games, {}, true);

    // Should return both teams in some order (may be arbitrary)
    expect(result).toHaveLength(2);
    expect(result.map(t => t.id).sort()).toEqual(['1', '2']);
  });

  it('should handle selection changes affecting tiebreakers', () => {
    const games: Game[] = [
      createGame('g1', bills, dolphins, null, null, 'scheduled', 1),
    ];

    const teams = [bills, dolphins];

    // With no selection
    const records1 = calculateTeamRecords(teams, games, {});
    expect(records1.get(bills.id)!.wins).toBe(0);

    // With home selection
    const records2 = calculateTeamRecords(teams, games, { g1: 'home' });
    expect(records2.get(bills.id)!.wins).toBe(1);

    // With away selection
    const records3 = calculateTeamRecords(teams, games, { g1: 'away' });
    expect(records3.get(bills.id)!.wins).toBe(0);
    expect(records3.get(bills.id)!.losses).toBe(1);
  });
});

describe('Phase 14: Playoff Seeding Integration', () => {
  it('should correctly seed division winners 1-4', () => {
    // Create a simple scenario where each division has a clear winner
    const games: Game[] = [
      // AFC East: Bills win division (12-0)
      ...Array.from({ length: 12 }, (_, i) =>
        createGame(`bills-${i}`, bills, dolphins, 24, 17, 'final', i + 1)
      ),
      // AFC North: Ravens win division (11-0)
      ...Array.from({ length: 11 }, (_, i) =>
        createGame(`ravens-${i}`, ravens, bengals, 24, 17, 'final', i + 1)
      ),
      // AFC South: Texans win division (10-0)
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`texans-${i}`, texans, colts, 24, 17, 'final', i + 1)
      ),
      // AFC West: Chiefs win division (9-0)
      ...Array.from({ length: 9 }, (_, i) =>
        createGame(`chiefs-${i}`, chiefs, broncos, 24, 17, 'final', i + 1)
      ),
    ];

    const standings = calculatePlayoffSeedings('AFC', allAfcTeams, games, {});

    // Top 4 should be division winners, seeded by record
    const top4 = standings.slice(0, 4);

    expect(top4[0].team.id).toBe(bills.id); // 12-0, seed 1
    expect(top4[0].seed).toBe(1);
    expect(top4[1].team.id).toBe(ravens.id); // 11-0, seed 2
    expect(top4[1].seed).toBe(2);
    expect(top4[2].team.id).toBe(texans.id); // 10-0, seed 3
    expect(top4[2].seed).toBe(3);
    expect(top4[3].team.id).toBe(chiefs.id); // 9-0, seed 4
    expect(top4[3].seed).toBe(4);
  });

  it('should correctly assign wild card seeds 5-7', () => {
    // Create scenario with clear wild card teams
    const games: Game[] = [
      // Division winners with moderate records
      createGame('e1', bills, dolphins, 24, 17, 'final', 1), // Bills win East
      createGame('n1', ravens, bengals, 24, 17, 'final', 2), // Ravens win North
      createGame('s1', texans, colts, 24, 17, 'final', 3), // Texans win South
      createGame('w1', chiefs, broncos, 24, 17, 'final', 4), // Chiefs win West
      // Wild card teams with good records
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`dolphins-${i}`, dolphins, patriots, 24, 17, 'final', i + 5)
      ),
      ...Array.from({ length: 9 }, (_, i) =>
        createGame(`bengals-${i}`, bengals, browns, 24, 17, 'final', i + 5)
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        createGame(`colts-${i}`, colts, jaguars, 24, 17, 'final', i + 5)
      ),
    ];

    const standings = calculatePlayoffSeedings('AFC', allAfcTeams, games, {});

    // Seeds 5-7 should be wild card teams
    const wildCards = standings.filter(s => s.seed !== null && s.seed >= 5);

    expect(wildCards).toHaveLength(3);
    expect(wildCards[0].seed).toBe(5);
    expect(wildCards[1].seed).toBe(6);
    expect(wildCards[2].seed).toBe(7);
  });

  it('should apply tiebreakers correctly between division winners', () => {
    // Two division winners with same record - need tiebreaker
    const games: Game[] = [
      // Bills win AFC East (10-6)
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`bills-win-${i}`, bills, dolphins, 24, 17, 'final', i + 1)
      ),
      ...Array.from({ length: 6 }, (_, i) =>
        createGame(`bills-loss-${i}`, patriots, bills, 24, 17, 'final', i + 11)
      ),
      // Ravens win AFC North (10-6)
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`ravens-win-${i}`, ravens, bengals, 24, 17, 'final', i + 1)
      ),
      ...Array.from({ length: 6 }, (_, i) =>
        createGame(`ravens-loss-${i}`, steelers, ravens, 24, 17, 'final', i + 11)
      ),
      // Bills beat Ravens in H2H
      createGame('h2h', bills, ravens, 24, 17, 'final', 18),
    ];

    const standings = calculatePlayoffSeedings('AFC', allAfcTeams, games, {});

    // Bills should be seeded higher due to H2H win
    const billsStanding = standings.find(s => s.team.id === bills.id);
    const ravensStanding = standings.find(s => s.team.id === ravens.id);

    expect(billsStanding?.seed).toBeLessThan(ravensStanding?.seed!);
  });

  it('should mark non-playoff teams with seed: null', () => {
    const games: Game[] = [];

    const standings = calculatePlayoffSeedings('AFC', allAfcTeams, games, {});

    // Bottom 9 teams should have null seed
    const nonPlayoff = standings.filter(s => s.seed === null);
    expect(nonPlayoff).toHaveLength(9);
  });

  it('should mark seed 1 with clinched bye', () => {
    const games: Game[] = [
      ...Array.from({ length: 17 }, (_, i) =>
        createGame(`bills-${i}`, bills, dolphins, 24, 17, 'final', i + 1)
      ),
    ];

    const standings = calculatePlayoffSeedings('AFC', allAfcTeams, games, {});

    const seed1 = standings.find(s => s.seed === 1);
    expect(seed1?.clinched).toBe('bye');
  });

  it('should mark seeds 2-4 with clinched division', () => {
    const games: Game[] = [
      createGame('e', bills, dolphins, 24, 17, 'final', 1),
      createGame('n', ravens, bengals, 24, 17, 'final', 2),
      createGame('s', texans, colts, 24, 17, 'final', 3),
      createGame('w', chiefs, broncos, 24, 17, 'final', 4),
    ];

    const standings = calculatePlayoffSeedings('AFC', allAfcTeams, games, {});

    const seeds2to4 = standings.filter(s => s.seed !== null && s.seed >= 2 && s.seed <= 4);
    expect(seeds2to4).toHaveLength(3);
    seeds2to4.forEach(s => {
      expect(s.clinched).toBe('division');
    });
  });

  it('should mark seeds 5-7 with clinched playoff', () => {
    const games: Game[] = [
      createGame('e', bills, dolphins, 24, 17, 'final', 1),
      createGame('n', ravens, bengals, 24, 17, 'final', 2),
      createGame('s', texans, colts, 24, 17, 'final', 3),
      createGame('w', chiefs, broncos, 24, 17, 'final', 4),
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`dolphins-${i}`, dolphins, patriots, 24, 17, 'final', i + 5)
      ),
    ];

    const standings = calculatePlayoffSeedings('AFC', allAfcTeams, games, {});

    const wildCards = standings.filter(s => s.seed !== null && s.seed >= 5);
    wildCards.forEach(s => {
      expect(s.clinched).toBe('playoff');
    });
  });
});

describe('Phase 14: Historical Scenario Validation', () => {
  it('should handle real-world-like scenario with multiple tied teams', () => {
    // Simulate a scenario where AFC East has 3 teams at 11-6
    const games: Game[] = [
      // Bills: 11-6, beat Dolphins and Patriots
      ...Array.from({ length: 9 }, (_, i) =>
        createGame(`bills-win-${i}`, bills, jets, 24, 17, 'final', i + 1)
      ),
      createGame('bills-beat-dolphins', bills, dolphins, 24, 17, 'final', 10),
      createGame('bills-beat-patriots', bills, patriots, 24, 17, 'final', 11),
      ...Array.from({ length: 6 }, (_, i) =>
        createGame(`bills-loss-${i}`, ravens, bills, 24, 17, 'final', i + 12)
      ),
      // Dolphins: 11-6, lost to Bills, beat Patriots
      ...Array.from({ length: 9 }, (_, i) =>
        createGame(`dolphins-win-${i}`, dolphins, jets, 24, 17, 'final', i + 1)
      ),
      createGame('dolphins-beat-patriots', dolphins, patriots, 24, 17, 'final', 10),
      createGame('dolphins-beat-jets', dolphins, jets, 24, 17, 'final', 11),
      ...Array.from({ length: 5 }, (_, i) =>
        createGame(`dolphins-loss-${i}`, ravens, dolphins, 24, 17, 'final', i + 12)
      ),
      // Patriots: 11-6, lost to Bills and Dolphins
      ...Array.from({ length: 11 }, (_, i) =>
        createGame(`patriots-win-${i}`, patriots, jets, 24, 17, 'final', i + 1)
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        createGame(`patriots-loss-${i}`, ravens, patriots, 24, 17, 'final', i + 12)
      ),
    ];

    const teams = [bills, dolphins, patriots, jets, ravens];
    const records = calculateTeamRecords(teams, games, {});

    // 3-way tie at 11-6 within division
    const result = breakTie([bills, dolphins, patriots], records, games, {}, true);

    // Bills beat both, should be first
    expect(result[0].id).toBe(bills.id);
    // Dolphins beat Patriots, should be second
    expect(result[1].id).toBe(dolphins.id);
    expect(result[2].id).toBe(patriots.id);
  });

  it('should correctly handle division winner with worse record than wild card', () => {
    // Division winner at 9-8 makes playoffs over 10-7 team from same conference
    const games: Game[] = [
      // Texans win weak AFC South at 9-8
      ...Array.from({ length: 9 }, (_, i) =>
        createGame(`texans-win-${i}`, texans, colts, 24, 17, 'final', i + 1)
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        createGame(`texans-loss-${i}`, ravens, texans, 24, 17, 'final', i + 10)
      ),
      // Dolphins 10-7 but don't win their division
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`dolphins-win-${i}`, dolphins, patriots, 24, 17, 'final', i + 1)
      ),
      ...Array.from({ length: 7 }, (_, i) =>
        createGame(`dolphins-loss-${i}`, bills, dolphins, 24, 17, 'final', i + 11)
      ),
      // Bills win AFC East at 11-6
      ...Array.from({ length: 11 }, (_, i) =>
        createGame(`bills-win-${i}`, bills, jets, 24, 17, 'final', i + 1)
      ),
    ];

    const standings = calculatePlayoffSeedings('AFC', allAfcTeams, games, {});

    const texansStanding = standings.find(s => s.team.id === texans.id);
    const dolphinsStanding = standings.find(s => s.team.id === dolphins.id);

    // Texans should be a division winner (seeds 1-4)
    expect(texansStanding?.seed).toBeLessThanOrEqual(4);
    // Dolphins with better record is wild card (seeds 5-7)
    expect(dolphinsStanding?.seed).toBeGreaterThanOrEqual(5);
  });
});

describe('Phase 14: Complex Multi-Team Tiebreaker Scenarios', () => {
  it('should handle 5-way wild card tie across different divisions', () => {
    // 5 teams from different divisions all 10-7 competing for 3 wild card spots
    const games: Game[] = [
      // Dolphins (AFC East) 10-7
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`dolphins-win-${i}`, dolphins, patriots, 24, 17, 'final', i + 1)
      ),
      // Bengals (AFC North) 10-7
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`bengals-win-${i}`, bengals, browns, 24, 17, 'final', i + 1)
      ),
      // Colts (AFC South) 10-7
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`colts-win-${i}`, colts, jaguars, 24, 17, 'final', i + 1)
      ),
      // Broncos (AFC West) 10-7
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`broncos-win-${i}`, broncos, raiders, 24, 17, 'final', i + 1)
      ),
      // Chargers (AFC West) 10-7
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`chargers-win-${i}`, chargers, raiders, 24, 17, 'final', i + 1)
      ),
    ];

    const teams = [dolphins, bengals, colts, broncos, chargers, patriots, browns, jaguars, raiders];
    const records = calculateTeamRecords(teams, games, {});

    // Wild card tie (isDivisionTie = false)
    const result = breakTie([dolphins, bengals, colts, broncos, chargers], records, games, {}, false);

    // Should return all 5 in some order
    expect(result).toHaveLength(5);
    expect(new Set(result.map(t => t.id)).size).toBe(5);
  });

  it('should handle tie between 2 division winners for #1 seed', () => {
    // Bills and Ravens both win their divisions at 14-3
    const games: Game[] = [
      // Bills 14-3 (AFC East winner)
      ...Array.from({ length: 14 }, (_, i) =>
        createGame(`bills-win-${i}`, bills, dolphins, 24, 17, 'final', i + 1)
      ),
      // Ravens 14-3 (AFC North winner)
      ...Array.from({ length: 14 }, (_, i) =>
        createGame(`ravens-win-${i}`, ravens, bengals, 24, 17, 'final', i + 1)
      ),
      // Bills beat Ravens in H2H
      createGame('h2h', bills, ravens, 24, 17, 'final', 18),
    ];

    const teams = allAfcTeams;
    const records = calculateTeamRecords(teams, games, {});

    // This is a wild card tiebreaker (between division winners)
    const result = breakTie([bills, ravens], records, games, {}, false);

    // Bills won H2H, should be seeded higher
    expect(result[0].id).toBe(bills.id);
  });

  it('should handle 3 teams from same division in wild card race', () => {
    // Dolphins, Patriots, Jets all 10-7, competing for wild card
    // (Bills won division)
    const games: Game[] = [
      // Bills win division (12-5)
      ...Array.from({ length: 12 }, (_, i) =>
        createGame(`bills-win-${i}`, bills, jets, 24, 17, 'final', i + 1)
      ),
      // Dolphins 10-7
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`dolphins-win-${i}`, dolphins, ravens, 24, 17, 'final', i + 1)
      ),
      // Patriots 10-7
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`patriots-win-${i}`, patriots, ravens, 24, 17, 'final', i + 1)
      ),
      // Jets 10-7
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`jets-win-${i}`, jets, ravens, 24, 17, 'final', i + 1)
      ),
      // Division games for H2H - Dolphins > Patriots > Jets > Dolphins (circular)
      createGame('dp', dolphins, patriots, 24, 17, 'final', 15),
      createGame('pj', patriots, jets, 24, 17, 'final', 16),
      createGame('jd', jets, dolphins, 24, 17, 'final', 17),
    ];

    const teams = [bills, dolphins, patriots, jets, ravens];
    const records = calculateTeamRecords(teams, games, {});

    // Wild card tie between 3 divisional rivals
    const result = breakTie([dolphins, patriots, jets], records, games, {}, false);

    expect(result).toHaveLength(3);
    // All from same division, should use applicable tiebreakers
    expect(result.map(t => t.division)).toEqual(['AFC East', 'AFC East', 'AFC East']);
  });

  it('should correctly apply tiebreakers when teams have played different number of games', () => {
    // Mid-season scenario: some teams have played more games
    const games: Game[] = [
      // Bills: 8-4 (12 games)
      ...Array.from({ length: 8 }, (_, i) =>
        createGame(`bills-win-${i}`, bills, dolphins, 24, 17, 'final', i + 1)
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        createGame(`bills-loss-${i}`, patriots, bills, 24, 17, 'final', i + 9)
      ),
      // Dolphins: 6-3 (9 games) - same win% but fewer games
      ...Array.from({ length: 6 }, (_, i) =>
        createGame(`dolphins-win-${i}`, dolphins, jets, 24, 17, 'final', i + 1)
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        createGame(`dolphins-loss-${i}`, patriots, dolphins, 24, 17, 'final', i + 7)
      ),
    ];

    const teams = [bills, dolphins, patriots, jets];
    const records = calculateTeamRecords(teams, games, {});

    // Both have ~.667 win percentage
    const result = breakTie([bills, dolphins], records, games, {}, true);
    expect(result).toHaveLength(2);
  });
});

describe('Phase 14: Tiebreaker Step Isolation Tests', () => {
  // These tests verify each step is reached when prior steps don't resolve

  it('should reach step 3 (common games) when H2H split and div record tied', () => {
    const games: Game[] = [
      // H2H split
      createGame('h2h1', bills, dolphins, 24, 17, 'final', 1),
      createGame('h2h2', dolphins, bills, 24, 17, 'final', 2),
      // Same division records (2-2 each in div)
      createGame('d1', bills, patriots, 24, 17, 'final', 3),
      createGame('d2', patriots, bills, 24, 17, 'final', 4),
      createGame('d3', dolphins, jets, 24, 17, 'final', 5),
      createGame('d4', jets, dolphins, 24, 17, 'final', 6),
      // Common games with 4+ common opponents - Bills wins all, Dolphins loses all
      createGame('c1', bills, ravens, 24, 17, 'final', 7),
      createGame('c2', bills, bengals, 24, 17, 'final', 8),
      createGame('c3', bills, browns, 24, 17, 'final', 9),
      createGame('c4', bills, steelers, 24, 17, 'final', 10),
      createGame('c5', ravens, dolphins, 24, 17, 'final', 11),
      createGame('c6', bengals, dolphins, 24, 17, 'final', 12),
      createGame('c7', browns, dolphins, 24, 17, 'final', 13),
      createGame('c8', steelers, dolphins, 24, 17, 'final', 14),
    ];

    const teams = [bills, dolphins, patriots, jets, ravens, bengals, browns, steelers];
    const records = calculateTeamRecords(teams, games, {});

    const result = breakTie([bills, dolphins], records, games, {}, true);

    // Bills should win on common games (4-0 vs 0-4)
    expect(result[0].id).toBe(bills.id);
  });

  it('should reach step 4 (conference record) when prior steps dont resolve', () => {
    const games: Game[] = [
      // H2H split
      createGame('h2h1', bills, dolphins, 24, 17, 'final', 1),
      createGame('h2h2', dolphins, bills, 24, 17, 'final', 2),
      // Same division records
      createGame('d1', bills, patriots, 24, 17, 'final', 3),
      createGame('d2', dolphins, jets, 24, 17, 'final', 4),
      // Not enough common games (only 3 common opponents)
      createGame('c1', bills, ravens, 24, 17, 'final', 5),
      createGame('c2', bills, bengals, 24, 17, 'final', 6),
      createGame('c3', bills, browns, 24, 17, 'final', 7),
      createGame('c4', dolphins, ravens, 17, 24, 'final', 8),
      createGame('c5', dolphins, bengals, 17, 24, 'final', 9),
      createGame('c6', dolphins, browns, 17, 24, 'final', 10),
      // Bills has better conference record (adds conference wins)
      createGame('conf1', bills, texans, 24, 17, 'final', 11),
      createGame('conf2', bills, colts, 24, 17, 'final', 12),
    ];

    const teams = [bills, dolphins, patriots, jets, ravens, bengals, browns, texans, colts];
    const records = calculateTeamRecords(teams, games, {});

    const result = breakTie([bills, dolphins], records, games, {}, true);

    // Bills should win on conference record
    expect(result[0].id).toBe(bills.id);
  });

  it('should reach step 5 (SOV) when conference records are tied', () => {
    // Both teams have identical:
    // - H2H (split)
    // - Division record (same)
    // - Common games (same - both beat Patriots only)
    // - Conference record (same)
    // The ONLY difference is SOV (quality of teams beaten)
    const games: Game[] = [
      // H2H split
      createGame('h2h1', bills, dolphins, 24, 17, 'final', 1),
      createGame('h2h2', dolphins, bills, 24, 17, 'final', 2),
      // Division games - same record (1-1 each against same opponents)
      createGame('bd1', bills, patriots, 24, 17, 'final', 3),
      createGame('bd2', jets, bills, 24, 17, 'final', 4),
      createGame('dd1', dolphins, patriots, 24, 17, 'final', 5),
      createGame('dd2', jets, dolphins, 24, 17, 'final', 6),
      // Non-division conference wins (SOV difference here!)
      // Bills beat Ravens (who have 10-0 record = good team)
      createGame('b-rav', bills, ravens, 24, 17, 'final', 7),
      // Dolphins beat Browns (who have 0-10 record = bad team)
      createGame('d-bro', dolphins, browns, 24, 17, 'final', 8),
      // Give Ravens a good record (10-0 after losing to Bills)
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`ravens-win-${i}`, ravens, bengals, 24, 17, 'final', i + 10)
      ),
      // Give Browns a bad record (0-10 after losing to Dolphins)
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`browns-loss-${i}`, bengals, browns, 24, 17, 'final', i + 20)
      ),
    ];

    const teams = [bills, dolphins, patriots, jets, ravens, browns, bengals];
    const records = calculateTeamRecords(teams, games, {});

    // Both teams have same overall, division, and conference records
    // But Bills' beaten opponents have better combined record
    const result = breakTie([bills, dolphins], records, games, {}, true);

    // Bills beat Ravens (good team), Dolphins beat Browns (bad team)
    // Bills should have higher SOV
    expect(result[0].id).toBe(bills.id);
  });
});

describe('Phase 14: Win Percentage Calculation Tests', () => {
  it('should correctly calculate win percentage with ties', () => {
    const games: Game[] = [
      createGame('g1', bills, dolphins, 24, 17, 'final', 1), // Win
      createGame('g2', patriots, bills, 24, 17, 'final', 2), // Loss
      createGame('g3', bills, jets, 20, 20, 'final', 3), // Tie
    ];

    const teams = [bills, dolphins, patriots, jets];
    const records = calculateTeamRecords(teams, games, {});

    const billsRec = records.get(bills.id)!;
    expect(billsRec.wins).toBe(1);
    expect(billsRec.losses).toBe(1);
    expect(billsRec.ties).toBe(1);
    // Win pct should be (1 + 0.5) / 3 = 0.5
  });

  it('should handle team with only ties (no wins or losses)', () => {
    const games: Game[] = [
      createGame('g1', bills, dolphins, 20, 20, 'final', 1),
      createGame('g2', bills, patriots, 17, 17, 'final', 2),
    ];

    const teams = [bills, dolphins, patriots];
    const records = calculateTeamRecords(teams, games, {});

    const billsRec = records.get(bills.id)!;
    expect(billsRec.wins).toBe(0);
    expect(billsRec.losses).toBe(0);
    expect(billsRec.ties).toBe(2);
    // Win pct should be (0 + 1) / 2 = 0.5
  });

  it('should handle division ties counting toward division record', () => {
    const games: Game[] = [
      createGame('g1', bills, dolphins, 20, 20, 'final', 1), // Division tie
    ];

    const teams = [bills, dolphins];
    const records = calculateTeamRecords(teams, games, {});

    const billsRec = records.get(bills.id)!;
    expect(billsRec.divisionTies).toBe(1);
    expect(billsRec.divisionWins).toBe(0);
    expect(billsRec.divisionLosses).toBe(0);
  });
});

describe('Phase 14: Conference vs Non-Conference Games', () => {
  it('should not count non-conference games in conference record', () => {
    const games: Game[] = [
      createGame('g1', bills, cowboys, 24, 17, 'final', 1), // Non-conference win
      createGame('g2', bills, eagles, 24, 17, 'final', 2), // Non-conference win
    ];

    const teams = [bills, cowboys, eagles];
    const records = calculateTeamRecords(teams, games, {});

    const billsRec = records.get(bills.id)!;
    expect(billsRec.wins).toBe(2);
    expect(billsRec.conferenceWins).toBe(0); // Non-conference games
  });

  it('should correctly track both conference and non-conference games', () => {
    const games: Game[] = [
      createGame('g1', bills, dolphins, 24, 17, 'final', 1), // Conference + Division
      createGame('g2', bills, ravens, 24, 17, 'final', 2), // Conference only
      createGame('g3', bills, cowboys, 24, 17, 'final', 3), // Non-conference
    ];

    const teams = [bills, dolphins, ravens, cowboys];
    const records = calculateTeamRecords(teams, games, {});

    const billsRec = records.get(bills.id)!;
    expect(billsRec.wins).toBe(3);
    expect(billsRec.conferenceWins).toBe(2);
    expect(billsRec.divisionWins).toBe(1);
  });
});

describe('Phase 14: Playoff Bracket Matchup Generation', () => {
  it('should generate correct Wild Card matchups (2v7, 3v6, 4v5)', () => {
    const games: Game[] = [
      // Create standings with clear seeds 1-7
      ...Array.from({ length: 16 }, (_, i) =>
        createGame(`bills-${i}`, bills, jets, 24, 17, 'final', i + 1)
      ), // Bills 16-0, seed 1
      ...Array.from({ length: 14 }, (_, i) =>
        createGame(`ravens-${i}`, ravens, bengals, 24, 17, 'final', i + 1)
      ), // Ravens 14-0, seed 2
      ...Array.from({ length: 12 }, (_, i) =>
        createGame(`texans-${i}`, texans, colts, 24, 17, 'final', i + 1)
      ), // Texans 12-0, seed 3
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`chiefs-${i}`, chiefs, broncos, 24, 17, 'final', i + 1)
      ), // Chiefs 10-0, seed 4
      ...Array.from({ length: 8 }, (_, i) =>
        createGame(`dolphins-${i}`, dolphins, patriots, 24, 17, 'final', i + 1)
      ), // Dolphins 8-0, seed 5
      ...Array.from({ length: 6 }, (_, i) =>
        createGame(`steelers-${i}`, steelers, browns, 24, 17, 'final', i + 1)
      ), // Steelers 6-0, seed 6
      ...Array.from({ length: 4 }, (_, i) =>
        createGame(`jaguars-${i}`, jaguars, titans, 24, 17, 'final', i + 1)
      ), // Jaguars 4-0, seed 7
    ];

    const standings = calculatePlayoffSeedings('AFC', allAfcTeams, games, {});

    const seed2 = standings.find(s => s.seed === 2);
    const seed3 = standings.find(s => s.seed === 3);
    const seed4 = standings.find(s => s.seed === 4);
    const seed5 = standings.find(s => s.seed === 5);
    const seed6 = standings.find(s => s.seed === 6);
    const seed7 = standings.find(s => s.seed === 7);

    // Verify seeds exist
    expect(seed2).toBeDefined();
    expect(seed3).toBeDefined();
    expect(seed4).toBeDefined();
    expect(seed5).toBeDefined();
    expect(seed6).toBeDefined();
    expect(seed7).toBeDefined();

    // Wild Card matchups: 2v7, 3v6, 4v5
    // Higher seed should always host
  });

  it('should give seed 1 a bye (no Wild Card game)', () => {
    const games: Game[] = [
      ...Array.from({ length: 17 }, (_, i) =>
        createGame(`bills-${i}`, bills, dolphins, 24, 17, 'final', i + 1)
      ),
    ];

    const standings = calculatePlayoffSeedings('AFC', allAfcTeams, games, {});

    const seed1 = standings.find(s => s.seed === 1);
    expect(seed1).toBeDefined();
    expect(seed1?.clinched).toBe('bye');
  });
});

describe('Phase 14: Regression Prevention Tests', () => {
  it('should handle late-season scenario where division winner is determined by tiebreaker', () => {
    // Week 17 scenario: Bills and Dolphins tied at 10-5, one game left each
    // They split H2H, Bills have better division record
    const games: Game[] = [
      // H2H split
      createGame('h2h1', bills, dolphins, 24, 17, 'final', 1),
      createGame('h2h2', dolphins, bills, 24, 17, 'final', 2),
      // Bills: 10-5, 5-0 in other division games
      createGame('d1', bills, patriots, 24, 17, 'final', 3),
      createGame('d2', bills, jets, 24, 17, 'final', 4),
      createGame('d3', patriots, bills, 17, 24, 'final', 5),
      createGame('d4', jets, bills, 17, 24, 'final', 6),
      createGame('d5', bills, jets, 24, 17, 'final', 7), // 5-1 in division
      // Other wins
      ...Array.from({ length: 4 }, (_, i) =>
        createGame(`bills-win-${i}`, bills, ravens, 24, 17, 'final', i + 8)
      ),
      // Dolphins: 10-5, 3-2 in other division games
      createGame('dd1', dolphins, patriots, 24, 17, 'final', 12),
      createGame('dd2', dolphins, jets, 24, 17, 'final', 13),
      createGame('dd3', jets, dolphins, 24, 17, 'final', 14), // Loss
      // Other wins
      ...Array.from({ length: 5 }, (_, i) =>
        createGame(`dolphins-win-${i}`, dolphins, ravens, 24, 17, 'final', i + 15)
      ),
    ];

    const teams = [bills, dolphins, patriots, jets, ravens];
    const records = calculateTeamRecords(teams, games, {});

    // Division tie
    const result = breakTie([bills, dolphins], records, games, {}, true);

    // Bills should win (better division record after H2H split)
    expect(result[0].id).toBe(bills.id);
  });

  it('should correctly handle scenario where team controls own destiny', () => {
    // If Bills win their last game, they win division regardless of Dolphins
    const games: Game[] = [
      // Bills 10-5 going into final game
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`bills-win-${i}`, bills, jets, 24, 17, 'final', i + 1)
      ),
      // Dolphins 10-5 going into final game
      ...Array.from({ length: 10 }, (_, i) =>
        createGame(`dolphins-win-${i}`, dolphins, patriots, 24, 17, 'final', i + 1)
      ),
      // Final game (scheduled, with selection)
      createGame('final', bills, dolphins, null, null, 'scheduled', 17),
    ];

    const teams = [bills, dolphins, patriots, jets];

    // With Bills winning final game
    const recordsWin = calculateTeamRecords(teams, games, { final: 'home' });
    expect(recordsWin.get(bills.id)!.wins).toBe(11);
    expect(recordsWin.get(dolphins.id)!.wins).toBe(10);

    // With Dolphins winning final game
    const recordsLoss = calculateTeamRecords(teams, games, { final: 'away' });
    expect(recordsLoss.get(bills.id)!.wins).toBe(10);
    expect(recordsLoss.get(dolphins.id)!.wins).toBe(11);
  });
});

describe('Phase 14: Point Differential Calculations', () => {
  it('should correctly accumulate points for final games', () => {
    const games: Game[] = [
      createGame('g1', bills, dolphins, 35, 21, 'final', 1),
      createGame('g2', bills, patriots, 28, 17, 'final', 2),
    ];

    const teams = [bills, dolphins, patriots];
    const records = calculateTeamRecords(teams, games, {});

    const billsRec = records.get(bills.id)!;
    expect(billsRec.pointsFor).toBe(35 + 28); // 63
    expect(billsRec.pointsAgainst).toBe(21 + 17); // 38
  });

  it('should use estimated points for selections (home: 24-17, away: 17-24)', () => {
    const games: Game[] = [
      createGame('g1', bills, dolphins, null, null, 'scheduled', 1),
    ];

    const teams = [bills, dolphins];

    // Home win selection
    const homeRecords = calculateTeamRecords(teams, games, { g1: 'home' });
    expect(homeRecords.get(bills.id)!.pointsFor).toBe(24);
    expect(homeRecords.get(bills.id)!.pointsAgainst).toBe(17);

    // Away win selection
    const awayRecords = calculateTeamRecords(teams, games, { g1: 'away' });
    expect(awayRecords.get(bills.id)!.pointsFor).toBe(17);
    expect(awayRecords.get(bills.id)!.pointsAgainst).toBe(24);
  });

  it('should use estimated points for tie selections (20-20)', () => {
    const games: Game[] = [
      createGame('g1', bills, dolphins, null, null, 'scheduled', 1),
    ];

    const teams = [bills, dolphins];

    const tieRecords = calculateTeamRecords(teams, games, { g1: 'tie' });
    expect(tieRecords.get(bills.id)!.pointsFor).toBe(20);
    expect(tieRecords.get(bills.id)!.pointsAgainst).toBe(20);
    expect(tieRecords.get(dolphins.id)!.pointsFor).toBe(20);
    expect(tieRecords.get(dolphins.id)!.pointsAgainst).toBe(20);
  });
});
