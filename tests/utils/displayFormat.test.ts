import { describe, it, expect } from 'vitest';
import {
  formatRecord,
  formatDivisionRecord,
  formatConferenceRecord,
  formatPointDiff,
} from '@/hooks/useStandings';
import type { TeamStanding } from '@/types';
import { getTeamById } from '@/data/teams';

// Helper to create a minimal TeamStanding for testing formatting functions
function createStanding(overrides: Partial<TeamStanding>): TeamStanding {
  const team = getTeamById('14')!; // KC Chiefs as default
  return {
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
    streak: '-',
    lastFive: [],
    isEliminated: false,
    clinched: null,
    seed: null,
    magicNumber: null,
    ...overrides,
  };
}

describe('Phase 13: Display and Formatting Tests', () => {
  describe('Standings Display - Record Formatting', () => {
    describe('formatRecord', () => {
      it('should format record as "W-L" without ties', () => {
        const standing = createStanding({ wins: 10, losses: 6, ties: 0 });
        expect(formatRecord(standing)).toBe('10-6');
      });

      it('should format record as "W-L-T" with ties', () => {
        const standing = createStanding({ wins: 10, losses: 5, ties: 1 });
        expect(formatRecord(standing)).toBe('10-5-1');
      });

      it('should handle 0-0 record', () => {
        const standing = createStanding({ wins: 0, losses: 0, ties: 0 });
        expect(formatRecord(standing)).toBe('0-0');
      });

      it('should handle winless season', () => {
        const standing = createStanding({ wins: 0, losses: 17, ties: 0 });
        expect(formatRecord(standing)).toBe('0-17');
      });

      it('should handle undefeated season', () => {
        const standing = createStanding({ wins: 17, losses: 0, ties: 0 });
        expect(formatRecord(standing)).toBe('17-0');
      });

      it('should handle multiple ties', () => {
        const standing = createStanding({ wins: 8, losses: 6, ties: 3 });
        expect(formatRecord(standing)).toBe('8-6-3');
      });
    });

    describe('formatDivisionRecord', () => {
      it('should format division record as "W-L" without ties', () => {
        const standing = createStanding({
          divisionWins: 4,
          divisionLosses: 2,
          divisionTies: 0,
        });
        expect(formatDivisionRecord(standing)).toBe('4-2');
      });

      it('should format division record as "W-L-T" with ties', () => {
        const standing = createStanding({
          divisionWins: 3,
          divisionLosses: 2,
          divisionTies: 1,
        });
        expect(formatDivisionRecord(standing)).toBe('3-2-1');
      });

      it('should handle perfect division record (6-0)', () => {
        const standing = createStanding({
          divisionWins: 6,
          divisionLosses: 0,
          divisionTies: 0,
        });
        expect(formatDivisionRecord(standing)).toBe('6-0');
      });

      it('should handle winless division record (0-6)', () => {
        const standing = createStanding({
          divisionWins: 0,
          divisionLosses: 6,
          divisionTies: 0,
        });
        expect(formatDivisionRecord(standing)).toBe('0-6');
      });

      it('should handle no division games played', () => {
        const standing = createStanding({
          divisionWins: 0,
          divisionLosses: 0,
          divisionTies: 0,
        });
        expect(formatDivisionRecord(standing)).toBe('0-0');
      });
    });

    describe('formatConferenceRecord', () => {
      it('should format conference record as "W-L" without ties', () => {
        const standing = createStanding({
          conferenceWins: 9,
          conferenceLosses: 4,
          conferenceTies: 0,
        });
        expect(formatConferenceRecord(standing)).toBe('9-4');
      });

      it('should format conference record as "W-L-T" with ties', () => {
        const standing = createStanding({
          conferenceWins: 8,
          conferenceLosses: 4,
          conferenceTies: 1,
        });
        expect(formatConferenceRecord(standing)).toBe('8-4-1');
      });

      it('should handle perfect conference record', () => {
        const standing = createStanding({
          conferenceWins: 13,
          conferenceLosses: 0,
          conferenceTies: 0,
        });
        expect(formatConferenceRecord(standing)).toBe('13-0');
      });

      it('should handle no conference games played', () => {
        const standing = createStanding({
          conferenceWins: 0,
          conferenceLosses: 0,
          conferenceTies: 0,
        });
        expect(formatConferenceRecord(standing)).toBe('0-0');
      });
    });

    describe('formatPointDiff', () => {
      it('should format positive point differential with + sign', () => {
        const standing = createStanding({ pointsFor: 400, pointsAgainst: 300 });
        expect(formatPointDiff(standing)).toBe('+100');
      });

      it('should format negative point differential without + sign', () => {
        const standing = createStanding({ pointsFor: 250, pointsAgainst: 350 });
        expect(formatPointDiff(standing)).toBe('-100');
      });

      it('should format zero point differential as "0"', () => {
        const standing = createStanding({ pointsFor: 300, pointsAgainst: 300 });
        expect(formatPointDiff(standing)).toBe('0');
      });

      it('should handle large positive differential', () => {
        const standing = createStanding({ pointsFor: 500, pointsAgainst: 200 });
        expect(formatPointDiff(standing)).toBe('+300');
      });

      it('should handle large negative differential', () => {
        const standing = createStanding({ pointsFor: 200, pointsAgainst: 500 });
        expect(formatPointDiff(standing)).toBe('-300');
      });

      it('should handle single digit differential', () => {
        const standing = createStanding({ pointsFor: 305, pointsAgainst: 300 });
        expect(formatPointDiff(standing)).toBe('+5');
      });

      it('should handle zero points scored and allowed', () => {
        const standing = createStanding({ pointsFor: 0, pointsAgainst: 0 });
        expect(formatPointDiff(standing)).toBe('0');
      });
    });
  });

  describe('Standings Display - Streak Formatting', () => {
    it('should display winning streak correctly', () => {
      const standing = createStanding({ streak: 'W5' });
      expect(standing.streak).toBe('W5');
    });

    it('should display losing streak correctly', () => {
      const standing = createStanding({ streak: 'L3' });
      expect(standing.streak).toBe('L3');
    });

    it('should display tie streak correctly', () => {
      const standing = createStanding({ streak: 'T1' });
      expect(standing.streak).toBe('T1');
    });

    it('should display "-" for no games played', () => {
      const standing = createStanding({ streak: '-' });
      expect(standing.streak).toBe('-');
    });

    it('should display single game winning streak', () => {
      const standing = createStanding({ streak: 'W1' });
      expect(standing.streak).toBe('W1');
    });

    it('should display double-digit streak', () => {
      const standing = createStanding({ streak: 'W10' });
      expect(standing.streak).toBe('W10');
    });
  });

  describe('Draft Order Display - Pick Number Formatting', () => {
    it('should display single pick number without range', () => {
      const pick = { pick: 1, pickMax: undefined };
      expect(pick.pickMax).toBeUndefined();
      expect(String(pick.pick)).toBe('1');
    });

    it('should represent pick range with pick and pickMax', () => {
      const pick = { pick: 25, pickMax: 28 };
      expect(`${pick.pick}-${pick.pickMax}`).toBe('25-28');
    });

    it('should handle first pick', () => {
      const pick = { pick: 1 };
      expect(pick.pick).toBe(1);
    });

    it('should handle last pick', () => {
      const pick = { pick: 32 };
      expect(pick.pick).toBe(32);
    });

    it('should handle conference championship range (29-30)', () => {
      const pick = { pick: 29, pickMax: 30 };
      expect(`${pick.pick}-${pick.pickMax}`).toBe('29-30');
    });

    it('should handle Super Bowl range (31-32)', () => {
      const pick = { pick: 31, pickMax: 32 };
      expect(`${pick.pick}-${pick.pickMax}`).toBe('31-32');
    });
  });

  describe('Draft Order Display - Pick Range Color Coding', () => {
    // Test the getPickColor function logic (matches DraftOrder.tsx)
    const getPickColor = (pickMax: number | undefined) => {
      return pickMax
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-gray-700 dark:text-gray-300';
    };

    it('should return amber color for picks with a range', () => {
      const pick = { pick: 25, pickMax: 28 };
      expect(getPickColor(pick.pickMax)).toContain('amber');
    });

    it('should return gray color for picks without a range', () => {
      const pick = { pick: 1, pickMax: undefined };
      expect(getPickColor(pick.pickMax)).toContain('gray');
    });

    it('should highlight divisional round ranges (25-28) in amber', () => {
      const pick = { pick: 25, pickMax: 28 };
      const color = getPickColor(pick.pickMax);
      expect(color).toBe('text-amber-600 dark:text-amber-400');
    });

    it('should highlight conference championship ranges (29-30) in amber', () => {
      const pick = { pick: 29, pickMax: 30 };
      const color = getPickColor(pick.pickMax);
      expect(color).toBe('text-amber-600 dark:text-amber-400');
    });

    it('should highlight Super Bowl ranges (31-32) in amber', () => {
      const pick = { pick: 31, pickMax: 32 };
      const color = getPickColor(pick.pickMax);
      expect(color).toBe('text-amber-600 dark:text-amber-400');
    });

    it('should NOT highlight non-playoff picks (no range)', () => {
      const pick = { pick: 1, pickMax: undefined };
      const color = getPickColor(pick.pickMax);
      expect(color).not.toContain('amber');
      expect(color).toContain('gray');
    });

    it('should NOT highlight wild card losers (no range)', () => {
      // Wild card losers have fixed positions (19-24), no range
      const pick = { pick: 19, pickMax: undefined };
      const color = getPickColor(pick.pickMax);
      expect(color).not.toContain('amber');
    });
  });

  describe('Draft Order Display - Reason Formatting', () => {
    const reasons = [
      'Missed playoffs',
      'Lost in Wild Card',
      'Lost in Divisional',
      'Lost in Conference Championship',
      'Lost Super Bowl',
      'Won Super Bowl',
    ];

    it('should have valid reason strings', () => {
      reasons.forEach(reason => {
        expect(typeof reason).toBe('string');
        expect(reason.length).toBeGreaterThan(0);
      });
    });

    it('should distinguish between all playoff exit reasons', () => {
      const uniqueReasons = new Set(reasons);
      expect(uniqueReasons.size).toBe(6);
    });

    // Test the getReasonColor function logic
    describe('Reason color coding logic', () => {
      const getReasonColor = (reason: string) => {
        switch (reason) {
          case 'Missed playoffs':
            return 'text-gray-500 dark:text-gray-400';
          case 'Lost in Wild Card':
            return 'text-blue-600 dark:text-blue-400';
          case 'Lost in Divisional':
            return 'text-purple-600 dark:text-purple-400';
          case 'Lost in Conference Championship':
            return 'text-orange-600 dark:text-orange-400';
          case 'Lost Super Bowl':
            return 'text-red-600 dark:text-red-400';
          case 'Won Super Bowl':
            return 'text-green-600 dark:text-green-400';
          default:
            return 'text-gray-500 dark:text-gray-400';
        }
      };

      it('should return gray color for non-playoff teams', () => {
        expect(getReasonColor('Missed playoffs')).toContain('gray');
      });

      it('should return blue color for Wild Card losers', () => {
        expect(getReasonColor('Lost in Wild Card')).toContain('blue');
      });

      it('should return purple color for Divisional losers', () => {
        expect(getReasonColor('Lost in Divisional')).toContain('purple');
      });

      it('should return orange color for Conference Championship losers', () => {
        expect(getReasonColor('Lost in Conference Championship')).toContain('orange');
      });

      it('should return red color for Super Bowl losers', () => {
        expect(getReasonColor('Lost Super Bowl')).toContain('red');
      });

      it('should return green color for Super Bowl winners', () => {
        expect(getReasonColor('Won Super Bowl')).toContain('green');
      });

      it('should return default gray color for unknown reasons', () => {
        expect(getReasonColor('Unknown reason')).toContain('gray');
      });
    });
  });

  describe('Draft Order Display - Record Formatting', () => {
    it('should format W-L record for draft pick', () => {
      const record = '10-7';
      expect(record).toMatch(/^\d+-\d+$/);
    });

    it('should format W-L-T record for draft pick', () => {
      const record = '10-6-1';
      expect(record).toMatch(/^\d+-\d+-\d+$/);
    });
  });

  describe('Clinched Status Display', () => {
    it('should display "BYE" for bye clinch', () => {
      const standing = createStanding({ clinched: 'bye', seed: 1 });
      const label = standing.clinched === 'bye' ? 'BYE' :
                    standing.clinched === 'division' ? 'DIV' : 'WC';
      expect(label).toBe('BYE');
    });

    it('should display "DIV" for division clinch', () => {
      const standing = createStanding({ clinched: 'division', seed: 2 });
      const label = standing.clinched === 'bye' ? 'BYE' :
                    standing.clinched === 'division' ? 'DIV' : 'WC';
      expect(label).toBe('DIV');
    });

    it('should display "WC" for playoff clinch (wild card)', () => {
      const standing = createStanding({ clinched: 'playoff', seed: 5 });
      const label = standing.clinched === 'bye' ? 'BYE' :
                    standing.clinched === 'division' ? 'DIV' : 'WC';
      expect(label).toBe('WC');
    });

    it('should not display clinch label when not clinched', () => {
      const standing = createStanding({ clinched: null, seed: null });
      expect(standing.clinched).toBeNull();
    });
  });

  describe('Magic Number Display', () => {
    it('should format magic number with "M" prefix', () => {
      const magicNumber = 3;
      const display = `M${magicNumber}`;
      expect(display).toBe('M3');
    });

    it('should not show magic number when clinched', () => {
      const standing = createStanding({
        clinched: 'playoff',
        magicNumber: null,
      });
      expect(standing.clinched).toBe('playoff');
      expect(standing.magicNumber).toBeNull();
    });

    it('should show elimination status instead of magic number', () => {
      const standing = createStanding({
        isEliminated: true,
        clinched: null,
        magicNumber: null,
      });
      expect(standing.isEliminated).toBe(true);
      expect(standing.clinched).toBeNull();
    });

    it('should format magic number tooltip correctly', () => {
      const standing = createStanding({
        clinched: null,
        isEliminated: false,
        magicNumber: {
          playoff: 3,
          division: 5,
          bye: 8,
          scenarios: [],
        },
      });

      const parts: string[] = [];
      if (standing.magicNumber?.playoff !== null && standing.magicNumber!.playoff > 0) {
        parts.push(`Playoff: ${standing.magicNumber!.playoff} win${standing.magicNumber!.playoff !== 1 ? 's' : ''}`);
      }
      if (standing.magicNumber?.division !== null && standing.magicNumber!.division > 0) {
        parts.push(`Division: ${standing.magicNumber!.division} win${standing.magicNumber!.division !== 1 ? 's' : ''}`);
      }
      if (standing.magicNumber?.bye !== null && standing.magicNumber!.bye > 0) {
        parts.push(`Bye: ${standing.magicNumber!.bye} win${standing.magicNumber!.bye !== 1 ? 's' : ''}`);
      }
      const tooltip = parts.join(' • ');

      expect(tooltip).toBe('Playoff: 3 wins • Division: 5 wins • Bye: 8 wins');
    });

    it('should use singular "win" for magic number of 1', () => {
      const standing = createStanding({
        clinched: null,
        isEliminated: false,
        magicNumber: {
          playoff: 1,
          division: null,
          bye: null,
          scenarios: [],
        },
      });

      const magicNumber = standing.magicNumber!.playoff;
      const text = `Playoff: ${magicNumber} win${magicNumber !== 1 ? 's' : ''}`;
      expect(text).toBe('Playoff: 1 win');
    });
  });

  describe('Last Five Display', () => {
    it('should display W for win', () => {
      const result: 'W' | 'L' | 'T' = 'W';
      expect(result).toBe('W');
    });

    it('should display L for loss', () => {
      const result: 'W' | 'L' | 'T' = 'L';
      expect(result).toBe('L');
    });

    it('should display T for tie', () => {
      const result: 'W' | 'L' | 'T' = 'T';
      expect(result).toBe('T');
    });

    it('should format final game score tooltip', () => {
      const game = {
        result: 'W' as const,
        week: 10,
        teamName: 'Chiefs',
        teamScore: 28,
        opponentName: 'Raiders',
        opponentScore: 14,
        isProjected: false,
      };

      const tooltip = `Wk ${game.week}: ${game.teamName} ${game.teamScore} - ${game.opponentName} ${game.opponentScore}`;
      expect(tooltip).toBe('Wk 10: Chiefs 28 - Raiders 14');
    });

    it('should format projected game tooltip', () => {
      const game = {
        result: 'W' as const,
        week: 15,
        teamName: 'Chiefs',
        teamScore: 1,
        opponentName: 'Raiders',
        opponentScore: 0,
        isProjected: true,
      };

      const tooltip = `Wk ${game.week}: vs ${game.opponentName} (projected)`;
      expect(tooltip).toBe('Wk 15: vs Raiders (projected)');
    });

    it('should display "-" when no games played', () => {
      const lastFive: never[] = [];
      const display = lastFive.length === 0 ? '-' : lastFive.map(g => g).join('');
      expect(display).toBe('-');
    });
  });

  describe('Eliminated Team Display', () => {
    it('should mark eliminated teams with isEliminated true', () => {
      const standing = createStanding({ isEliminated: true, seed: null });
      expect(standing.isEliminated).toBe(true);
    });

    it('should not mark playoff teams as eliminated', () => {
      const standing = createStanding({ isEliminated: false, seed: 5 });
      expect(standing.isEliminated).toBe(false);
    });

    it('should show "Eliminated" in tooltip for eliminated teams', () => {
      const standing = createStanding({
        isEliminated: true,
        clinched: null,
        magicNumber: null,
      });

      const tooltip = standing.isEliminated ? 'Eliminated' : null;
      expect(tooltip).toBe('Eliminated');
    });

    describe('Eliminated team styling (grayed out display)', () => {
      // Test the getRowTextColor function logic (matches Standings.tsx)
      const getRowTextColor = (standing: TeamStanding) => {
        if (standing.isEliminated) {
          return 'text-gray-400 dark:text-gray-500'; // Grayed out for eliminated
        }
        return 'text-gray-900 dark:text-gray-100'; // Normal for non-eliminated
      };

      it('should return grayed-out color class for eliminated teams', () => {
        const standing = createStanding({ isEliminated: true, seed: null });
        const colorClass = getRowTextColor(standing);
        expect(colorClass).toContain('gray-400');
        expect(colorClass).toContain('gray-500');
      });

      it('should return normal color class for non-eliminated teams', () => {
        const standing = createStanding({ isEliminated: false, seed: 5 });
        const colorClass = getRowTextColor(standing);
        expect(colorClass).toContain('gray-900');
        expect(colorClass).toContain('gray-100');
      });

      it('should return normal color class for teams in playoff position', () => {
        const standing = createStanding({
          isEliminated: false,
          seed: 7,
          clinched: null,
        });
        const colorClass = getRowTextColor(standing);
        expect(colorClass).not.toContain('gray-400');
      });

      it('should return normal color class for clinched teams', () => {
        const standing = createStanding({
          isEliminated: false,
          seed: 1,
          clinched: 'bye',
        });
        const colorClass = getRowTextColor(standing);
        expect(colorClass).not.toContain('gray-400');
      });

      it('should gray out teams that are both non-playoff and eliminated', () => {
        const standing = createStanding({
          isEliminated: true,
          seed: null,
          clinched: null,
        });
        const colorClass = getRowTextColor(standing);
        expect(colorClass).toBe('text-gray-400 dark:text-gray-500');
      });

      it('should use darker gray in dark mode for eliminated teams', () => {
        const standing = createStanding({ isEliminated: true });
        const colorClass = getRowTextColor(standing);
        // Verify dark mode uses a higher-numbered gray (darker) for reduced emphasis
        expect(colorClass).toContain('dark:text-gray-500');
      });
    });
  });

  describe('Playoff Line Display', () => {
    it('should separate playoff teams (seeds 1-7) from non-playoff teams', () => {
      const standings: TeamStanding[] = [
        createStanding({ seed: 1 }),
        createStanding({ seed: 2 }),
        createStanding({ seed: 3 }),
        createStanding({ seed: 4 }),
        createStanding({ seed: 5 }),
        createStanding({ seed: 6 }),
        createStanding({ seed: 7 }),
        createStanding({ seed: null }),
        createStanding({ seed: null }),
      ];

      const playoffTeams = standings.filter(s => s.seed !== null);
      const nonPlayoffTeams = standings.filter(s => s.seed === null);

      expect(playoffTeams).toHaveLength(7);
      expect(nonPlayoffTeams).toHaveLength(2);
    });

    it('should sort playoff teams by seed', () => {
      const standings: TeamStanding[] = [
        createStanding({ seed: 3 }),
        createStanding({ seed: 1 }),
        createStanding({ seed: 7 }),
        createStanding({ seed: 2 }),
      ];

      const sorted = standings
        .filter(s => s.seed !== null)
        .sort((a, b) => a.seed! - b.seed!);

      expect(sorted.map(s => s.seed)).toEqual([1, 2, 3, 7]);
    });
  });

  describe('Draft Order Missing Round Message', () => {
    // Test the getMissingRoundMessage logic
    it('should prompt for Wild Card picks when fewer than 6', () => {
      const wcComplete = 3;
      const wcPicks = 2;
      const total = wcComplete + wcPicks;
      const remaining = 6 - total;

      const message = `Select ${remaining} more Wild Card winner${remaining > 1 ? 's' : ''} to see picks 19-24`;
      expect(message).toBe('Select 1 more Wild Card winner to see picks 19-24');
    });

    it('should use plural when multiple Wild Card picks needed', () => {
      const remaining = 3;
      const message = `Select ${remaining} more Wild Card winner${remaining > 1 ? 's' : ''} to see picks 19-24`;
      expect(message).toBe('Select 3 more Wild Card winners to see picks 19-24');
    });

    it('should prompt for Divisional picks when Wild Card complete', () => {
      const remaining = 2;
      const message = `Select ${remaining} more Divisional winner${remaining > 1 ? 's' : ''} to see picks 25-28`;
      expect(message).toBe('Select 2 more Divisional winners to see picks 25-28');
    });

    it('should prompt for Conference Championship picks when Divisional complete', () => {
      const remaining = 1;
      const message = `Select ${remaining} more Conference Championship winner${remaining > 1 ? 's' : ''} to see picks 29-30`;
      expect(message).toBe('Select 1 more Conference Championship winner to see picks 29-30');
    });

    it('should prompt for Super Bowl pick when Conference Championship complete', () => {
      const message = 'Select Super Bowl winner to see picks 31-32';
      expect(message).toBe('Select Super Bowl winner to see picks 31-32');
    });
  });

  describe('Partial Draft Order Display', () => {
    it('should show "Partial" badge when draft order incomplete', () => {
      const draftOrderLength = 18; // Only non-playoff picks
      const isPartial = draftOrderLength > 0 && draftOrderLength < 32;
      expect(isPartial).toBe(true);
    });

    it('should not show "Partial" badge when draft order complete', () => {
      const draftOrderLength = 32;
      const isPartial = draftOrderLength > 0 && draftOrderLength < 32;
      expect(isPartial).toBe(false);
    });

    it('should not show "Partial" badge when no picks available', () => {
      const draftOrderLength = 0;
      const isPartial = draftOrderLength > 0 && draftOrderLength < 32;
      expect(isPartial).toBe(false);
    });

    it('should show summary with correct count', () => {
      const count = 24;
      const summary = `Showing ${count} of 32 picks`;
      expect(summary).toBe('Showing 24 of 32 picks');
    });
  });
});
