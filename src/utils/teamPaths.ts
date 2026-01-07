import type { Team, Game, GameSelection, TeamStanding } from '@/types';
import { teams, getTeamsByConference, getTeamsByDivision } from '@/data/teams';
import { calculatePlayoffSeedings } from './tiebreakers';

export interface TeamPath {
  type: 'division' | 'wildcard' | 'bye';
  description: string;
  requirements: PathRequirement[];
  complexity: number; // Lower is simpler
}

export interface PathRequirement {
  type: 'win' | 'loss' | 'tie';
  teamId: string;
  teamName: string;
  opponentId: string;
  opponentName: string;
  gameId: string;
  week: number;
}

interface ScenarioResult {
  selections: Record<string, GameSelection>;
  seed: number | null;
  clinched: 'division' | 'playoff' | 'bye' | null;
}

// Get remaining games for a team
function getRemainingGames(teamId: string, games: Game[]): Game[] {
  return games.filter(
    g => g.status !== 'final' && (g.homeTeam.id === teamId || g.awayTeam.id === teamId)
  );
}

// Get all remaining games in the conference
function getRemainingConferenceGames(conference: 'AFC' | 'NFC', games: Game[]): Game[] {
  const conferenceTeams = getTeamsByConference(conference);
  const teamIds = new Set(conferenceTeams.map(t => t.id));

  return games.filter(
    g => g.status !== 'final' && (teamIds.has(g.homeTeam.id) || teamIds.has(g.awayTeam.id))
  );
}

// Check if team makes playoffs with given selections
function checkPlayoffStatus(
  teamId: string,
  games: Game[],
  baseSelections: Record<string, GameSelection>,
  additionalSelections: Record<string, GameSelection>
): { seed: number | null; clinched: 'division' | 'playoff' | 'bye' | null } {
  const allSelections = { ...baseSelections, ...additionalSelections };
  const team = teams.find(t => t.id === teamId);
  if (!team) return { seed: null, clinched: null };

  const standings = calculatePlayoffSeedings(team.conference, teams, games, allSelections);
  const teamStanding = standings.find(s => s.team.id === teamId);

  return {
    seed: teamStanding?.seed ?? null,
    clinched: teamStanding?.clinched ?? null,
  };
}

// Generate simplest path to a goal
export function calculateTeamPaths(
  teamId: string,
  games: Game[],
  currentSelections: Record<string, GameSelection>,
  currentStandings: TeamStanding[]
): TeamPath[] {
  const team = teams.find(t => t.id === teamId);
  if (!team) return [];

  const paths: TeamPath[] = [];
  const teamStanding = currentStandings.find(s => s.team.id === teamId);

  // If already clinched, no paths needed
  if (teamStanding?.clinched === 'bye') {
    return [{ type: 'bye', description: 'Already clinched first-round bye', requirements: [], complexity: 0 }];
  }
  if (teamStanding?.clinched === 'division') {
    // Can still calculate bye path
  }
  if (teamStanding?.clinched === 'playoff') {
    // Can still calculate division/bye paths
  }
  if (teamStanding?.isEliminated) {
    return [{ type: 'wildcard', description: 'Mathematically eliminated from playoffs', requirements: [], complexity: Infinity }];
  }

  const remainingTeamGames = getRemainingGames(teamId, games);
  const remainingConfGames = getRemainingConferenceGames(team.conference, games);

  // Calculate current status
  const currentStatus = checkPlayoffStatus(teamId, games, currentSelections, {});

  // Simple path: Team wins all remaining games
  if (remainingTeamGames.length > 0) {
    const winAllSelections: Record<string, GameSelection> = {};
    for (const game of remainingTeamGames) {
      winAllSelections[game.id] = game.homeTeam.id === teamId ? 'home' : 'away';
    }

    const winAllStatus = checkPlayoffStatus(teamId, games, currentSelections, winAllSelections);

    if (winAllStatus.seed !== null) {
      const requirements: PathRequirement[] = remainingTeamGames.map(game => ({
        type: 'win' as const,
        teamId,
        teamName: team.abbreviation,
        opponentId: game.homeTeam.id === teamId ? game.awayTeam.id : game.homeTeam.id,
        opponentName: game.homeTeam.id === teamId ? game.awayTeam.abbreviation : game.homeTeam.abbreviation,
        gameId: game.id,
        week: game.week,
      }));

      if (winAllStatus.clinched === 'bye' || winAllStatus.seed === 1) {
        paths.push({
          type: 'bye',
          description: `Win all remaining games (${remainingTeamGames.length})`,
          requirements,
          complexity: remainingTeamGames.length,
        });
      } else if (winAllStatus.clinched === 'division' || (winAllStatus.seed && winAllStatus.seed <= 4)) {
        paths.push({
          type: 'division',
          description: `Win all remaining games (${remainingTeamGames.length})`,
          requirements,
          complexity: remainingTeamGames.length,
        });
      } else if (winAllStatus.seed !== null) {
        paths.push({
          type: 'wildcard',
          description: `Win all remaining games (${remainingTeamGames.length})`,
          requirements,
          complexity: remainingTeamGames.length,
        });
      }
    }
  }

  // Find minimal win scenarios for playoffs
  const minimalPlayoffPath = findMinimalPath(teamId, team, games, currentSelections, remainingTeamGames, 'playoff');
  if (minimalPlayoffPath && !paths.some(p => p.type === 'wildcard' && p.complexity <= minimalPlayoffPath.complexity)) {
    paths.push(minimalPlayoffPath);
  }

  // Find minimal win scenarios for division
  const minimalDivisionPath = findMinimalPath(teamId, team, games, currentSelections, remainingTeamGames, 'division');
  if (minimalDivisionPath && !paths.some(p => p.type === 'division' && p.complexity <= minimalDivisionPath.complexity)) {
    paths.push(minimalDivisionPath);
  }

  // Sort by complexity (simplest first)
  paths.sort((a, b) => a.complexity - b.complexity);

  return paths;
}

