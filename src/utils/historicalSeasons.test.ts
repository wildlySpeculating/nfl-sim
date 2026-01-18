/**
 * Phase 16: Historical Season Regression Tests
 *
 * These tests use actual NFL game results to verify our tiebreaker logic
 * produces the exact historical playoff seedings. This is the definitive
 * validation that our implementation matches NFL rules.
 *
 * Data source: ESPN API
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { calculatePlayoffSeedings, calculateTeamRecords } from './tiebreakers';
import { getTeamByAbbreviation, getTeamsByConference } from '@/data/teams';
import type { Game, Team } from '@/types';
import {
  SEASON_2024_GAMES,
  EXPECTED_2024_AFC_SEEDINGS,
  EXPECTED_2024_NFC_SEEDINGS,
  TIEBREAKER_SCENARIOS_2024,
  type CompactGame,
} from './fixtures/season2024';
import {
  SEASON_2023_GAMES,
  EXPECTED_2023_AFC_SEEDINGS,
  EXPECTED_2023_NFC_SEEDINGS,
  TIEBREAKER_SCENARIOS_2023,
} from './fixtures/season2023';
import {
  SEASON_2022_GAMES,
  EXPECTED_2022_AFC_SEEDINGS,
  EXPECTED_2022_NFC_SEEDINGS,
} from './fixtures/season2022';
import {
  SEASON_2021_GAMES,
  EXPECTED_2021_AFC_SEEDINGS,
  EXPECTED_2021_NFC_SEEDINGS,
} from './fixtures/season2021';
import {
  SEASON_2020_GAMES,
  EXPECTED_2020_AFC_SEEDINGS,
  EXPECTED_2020_NFC_SEEDINGS,
} from './fixtures/season2020';

/**
 * Convert compact fixture format to full Game objects
 */
function fixtureToGames(fixtures: CompactGame[]): Game[] {
  return fixtures
    .map(f => {
      const homeTeam = getTeamByAbbreviation(f.home);
      const awayTeam = getTeamByAbbreviation(f.away);

      if (!homeTeam || !awayTeam) {
        console.warn(`Team not found: ${f.home} or ${f.away}`);
        return null;
      }

      return {
        id: f.id,
        week: f.week,
        homeTeam,
        awayTeam,
        kickoffTime: new Date(),
        status: 'final' as const,
        homeScore: f.homeScore,
        awayScore: f.awayScore,
      };
    })
    .filter((g): g is Game => g !== null);
}

describe('Phase 16: 2024 NFL Season Historical Regression Tests', () => {
  let games: Game[];
  let afcTeams: Team[];
  let nfcTeams: Team[];

  beforeAll(() => {
    games = fixtureToGames(SEASON_2024_GAMES);
    afcTeams = getTeamsByConference('AFC');
    nfcTeams = getTeamsByConference('NFC');
  });

  describe('Data Validation', () => {
    it('should have loaded all 272 games', () => {
      expect(games.length).toBe(272);
    });

    it('should have 16 AFC teams', () => {
      expect(afcTeams.length).toBe(16);
    });

    it('should have 16 NFC teams', () => {
      expect(nfcTeams.length).toBe(16);
    });

    it('should have all games with final scores', () => {
      const gamesWithScores = games.filter(
        g => g.homeScore !== null && g.awayScore !== null
      );
      expect(gamesWithScores.length).toBe(272);
    });
  });

  describe('2024 AFC Playoff Seeding Verification', () => {
    it('should produce exactly 7 playoff teams for AFC', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);
    });

    it('should have Chiefs (15-2) as AFC 1 seed', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed1 = standings.find(s => s.seed === 1);

      expect(seed1).toBeDefined();
      expect(seed1?.team.id).toBe(EXPECTED_2024_AFC_SEEDINGS[1].teamId);
      expect(seed1?.team.name).toBe('Chiefs');
      expect(seed1?.wins).toBe(15);
      expect(seed1?.losses).toBe(2);
    });

    it('should have Bills (13-4) as AFC 2 seed', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed2 = standings.find(s => s.seed === 2);

      expect(seed2).toBeDefined();
      expect(seed2?.team.id).toBe(EXPECTED_2024_AFC_SEEDINGS[2].teamId);
      expect(seed2?.team.name).toBe('Bills');
      expect(seed2?.wins).toBe(13);
      expect(seed2?.losses).toBe(4);
    });

    it('should have Ravens (12-5) as AFC 3 seed', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed3 = standings.find(s => s.seed === 3);

      expect(seed3).toBeDefined();
      expect(seed3?.team.id).toBe(EXPECTED_2024_AFC_SEEDINGS[3].teamId);
      expect(seed3?.team.name).toBe('Ravens');
      expect(seed3?.wins).toBe(12);
      expect(seed3?.losses).toBe(5);
    });

    it('should have Texans (10-7) as AFC 4 seed (AFC South winner)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed4 = standings.find(s => s.seed === 4);

      expect(seed4).toBeDefined();
      expect(seed4?.team.id).toBe(EXPECTED_2024_AFC_SEEDINGS[4].teamId);
      expect(seed4?.team.name).toBe('Texans');
      expect(seed4?.wins).toBe(10);
      expect(seed4?.losses).toBe(7);
    });

    it('should have Chargers (11-6) as AFC 5 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed5 = standings.find(s => s.seed === 5);

      expect(seed5).toBeDefined();
      expect(seed5?.team.id).toBe(EXPECTED_2024_AFC_SEEDINGS[5].teamId);
      expect(seed5?.team.name).toBe('Chargers');
      expect(seed5?.wins).toBe(11);
      expect(seed5?.losses).toBe(6);
    });

    it('should have Steelers (10-7) as AFC 6 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed6 = standings.find(s => s.seed === 6);

      expect(seed6).toBeDefined();
      expect(seed6?.team.id).toBe(EXPECTED_2024_AFC_SEEDINGS[6].teamId);
      expect(seed6?.team.name).toBe('Steelers');
      expect(seed6?.wins).toBe(10);
      expect(seed6?.losses).toBe(7);
    });

    it('should have Broncos (10-7) as AFC 7 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed7 = standings.find(s => s.seed === 7);

      expect(seed7).toBeDefined();
      expect(seed7?.team.id).toBe(EXPECTED_2024_AFC_SEEDINGS[7].teamId);
      expect(seed7?.team.name).toBe('Broncos');
      expect(seed7?.wins).toBe(10);
      expect(seed7?.losses).toBe(7);
    });

    it('should have 4 division winners in seeds 1-4', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);

      expect(divisionWinners.length).toBe(4);

      // Each should be from a different division
      const divisions = new Set(divisionWinners.map(s => s.team.division));
      expect(divisions.size).toBe(4);
      expect(divisions.has('AFC East')).toBe(true);
      expect(divisions.has('AFC North')).toBe(true);
      expect(divisions.has('AFC South')).toBe(true);
      expect(divisions.has('AFC West')).toBe(true);
    });
  });

  describe('2024 NFC Playoff Seeding Verification', () => {
    it('should produce exactly 7 playoff teams for NFC', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);
    });

    it('should have Lions (15-2) as NFC 1 seed', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed1 = standings.find(s => s.seed === 1);

      expect(seed1).toBeDefined();
      expect(seed1?.team.id).toBe(EXPECTED_2024_NFC_SEEDINGS[1].teamId);
      expect(seed1?.team.name).toBe('Lions');
      expect(seed1?.wins).toBe(15);
      expect(seed1?.losses).toBe(2);
    });

    it('should have Eagles (14-3) as NFC 2 seed', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed2 = standings.find(s => s.seed === 2);

      expect(seed2).toBeDefined();
      expect(seed2?.team.id).toBe(EXPECTED_2024_NFC_SEEDINGS[2].teamId);
      expect(seed2?.team.name).toBe('Eagles');
      expect(seed2?.wins).toBe(14);
      expect(seed2?.losses).toBe(3);
    });

    // Per ESPN: Buccaneers (NFC South) at 3, Rams (NFC West) at 4 - both 10-7 division winners
    it('should have Buccaneers (10-7) as NFC 3 seed (NFC South winner)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed3 = standings.find(s => s.seed === 3);

      expect(seed3).toBeDefined();
      expect(seed3?.team.id).toBe(EXPECTED_2024_NFC_SEEDINGS[3].teamId);
      expect(seed3?.team.name).toBe('Buccaneers');
      expect(seed3?.wins).toBe(10);
      expect(seed3?.losses).toBe(7);
    });

    it('should have Rams (10-7) as NFC 4 seed (NFC West winner)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed4 = standings.find(s => s.seed === 4);

      expect(seed4).toBeDefined();
      expect(seed4?.team.id).toBe(EXPECTED_2024_NFC_SEEDINGS[4].teamId);
      expect(seed4?.team.name).toBe('Rams');
      expect(seed4?.wins).toBe(10);
      expect(seed4?.losses).toBe(7);
    });

    it('should have Vikings (14-3) as NFC 5 seed (wild card despite excellent record)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed5 = standings.find(s => s.seed === 5);

      expect(seed5).toBeDefined();
      expect(seed5?.team.id).toBe(EXPECTED_2024_NFC_SEEDINGS[5].teamId);
      expect(seed5?.team.name).toBe('Vikings');
      expect(seed5?.wins).toBe(14);
      expect(seed5?.losses).toBe(3);
    });

    it('should have Commanders (12-5) as NFC 6 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed6 = standings.find(s => s.seed === 6);

      expect(seed6).toBeDefined();
      expect(seed6?.team.id).toBe(EXPECTED_2024_NFC_SEEDINGS[6].teamId);
      expect(seed6?.team.name).toBe('Commanders');
      expect(seed6?.wins).toBe(12);
      expect(seed6?.losses).toBe(5);
    });

    it('should have Packers (11-6) as NFC 7 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed7 = standings.find(s => s.seed === 7);

      expect(seed7).toBeDefined();
      expect(seed7?.team.id).toBe(EXPECTED_2024_NFC_SEEDINGS[7].teamId);
      expect(seed7?.team.name).toBe('Packers');
      expect(seed7?.wins).toBe(11);
      expect(seed7?.losses).toBe(6);
    });

    it('should have 4 division winners in seeds 1-4', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);

      expect(divisionWinners.length).toBe(4);

      // Each should be from a different division
      const divisions = new Set(divisionWinners.map(s => s.team.division));
      expect(divisions.size).toBe(4);
      expect(divisions.has('NFC East')).toBe(true);
      expect(divisions.has('NFC North')).toBe(true);
      expect(divisions.has('NFC South')).toBe(true);
      expect(divisions.has('NFC West')).toBe(true);
    });
  });

  describe('2024 Notable Tiebreaker Scenarios', () => {
    it('should correctly order Steelers over Broncos for AFC 6/7 seeds (both 10-7)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      const steelers = standings.find(s => s.team.id === '8');
      const broncos = standings.find(s => s.team.id === '13');

      expect(steelers).toBeDefined();
      expect(broncos).toBeDefined();

      // Both should be 10-7
      expect(steelers?.wins).toBe(10);
      expect(steelers?.losses).toBe(7);
      expect(broncos?.wins).toBe(10);
      expect(broncos?.losses).toBe(7);

      // Steelers should have better seed (6 < 7)
      expect(steelers?.seed).toBe(6);
      expect(broncos?.seed).toBe(7);
    });

    // Per ESPN: Buccaneers at 3, Rams at 4 (both 10-7 division winners)
    it('should correctly order Buccaneers over Rams for NFC 3/4 seeds (both 10-7 division winners)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      const buccaneers = standings.find(s => s.team.id === '28');
      const rams = standings.find(s => s.team.id === '30');

      expect(buccaneers).toBeDefined();
      expect(rams).toBeDefined();

      // Both should be 10-7
      expect(buccaneers?.wins).toBe(10);
      expect(buccaneers?.losses).toBe(7);
      expect(rams?.wins).toBe(10);
      expect(rams?.losses).toBe(7);

      // Buccaneers should have better seed (3 < 4) - per ESPN
      expect(buccaneers?.seed).toBe(3);
      expect(rams?.seed).toBe(4);
    });

    it('should have Vikings (14-3) as wild card while Lions (15-2) win NFC North', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      const lions = standings.find(s => s.team.id === '22');
      const vikings = standings.find(s => s.team.id === '24');

      expect(lions).toBeDefined();
      expect(vikings).toBeDefined();

      // Lions: 15-2, division winner (seed 1)
      expect(lions?.wins).toBe(15);
      expect(lions?.losses).toBe(2);
      expect(lions?.seed).toBe(1);

      // Vikings: 14-3, wild card (seed 5)
      expect(vikings?.wins).toBe(14);
      expect(vikings?.losses).toBe(3);
      expect(vikings?.seed).toBe(5);

      // Vikings have better record than some division winners (10-7) but still wild card
      const buccaneers = standings.find(s => s.team.id === '28');
      const rams = standings.find(s => s.team.id === '30');
      expect(vikings!.wins).toBeGreaterThan(buccaneers!.wins);
      expect(vikings!.wins).toBeGreaterThan(rams!.wins);
    });
  });

  describe('Record Calculation Verification', () => {
    it('should calculate correct records for all teams', () => {
      const allTeams = [...afcTeams, ...nfcTeams];
      const records = calculateTeamRecords(allTeams, games, {});

      // Verify Chiefs are 15-2
      const chiefsRecord = records.get('14');
      expect(chiefsRecord?.wins).toBe(15);
      expect(chiefsRecord?.losses).toBe(2);

      // Verify Lions are 15-2
      const lionsRecord = records.get('22');
      expect(lionsRecord?.wins).toBe(15);
      expect(lionsRecord?.losses).toBe(2);

      // Verify Eagles are 14-3
      const eaglesRecord = records.get('19');
      expect(eaglesRecord?.wins).toBe(14);
      expect(eaglesRecord?.losses).toBe(3);

      // Verify Vikings are 14-3
      const vikingsRecord = records.get('24');
      expect(vikingsRecord?.wins).toBe(14);
      expect(vikingsRecord?.losses).toBe(3);
    });

    it('should have correct total wins and losses (sum to 272 games)', () => {
      const allTeams = [...afcTeams, ...nfcTeams];
      const records = calculateTeamRecords(allTeams, games, {});

      let totalWins = 0;
      let totalLosses = 0;

      for (const record of records.values()) {
        totalWins += record.wins;
        totalLosses += record.losses;
      }

      // Each game has 1 winner and 1 loser, so total wins = total losses = 272
      expect(totalWins).toBe(272);
      expect(totalLosses).toBe(272);
    });
  });

  describe('Division Winner Determination', () => {
    it('should correctly identify AFC East winner as Bills', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcEastWinner = standings.find(
        s => s.team.division === 'AFC East' && s.seed !== null && s.seed <= 4
      );

      expect(afcEastWinner?.team.id).toBe('1'); // Bills
      expect(afcEastWinner?.team.name).toBe('Bills');
    });

    it('should correctly identify AFC North winner as Ravens', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcNorthWinner = standings.find(
        s => s.team.division === 'AFC North' && s.seed !== null && s.seed <= 4
      );

      expect(afcNorthWinner?.team.id).toBe('5'); // Ravens
      expect(afcNorthWinner?.team.name).toBe('Ravens');
    });

    it('should correctly identify AFC South winner as Texans', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcSouthWinner = standings.find(
        s => s.team.division === 'AFC South' && s.seed !== null && s.seed <= 4
      );

      expect(afcSouthWinner?.team.id).toBe('9'); // Texans
      expect(afcSouthWinner?.team.name).toBe('Texans');
    });

    it('should correctly identify AFC West winner as Chiefs', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcWestWinner = standings.find(
        s => s.team.division === 'AFC West' && s.seed !== null && s.seed <= 4
      );

      expect(afcWestWinner?.team.id).toBe('14'); // Chiefs
      expect(afcWestWinner?.team.name).toBe('Chiefs');
    });

    it('should correctly identify NFC East winner as Eagles', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcEastWinner = standings.find(
        s => s.team.division === 'NFC East' && s.seed !== null && s.seed <= 4
      );

      expect(nfcEastWinner?.team.id).toBe('19'); // Eagles
      expect(nfcEastWinner?.team.name).toBe('Eagles');
    });

    it('should correctly identify NFC North winner as Lions', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcNorthWinner = standings.find(
        s => s.team.division === 'NFC North' && s.seed !== null && s.seed <= 4
      );

      expect(nfcNorthWinner?.team.id).toBe('22'); // Lions
      expect(nfcNorthWinner?.team.name).toBe('Lions');
    });

    it('should correctly identify NFC South winner as Buccaneers', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcSouthWinner = standings.find(
        s => s.team.division === 'NFC South' && s.seed !== null && s.seed <= 4
      );

      expect(nfcSouthWinner?.team.id).toBe('28'); // Buccaneers
      expect(nfcSouthWinner?.team.name).toBe('Buccaneers');
    });

    it('should correctly identify NFC West winner as Rams', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcWestWinner = standings.find(
        s => s.team.division === 'NFC West' && s.seed !== null && s.seed <= 4
      );

      expect(nfcWestWinner?.team.id).toBe('30'); // Rams
      expect(nfcWestWinner?.team.name).toBe('Rams');
    });
  });

  describe('Complete Seeding Order Verification', () => {
    it('should match exact AFC playoff seeding order', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      for (let seed = 1; seed <= 7; seed++) {
        const teamStanding = standings.find(s => s.seed === seed);
        const expected = EXPECTED_2024_AFC_SEEDINGS[seed as keyof typeof EXPECTED_2024_AFC_SEEDINGS];

        expect(teamStanding?.team.id).toBe(expected.teamId);
      }
    });

    it('should match exact NFC playoff seeding order', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      for (let seed = 1; seed <= 7; seed++) {
        const teamStanding = standings.find(s => s.seed === seed);
        const expected = EXPECTED_2024_NFC_SEEDINGS[seed as keyof typeof EXPECTED_2024_NFC_SEEDINGS];

        expect(teamStanding?.team.id).toBe(expected.teamId);
      }
    });
  });
});

