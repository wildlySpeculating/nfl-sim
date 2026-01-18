/**
 * Historical Season Data Fetching Utilities
 *
 * Provides functions to fetch actual NFL game data from ESPN API
 * for historical seasons to validate tiebreaker logic.
 */

import type { Game, Team } from '@/types';
import { getTeamByAbbreviation } from '@/data/teams';

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
const REGULAR_SEASON_TYPE = 2;

interface EspnEvent {
  id: string;
  date: string;
  status: {
    type: {
      name: string;
      completed: boolean;
    };
  };
  competitions: [{
    competitors: {
      homeAway: 'home' | 'away';
      team: {
        abbreviation: string;
      };
      score?: string;
    }[];
  }];
}

interface EspnScoreboardResponse {
  events: EspnEvent[];
  week: {
    number: number;
  };
}

/**
 * Fetch all regular season games for a given year from ESPN API
 */
export async function fetchSeasonGames(year: number): Promise<Game[]> {
  const allGames: Game[] = [];

  for (let week = 1; week <= 18; week++) {
    try {
      const url = `${ESPN_BASE_URL}/scoreboard?week=${week}&seasontype=${REGULAR_SEASON_TYPE}&dates=${year}`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch week ${week}: ${response.status}`);
        continue;
      }

      const data: EspnScoreboardResponse = await response.json();

      for (const event of data.events) {
        const game = parseEspnEvent(event, week);
        if (game) {
          allGames.push(game);
        }
      }
    } catch (error) {
      console.error(`Error fetching week ${week}:`, error);
    }
  }

  // Sort by week then kickoff time
  allGames.sort((a, b) => {
    if (a.week !== b.week) return a.week - b.week;
    return a.kickoffTime.getTime() - b.kickoffTime.getTime();
  });

  return allGames;
}

function parseEspnEvent(event: EspnEvent, week: number): Game | null {
  try {
    const competition = event.competitions[0];
    const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');
    const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');

    if (!homeCompetitor || !awayCompetitor) return null;

    const homeTeam = getTeamByAbbreviation(homeCompetitor.team.abbreviation);
    const awayTeam = getTeamByAbbreviation(awayCompetitor.team.abbreviation);

    if (!homeTeam || !awayTeam) return null;

    return {
      id: event.id,
      week,
      homeTeam,
      awayTeam,
      kickoffTime: new Date(event.date),
      status: event.status.type.completed ? 'final' : 'scheduled',
      homeScore: homeCompetitor.score ? parseInt(homeCompetitor.score, 10) : null,
      awayScore: awayCompetitor.score ? parseInt(awayCompetitor.score, 10) : null,
    };
  } catch {
    return null;
  }
}

/**
 * Convert games array to a compact JSON format for fixture files
 */
export function gamesToFixtureFormat(games: Game[]): string {
  const compactGames = games.map(g => ({
    id: g.id,
    week: g.week,
    home: g.homeTeam.abbreviation,
    away: g.awayTeam.abbreviation,
    homeScore: g.homeScore,
    awayScore: g.awayScore,
  }));

  return JSON.stringify(compactGames, null, 2);
}

/**
 * Convert compact fixture format back to Game objects
 */
export function fixtureToGames(
  fixtures: Array<{
    id: string;
    week: number;
    home: string;
    away: string;
    homeScore: number | null;
    awayScore: number | null;
  }>
): Game[] {
  return fixtures
    .map(f => {
      const homeTeam = getTeamByAbbreviation(f.home);
      const awayTeam = getTeamByAbbreviation(f.away);

      if (!homeTeam || !awayTeam) return null;

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

/**
 * Expected 2024 NFL Playoff Seedings (actual results)
 */
export const EXPECTED_2024_SEEDINGS = {
  AFC: {
    1: { teamId: '14', name: 'Chiefs', record: '15-2' },
    2: { teamId: '1', name: 'Bills', record: '13-4' },
    3: { teamId: '5', name: 'Ravens', record: '12-5' },
    4: { teamId: '9', name: 'Texans', record: '10-7' },
    5: { teamId: '16', name: 'Chargers', record: '11-6' },
    6: { teamId: '8', name: 'Steelers', record: '10-7' },
    7: { teamId: '13', name: 'Broncos', record: '10-7' },
  },
  NFC: {
    1: { teamId: '22', name: 'Lions', record: '15-2' },
    2: { teamId: '19', name: 'Eagles', record: '14-3' },
    3: { teamId: '28', name: 'Buccaneers', record: '10-7' },
    4: { teamId: '30', name: 'Rams', record: '10-7' },
    5: { teamId: '24', name: 'Vikings', record: '14-3' },
    6: { teamId: '20', name: 'Commanders', record: '12-5' },
    7: { teamId: '23', name: 'Packers', record: '11-6' },
  },
};

/**
 * Notable tiebreaker scenarios from 2024 season
 */
export const TIEBREAKER_SCENARIOS_2024 = {
  // AFC: Steelers (10-7) vs Broncos (10-7) - seeds 6 and 7
  steelersVsBroncos: {
    description: 'Steelers won 6th seed over Broncos via conference record',
    teams: ['8', '13'], // Steelers, Broncos
    expectedOrder: ['8', '13'], // Steelers first
    tiebreakerUsed: 'conference record',
  },

  // NFC: Buccaneers (10-7) vs Rams (10-7) - seeds 3 and 4
  buccaneersVsRams: {
    description: 'Buccaneers won 3rd seed (NFC South) over Rams (NFC West)',
    teams: ['28', '30'], // Buccaneers, Rams
    expectedOrder: ['28', '30'], // Both are division winners, seeding by record/tiebreaker
    tiebreakerUsed: 'division winners with same record',
  },

  // NFC North: Vikings (14-3) as wild card behind Lions (15-2)
  vikingsWildCard: {
    description: 'Vikings 14-3 finished as wild card because Lions won division at 15-2',
    divisionWinner: '22', // Lions
    wildCard: '24', // Vikings
  },
};