function findMinimalPath(
  teamId: string,
  team: Team,
  games: Game[],
  currentSelections: Record<string, GameSelection>,
  remainingTeamGames: Game[],
  goalType: 'playoff' | 'division' | 'bye'
): TeamPath | null {
  // Try winning 0, 1, 2, ... games until we find a path
  const numGames = remainingTeamGames.length;

  for (let wins = 0; wins <= numGames; wins++) {
    // Generate combinations of 'wins' games to win
    const combinations = getCombinations(remainingTeamGames, wins);

    for (const winGames of combinations) {
      const selections: Record<string, GameSelection> = {};

      // Set wins
      for (const game of winGames) {
        selections[game.id] = game.homeTeam.id === teamId ? 'home' : 'away';
      }

      // Set losses for other games
      for (const game of remainingTeamGames) {
        if (!winGames.includes(game)) {
          selections[game.id] = game.homeTeam.id === teamId ? 'away' : 'home';
        }
      }

      const status = checkPlayoffStatus(teamId, games, currentSelections, selections);

      let meetsGoal = false;
      if (goalType === 'playoff' && status.seed !== null) {
        meetsGoal = true;
      } else if (goalType === 'division' && status.seed !== null && status.seed <= 4) {
        meetsGoal = true;
      } else if (goalType === 'bye' && status.seed === 1) {
        meetsGoal = true;
      }

      if (meetsGoal) {
        const requirements: PathRequirement[] = winGames.map(game => ({
          type: 'win' as const,
          teamId,
          teamName: team.abbreviation,
          opponentId: game.homeTeam.id === teamId ? game.awayTeam.id : game.homeTeam.id,
          opponentName: game.homeTeam.id === teamId ? game.awayTeam.abbreviation : game.homeTeam.abbreviation,
          gameId: game.id,
          week: game.week,
        }));

        const description = wins === 0
          ? 'Already clinched (no wins needed)'
          : wins === 1
          ? `Win 1 game (vs ${requirements[0].opponentName})`
          : `Win ${wins} of ${numGames} remaining games`;

        return {
          type: goalType === 'playoff' ? 'wildcard' : goalType,
          description,
          requirements,
          complexity: wins,
        };
      }
    }
  }

  return null;
}