describe('Phase 16: 2023 NFL Season Historical Regression Tests', () => {
  let games: Game[];
  let afcTeams: Team[];
  let nfcTeams: Team[];

  beforeAll(() => {
    games = fixtureToGames(SEASON_2023_GAMES);
    afcTeams = getTeamsByConference('AFC');
    nfcTeams = getTeamsByConference('NFC');
  });

  describe('Data Validation', () => {
    it('should have loaded all 272 games', () => {
      expect(games.length).toBe(272);
    });

    it('should have 16 AFC teams', () => {
      expect(afcTeams.length).toBe(16);
    });

    it('should have 16 NFC teams', () => {
      expect(nfcTeams.length).toBe(16);
    });

    it('should have all games with final scores', () => {
      const gamesWithScores = games.filter(
        g => g.homeScore !== null && g.awayScore !== null
      );
      expect(gamesWithScores.length).toBe(272);
    });
  });

  describe('2023 AFC Playoff Seeding Verification', () => {
    it('should produce exactly 7 playoff teams for AFC', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);
    });

    it('should have Ravens (13-4) as AFC 1 seed', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed1 = standings.find(s => s.seed === 1);

      expect(seed1).toBeDefined();
      expect(seed1?.team.id).toBe(EXPECTED_2023_AFC_SEEDINGS[1].teamId);
      expect(seed1?.team.name).toBe('Ravens');
      expect(seed1?.wins).toBe(13);
      expect(seed1?.losses).toBe(4);
    });

    it('should have Bills (11-6) as AFC 2 seed', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed2 = standings.find(s => s.seed === 2);

      expect(seed2).toBeDefined();
      expect(seed2?.team.id).toBe(EXPECTED_2023_AFC_SEEDINGS[2].teamId);
      expect(seed2?.team.name).toBe('Bills');
      expect(seed2?.wins).toBe(11);
      expect(seed2?.losses).toBe(6);
    });

    it('should have Chiefs (11-6) as AFC 3 seed', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed3 = standings.find(s => s.seed === 3);

      expect(seed3).toBeDefined();
      expect(seed3?.team.id).toBe(EXPECTED_2023_AFC_SEEDINGS[3].teamId);
      expect(seed3?.team.name).toBe('Chiefs');
      expect(seed3?.wins).toBe(11);
      expect(seed3?.losses).toBe(6);
    });

    it('should have Texans (10-7) as AFC 4 seed (AFC South winner)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed4 = standings.find(s => s.seed === 4);

      expect(seed4).toBeDefined();
      expect(seed4?.team.id).toBe(EXPECTED_2023_AFC_SEEDINGS[4].teamId);
      expect(seed4?.team.name).toBe('Texans');
      expect(seed4?.wins).toBe(10);
      expect(seed4?.losses).toBe(7);
    });

    // BUG: Our system produces Dolphins(5), Browns(6). NFL had Browns(5), Dolphins(6).
    // This test expects the CORRECT NFL result and will FAIL until the bug is fixed.
    // See REGRESSION_ERRORS_CHECKLIST.md - Error #1
    it('should have Browns (11-6) as AFC 5 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed5 = standings.find(s => s.seed === 5);

      expect(seed5).toBeDefined();
      expect(seed5?.team.id).toBe(EXPECTED_2023_AFC_SEEDINGS[5].teamId);
      expect(seed5?.team.name).toBe('Browns');
      expect(seed5?.wins).toBe(11);
      expect(seed5?.losses).toBe(6);
    });

    it('should have Dolphins (11-6) as AFC 6 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed6 = standings.find(s => s.seed === 6);

      expect(seed6).toBeDefined();
      expect(seed6?.team.id).toBe(EXPECTED_2023_AFC_SEEDINGS[6].teamId);
      expect(seed6?.team.name).toBe('Dolphins');
      expect(seed6?.wins).toBe(11);
      expect(seed6?.losses).toBe(6);
    });

    it('should have Steelers (10-7) as AFC 7 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed7 = standings.find(s => s.seed === 7);

      expect(seed7).toBeDefined();
      expect(seed7?.team.id).toBe(EXPECTED_2023_AFC_SEEDINGS[7].teamId);
      expect(seed7?.team.name).toBe('Steelers');
      expect(seed7?.wins).toBe(10);
      expect(seed7?.losses).toBe(7);
    });

    it('should have 4 division winners in seeds 1-4', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);

      expect(divisionWinners.length).toBe(4);

      // Each should be from a different division
      const divisions = new Set(divisionWinners.map(s => s.team.division));
      expect(divisions.size).toBe(4);
      expect(divisions.has('AFC East')).toBe(true);
      expect(divisions.has('AFC North')).toBe(true);
      expect(divisions.has('AFC South')).toBe(true);
      expect(divisions.has('AFC West')).toBe(true);
    });
  });

  describe('2023 NFC Playoff Seeding Verification', () => {
    it('should produce exactly 7 playoff teams for NFC', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);
    });

    // BUG: Our system produces Cowboys(1), Lions(2), 49ers(3). NFL had 49ers(1), Cowboys(2), Lions(3).
    // These tests expect the CORRECT NFL result and will FAIL until the bug is fixed.
    // See REGRESSION_ERRORS_CHECKLIST.md - Error #2
    it('should have 49ers (12-5) as NFC 1 seed', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed1 = standings.find(s => s.seed === 1);

      expect(seed1).toBeDefined();
      expect(seed1?.team.id).toBe(EXPECTED_2023_NFC_SEEDINGS[1].teamId);
      expect(seed1?.team.name).toBe('49ers');
      expect(seed1?.wins).toBe(12);
      expect(seed1?.losses).toBe(5);
    });

    it('should have Cowboys (12-5) as NFC 2 seed', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed2 = standings.find(s => s.seed === 2);

      expect(seed2).toBeDefined();
      expect(seed2?.team.id).toBe(EXPECTED_2023_NFC_SEEDINGS[2].teamId);
      expect(seed2?.team.name).toBe('Cowboys');
      expect(seed2?.wins).toBe(12);
      expect(seed2?.losses).toBe(5);
    });

    it('should have Lions (12-5) as NFC 3 seed', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed3 = standings.find(s => s.seed === 3);

      expect(seed3).toBeDefined();
      expect(seed3?.team.id).toBe(EXPECTED_2023_NFC_SEEDINGS[3].teamId);
      expect(seed3?.team.name).toBe('Lions');
      expect(seed3?.wins).toBe(12);
      expect(seed3?.losses).toBe(5);
    });

    it('should have Buccaneers (9-8) as NFC 4 seed (NFC South winner)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed4 = standings.find(s => s.seed === 4);

      expect(seed4).toBeDefined();
      expect(seed4?.team.id).toBe(EXPECTED_2023_NFC_SEEDINGS[4].teamId);
      expect(seed4?.team.name).toBe('Buccaneers');
      expect(seed4?.wins).toBe(9);
      expect(seed4?.losses).toBe(8);
    });

    it('should have Eagles (11-6) as NFC 5 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed5 = standings.find(s => s.seed === 5);

      expect(seed5).toBeDefined();
      expect(seed5?.team.id).toBe(EXPECTED_2023_NFC_SEEDINGS[5].teamId);
      expect(seed5?.team.name).toBe('Eagles');
      expect(seed5?.wins).toBe(11);
      expect(seed5?.losses).toBe(6);
    });

    it('should have Rams (10-7) as NFC 6 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed6 = standings.find(s => s.seed === 6);

      expect(seed6).toBeDefined();
      expect(seed6?.team.id).toBe(EXPECTED_2023_NFC_SEEDINGS[6].teamId);
      expect(seed6?.team.name).toBe('Rams');
      expect(seed6?.wins).toBe(10);
      expect(seed6?.losses).toBe(7);
    });

    it('should have Packers (9-8) as NFC 7 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed7 = standings.find(s => s.seed === 7);

      expect(seed7).toBeDefined();
      expect(seed7?.team.id).toBe(EXPECTED_2023_NFC_SEEDINGS[7].teamId);
      expect(seed7?.team.name).toBe('Packers');
      expect(seed7?.wins).toBe(9);
      expect(seed7?.losses).toBe(8);
    });

    it('should have 4 division winners in seeds 1-4', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);

      expect(divisionWinners.length).toBe(4);

      // Each should be from a different division
      const divisions = new Set(divisionWinners.map(s => s.team.division));
      expect(divisions.size).toBe(4);
      expect(divisions.has('NFC East')).toBe(true);
      expect(divisions.has('NFC North')).toBe(true);
      expect(divisions.has('NFC South')).toBe(true);
      expect(divisions.has('NFC West')).toBe(true);
    });
  });

  describe('2023 Notable Tiebreaker Scenarios', () => {
    // BUG: Our system gives Dolphins(5), Browns(6). NFL had Browns(5), Dolphins(6).
    // This test expects the CORRECT NFL result and will FAIL until the bug is fixed.
    it('should correctly order four 11-6 AFC teams (Bills, Chiefs, Browns, Dolphins)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      const bills = standings.find(s => s.team.id === '1');
      const chiefs = standings.find(s => s.team.id === '14');
      const browns = standings.find(s => s.team.id === '7');
      const dolphins = standings.find(s => s.team.id === '2');

      // All should be 11-6
      expect(bills?.wins).toBe(11);
      expect(bills?.losses).toBe(6);
      expect(chiefs?.wins).toBe(11);
      expect(chiefs?.losses).toBe(6);
      expect(browns?.wins).toBe(11);
      expect(browns?.losses).toBe(6);
      expect(dolphins?.wins).toBe(11);
      expect(dolphins?.losses).toBe(6);

      // Bills and Chiefs as division winners (seeds 2 and 3)
      expect(bills?.seed).toBe(2);
      expect(chiefs?.seed).toBe(3);

      // NFL had Browns(5), Dolphins(6)
      expect(browns?.seed).toBe(5);
      expect(dolphins?.seed).toBe(6);
    });

    // BUG: Our system produces Cowboys(1), Lions(2), 49ers(3). NFL had 49ers(1), Cowboys(2), Lions(3).
    // This test expects the CORRECT NFL result and will FAIL until the bug is fixed.
    it('should correctly order three 12-5 NFC division winners (49ers, Cowboys, Lions)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      const niners = standings.find(s => s.team.id === '31');
      const cowboys = standings.find(s => s.team.id === '17');
      const lions = standings.find(s => s.team.id === '22');

      // All should be 12-5
      expect(niners?.wins).toBe(12);
      expect(niners?.losses).toBe(5);
      expect(cowboys?.wins).toBe(12);
      expect(cowboys?.losses).toBe(5);
      expect(lions?.wins).toBe(12);
      expect(lions?.losses).toBe(5);

      // NFL had 49ers(1), Cowboys(2), Lions(3)
      expect(niners?.seed).toBe(1);
      expect(cowboys?.seed).toBe(2);
      expect(lions?.seed).toBe(3);
    });

    it('should have Buccaneers (9-8) as NFC 4 seed despite poor record (weak division)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      const buccaneers = standings.find(s => s.team.id === '28');

      expect(buccaneers?.wins).toBe(9);
      expect(buccaneers?.losses).toBe(8);
      expect(buccaneers?.seed).toBe(4);

      // Buccaneers have worse record than wild cards
      const eagles = standings.find(s => s.team.id === '19');
      const rams = standings.find(s => s.team.id === '30');
      expect(buccaneers!.wins).toBeLessThan(eagles!.wins);
      expect(buccaneers!.wins).toBeLessThan(rams!.wins);
    });

    it('should have Packers (9-8) over Saints (9-8) for NFC 7 seed', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      const packers = standings.find(s => s.team.id === '23');
      const saints = standings.find(s => s.team.id === '27');

      // Both should be 9-8
      expect(packers?.wins).toBe(9);
      expect(packers?.losses).toBe(8);
      expect(saints?.wins).toBe(9);
      expect(saints?.losses).toBe(8);

      // Packers should have seed 7, Saints should not be in playoffs
      expect(packers?.seed).toBe(7);
      expect(saints?.seed).toBe(null);
    });
  });

  describe('Record Calculation Verification', () => {
    it('should calculate correct records for all teams', () => {
      const allTeams = [...afcTeams, ...nfcTeams];
      const records = calculateTeamRecords(allTeams, games, {});

      // Verify Ravens are 13-4
      const ravensRecord = records.get('5');
      expect(ravensRecord?.wins).toBe(13);
      expect(ravensRecord?.losses).toBe(4);

      // Verify 49ers are 12-5
      const ninersRecord = records.get('31');
      expect(ninersRecord?.wins).toBe(12);
      expect(ninersRecord?.losses).toBe(5);

      // Verify Cowboys are 12-5
      const cowboysRecord = records.get('17');
      expect(cowboysRecord?.wins).toBe(12);
      expect(cowboysRecord?.losses).toBe(5);

      // Verify Lions are 12-5
      const lionsRecord = records.get('22');
      expect(lionsRecord?.wins).toBe(12);
      expect(lionsRecord?.losses).toBe(5);
    });

    it('should have correct total wins and losses (sum to 272 games)', () => {
      const allTeams = [...afcTeams, ...nfcTeams];
      const records = calculateTeamRecords(allTeams, games, {});

      let totalWins = 0;
      let totalLosses = 0;

      for (const record of records.values()) {
        totalWins += record.wins;
        totalLosses += record.losses;
      }

      // Each game has 1 winner and 1 loser, so total wins = total losses = 272
      expect(totalWins).toBe(272);
      expect(totalLosses).toBe(272);
    });
  });

  describe('Division Winner Determination', () => {
    it('should correctly identify AFC East winner as Bills', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcEastWinner = standings.find(
        s => s.team.division === 'AFC East' && s.seed !== null && s.seed <= 4
      );

      expect(afcEastWinner?.team.id).toBe('1'); // Bills
      expect(afcEastWinner?.team.name).toBe('Bills');
    });

    it('should correctly identify AFC North winner as Ravens', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcNorthWinner = standings.find(
        s => s.team.division === 'AFC North' && s.seed !== null && s.seed <= 4
      );

      expect(afcNorthWinner?.team.id).toBe('5'); // Ravens
      expect(afcNorthWinner?.team.name).toBe('Ravens');
    });

    it('should correctly identify AFC South winner as Texans', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcSouthWinner = standings.find(
        s => s.team.division === 'AFC South' && s.seed !== null && s.seed <= 4
      );

      expect(afcSouthWinner?.team.id).toBe('9'); // Texans
      expect(afcSouthWinner?.team.name).toBe('Texans');
    });

    it('should correctly identify AFC West winner as Chiefs', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcWestWinner = standings.find(
        s => s.team.division === 'AFC West' && s.seed !== null && s.seed <= 4
      );

      expect(afcWestWinner?.team.id).toBe('14'); // Chiefs
      expect(afcWestWinner?.team.name).toBe('Chiefs');
    });

    it('should correctly identify NFC East winner as Cowboys', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcEastWinner = standings.find(
        s => s.team.division === 'NFC East' && s.seed !== null && s.seed <= 4
      );

      expect(nfcEastWinner?.team.id).toBe('17'); // Cowboys
      expect(nfcEastWinner?.team.name).toBe('Cowboys');
    });

    it('should correctly identify NFC North winner as Lions', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcNorthWinner = standings.find(
        s => s.team.division === 'NFC North' && s.seed !== null && s.seed <= 4
      );

      expect(nfcNorthWinner?.team.id).toBe('22'); // Lions
      expect(nfcNorthWinner?.team.name).toBe('Lions');
    });

    it('should correctly identify NFC South winner as Buccaneers', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcSouthWinner = standings.find(
        s => s.team.division === 'NFC South' && s.seed !== null && s.seed <= 4
      );

      expect(nfcSouthWinner?.team.id).toBe('28'); // Buccaneers
      expect(nfcSouthWinner?.team.name).toBe('Buccaneers');
    });

    it('should correctly identify NFC West winner as 49ers', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcWestWinner = standings.find(
        s => s.team.division === 'NFC West' && s.seed !== null && s.seed <= 4
      );

      expect(nfcWestWinner?.team.id).toBe('31'); // 49ers
      expect(nfcWestWinner?.team.name).toBe('49ers');
    });
  });

  describe('Complete Seeding Order Verification', () => {
    // These tests expect the CORRECT NFL seeding order.
    // Tests will FAIL until tiebreaker bugs are fixed. See REGRESSION_ERRORS_CHECKLIST.md.
    it('should match exact AFC playoff seeding order', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      for (let seed = 1; seed <= 7; seed++) {
        const teamStanding = standings.find(s => s.seed === seed);
        const expected = EXPECTED_2023_AFC_SEEDINGS[seed as keyof typeof EXPECTED_2023_AFC_SEEDINGS];

        expect(teamStanding?.team.id).toBe(expected.teamId);
      }
    });

    it('should match exact NFC playoff seeding order', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      for (let seed = 1; seed <= 7; seed++) {
        const teamStanding = standings.find(s => s.seed === seed);
        const expected = EXPECTED_2023_NFC_SEEDINGS[seed as keyof typeof EXPECTED_2023_NFC_SEEDINGS];

        expect(teamStanding?.team.id).toBe(expected.teamId);
      }
    });
  });
});

