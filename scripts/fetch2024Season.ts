/**
 * Script to fetch 2024 NFL season data from ESPN API
 *
 * Run with: npx tsx scripts/fetch2024Season.ts
 */

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
const REGULAR_SEASON_TYPE = 2;
const YEAR = 2020;

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

interface CompactGame {
  id: string;
  week: number;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
}

async function fetchWeek(week: number): Promise<CompactGame[]> {
  const games: CompactGame[] = [];

  try {
    const url = `${ESPN_BASE_URL}/scoreboard?week=${week}&seasontype=${REGULAR_SEASON_TYPE}&dates=${YEAR}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Week ${week}: HTTP ${response.status}`);
      return games;
    }

    const data: EspnScoreboardResponse = await response.json();

    for (const event of data.events) {
      const competition = event.competitions[0];
      const homeComp = competition.competitors.find(c => c.homeAway === 'home');
      const awayComp = competition.competitors.find(c => c.homeAway === 'away');

      if (!homeComp || !awayComp) continue;

      games.push({
        id: event.id,
        week,
        home: homeComp.team.abbreviation,
        away: awayComp.team.abbreviation,
        homeScore: homeComp.score ? parseInt(homeComp.score, 10) : null,
        awayScore: awayComp.score ? parseInt(awayComp.score, 10) : null,
      });
    }

    console.log(`Week ${week}: ${games.length} games fetched`);
  } catch (error) {
    console.error(`Week ${week}: Error -`, error);
  }

  return games;
}

async function main() {
  console.log(`Fetching ${YEAR} NFL season data from ESPN API...\n`);

  const allGames: CompactGame[] = [];

  for (let week = 1; week <= 18; week++) {
    const weekGames = await fetchWeek(week);
    allGames.push(...weekGames);

    // Small delay to be nice to the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\nTotal games fetched: ${allGames.length}`);

  // Output as TypeScript constant
  console.log('\n// Copy this to src/utils/fixtures/season2024.ts:\n');
  console.log('export const SEASON_2024_GAMES = ');
  console.log(JSON.stringify(allGames, null, 2));
  console.log(';');
}

main().catch(console.error);