// Get all combinations of k items from array
function getCombinations<T>(array: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > array.length) return [];
  if (k === array.length) return [array];

  const result: T[][] = [];

  function combine(start: number, combo: T[]) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }

    for (let i = start; i < array.length; i++) {
      combo.push(array[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }

  combine(0, []);
  return result;
}

// Calculate magic number for a team
export function calculateMagicNumber(
  teamId: string,
  games: Game[],
  currentSelections: Record<string, GameSelection>,
  currentStandings: TeamStanding[],
  targetType: 'playoff' | 'division' | 'bye'
): { number: number | null; scenarios: string[] } {
  const team = teams.find(t => t.id === teamId);
  if (!team) return { number: null, scenarios: [] };

  const teamStanding = currentStandings.find(s => s.team.id === teamId);

  // Already clinched
  if (targetType === 'playoff' && teamStanding?.clinched) {
    return { number: 0, scenarios: ['Clinched'] };
  }
  if (targetType === 'division' && (teamStanding?.clinched === 'division' || teamStanding?.clinched === 'bye')) {
    return { number: 0, scenarios: ['Clinched division'] };
  }
  if (targetType === 'bye' && teamStanding?.clinched === 'bye') {
    return { number: 0, scenarios: ['Clinched bye'] };
  }

  // Eliminated
  if (teamStanding?.isEliminated) {
    return { number: null, scenarios: ['Eliminated'] };
  }

  const remainingTeamGames = getRemainingGames(teamId, games);
  const paths = calculateTeamPaths(teamId, games, currentSelections, currentStandings);

  const relevantPaths = paths.filter(p => {
    if (targetType === 'playoff') return true;
    if (targetType === 'division') return p.type === 'division' || p.type === 'bye';
    if (targetType === 'bye') return p.type === 'bye';
    return false;
  });

  if (relevantPaths.length === 0) {
    return { number: null, scenarios: ['No path available'] };
  }

  const simplestPath = relevantPaths[0];
  const magicNumber = simplestPath.requirements.length;

  const scenarios: string[] = [];
  if (magicNumber === 0) {
    scenarios.push('Clinched');
  } else {
    const winsNeeded = simplestPath.requirements.filter(r => r.type === 'win').length;
    if (winsNeeded > 0) {
      scenarios.push(`${winsNeeded} win${winsNeeded > 1 ? 's' : ''}`);
    }
  }

  return { number: magicNumber, scenarios };
}

// Check if a team is mathematically eliminated
export function isTeamEliminated(
  teamId: string,
  games: Game[],
  currentSelections: Record<string, GameSelection>
): boolean {
  const team = teams.find(t => t.id === teamId);
  if (!team) return true;

  const remainingTeamGames = getRemainingGames(teamId, games);

  // Best case: team wins all remaining games
  const bestCaseSelections: Record<string, GameSelection> = { ...currentSelections };
  for (const game of remainingTeamGames) {
    bestCaseSelections[game.id] = game.homeTeam.id === teamId ? 'home' : 'away';
  }

  // Check if team can make playoffs in best case
  const bestCaseStandings = calculatePlayoffSeedings(team.conference, teams, games, bestCaseSelections);
  const teamStanding = bestCaseStandings.find(s => s.team.id === teamId);

  // If team can't make top 7 even winning all remaining, they're eliminated
  return teamStanding?.seed === null;
}

// Calculate streak from games
export function calculateStreak(
  teamId: string,
  games: Game[],
  selections: Record<string, GameSelection>
): string {
  const teamGames = games
    .filter(g => (g.homeTeam.id === teamId || g.awayTeam.id === teamId) &&
                 (g.status === 'final' || selections[g.id]))
    .sort((a, b) => b.week - a.week); // Most recent first

  if (teamGames.length === 0) return '-';

  let streakType: 'W' | 'L' | 'T' | null = null;
  let streakCount = 0;

  for (const game of teamGames) {
    const isHome = game.homeTeam.id === teamId;
    let result: 'W' | 'L' | 'T';

    if (game.status === 'final') {
      const homeWon = (game.homeScore ?? 0) > (game.awayScore ?? 0);
      const tied = game.homeScore === game.awayScore;
      if (tied) {
        result = 'T';
      } else {
        result = isHome ? (homeWon ? 'W' : 'L') : (homeWon ? 'L' : 'W');
      }
    } else {
      const selection = selections[game.id];
      if (selection === 'tie') {
        result = 'T';
      } else if (selection === 'home') {
        result = isHome ? 'W' : 'L';
      } else {
        result = isHome ? 'L' : 'W';
      }
    }

    if (streakType === null) {
      streakType = result;
      streakCount = 1;
    } else if (result === streakType) {
      streakCount++;
    } else {
      break;
    }
  }

  return streakType ? `${streakType}${streakCount}` : '-';
}

// Calculate last 5 games with full details
export interface LastFiveGame {
  result: 'W' | 'L' | 'T';
  teamName: string;
  teamScore: number;
  opponentName: string;
  opponentScore: number;
  week: number;
  isProjected: boolean;
}

export function calculateLastFive(
  teamId: string,
  games: Game[],
  selections: Record<string, GameSelection>
): LastFiveGame[] {
  const team = teams.find(t => t.id === teamId);
  if (!team) return [];

  const teamGames = games
    .filter(g => (g.homeTeam.id === teamId || g.awayTeam.id === teamId) &&
                 (g.status === 'final' || selections[g.id]))
    .sort((a, b) => b.week - a.week) // Most recent first
    .slice(0, 5);

  return teamGames.map(game => {
    const isHome = game.homeTeam.id === teamId;
    const opponent = isHome ? game.awayTeam : game.homeTeam;
    const isProjected = game.status !== 'final';

    let result: 'W' | 'L' | 'T';
    let teamScore: number;
    let opponentScore: number;

    if (game.status === 'final') {
      const homeScore = game.homeScore ?? 0;
      const awayScore = game.awayScore ?? 0;
      teamScore = isHome ? homeScore : awayScore;
      opponentScore = isHome ? awayScore : homeScore;

      if (homeScore === awayScore) {
        result = 'T';
      } else {
        const homeWon = homeScore > awayScore;
        result = isHome ? (homeWon ? 'W' : 'L') : (homeWon ? 'L' : 'W');
      }
    } else {
      // Projected game based on selection
      const selection = selections[game.id];
      if (selection === 'tie') {
        result = 'T';
        teamScore = 0;
        opponentScore = 0;
      } else if (selection === 'home') {
        result = isHome ? 'W' : 'L';
        teamScore = isHome ? 1 : 0;
        opponentScore = isHome ? 0 : 1;
      } else {
        result = isHome ? 'L' : 'W';
        teamScore = isHome ? 0 : 1;
        opponentScore = isHome ? 1 : 0;
      }
    }

    return {
      result,
      teamName: team.name,
      teamScore,
      opponentName: opponent.name,
      opponentScore,
      week: game.week,
      isProjected,
    };
  });
}