describe('Phase 16: 2022 NFL Season Historical Regression Tests', () => {
  let games: Game[];
  let afcTeams: Team[];
  let nfcTeams: Team[];

  beforeAll(() => {
    games = fixtureToGames(SEASON_2022_GAMES);
    afcTeams = getTeamsByConference('AFC');
    nfcTeams = getTeamsByConference('NFC');
  });

  describe('Data Validation', () => {
    it('should have loaded all 272 games', () => {
      expect(games.length).toBe(272);
    });

    it('should have 16 AFC teams', () => {
      expect(afcTeams.length).toBe(16);
    });

    it('should have 16 NFC teams', () => {
      expect(nfcTeams.length).toBe(16);
    });

    it('should have all games with scores (including cancelled CIN-BUF)', () => {
      // Note: The Bengals-Bills Week 17 game was cancelled after Damar Hamlin's
      // cardiac arrest. It shows as 0-0 in our data.
      const gamesWithScores = games.filter(
        g => g.homeScore !== null && g.awayScore !== null
      );
      expect(gamesWithScores.length).toBe(272);
    });
  });

  describe('2022 AFC Playoff Seeding Verification', () => {
    it('should produce exactly 7 playoff teams for AFC', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);
    });

    it('should have Chiefs (14-3) as AFC 1 seed', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed1 = standings.find(s => s.seed === 1);

      expect(seed1).toBeDefined();
      expect(seed1?.team.id).toBe(EXPECTED_2022_AFC_SEEDINGS[1].teamId);
      expect(seed1?.team.name).toBe('Chiefs');
      expect(seed1?.wins).toBe(14);
      expect(seed1?.losses).toBe(3);
    });

    it('should have Bills (13-3) as AFC 2 seed', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed2 = standings.find(s => s.seed === 2);

      expect(seed2).toBeDefined();
      expect(seed2?.team.id).toBe(EXPECTED_2022_AFC_SEEDINGS[2].teamId);
      expect(seed2?.team.name).toBe('Bills');
      // Note: Bills ended 13-3 but CIN-BUF game was cancelled
      expect(seed2?.wins).toBe(13);
      expect(seed2?.losses).toBe(3);
    });

    it('should have Bengals (12-4) as AFC 3 seed', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed3 = standings.find(s => s.seed === 3);

      expect(seed3).toBeDefined();
      expect(seed3?.team.id).toBe(EXPECTED_2022_AFC_SEEDINGS[3].teamId);
      expect(seed3?.team.name).toBe('Bengals');
      expect(seed3?.wins).toBe(12);
      expect(seed3?.losses).toBe(4);
    });

    it('should have Jaguars (9-8) as AFC 4 seed (AFC South winner)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed4 = standings.find(s => s.seed === 4);

      expect(seed4).toBeDefined();
      expect(seed4?.team.id).toBe(EXPECTED_2022_AFC_SEEDINGS[4].teamId);
      expect(seed4?.team.name).toBe('Jaguars');
      expect(seed4?.wins).toBe(9);
      expect(seed4?.losses).toBe(8);
    });

    // BUG: Our system produces Ravens(5), Chargers(6). NFL had Chargers(5), Ravens(6).
    // This test expects the CORRECT NFL result and will FAIL until the bug is fixed.
    // See REGRESSION_ERRORS_CHECKLIST.md - 2022 Error #1
    it('should have Chargers (10-7) as AFC 5 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed5 = standings.find(s => s.seed === 5);

      expect(seed5).toBeDefined();
      expect(seed5?.team.id).toBe(EXPECTED_2022_AFC_SEEDINGS[5].teamId);
      expect(seed5?.team.name).toBe('Chargers');
      expect(seed5?.wins).toBe(10);
      expect(seed5?.losses).toBe(7);
    });

    it('should have Ravens (10-7) as AFC 6 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed6 = standings.find(s => s.seed === 6);

      expect(seed6).toBeDefined();
      expect(seed6?.team.id).toBe(EXPECTED_2022_AFC_SEEDINGS[6].teamId);
      expect(seed6?.team.name).toBe('Ravens');
      expect(seed6?.wins).toBe(10);
      expect(seed6?.losses).toBe(7);
    });

    it('should have Dolphins (9-8) as AFC 7 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed7 = standings.find(s => s.seed === 7);

      expect(seed7).toBeDefined();
      expect(seed7?.team.id).toBe(EXPECTED_2022_AFC_SEEDINGS[7].teamId);
      expect(seed7?.team.name).toBe('Dolphins');
      expect(seed7?.wins).toBe(9);
      expect(seed7?.losses).toBe(8);
    });

    it('should have 4 division winners in seeds 1-4', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);

      expect(divisionWinners.length).toBe(4);

      // Each should be from a different division
      const divisions = new Set(divisionWinners.map(s => s.team.division));
      expect(divisions.size).toBe(4);
      expect(divisions.has('AFC East')).toBe(true);
      expect(divisions.has('AFC North')).toBe(true);
      expect(divisions.has('AFC South')).toBe(true);
      expect(divisions.has('AFC West')).toBe(true);
    });
  });

  describe('2022 NFC Playoff Seeding Verification', () => {
    it('should produce exactly 7 playoff teams for NFC', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);
    });

    it('should have Eagles (14-3) as NFC 1 seed', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed1 = standings.find(s => s.seed === 1);

      expect(seed1).toBeDefined();
      expect(seed1?.team.id).toBe(EXPECTED_2022_NFC_SEEDINGS[1].teamId);
      expect(seed1?.team.name).toBe('Eagles');
      expect(seed1?.wins).toBe(14);
      expect(seed1?.losses).toBe(3);
    });

    // BUG: Our system produces Vikings(2), 49ers(3). NFL had 49ers(2), Vikings(3).
    // This test expects the CORRECT NFL result and will FAIL until the bug is fixed.
    // See REGRESSION_ERRORS_CHECKLIST.md - 2022 Error #2
    it('should have 49ers (13-4) as NFC 2 seed', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed2 = standings.find(s => s.seed === 2);

      expect(seed2).toBeDefined();
      expect(seed2?.team.id).toBe(EXPECTED_2022_NFC_SEEDINGS[2].teamId);
      expect(seed2?.team.name).toBe('49ers');
      expect(seed2?.wins).toBe(13);
      expect(seed2?.losses).toBe(4);
    });

    it('should have Vikings (13-4) as NFC 3 seed', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed3 = standings.find(s => s.seed === 3);

      expect(seed3).toBeDefined();
      expect(seed3?.team.id).toBe(EXPECTED_2022_NFC_SEEDINGS[3].teamId);
      expect(seed3?.team.name).toBe('Vikings');
      expect(seed3?.wins).toBe(13);
      expect(seed3?.losses).toBe(4);
    });

    it('should have Buccaneers (8-9) as NFC 4 seed (NFC South winner)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed4 = standings.find(s => s.seed === 4);

      expect(seed4).toBeDefined();
      expect(seed4?.team.id).toBe(EXPECTED_2022_NFC_SEEDINGS[4].teamId);
      expect(seed4?.team.name).toBe('Buccaneers');
      expect(seed4?.wins).toBe(8);
      expect(seed4?.losses).toBe(9);
    });

    it('should have Cowboys (12-5) as NFC 5 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed5 = standings.find(s => s.seed === 5);

      expect(seed5).toBeDefined();
      expect(seed5?.team.id).toBe(EXPECTED_2022_NFC_SEEDINGS[5].teamId);
      expect(seed5?.team.name).toBe('Cowboys');
      expect(seed5?.wins).toBe(12);
      expect(seed5?.losses).toBe(5);
    });

    it('should have Giants (9-7-1) as NFC 6 seed (wild card with tie)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed6 = standings.find(s => s.seed === 6);

      expect(seed6).toBeDefined();
      expect(seed6?.team.id).toBe(EXPECTED_2022_NFC_SEEDINGS[6].teamId);
      expect(seed6?.team.name).toBe('Giants');
      expect(seed6?.wins).toBe(9);
      expect(seed6?.losses).toBe(7);
      expect(seed6?.ties).toBe(1);
    });

    // BUG: Our system puts Lions at NFC 7 instead of Seahawks. Seahawks have seed=null.
    // This is a more serious bug that needs investigation.
    // See REGRESSION_ERRORS_CHECKLIST.md - 2022 Error #3
    it('should have Seahawks (9-8) as NFC 7 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed7 = standings.find(s => s.seed === 7);

      expect(seed7).toBeDefined();
      expect(seed7?.team.id).toBe(EXPECTED_2022_NFC_SEEDINGS[7].teamId);
      expect(seed7?.team.name).toBe('Seahawks');
      expect(seed7?.wins).toBe(9);
      expect(seed7?.losses).toBe(8);
    });

    it('should have 4 division winners in seeds 1-4', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);

      expect(divisionWinners.length).toBe(4);

      // Each should be from a different division
      const divisions = new Set(divisionWinners.map(s => s.team.division));
      expect(divisions.size).toBe(4);
      expect(divisions.has('NFC East')).toBe(true);
      expect(divisions.has('NFC North')).toBe(true);
      expect(divisions.has('NFC South')).toBe(true);
      expect(divisions.has('NFC West')).toBe(true);
    });
  });

  describe('2022 Notable Tiebreaker Scenarios', () => {
    // BUG: Our system produces Ravens(5), Chargers(6). NFL had Chargers(5), Ravens(6).
    // See REGRESSION_ERRORS_CHECKLIST.md - 2022 Error #1
    it('should correctly order Chargers over Ravens for AFC 5/6 seeds (both 10-7)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      const chargers = standings.find(s => s.team.id === '16');
      const ravens = standings.find(s => s.team.id === '5');

      expect(chargers).toBeDefined();
      expect(ravens).toBeDefined();

      // Both should be 10-7
      expect(chargers?.wins).toBe(10);
      expect(chargers?.losses).toBe(7);
      expect(ravens?.wins).toBe(10);
      expect(ravens?.losses).toBe(7);

      // Chargers should have better seed (5 < 6)
      expect(chargers?.seed).toBe(5);
      expect(ravens?.seed).toBe(6);
    });

    // BUG: Our system produces Vikings(2), 49ers(3). NFL had 49ers(2), Vikings(3).
    // See REGRESSION_ERRORS_CHECKLIST.md - 2022 Error #2
    it('should correctly order 49ers over Vikings for NFC 2/3 seeds (both 13-4 division winners)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      const niners = standings.find(s => s.team.id === '31');
      const vikings = standings.find(s => s.team.id === '24');

      expect(niners).toBeDefined();
      expect(vikings).toBeDefined();

      // Both should be 13-4
      expect(niners?.wins).toBe(13);
      expect(niners?.losses).toBe(4);
      expect(vikings?.wins).toBe(13);
      expect(vikings?.losses).toBe(4);

      // 49ers should have better seed (2 < 3)
      expect(niners?.seed).toBe(2);
      expect(vikings?.seed).toBe(3);
    });

    it('should have Buccaneers (8-9) as NFC 4 seed despite sub-.500 record (weak division)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      const buccaneers = standings.find(s => s.team.id === '28');

      expect(buccaneers?.wins).toBe(8);
      expect(buccaneers?.losses).toBe(9);
      expect(buccaneers?.seed).toBe(4);

      // Buccaneers have worse record than wild cards
      const cowboys = standings.find(s => s.team.id === '17');
      const giants = standings.find(s => s.team.id === '18');
      const seahawks = standings.find(s => s.team.id === '32');
      expect(buccaneers!.wins).toBeLessThan(cowboys!.wins);
      expect(buccaneers!.wins).toBeLessThan(giants!.wins);
      expect(buccaneers!.wins).toBeLessThan(seahawks!.wins);
    });

    // BUG: Our system has Seahawks not making playoffs (seed=null).
    // NFL had Giants(6), Seahawks(7). This needs investigation.
    // See REGRESSION_ERRORS_CHECKLIST.md - 2022 Error #3
    it('should have Giants (9-7-1 with tie) as wild card ahead of Seahawks (9-8)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      const giants = standings.find(s => s.team.id === '18');
      const seahawks = standings.find(s => s.team.id === '32');

      // Giants: 9-7-1 with tie
      expect(giants?.wins).toBe(9);
      expect(giants?.losses).toBe(7);
      expect(giants?.ties).toBe(1);

      // Seahawks: 9-8
      expect(seahawks?.wins).toBe(9);
      expect(seahawks?.losses).toBe(8);

      // Giants have better winning percentage: 9.5/17 vs 9/17
      expect(giants?.seed).toBe(6);
      expect(seahawks?.seed).toBe(7);
    });

    it('should correctly handle cancelled Bengals-Bills game (13-3 Bills over 12-4 Bengals)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      const bills = standings.find(s => s.team.id === '1');
      const bengals = standings.find(s => s.team.id === '6');

      // Bills: 13-3 (cancelled game not counted)
      expect(bills?.wins).toBe(13);
      expect(bills?.losses).toBe(3);

      // Bengals: 12-4
      expect(bengals?.wins).toBe(12);
      expect(bengals?.losses).toBe(4);

      // Bills should have better seed (2 < 3)
      expect(bills?.seed).toBe(2);
      expect(bengals?.seed).toBe(3);
    });
  });

  describe('Record Calculation Verification', () => {
    it('should calculate correct records for all teams', () => {
      const allTeams = [...afcTeams, ...nfcTeams];
      const records = calculateTeamRecords(allTeams, games, {});

      // Verify Chiefs are 14-3
      const chiefsRecord = records.get('14');
      expect(chiefsRecord?.wins).toBe(14);
      expect(chiefsRecord?.losses).toBe(3);

      // Verify Eagles are 14-3
      const eaglesRecord = records.get('19');
      expect(eaglesRecord?.wins).toBe(14);
      expect(eaglesRecord?.losses).toBe(3);

      // Verify 49ers are 13-4
      const ninersRecord = records.get('31');
      expect(ninersRecord?.wins).toBe(13);
      expect(ninersRecord?.losses).toBe(4);

      // Verify Giants are 9-7-1 (with tie)
      const giantsRecord = records.get('18');
      expect(giantsRecord?.wins).toBe(9);
      expect(giantsRecord?.losses).toBe(7);
      expect(giantsRecord?.ties).toBe(1);
    });

    it('should have correct total wins and losses (including tie and cancelled game)', () => {
      const allTeams = [...afcTeams, ...nfcTeams];
      const records = calculateTeamRecords(allTeams, games, {});

      let totalWins = 0;
      let totalLosses = 0;
      let totalTies = 0;

      for (const record of records.values()) {
        totalWins += record.wins;
        totalLosses += record.losses;
        totalTies += record.ties;
      }

      // 272 games total but:
      // - CIN-BUF cancelled (0-0, treated as tie by our system - needs verification)
      // - HOU-IND Week 1 was 20-20 (actual tie)
      // Total wins = total losses = 271 (one tie), or 272 if cancelled game not counted
      // Total ties = 2 (one real, one cancelled)
      expect(totalWins).toBeLessThanOrEqual(272);
      expect(totalLosses).toBeLessThanOrEqual(272);
      expect(totalWins).toBe(totalLosses);
    });
  });

  describe('Division Winner Determination', () => {
    it('should correctly identify AFC East winner as Bills', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcEastWinner = standings.find(
        s => s.team.division === 'AFC East' && s.seed !== null && s.seed <= 4
      );

      expect(afcEastWinner?.team.id).toBe('1'); // Bills
      expect(afcEastWinner?.team.name).toBe('Bills');
    });

    it('should correctly identify AFC North winner as Bengals', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcNorthWinner = standings.find(
        s => s.team.division === 'AFC North' && s.seed !== null && s.seed <= 4
      );

      expect(afcNorthWinner?.team.id).toBe('6'); // Bengals
      expect(afcNorthWinner?.team.name).toBe('Bengals');
    });

    it('should correctly identify AFC South winner as Jaguars', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcSouthWinner = standings.find(
        s => s.team.division === 'AFC South' && s.seed !== null && s.seed <= 4
      );

      expect(afcSouthWinner?.team.id).toBe('11'); // Jaguars
      expect(afcSouthWinner?.team.name).toBe('Jaguars');
    });

    it('should correctly identify AFC West winner as Chiefs', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcWestWinner = standings.find(
        s => s.team.division === 'AFC West' && s.seed !== null && s.seed <= 4
      );

      expect(afcWestWinner?.team.id).toBe('14'); // Chiefs
      expect(afcWestWinner?.team.name).toBe('Chiefs');
    });

    it('should correctly identify NFC East winner as Eagles', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcEastWinner = standings.find(
        s => s.team.division === 'NFC East' && s.seed !== null && s.seed <= 4
      );

      expect(nfcEastWinner?.team.id).toBe('19'); // Eagles
      expect(nfcEastWinner?.team.name).toBe('Eagles');
    });

    it('should correctly identify NFC North winner as Vikings', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcNorthWinner = standings.find(
        s => s.team.division === 'NFC North' && s.seed !== null && s.seed <= 4
      );

      expect(nfcNorthWinner?.team.id).toBe('24'); // Vikings
      expect(nfcNorthWinner?.team.name).toBe('Vikings');
    });

    it('should correctly identify NFC South winner as Buccaneers', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcSouthWinner = standings.find(
        s => s.team.division === 'NFC South' && s.seed !== null && s.seed <= 4
      );

      expect(nfcSouthWinner?.team.id).toBe('28'); // Buccaneers
      expect(nfcSouthWinner?.team.name).toBe('Buccaneers');
    });

    it('should correctly identify NFC West winner as 49ers', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcWestWinner = standings.find(
        s => s.team.division === 'NFC West' && s.seed !== null && s.seed <= 4
      );

      expect(nfcWestWinner?.team.id).toBe('31'); // 49ers
      expect(nfcWestWinner?.team.name).toBe('49ers');
    });
  });

  describe('Complete Seeding Order Verification', () => {
    it('should match exact AFC playoff seeding order', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      for (let seed = 1; seed <= 7; seed++) {
        const teamStanding = standings.find(s => s.seed === seed);
        const expected = EXPECTED_2022_AFC_SEEDINGS[seed as keyof typeof EXPECTED_2022_AFC_SEEDINGS];

        expect(teamStanding?.team.id).toBe(expected.teamId);
      }
    });

    it('should match exact NFC playoff seeding order', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      for (let seed = 1; seed <= 7; seed++) {
        const teamStanding = standings.find(s => s.seed === seed);
        const expected = EXPECTED_2022_NFC_SEEDINGS[seed as keyof typeof EXPECTED_2022_NFC_SEEDINGS];

        expect(teamStanding?.team.id).toBe(expected.teamId);
      }
    });
  });
});

describe('Phase 16: 2021 NFL Season Historical Regression Tests', () => {
  let games: Game[];
  let afcTeams: Team[];
  let nfcTeams: Team[];

  beforeAll(() => {
    games = fixtureToGames(SEASON_2021_GAMES);
    afcTeams = getTeamsByConference('AFC');
    nfcTeams = getTeamsByConference('NFC');
  });

  describe('Data Validation', () => {
    it('should have loaded all 272 games', () => {
      expect(games.length).toBe(272);
    });

    it('should have 16 AFC teams', () => {
      expect(afcTeams.length).toBe(16);
    });

    it('should have 16 NFC teams', () => {
      expect(nfcTeams.length).toBe(16);
    });

    it('should have all games with scores (including PIT-DET tie)', () => {
      // Note: Week 10 PIT vs DET ended in a 16-16 tie
      const gamesWithScores = games.filter(
        g => g.homeScore !== null && g.awayScore !== null
      );
      expect(gamesWithScores.length).toBe(272);
    });
  });

  describe('2021 AFC Playoff Seeding Verification', () => {
    it('should produce exactly 7 playoff teams for AFC', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);
    });

    it('should have Titans (12-5) as AFC 1 seed', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed1 = standings.find(s => s.seed === 1);

      expect(seed1).toBeDefined();
      expect(seed1?.team.id).toBe(EXPECTED_2021_AFC_SEEDINGS[1].teamId);
      expect(seed1?.team.name).toBe('Titans');
      expect(seed1?.wins).toBe(12);
      expect(seed1?.losses).toBe(5);
    });

    it('should have Chiefs (12-5) as AFC 2 seed', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed2 = standings.find(s => s.seed === 2);

      expect(seed2).toBeDefined();
      expect(seed2?.team.id).toBe(EXPECTED_2021_AFC_SEEDINGS[2].teamId);
      expect(seed2?.team.name).toBe('Chiefs');
      expect(seed2?.wins).toBe(12);
      expect(seed2?.losses).toBe(5);
    });

    it('should have Bills (11-6) as AFC 3 seed', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed3 = standings.find(s => s.seed === 3);

      expect(seed3).toBeDefined();
      expect(seed3?.team.id).toBe(EXPECTED_2021_AFC_SEEDINGS[3].teamId);
      expect(seed3?.team.name).toBe('Bills');
      expect(seed3?.wins).toBe(11);
      expect(seed3?.losses).toBe(6);
    });

    it('should have Bengals (10-7) as AFC 4 seed (AFC North winner)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed4 = standings.find(s => s.seed === 4);

      expect(seed4).toBeDefined();
      expect(seed4?.team.id).toBe(EXPECTED_2021_AFC_SEEDINGS[4].teamId);
      expect(seed4?.team.name).toBe('Bengals');
      expect(seed4?.wins).toBe(10);
      expect(seed4?.losses).toBe(7);
    });

    // BUG: Our system produces team '3' at seed 5 instead of Raiders.
    // This test expects the CORRECT NFL result and will FAIL until the bug is fixed.
    // See REGRESSION_ERRORS_CHECKLIST.md - 2021 Error #1
    it('should have Raiders (10-7) as AFC 5 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed5 = standings.find(s => s.seed === 5);

      expect(seed5).toBeDefined();
      expect(seed5?.team.id).toBe(EXPECTED_2021_AFC_SEEDINGS[5].teamId);
      expect(seed5?.team.name).toBe('Raiders');
      expect(seed5?.wins).toBe(10);
      expect(seed5?.losses).toBe(7);
    });

    // BUG: Our system produces Raiders at seed 6 instead of Patriots.
    // See REGRESSION_ERRORS_CHECKLIST.md - 2021 Error #1
    it('should have Patriots (10-7) as AFC 6 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed6 = standings.find(s => s.seed === 6);

      expect(seed6).toBeDefined();
      expect(seed6?.team.id).toBe(EXPECTED_2021_AFC_SEEDINGS[6].teamId);
      expect(seed6?.team.name).toBe('Patriots');
      expect(seed6?.wins).toBe(10);
      expect(seed6?.losses).toBe(7);
    });

    it('should have Steelers (9-7-1) as AFC 7 seed (wild card with tie)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed7 = standings.find(s => s.seed === 7);

      expect(seed7).toBeDefined();
      expect(seed7?.team.id).toBe(EXPECTED_2021_AFC_SEEDINGS[7].teamId);
      expect(seed7?.team.name).toBe('Steelers');
      expect(seed7?.wins).toBe(9);
      expect(seed7?.losses).toBe(7);
      expect(seed7?.ties).toBe(1);
    });

    it('should have 4 division winners in seeds 1-4', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);

      expect(divisionWinners.length).toBe(4);

      // Each should be from a different division
      const divisions = new Set(divisionWinners.map(s => s.team.division));
      expect(divisions.size).toBe(4);
      expect(divisions.has('AFC East')).toBe(true);
      expect(divisions.has('AFC North')).toBe(true);
      expect(divisions.has('AFC South')).toBe(true);
      expect(divisions.has('AFC West')).toBe(true);
    });
  });

  describe('2021 NFC Playoff Seeding Verification', () => {
    it('should produce exactly 7 playoff teams for NFC', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);
    });

    it('should have Packers (13-4) as NFC 1 seed', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed1 = standings.find(s => s.seed === 1);

      expect(seed1).toBeDefined();
      expect(seed1?.team.id).toBe(EXPECTED_2021_NFC_SEEDINGS[1].teamId);
      expect(seed1?.team.name).toBe('Packers');
      expect(seed1?.wins).toBe(13);
      expect(seed1?.losses).toBe(4);
    });

    it('should have Buccaneers (13-4) as NFC 2 seed', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed2 = standings.find(s => s.seed === 2);

      expect(seed2).toBeDefined();
      expect(seed2?.team.id).toBe(EXPECTED_2021_NFC_SEEDINGS[2].teamId);
      expect(seed2?.team.name).toBe('Buccaneers');
      expect(seed2?.wins).toBe(13);
      expect(seed2?.losses).toBe(4);
    });

    it('should have Cowboys (12-5) as NFC 3 seed', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed3 = standings.find(s => s.seed === 3);

      expect(seed3).toBeDefined();
      expect(seed3?.team.id).toBe(EXPECTED_2021_NFC_SEEDINGS[3].teamId);
      expect(seed3?.team.name).toBe('Cowboys');
      expect(seed3?.wins).toBe(12);
      expect(seed3?.losses).toBe(5);
    });

    it('should have Rams (12-5) as NFC 4 seed (NFC West winner)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed4 = standings.find(s => s.seed === 4);

      expect(seed4).toBeDefined();
      expect(seed4?.team.id).toBe(EXPECTED_2021_NFC_SEEDINGS[4].teamId);
      expect(seed4?.team.name).toBe('Rams');
      expect(seed4?.wins).toBe(12);
      expect(seed4?.losses).toBe(5);
    });

    // BUG: Our system produces team '29' at seed 5 instead of Cardinals ('27').
    // This test expects the CORRECT NFL result and will FAIL until the bug is fixed.
    // See REGRESSION_ERRORS_CHECKLIST.md - 2021 Error #2
    it('should have Cardinals (11-6) as NFC 5 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed5 = standings.find(s => s.seed === 5);

      expect(seed5).toBeDefined();
      expect(seed5?.team.id).toBe(EXPECTED_2021_NFC_SEEDINGS[5].teamId);
      expect(seed5?.team.name).toBe('Cardinals');
      expect(seed5?.wins).toBe(11);
      expect(seed5?.losses).toBe(6);
    });

    it('should have 49ers (10-7) as NFC 6 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed6 = standings.find(s => s.seed === 6);

      expect(seed6).toBeDefined();
      expect(seed6?.team.id).toBe(EXPECTED_2021_NFC_SEEDINGS[6].teamId);
      expect(seed6?.team.name).toBe('49ers');
      expect(seed6?.wins).toBe(10);
      expect(seed6?.losses).toBe(7);
    });

    it('should have Eagles (9-8) as NFC 7 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed7 = standings.find(s => s.seed === 7);

      expect(seed7).toBeDefined();
      expect(seed7?.team.id).toBe(EXPECTED_2021_NFC_SEEDINGS[7].teamId);
      expect(seed7?.team.name).toBe('Eagles');
      expect(seed7?.wins).toBe(9);
      expect(seed7?.losses).toBe(8);
    });

    it('should have 4 division winners in seeds 1-4', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);

      expect(divisionWinners.length).toBe(4);

      // Each should be from a different division
      const divisions = new Set(divisionWinners.map(s => s.team.division));
      expect(divisions.size).toBe(4);
      expect(divisions.has('NFC East')).toBe(true);
      expect(divisions.has('NFC North')).toBe(true);
      expect(divisions.has('NFC South')).toBe(true);
      expect(divisions.has('NFC West')).toBe(true);
    });
  });

  describe('2021 Notable Tiebreaker Scenarios', () => {
    it('should correctly order Titans over Chiefs for AFC 1/2 seeds (both 12-5 division winners)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      const titans = standings.find(s => s.team.id === '12');
      const chiefs = standings.find(s => s.team.id === '14');

      expect(titans).toBeDefined();
      expect(chiefs).toBeDefined();

      // Both should be 12-5
      expect(titans?.wins).toBe(12);
      expect(titans?.losses).toBe(5);
      expect(chiefs?.wins).toBe(12);
      expect(chiefs?.losses).toBe(5);

      // Titans should have better seed (1 < 2)
      expect(titans?.seed).toBe(1);
      expect(chiefs?.seed).toBe(2);
    });

    it('should correctly order three 10-7 AFC teams (Bengals div winner, Raiders/Patriots wild cards)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      const raiders = standings.find(s => s.team.id === '15');
      const patriots = standings.find(s => s.team.id === '3');  // Patriots = '3'
      const bengals = standings.find(s => s.team.id === '6');

      // All should be 10-7
      expect(raiders?.wins).toBe(10);
      expect(raiders?.losses).toBe(7);
      expect(patriots?.wins).toBe(10);
      expect(patriots?.losses).toBe(7);
      expect(bengals?.wins).toBe(10);
      expect(bengals?.losses).toBe(7);

      // Bengals win division (seed 4), Raiders (seed 5), Patriots (seed 6)
      expect(bengals?.seed).toBe(4);
      expect(raiders?.seed).toBe(5);
      expect(patriots?.seed).toBe(6);
    });

    it('should correctly order Packers over Buccaneers for NFC 1/2 seeds (both 13-4 division winners)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      const packers = standings.find(s => s.team.id === '23');
      const buccaneers = standings.find(s => s.team.id === '28');

      expect(packers).toBeDefined();
      expect(buccaneers).toBeDefined();

      // Both should be 13-4
      expect(packers?.wins).toBe(13);
      expect(packers?.losses).toBe(4);
      expect(buccaneers?.wins).toBe(13);
      expect(buccaneers?.losses).toBe(4);

      // Packers should have better seed (1 < 2)
      expect(packers?.seed).toBe(1);
      expect(buccaneers?.seed).toBe(2);
    });

    it('should correctly order Cowboys over Rams for NFC 3/4 seeds (both 12-5 division winners)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      const cowboys = standings.find(s => s.team.id === '17');
      const rams = standings.find(s => s.team.id === '30');

      expect(cowboys).toBeDefined();
      expect(rams).toBeDefined();

      // Both should be 12-5
      expect(cowboys?.wins).toBe(12);
      expect(cowboys?.losses).toBe(5);
      expect(rams?.wins).toBe(12);
      expect(rams?.losses).toBe(5);

      // Cowboys should have better seed (3 < 4)
      expect(cowboys?.seed).toBe(3);
      expect(rams?.seed).toBe(4);
    });

    it('should have Steelers (9-7-1 with tie) as AFC 7 seed', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      const steelers = standings.find(s => s.team.id === '8');

      // Steelers: 9-7-1 with tie (vs Lions Week 10)
      expect(steelers?.wins).toBe(9);
      expect(steelers?.losses).toBe(7);
      expect(steelers?.ties).toBe(1);
      expect(steelers?.seed).toBe(7);
    });

    it('should have Eagles (9-8) over Saints (9-8) for NFC 7 seed', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      const eagles = standings.find(s => s.team.id === '19');
      const saints = standings.find(s => s.team.id === '27');  // Saints = '27'

      // Both should be 9-8
      expect(eagles?.wins).toBe(9);
      expect(eagles?.losses).toBe(8);
      expect(saints?.wins).toBe(9);
      expect(saints?.losses).toBe(8);

      // Eagles should make playoffs, Saints should not
      expect(eagles?.seed).toBe(7);
      expect(saints?.seed).toBe(null);
    });
  });

  describe('Record Calculation Verification', () => {
    it('should calculate correct records for all teams', () => {
      const allTeams = [...afcTeams, ...nfcTeams];
      const records = calculateTeamRecords(allTeams, games, {});

      // Verify Packers are 13-4
      const packersRecord = records.get('23');
      expect(packersRecord?.wins).toBe(13);
      expect(packersRecord?.losses).toBe(4);

      // Verify Buccaneers are 13-4
      const buccaneersRecord = records.get('28');
      expect(buccaneersRecord?.wins).toBe(13);
      expect(buccaneersRecord?.losses).toBe(4);

      // Verify Titans are 12-5
      const titansRecord = records.get('12');
      expect(titansRecord?.wins).toBe(12);
      expect(titansRecord?.losses).toBe(5);

      // Verify Steelers are 9-7-1 (with tie)
      const steelersRecord = records.get('8');
      expect(steelersRecord?.wins).toBe(9);
      expect(steelersRecord?.losses).toBe(7);
      expect(steelersRecord?.ties).toBe(1);
    });

    it('should have correct total wins and losses (including tie)', () => {
      const allTeams = [...afcTeams, ...nfcTeams];
      const records = calculateTeamRecords(allTeams, games, {});

      let totalWins = 0;
      let totalLosses = 0;
      let totalTies = 0;

      for (const record of records.values()) {
        totalWins += record.wins;
        totalLosses += record.losses;
        totalTies += record.ties;
      }

      // 272 games, but one ended in a tie (PIT-DET Week 10)
      // Total wins = total losses = 271, totalTies = 2 (each team gets one tie)
      expect(totalWins).toBe(271);
      expect(totalLosses).toBe(271);
      expect(totalTies).toBe(2);
    });
  });

  describe('Division Winner Determination', () => {
    it('should correctly identify AFC East winner as Bills', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcEastWinner = standings.find(
        s => s.team.division === 'AFC East' && s.seed !== null && s.seed <= 4
      );

      expect(afcEastWinner?.team.id).toBe('1'); // Bills
      expect(afcEastWinner?.team.name).toBe('Bills');
    });

    it('should correctly identify AFC North winner as Bengals', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcNorthWinner = standings.find(
        s => s.team.division === 'AFC North' && s.seed !== null && s.seed <= 4
      );

      expect(afcNorthWinner?.team.id).toBe('6'); // Bengals
      expect(afcNorthWinner?.team.name).toBe('Bengals');
    });

    it('should correctly identify AFC South winner as Titans', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcSouthWinner = standings.find(
        s => s.team.division === 'AFC South' && s.seed !== null && s.seed <= 4
      );

      expect(afcSouthWinner?.team.id).toBe('12'); // Titans
      expect(afcSouthWinner?.team.name).toBe('Titans');
    });

    it('should correctly identify AFC West winner as Chiefs', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcWestWinner = standings.find(
        s => s.team.division === 'AFC West' && s.seed !== null && s.seed <= 4
      );

      expect(afcWestWinner?.team.id).toBe('14'); // Chiefs
      expect(afcWestWinner?.team.name).toBe('Chiefs');
    });

    it('should correctly identify NFC East winner as Cowboys', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcEastWinner = standings.find(
        s => s.team.division === 'NFC East' && s.seed !== null && s.seed <= 4
      );

      expect(nfcEastWinner?.team.id).toBe('17'); // Cowboys
      expect(nfcEastWinner?.team.name).toBe('Cowboys');
    });

    it('should correctly identify NFC North winner as Packers', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcNorthWinner = standings.find(
        s => s.team.division === 'NFC North' && s.seed !== null && s.seed <= 4
      );

      expect(nfcNorthWinner?.team.id).toBe('23'); // Packers
      expect(nfcNorthWinner?.team.name).toBe('Packers');
    });

    it('should correctly identify NFC South winner as Buccaneers', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcSouthWinner = standings.find(
        s => s.team.division === 'NFC South' && s.seed !== null && s.seed <= 4
      );

      expect(nfcSouthWinner?.team.id).toBe('28'); // Buccaneers
      expect(nfcSouthWinner?.team.name).toBe('Buccaneers');
    });

    it('should correctly identify NFC West winner as Rams', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcWestWinner = standings.find(
        s => s.team.division === 'NFC West' && s.seed !== null && s.seed <= 4
      );

      expect(nfcWestWinner?.team.id).toBe('30'); // Rams
      expect(nfcWestWinner?.team.name).toBe('Rams');
    });
  });

  describe('Complete Seeding Order Verification', () => {
    it('should match exact AFC playoff seeding order', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      for (let seed = 1; seed <= 7; seed++) {
        const teamStanding = standings.find(s => s.seed === seed);
        const expected = EXPECTED_2021_AFC_SEEDINGS[seed as keyof typeof EXPECTED_2021_AFC_SEEDINGS];

        expect(teamStanding?.team.id).toBe(expected.teamId);
      }
    });

    it('should match exact NFC playoff seeding order', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      for (let seed = 1; seed <= 7; seed++) {
        const teamStanding = standings.find(s => s.seed === seed);
        const expected = EXPECTED_2021_NFC_SEEDINGS[seed as keyof typeof EXPECTED_2021_NFC_SEEDINGS];

        expect(teamStanding?.team.id).toBe(expected.teamId);
      }
    });
  });
});

describe('Phase 16: 2020 NFL Season Historical Regression Tests', () => {
  let games: Game[];
  let afcTeams: Team[];
  let nfcTeams: Team[];

  beforeAll(() => {
    games = fixtureToGames(SEASON_2020_GAMES);
    afcTeams = getTeamsByConference('AFC');
    nfcTeams = getTeamsByConference('NFC');
  });

  describe('Data Validation', () => {
    it('should have loaded all 256 games (17-week season)', () => {
      expect(games.length).toBe(256);
    });

    it('should have 16 AFC teams', () => {
      expect(afcTeams.length).toBe(16);
    });

    it('should have 16 NFC teams', () => {
      expect(nfcTeams.length).toBe(16);
    });

    it('should have all games with scores (including PHI-CIN tie)', () => {
      // Note: Week 3 PHI vs CIN ended in a 23-23 tie
      const gamesWithScores = games.filter(
        g => g.homeScore !== null && g.awayScore !== null
      );
      expect(gamesWithScores.length).toBe(256);
    });
  });

  describe('2020 AFC Playoff Seeding Verification', () => {
    it('should produce exactly 7 playoff teams for AFC', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);
    });

    it('should have Chiefs (14-2) as AFC 1 seed', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed1 = standings.find(s => s.seed === 1);

      expect(seed1).toBeDefined();
      expect(seed1?.team.id).toBe(EXPECTED_2020_AFC_SEEDINGS[1].teamId);
      expect(seed1?.team.name).toBe('Chiefs');
      expect(seed1?.wins).toBe(14);
      expect(seed1?.losses).toBe(2);
    });

    it('should have Bills (13-3) as AFC 2 seed', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed2 = standings.find(s => s.seed === 2);

      expect(seed2).toBeDefined();
      expect(seed2?.team.id).toBe(EXPECTED_2020_AFC_SEEDINGS[2].teamId);
      expect(seed2?.team.name).toBe('Bills');
      expect(seed2?.wins).toBe(13);
      expect(seed2?.losses).toBe(3);
    });

    it('should have Steelers (12-4) as AFC 3 seed', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed3 = standings.find(s => s.seed === 3);

      expect(seed3).toBeDefined();
      expect(seed3?.team.id).toBe(EXPECTED_2020_AFC_SEEDINGS[3].teamId);
      expect(seed3?.team.name).toBe('Steelers');
      expect(seed3?.wins).toBe(12);
      expect(seed3?.losses).toBe(4);
    });

    it('should have Titans (11-5) as AFC 4 seed (AFC South winner)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed4 = standings.find(s => s.seed === 4);

      expect(seed4).toBeDefined();
      expect(seed4?.team.id).toBe(EXPECTED_2020_AFC_SEEDINGS[4].teamId);
      expect(seed4?.team.name).toBe('Titans');
      expect(seed4?.wins).toBe(11);
      expect(seed4?.losses).toBe(5);
    });

    it('should have Ravens (11-5) as AFC 5 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed5 = standings.find(s => s.seed === 5);

      expect(seed5).toBeDefined();
      expect(seed5?.team.id).toBe(EXPECTED_2020_AFC_SEEDINGS[5].teamId);
      expect(seed5?.team.name).toBe('Ravens');
      expect(seed5?.wins).toBe(11);
      expect(seed5?.losses).toBe(5);
    });

    it('should have Browns (11-5) as AFC 6 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed6 = standings.find(s => s.seed === 6);

      expect(seed6).toBeDefined();
      expect(seed6?.team.id).toBe(EXPECTED_2020_AFC_SEEDINGS[6].teamId);
      expect(seed6?.team.name).toBe('Browns');
      expect(seed6?.wins).toBe(11);
      expect(seed6?.losses).toBe(5);
    });

    it('should have Colts (11-5) as AFC 7 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const seed7 = standings.find(s => s.seed === 7);

      expect(seed7).toBeDefined();
      expect(seed7?.team.id).toBe(EXPECTED_2020_AFC_SEEDINGS[7].teamId);
      expect(seed7?.team.name).toBe('Colts');
      expect(seed7?.wins).toBe(11);
      expect(seed7?.losses).toBe(5);
    });

    it('should have 4 division winners in seeds 1-4', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);

      expect(divisionWinners.length).toBe(4);

      // Each should be from a different division
      const divisions = new Set(divisionWinners.map(s => s.team.division));
      expect(divisions.size).toBe(4);
      expect(divisions.has('AFC East')).toBe(true);
      expect(divisions.has('AFC North')).toBe(true);
      expect(divisions.has('AFC South')).toBe(true);
      expect(divisions.has('AFC West')).toBe(true);
    });
  });

  describe('2020 NFC Playoff Seeding Verification', () => {
    it('should produce exactly 7 playoff teams for NFC', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const playoffTeams = standings.filter(s => s.seed !== null);
      expect(playoffTeams.length).toBe(7);
    });

    it('should have Packers (13-3) as NFC 1 seed', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed1 = standings.find(s => s.seed === 1);

      expect(seed1).toBeDefined();
      expect(seed1?.team.id).toBe(EXPECTED_2020_NFC_SEEDINGS[1].teamId);
      expect(seed1?.team.name).toBe('Packers');
      expect(seed1?.wins).toBe(13);
      expect(seed1?.losses).toBe(3);
    });

    it('should have Saints (12-4) as NFC 2 seed', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed2 = standings.find(s => s.seed === 2);

      expect(seed2).toBeDefined();
      expect(seed2?.team.id).toBe(EXPECTED_2020_NFC_SEEDINGS[2].teamId);
      expect(seed2?.team.name).toBe('Saints');
      expect(seed2?.wins).toBe(12);
      expect(seed2?.losses).toBe(4);
    });

    it('should have Seahawks (12-4) as NFC 3 seed', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed3 = standings.find(s => s.seed === 3);

      expect(seed3).toBeDefined();
      expect(seed3?.team.id).toBe(EXPECTED_2020_NFC_SEEDINGS[3].teamId);
      expect(seed3?.team.name).toBe('Seahawks');
      expect(seed3?.wins).toBe(12);
      expect(seed3?.losses).toBe(4);
    });

    it('should have Washington (7-9) as NFC 4 seed (NFC East winner)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed4 = standings.find(s => s.seed === 4);

      expect(seed4).toBeDefined();
      expect(seed4?.team.id).toBe(EXPECTED_2020_NFC_SEEDINGS[4].teamId);
      // Note: Team was "Washington Football Team" in 2020, now "Commanders"
      expect(seed4?.wins).toBe(7);
      expect(seed4?.losses).toBe(9);
    });

    it('should have Buccaneers (11-5) as NFC 5 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed5 = standings.find(s => s.seed === 5);

      expect(seed5).toBeDefined();
      expect(seed5?.team.id).toBe(EXPECTED_2020_NFC_SEEDINGS[5].teamId);
      expect(seed5?.team.name).toBe('Buccaneers');
      expect(seed5?.wins).toBe(11);
      expect(seed5?.losses).toBe(5);
    });

    it('should have Rams (10-6) as NFC 6 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed6 = standings.find(s => s.seed === 6);

      expect(seed6).toBeDefined();
      expect(seed6?.team.id).toBe(EXPECTED_2020_NFC_SEEDINGS[6].teamId);
      expect(seed6?.team.name).toBe('Rams');
      expect(seed6?.wins).toBe(10);
      expect(seed6?.losses).toBe(6);
    });

    it('should have Bears (8-8) as NFC 7 seed (wild card)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const seed7 = standings.find(s => s.seed === 7);

      expect(seed7).toBeDefined();
      expect(seed7?.team.id).toBe(EXPECTED_2020_NFC_SEEDINGS[7].teamId);
      expect(seed7?.team.name).toBe('Bears');
      expect(seed7?.wins).toBe(8);
      expect(seed7?.losses).toBe(8);
    });

    it('should have 4 division winners in seeds 1-4', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const divisionWinners = standings.filter(s => s.seed !== null && s.seed <= 4);

      expect(divisionWinners.length).toBe(4);

      // Each should be from a different division
      const divisions = new Set(divisionWinners.map(s => s.team.division));
      expect(divisions.size).toBe(4);
      expect(divisions.has('NFC East')).toBe(true);
      expect(divisions.has('NFC North')).toBe(true);
      expect(divisions.has('NFC South')).toBe(true);
      expect(divisions.has('NFC West')).toBe(true);
    });
  });

  describe('2020 Notable Tiebreaker Scenarios', () => {
    it('should correctly order four 11-5 AFC teams (Titans, Ravens, Browns, Colts)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      const titans = standings.find(s => s.team.id === '12');
      const ravens = standings.find(s => s.team.id === '5');
      const browns = standings.find(s => s.team.id === '7');
      const colts = standings.find(s => s.team.id === '10');

      // All should be 11-5
      expect(titans?.wins).toBe(11);
      expect(titans?.losses).toBe(5);
      expect(ravens?.wins).toBe(11);
      expect(ravens?.losses).toBe(5);
      expect(browns?.wins).toBe(11);
      expect(browns?.losses).toBe(5);
      expect(colts?.wins).toBe(11);
      expect(colts?.losses).toBe(5);

      // NFL seeding order: Titans(4 - division winner), Ravens(5), Browns(6), Colts(7)
      expect(titans?.seed).toBe(4);
      expect(ravens?.seed).toBe(5);
      expect(browns?.seed).toBe(6);
      expect(colts?.seed).toBe(7);
    });

    it('should have Steelers (12-4) ahead of four 11-5 teams', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      const steelers = standings.find(s => s.team.id === '8');
      expect(steelers?.wins).toBe(12);
      expect(steelers?.losses).toBe(4);
      expect(steelers?.seed).toBe(3);
    });

    it('should correctly order Saints over Seahawks for NFC 2/3 seeds (both 12-4 division winners)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      const saints = standings.find(s => s.team.id === '27');
      const seahawks = standings.find(s => s.team.id === '32');

      expect(saints).toBeDefined();
      expect(seahawks).toBeDefined();

      // Both should be 12-4
      expect(saints?.wins).toBe(12);
      expect(saints?.losses).toBe(4);
      expect(seahawks?.wins).toBe(12);
      expect(seahawks?.losses).toBe(4);

      // Saints should have better seed (2 < 3)
      expect(saints?.seed).toBe(2);
      expect(seahawks?.seed).toBe(3);
    });

    it('should have Washington (7-9) as NFC 4 seed despite sub-.500 record (weak NFC East)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      const washington = standings.find(s => s.team.id === '20');

      expect(washington?.wins).toBe(7);
      expect(washington?.losses).toBe(9);
      expect(washington?.seed).toBe(4);

      // Washington has worse record than wild cards
      const buccaneers = standings.find(s => s.team.id === '28');
      const rams = standings.find(s => s.team.id === '30');
      const bears = standings.find(s => s.team.id === '21');
      expect(washington!.wins).toBeLessThan(buccaneers!.wins);
      expect(washington!.wins).toBeLessThan(rams!.wins);
      // Bears at 8-8 also have better record than Washington 7-9
    });

    it('should correctly handle PHI-CIN tie game (Week 3)', () => {
      const allTeams = [...afcTeams, ...nfcTeams];
      const records = calculateTeamRecords(allTeams, games, {});

      // Eagles: 4-11-1
      const eaglesRecord = records.get('19');
      expect(eaglesRecord?.wins).toBe(4);
      expect(eaglesRecord?.losses).toBe(11);
      expect(eaglesRecord?.ties).toBe(1);

      // Bengals: 4-11-1
      const bengalsRecord = records.get('6');
      expect(bengalsRecord?.wins).toBe(4);
      expect(bengalsRecord?.losses).toBe(11);
      expect(bengalsRecord?.ties).toBe(1);
    });

    it('should have Bears (8-8) as NFC 7 seed over Cardinals (8-8)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      const bears = standings.find(s => s.team.id === '21');
      const cardinals = standings.find(s => s.team.id === '29');

      // Both should be 8-8
      expect(bears?.wins).toBe(8);
      expect(bears?.losses).toBe(8);
      expect(cardinals?.wins).toBe(8);
      expect(cardinals?.losses).toBe(8);

      // Bears should make playoffs, Cardinals should not
      expect(bears?.seed).toBe(7);
      expect(cardinals?.seed).toBe(null);
    });
  });

  describe('Record Calculation Verification', () => {
    it('should calculate correct records for all teams', () => {
      const allTeams = [...afcTeams, ...nfcTeams];
      const records = calculateTeamRecords(allTeams, games, {});

      // Verify Chiefs are 14-2
      const chiefsRecord = records.get('14');
      expect(chiefsRecord?.wins).toBe(14);
      expect(chiefsRecord?.losses).toBe(2);

      // Verify Packers are 13-3
      const packersRecord = records.get('23');
      expect(packersRecord?.wins).toBe(13);
      expect(packersRecord?.losses).toBe(3);

      // Verify Bills are 13-3
      const billsRecord = records.get('1');
      expect(billsRecord?.wins).toBe(13);
      expect(billsRecord?.losses).toBe(3);

      // Verify Eagles are 4-11-1 (with tie)
      const eaglesRecord = records.get('19');
      expect(eaglesRecord?.wins).toBe(4);
      expect(eaglesRecord?.losses).toBe(11);
      expect(eaglesRecord?.ties).toBe(1);
    });

    it('should have correct total wins and losses (including tie)', () => {
      const allTeams = [...afcTeams, ...nfcTeams];
      const records = calculateTeamRecords(allTeams, games, {});

      let totalWins = 0;
      let totalLosses = 0;
      let totalTies = 0;

      for (const record of records.values()) {
        totalWins += record.wins;
        totalLosses += record.losses;
        totalTies += record.ties;
      }

      // 256 games, but one ended in a tie (PHI-CIN Week 3)
      // Total wins = total losses = 255, totalTies = 2 (each team gets one tie)
      expect(totalWins).toBe(255);
      expect(totalLosses).toBe(255);
      expect(totalTies).toBe(2);
    });
  });

  describe('Division Winner Determination', () => {
    it('should correctly identify AFC East winner as Bills', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcEastWinner = standings.find(
        s => s.team.division === 'AFC East' && s.seed !== null && s.seed <= 4
      );

      expect(afcEastWinner?.team.id).toBe('1'); // Bills
      expect(afcEastWinner?.team.name).toBe('Bills');
    });

    it('should correctly identify AFC North winner as Steelers', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcNorthWinner = standings.find(
        s => s.team.division === 'AFC North' && s.seed !== null && s.seed <= 4
      );

      expect(afcNorthWinner?.team.id).toBe('8'); // Steelers
      expect(afcNorthWinner?.team.name).toBe('Steelers');
    });

    it('should correctly identify AFC South winner as Titans', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcSouthWinner = standings.find(
        s => s.team.division === 'AFC South' && s.seed !== null && s.seed <= 4
      );

      expect(afcSouthWinner?.team.id).toBe('12'); // Titans
      expect(afcSouthWinner?.team.name).toBe('Titans');
    });

    it('should correctly identify AFC West winner as Chiefs', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});
      const afcWestWinner = standings.find(
        s => s.team.division === 'AFC West' && s.seed !== null && s.seed <= 4
      );

      expect(afcWestWinner?.team.id).toBe('14'); // Chiefs
      expect(afcWestWinner?.team.name).toBe('Chiefs');
    });

    it('should correctly identify NFC East winner as Washington', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcEastWinner = standings.find(
        s => s.team.division === 'NFC East' && s.seed !== null && s.seed <= 4
      );

      expect(nfcEastWinner?.team.id).toBe('20'); // Washington
    });

    it('should correctly identify NFC North winner as Packers', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcNorthWinner = standings.find(
        s => s.team.division === 'NFC North' && s.seed !== null && s.seed <= 4
      );

      expect(nfcNorthWinner?.team.id).toBe('23'); // Packers
      expect(nfcNorthWinner?.team.name).toBe('Packers');
    });

    it('should correctly identify NFC South winner as Saints', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcSouthWinner = standings.find(
        s => s.team.division === 'NFC South' && s.seed !== null && s.seed <= 4
      );

      expect(nfcSouthWinner?.team.id).toBe('27'); // Saints
      expect(nfcSouthWinner?.team.name).toBe('Saints');
    });

    it('should correctly identify NFC West winner as Seahawks', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});
      const nfcWestWinner = standings.find(
        s => s.team.division === 'NFC West' && s.seed !== null && s.seed <= 4
      );

      expect(nfcWestWinner?.team.id).toBe('32'); // Seahawks
      expect(nfcWestWinner?.team.name).toBe('Seahawks');
    });
  });

  describe('Complete Seeding Order Verification', () => {
    it('should match exact AFC playoff seeding order', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      for (let seed = 1; seed <= 7; seed++) {
        const teamStanding = standings.find(s => s.seed === seed);
        const expected = EXPECTED_2020_AFC_SEEDINGS[seed as keyof typeof EXPECTED_2020_AFC_SEEDINGS];

        expect(teamStanding?.team.id).toBe(expected.teamId);
      }
    });

    it('should match exact NFC playoff seeding order', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      for (let seed = 1; seed <= 7; seed++) {
        const teamStanding = standings.find(s => s.seed === seed);
        const expected = EXPECTED_2020_NFC_SEEDINGS[seed as keyof typeof EXPECTED_2020_NFC_SEEDINGS];

        expect(teamStanding?.team.id).toBe(expected.teamId);
      }
    });
  });
});

// =============================================================================
// FULL CONFERENCE STANDINGS VERIFICATION (POSITIONS 8-16)
// =============================================================================
// These tests verify the complete conference standings including non-playoff teams.
// Standings are sorted by overall conference position after playoff seeding.

describe('Full Conference Standings Verification', () => {
  describe('2024 Season Full Conference Standings', () => {
    let games: Game[];
    let afcTeams: Team[];
    let nfcTeams: Team[];

    beforeAll(() => {
      games = fixtureToGames(SEASON_2024_GAMES);
      afcTeams = getTeamsByConference('AFC');
      nfcTeams = getTeamsByConference('NFC');
    });

    it('should match full AFC conference standings (positions 8-16)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      // Standings are sorted with playoff teams (seeds 1-7) first, then non-playoff teams
      // Get non-playoff teams (those without seeds)
      const nonPlayoffTeams = standings.filter(s => s.seed === null);

      // Expected order for positions 8-16 (non-playoff teams)
      const expectedOrder = [
        EXPECTED_2024_AFC_SEEDINGS[8],
        EXPECTED_2024_AFC_SEEDINGS[9],
        EXPECTED_2024_AFC_SEEDINGS[10],
        EXPECTED_2024_AFC_SEEDINGS[11],
        EXPECTED_2024_AFC_SEEDINGS[12],
        EXPECTED_2024_AFC_SEEDINGS[13],
        EXPECTED_2024_AFC_SEEDINGS[14],
        EXPECTED_2024_AFC_SEEDINGS[15],
        EXPECTED_2024_AFC_SEEDINGS[16],
      ];

      expect(nonPlayoffTeams.length).toBe(9);

      for (let i = 0; i < 9; i++) {
        expect(nonPlayoffTeams[i]?.team.id).toBe(expectedOrder[i].teamId);
      }
    });

    it('should match full NFC conference standings (positions 8-16)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      const nonPlayoffTeams = standings.filter(s => s.seed === null);

      const expectedOrder = [
        EXPECTED_2024_NFC_SEEDINGS[8],
        EXPECTED_2024_NFC_SEEDINGS[9],
        EXPECTED_2024_NFC_SEEDINGS[10],
        EXPECTED_2024_NFC_SEEDINGS[11],
        EXPECTED_2024_NFC_SEEDINGS[12],
        EXPECTED_2024_NFC_SEEDINGS[13],
        EXPECTED_2024_NFC_SEEDINGS[14],
        EXPECTED_2024_NFC_SEEDINGS[15],
        EXPECTED_2024_NFC_SEEDINGS[16],
      ];

      expect(nonPlayoffTeams.length).toBe(9);

      for (let i = 0; i < 9; i++) {
        expect(nonPlayoffTeams[i]?.team.id).toBe(expectedOrder[i].teamId);
      }
    });

    it('should have correct complete AFC standings order (all 16 positions)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      // Verify all 16 teams
      for (let pos = 1; pos <= 16; pos++) {
        const expected = EXPECTED_2024_AFC_SEEDINGS[pos as keyof typeof EXPECTED_2024_AFC_SEEDINGS];
        if (pos <= 7) {
          const teamStanding = standings.find(s => s.seed === pos);
          expect(teamStanding?.team.id).toBe(expected.teamId);
        } else {
          const nonPlayoffTeams = standings.filter(s => s.seed === null);
          expect(nonPlayoffTeams[pos - 8]?.team.id).toBe(expected.teamId);
        }
      }
    });

    it('should have correct complete NFC standings order (all 16 positions)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      for (let pos = 1; pos <= 16; pos++) {
        const expected = EXPECTED_2024_NFC_SEEDINGS[pos as keyof typeof EXPECTED_2024_NFC_SEEDINGS];
        if (pos <= 7) {
          const teamStanding = standings.find(s => s.seed === pos);
          expect(teamStanding?.team.id).toBe(expected.teamId);
        } else {
          const nonPlayoffTeams = standings.filter(s => s.seed === null);
          expect(nonPlayoffTeams[pos - 8]?.team.id).toBe(expected.teamId);
        }
      }
    });
  });

  describe('2023 Season Full Conference Standings', () => {
    let games: Game[];
    let afcTeams: Team[];
    let nfcTeams: Team[];

    beforeAll(() => {
      games = fixtureToGames(SEASON_2023_GAMES);
      afcTeams = getTeamsByConference('AFC');
      nfcTeams = getTeamsByConference('NFC');
    });

    it('should have correct complete AFC standings order (all 16 positions)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      for (let pos = 1; pos <= 16; pos++) {
        const expected = EXPECTED_2023_AFC_SEEDINGS[pos as keyof typeof EXPECTED_2023_AFC_SEEDINGS];
        if (pos <= 7) {
          const teamStanding = standings.find(s => s.seed === pos);
          expect(teamStanding?.team.id).toBe(expected.teamId);
        } else {
          const nonPlayoffTeams = standings.filter(s => s.seed === null);
          expect(nonPlayoffTeams[pos - 8]?.team.id).toBe(expected.teamId);
        }
      }
    });

    it('should have correct complete NFC standings order (all 16 positions)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      for (let pos = 1; pos <= 16; pos++) {
        const expected = EXPECTED_2023_NFC_SEEDINGS[pos as keyof typeof EXPECTED_2023_NFC_SEEDINGS];
        if (pos <= 7) {
          const teamStanding = standings.find(s => s.seed === pos);
          expect(teamStanding?.team.id).toBe(expected.teamId);
        } else {
          const nonPlayoffTeams = standings.filter(s => s.seed === null);
          expect(nonPlayoffTeams[pos - 8]?.team.id).toBe(expected.teamId);
        }
      }
    });
  });

  describe('2022 Season Full Conference Standings', () => {
    let games: Game[];
    let afcTeams: Team[];
    let nfcTeams: Team[];

    beforeAll(() => {
      games = fixtureToGames(SEASON_2022_GAMES);
      afcTeams = getTeamsByConference('AFC');
      nfcTeams = getTeamsByConference('NFC');
    });

    it('should have correct complete AFC standings order (all 16 positions)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      for (let pos = 1; pos <= 16; pos++) {
        const expected = EXPECTED_2022_AFC_SEEDINGS[pos as keyof typeof EXPECTED_2022_AFC_SEEDINGS];
        if (pos <= 7) {
          const teamStanding = standings.find(s => s.seed === pos);
          expect(teamStanding?.team.id).toBe(expected.teamId);
        } else {
          const nonPlayoffTeams = standings.filter(s => s.seed === null);
          expect(nonPlayoffTeams[pos - 8]?.team.id).toBe(expected.teamId);
        }
      }
    });

    it('should have correct complete NFC standings order (all 16 positions)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      for (let pos = 1; pos <= 16; pos++) {
        const expected = EXPECTED_2022_NFC_SEEDINGS[pos as keyof typeof EXPECTED_2022_NFC_SEEDINGS];
        if (pos <= 7) {
          const teamStanding = standings.find(s => s.seed === pos);
          expect(teamStanding?.team.id).toBe(expected.teamId);
        } else {
          const nonPlayoffTeams = standings.filter(s => s.seed === null);
          expect(nonPlayoffTeams[pos - 8]?.team.id).toBe(expected.teamId);
        }
      }
    });
  });

  describe('2021 Season Full Conference Standings', () => {
    let games: Game[];
    let afcTeams: Team[];
    let nfcTeams: Team[];

    beforeAll(() => {
      games = fixtureToGames(SEASON_2021_GAMES);
      afcTeams = getTeamsByConference('AFC');
      nfcTeams = getTeamsByConference('NFC');
    });

    it('should have correct complete AFC standings order (all 16 positions)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      for (let pos = 1; pos <= 16; pos++) {
        const expected = EXPECTED_2021_AFC_SEEDINGS[pos as keyof typeof EXPECTED_2021_AFC_SEEDINGS];
        if (pos <= 7) {
          const teamStanding = standings.find(s => s.seed === pos);
          expect(teamStanding?.team.id).toBe(expected.teamId);
        } else {
          const nonPlayoffTeams = standings.filter(s => s.seed === null);
          expect(nonPlayoffTeams[pos - 8]?.team.id).toBe(expected.teamId);
        }
      }
    });

    it('should have correct complete NFC standings order (all 16 positions)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      for (let pos = 1; pos <= 16; pos++) {
        const expected = EXPECTED_2021_NFC_SEEDINGS[pos as keyof typeof EXPECTED_2021_NFC_SEEDINGS];
        if (pos <= 7) {
          const teamStanding = standings.find(s => s.seed === pos);
          expect(teamStanding?.team.id).toBe(expected.teamId);
        } else {
          const nonPlayoffTeams = standings.filter(s => s.seed === null);
          expect(nonPlayoffTeams[pos - 8]?.team.id).toBe(expected.teamId);
        }
      }
    });
  });

  describe('2020 Season Full Conference Standings', () => {
    let games: Game[];
    let afcTeams: Team[];
    let nfcTeams: Team[];

    beforeAll(() => {
      games = fixtureToGames(SEASON_2020_GAMES);
      afcTeams = getTeamsByConference('AFC');
      nfcTeams = getTeamsByConference('NFC');
    });

    it('should have correct complete AFC standings order (all 16 positions)', () => {
      const standings = calculatePlayoffSeedings('AFC', [...afcTeams, ...nfcTeams], games, {});

      for (let pos = 1; pos <= 16; pos++) {
        const expected = EXPECTED_2020_AFC_SEEDINGS[pos as keyof typeof EXPECTED_2020_AFC_SEEDINGS];
        if (pos <= 7) {
          const teamStanding = standings.find(s => s.seed === pos);
          expect(teamStanding?.team.id).toBe(expected.teamId);
        } else {
          const nonPlayoffTeams = standings.filter(s => s.seed === null);
          expect(nonPlayoffTeams[pos - 8]?.team.id).toBe(expected.teamId);
        }
      }
    });

    it('should have correct complete NFC standings order (all 16 positions)', () => {
      const standings = calculatePlayoffSeedings('NFC', [...afcTeams, ...nfcTeams], games, {});

      for (let pos = 1; pos <= 16; pos++) {
        const expected = EXPECTED_2020_NFC_SEEDINGS[pos as keyof typeof EXPECTED_2020_NFC_SEEDINGS];
        if (pos <= 7) {
          const teamStanding = standings.find(s => s.seed === pos);
          expect(teamStanding?.team.id).toBe(expected.teamId);
        } else {
          const nonPlayoffTeams = standings.filter(s => s.seed === null);
          expect(nonPlayoffTeams[pos - 8]?.team.id).toBe(expected.teamId);
        }
      }
    });
  });
});
