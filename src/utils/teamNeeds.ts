/**
 * Team Needs Logic - Phase 1: Magic Number Calculation
 *
 * Implements proper NFL magic number calculation:
 * Magic Number = minimum combination of (team wins + opponent losses) to clinch
 *
 * Unlike the simpler implementation in teamPaths.ts, this considers:
 * - Both team wins AND opponent losses
 * - Which specific opponents' losses matter
 * - Multiple scenarios (different win/loss combinations)
 */

import type { Team, Game, GameSelection } from '@/types';
import { teams, getTeamsByConference, getTeamsByDivision } from '@/data/teams';
import { calculatePlayoffSeedings } from './tiebreakers';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface MagicNumberResult {
  number: number | null;  // null = eliminated, 0 = clinched
  winsNeeded: number;
  opponentLossesNeeded: number;
  relevantGames: RelevantGame[];
  scenarios: ClinchScenario[];
}

export interface RelevantGame {
  gameId: string;
  week: number;
  team1: string;  // team ID
  team2: string;  // team ID
  team1Name: string;
  team2Name: string;
  impact: 'team_must_win' | 'opponent_must_lose' | 'helps_if_win' | 'helps_if_lose';
  description: string;
}

export interface ClinchScenario {
  description: string;
  requirements: ScenarioRequirement[];
}

export interface ScenarioRequirement {
  gameId: string;
  result: 'team1_wins' | 'team2_wins' | 'tie';
  team1: string;
  team2: string;
}

export type GoalType = 'playoff' | 'division' | 'bye';

export type PathType = 'division' | 'wildcard' | 'bye';

export interface EliminationResult {
  isEliminated: boolean;
  eliminatedFrom: GoalType[];
  reason?: string;
  bestPossibleSeed: number | null;  // null if eliminated from playoffs
  worstPossibleSeed: number | null; // null if eliminated from playoffs
}

export interface AllGoalsEliminationResult {
  playoff: EliminationResult;
  division: EliminationResult;
  bye: EliminationResult;
}

export interface ClinchResult {
  hasClinched: boolean;
  clinchType: GoalType | null;
  clinchScenario?: string;
  guaranteedSeed?: number;
}

export interface ClinchCondition {
  type: 'win' | 'opponent_loses' | 'win_or_opponent_loses' | 'win_and_opponent_loses';
  teamGame?: string;
  opponentGame?: string;
  opponent?: string;
  description: string;
}

export interface TeamPath {
  type: PathType;
  description: string;
  requirements: ScenarioRequirement[];
  seed?: number;  // Resulting seed if this path is followed
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get remaining (non-final) games for a specific team
 */
function getRemainingGames(teamId: string, games: Game[]): Game[] {
  return games.filter(
    g => g.status !== 'final' && (g.homeTeam.id === teamId || g.awayTeam.id === teamId)
  );
}

/**
 * Get all remaining games in a conference (games where at least one team is in the conference)
 */
function getRemainingConferenceGames(conference: 'AFC' | 'NFC', games: Game[]): Game[] {
  const conferenceTeams = getTeamsByConference(conference);
  const teamIds = new Set(conferenceTeams.map(t => t.id));

  return games.filter(
    g => g.status !== 'final' && (teamIds.has(g.homeTeam.id) || teamIds.has(g.awayTeam.id))
  );
}

/**
 * Get team's current record from games
 */
function getTeamRecord(
  teamId: string,
  games: Game[],
  selections: Record<string, GameSelection>
): { wins: number; losses: number; ties: number } {
  let wins = 0, losses = 0, ties = 0;

  for (const game of games) {
    const isHome = game.homeTeam.id === teamId;
    const isAway = game.awayTeam.id === teamId;
    if (!isHome && !isAway) continue;

    let result: 'win' | 'loss' | 'tie' | null = null;

    if (game.status === 'final') {
      if (game.homeScore === game.awayScore) {
        result = 'tie';
      } else {
        const homeWon = (game.homeScore ?? 0) > (game.awayScore ?? 0);
        result = isHome ? (homeWon ? 'win' : 'loss') : (homeWon ? 'loss' : 'win');
      }
    } else if (selections[game.id]) {
      const selection = selections[game.id];
      if (selection === 'tie') {
        result = 'tie';
      } else if (selection === 'home') {
        result = isHome ? 'win' : 'loss';
      } else if (selection === 'away') {
        result = isHome ? 'loss' : 'win';
      }
    }

    if (result === 'win') wins++;
    else if (result === 'loss') losses++;
    else if (result === 'tie') ties++;
  }

  return { wins, losses, ties };
}

/**
 * Check if a team achieves the goal with given selections
 */
function checkGoalAchieved(
  teamId: string,
  games: Game[],
  baseSelections: Record<string, GameSelection>,
  additionalSelections: Record<string, GameSelection>,
  goalType: GoalType
): boolean {
  const allSelections = { ...baseSelections, ...additionalSelections };
  const team = teams.find(t => t.id === teamId);
  if (!team) return false;

  const standings = calculatePlayoffSeedings(team.conference, teams, games, allSelections);
  const teamStanding = standings.find(s => s.team.id === teamId);

  if (!teamStanding) return false;

  switch (goalType) {
    case 'playoff':
      return teamStanding.seed !== null && teamStanding.seed >= 1 && teamStanding.seed <= 7;
    case 'division':
      return teamStanding.seed !== null && teamStanding.seed >= 1 && teamStanding.seed <= 4;
    case 'bye':
      return teamStanding.seed === 1;
    default:
      return false;
  }
}

/**
 * Check if team has already clinched the goal
 */
function hasTeamClinched(
  teamId: string,
  games: Game[],
  selections: Record<string, GameSelection>,
  goalType: GoalType
): boolean {
  const team = teams.find(t => t.id === teamId);
  if (!team) return false;

  // Get remaining conference games
  const remainingGames = getRemainingConferenceGames(team.conference, games);

  // If no remaining games, check current standings
  if (remainingGames.length === 0) {
    return checkGoalAchieved(teamId, games, selections, {}, goalType);
  }

  // Team has clinched if they achieve the goal in ALL possible outcomes
  // For efficiency, we check worst-case scenarios instead of all 2^N combinations

  // Find competitors to determine worst case
  const competitors = findCompetitors(teamId, games, selections, goalType);
  const competitorIds = new Set(competitors.map(c => c.id));

  // Worst case for the team: they lose all, competitors win all
  const worstCaseSelections: Record<string, GameSelection> = {};

  for (const game of remainingGames) {
    const isTeamHome = game.homeTeam.id === teamId;
    const isTeamAway = game.awayTeam.id === teamId;
    const homeIsCompetitor = competitorIds.has(game.homeTeam.id);
    const awayIsCompetitor = competitorIds.has(game.awayTeam.id);

    if (isTeamHome || isTeamAway) {
      // Team loses this game
      worstCaseSelections[game.id] = isTeamHome ? 'away' : 'home';
    } else if (homeIsCompetitor && !awayIsCompetitor) {
      // Home team is competitor, make them win
      worstCaseSelections[game.id] = 'home';
    } else if (awayIsCompetitor && !homeIsCompetitor) {
      // Away team is competitor, make them win
      worstCaseSelections[game.id] = 'away';
    } else if (homeIsCompetitor && awayIsCompetitor) {
      // Both competitors, one must win - pick home (arbitrary)
      worstCaseSelections[game.id] = 'home';
    } else {
      // Neither is competitor, arbitrary
      worstCaseSelections[game.id] = 'home';
    }
  }

  return checkGoalAchieved(teamId, games, selections, worstCaseSelections, goalType);
}

/**
 * Check if team is eliminated from achieving the goal
 */
function isTeamEliminatedFromGoal(
  teamId: string,
  games: Game[],
  selections: Record<string, GameSelection>,
  goalType: GoalType
): boolean {
  const team = teams.find(t => t.id === teamId);
  if (!team) return true;

  const remainingGames = getRemainingConferenceGames(team.conference, games);
  const competitors = findCompetitors(teamId, games, selections, goalType);
  const competitorIds = new Set(competitors.map(c => c.id));

  // Best case: team wins all their games, competitors lose all their games
  const bestCaseSelections: Record<string, GameSelection> = {};

  for (const game of remainingGames) {
    const isTeamHome = game.homeTeam.id === teamId;
    const isTeamAway = game.awayTeam.id === teamId;
    const homeIsCompetitor = competitorIds.has(game.homeTeam.id);
    const awayIsCompetitor = competitorIds.has(game.awayTeam.id);

    if (isTeamHome || isTeamAway) {
      // Team wins this game
      bestCaseSelections[game.id] = isTeamHome ? 'home' : 'away';
    } else if (homeIsCompetitor && !awayIsCompetitor) {
      // Home team is a competitor, make them lose
      bestCaseSelections[game.id] = 'away';
    } else if (awayIsCompetitor && !homeIsCompetitor) {
      // Away team is a competitor, make them lose
      bestCaseSelections[game.id] = 'home';
    } else if (homeIsCompetitor && awayIsCompetitor) {
      // Both are competitors, one will lose either way - pick away wins (home loses)
      bestCaseSelections[game.id] = 'away';
    } else {
      // Neither is a competitor, arbitrary outcome
      bestCaseSelections[game.id] = 'home';
    }
  }

  // If team can't achieve goal even in this best case, they're eliminated
  return !checkGoalAchieved(teamId, games, selections, bestCaseSelections, goalType);
}

/**
 * Find competitors - teams that could prevent the target team from achieving the goal
 */
function findCompetitors(
  teamId: string,
  games: Game[],
  selections: Record<string, GameSelection>,
  goalType: GoalType
): Team[] {
  const team = teams.find(t => t.id === teamId);
  if (!team) return [];

  const conferenceTeams = getTeamsByConference(team.conference);
  const standings = calculatePlayoffSeedings(team.conference, teams, games, selections);
  const teamStanding = standings.find(s => s.team.id === teamId);

  if (!teamStanding) return [];

  const competitors: Team[] = [];

  switch (goalType) {
    case 'playoff':
      // Competitors are teams that could take the 7th seed
      // Focus on teams near the playoff cutoff
      for (const s of standings) {
        if (s.team.id === teamId) continue;
        // Teams within striking distance
        const teamRecord = getTeamRecord(teamId, games, selections);
        const compRecord = getTeamRecord(s.team.id, games, selections);
        const compRemainingCount = getRemainingGames(s.team.id, games).length;

        // Competitor could catch up or stay ahead
        const compBestWins = compRecord.wins + compRemainingCount;
        const teamWorstWins = teamRecord.wins;

        if (compBestWins >= teamWorstWins || s.seed !== null) {
          competitors.push(s.team);
        }
      }
      break;

    case 'division': {
      // Competitors are teams in the same division
      const divisionTeams = getTeamsByDivision(team.division);
      for (const t of divisionTeams) {
        if (t.id !== teamId) {
          competitors.push(t);
        }
      }
      break;
    }

    case 'bye':
      // Competitors are all other conference teams that could get #1 seed
      for (const t of conferenceTeams) {
        if (t.id !== teamId) {
          competitors.push(t);
        }
      }
      break;
  }

  return competitors;
}

/**
 * Generate all combinations of k items from an array
 */
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

// ============================================================================
// Main Magic Number Calculation
// ============================================================================

/**
 * Calculate magic number for a team to achieve a specific goal
 *
 * Magic Number = minimum (team wins needed + opponent losses needed) to clinch
 *
 * Returns:
 * - number: 0 if clinched, null if eliminated, otherwise the magic number
 * - winsNeeded: minimum wins the team needs
 * - opponentLossesNeeded: minimum opponent losses needed
 * - relevantGames: games that affect the outcome
 * - scenarios: different ways to clinch
 */
export function calculateMagicNumber(
  teamId: string,
  games: Game[],
  selections: Record<string, GameSelection>,
  goalType: GoalType
): MagicNumberResult {
  const team = teams.find(t => t.id === teamId);

  // Invalid team
  if (!team) {
    return {
      number: null,
      winsNeeded: 0,
      opponentLossesNeeded: 0,
      relevantGames: [],
      scenarios: [],
    };
  }

  // No games - check current state
  if (games.length === 0) {
    return {
      number: null,
      winsNeeded: 0,
      opponentLossesNeeded: 0,
      relevantGames: [],
      scenarios: [],
    };
  }

  // Check if already clinched
  if (hasTeamClinched(teamId, games, selections, goalType)) {
    return {
      number: 0,
      winsNeeded: 0,
      opponentLossesNeeded: 0,
      relevantGames: [],
      scenarios: [{ description: `Clinched ${goalType}`, requirements: [] }],
    };
  }

  // Check if eliminated
  if (isTeamEliminatedFromGoal(teamId, games, selections, goalType)) {
    return {
      number: null,
      winsNeeded: 0,
      opponentLossesNeeded: 0,
      relevantGames: [],
      scenarios: [{ description: `Eliminated from ${goalType}`, requirements: [] }],
    };
  }

  // Get remaining games
  const teamRemainingGames = getRemainingGames(teamId, games);
  const conferenceRemainingGames = getRemainingConferenceGames(team.conference, games);

  // Find competitor games (games that don't involve the team but affect standings)
  const competitorGames = conferenceRemainingGames.filter(
    g => g.homeTeam.id !== teamId && g.awayTeam.id !== teamId
  );

  // Find competitors
  const competitors = findCompetitors(teamId, games, selections, goalType);
  const competitorIds = new Set(competitors.map(c => c.id));

  // Identify competitor remaining games
  const competitorRemainingGames = competitorGames.filter(
    g => competitorIds.has(g.homeTeam.id) || competitorIds.has(g.awayTeam.id)
  );

  // Try to find minimum combination using an optimized search
  // Start with wins only, then add opponent losses
  const scenarios: ClinchScenario[] = [];
  const relevantGamesMap = new Map<string, RelevantGame>();

  let minMagicNumber = Infinity;
  let minWinsNeeded = Infinity;
  let minOpponentLossesNeeded = Infinity;

  const maxTeamWins = teamRemainingGames.length;
  // Limit competitor losses to check (performance optimization)
  const maxCompetitorLosses = Math.min(competitorRemainingGames.length, 3);

  // Maximum combinations to check per level (performance optimization)
  const MAX_COMBINATIONS_PER_LEVEL = 10;

  // Try combinations: 0 wins, 1 win, 2 wins, etc.
  // Combined with: 0 opponent losses, 1 opponent loss, etc.
  for (let wins = 0; wins <= maxTeamWins; wins++) {
    // Early exit if we already found a solution with fewer wins
    if (wins >= minMagicNumber) break;

    const winCombinations = getCombinations(teamRemainingGames, wins);
    let combinationsChecked = 0;

    for (const winGames of winCombinations) {
      combinationsChecked++;
      if (combinationsChecked > MAX_COMBINATIONS_PER_LEVEL && minMagicNumber < Infinity) break;

      // Set team's selections
      const teamSelections: Record<string, GameSelection> = {};

      for (const game of teamRemainingGames) {
        const isTeamHome = game.homeTeam.id === teamId;
        if (winGames.includes(game)) {
          teamSelections[game.id] = isTeamHome ? 'home' : 'away';
        } else {
          teamSelections[game.id] = isTeamHome ? 'away' : 'home';
        }
      }

      // Check if this is enough (no opponent losses needed)
      if (checkGoalAchieved(teamId, games, selections, teamSelections, goalType)) {
        const magicNumber = wins;

        if (magicNumber < minMagicNumber) {
          minMagicNumber = magicNumber;
          minWinsNeeded = wins;
          minOpponentLossesNeeded = 0;

          // Record this scenario
          const requirements: ScenarioRequirement[] = winGames.map(game => {
            const result: 'team1_wins' | 'team2_wins' = game.homeTeam.id === teamId ? 'team1_wins' : 'team2_wins';
            return {
              gameId: game.id,
              result,
              team1: game.homeTeam.id,
              team2: game.awayTeam.id,
            };
          });

          const description = wins === 0
            ? 'Clinched (no wins needed)'
            : wins === 1
            ? `Win vs ${winGames[0].homeTeam.id === teamId ? winGames[0].awayTeam.abbreviation : winGames[0].homeTeam.abbreviation}`
            : `Win ${wins} games`;

          scenarios.push({ description, requirements });

          // Mark these games as relevant
          for (const game of winGames) {
            const opponent = game.homeTeam.id === teamId ? game.awayTeam : game.homeTeam;
            relevantGamesMap.set(game.id, {
              gameId: game.id,
              week: game.week,
              team1: game.homeTeam.id,
              team2: game.awayTeam.id,
              team1Name: game.homeTeam.abbreviation,
              team2Name: game.awayTeam.abbreviation,
              impact: 'team_must_win',
              description: `${team.abbreviation} must beat ${opponent.abbreviation}`,
            });
          }
        }

        // Found a valid scenario with just wins, skip loss checking
        continue;
      }

      // Try adding opponent losses (only if we haven't found a solution with just wins)
      if (minMagicNumber === Infinity || wins + 1 < minMagicNumber) {
        for (let losses = 1; losses <= maxCompetitorLosses; losses++) {
          const totalMagic = wins + losses;
          if (totalMagic >= minMagicNumber) break;

          const lossCombinations = getCombinations(competitorRemainingGames, losses);
          let lossComboChecked = 0;

          for (const lossGames of lossCombinations) {
            lossComboChecked++;
            if (lossComboChecked > MAX_COMBINATIONS_PER_LEVEL) break;

            const fullSelections: Record<string, GameSelection> = { ...teamSelections };

            for (const game of lossGames) {
              const homeIsCompetitor = competitorIds.has(game.homeTeam.id);
              const awayIsCompetitor = competitorIds.has(game.awayTeam.id);

              if (homeIsCompetitor && !awayIsCompetitor) {
                fullSelections[game.id] = 'away';
              } else if (awayIsCompetitor && !homeIsCompetitor) {
                fullSelections[game.id] = 'home';
              } else if (homeIsCompetitor && awayIsCompetitor) {
                fullSelections[game.id] = 'away';
              }
            }

            if (checkGoalAchieved(teamId, games, selections, fullSelections, goalType)) {
              const magicNumber = wins + losses;

              if (magicNumber < minMagicNumber) {
                minMagicNumber = magicNumber;
                minWinsNeeded = wins;
                minOpponentLossesNeeded = losses;

                // Record this scenario
                const winRequirements: ScenarioRequirement[] = winGames.map(game => {
                  const result: 'team1_wins' | 'team2_wins' = game.homeTeam.id === teamId ? 'team1_wins' : 'team2_wins';
                  return {
                    gameId: game.id,
                    result,
                    team1: game.homeTeam.id,
                    team2: game.awayTeam.id,
                  };
                });
                const lossRequirements: ScenarioRequirement[] = lossGames.map(game => {
                  const homeIsCompetitor = competitorIds.has(game.homeTeam.id);
                  const result: 'team1_wins' | 'team2_wins' = homeIsCompetitor ? 'team2_wins' : 'team1_wins';
                  return {
                    gameId: game.id,
                    result,
                    team1: game.homeTeam.id,
                    team2: game.awayTeam.id,
                  };
                });
                const requirements: ScenarioRequirement[] = [...winRequirements, ...lossRequirements];

                const winDesc = wins === 0 ? '' : wins === 1
                  ? `Win vs ${winGames[0].homeTeam.id === teamId ? winGames[0].awayTeam.abbreviation : winGames[0].homeTeam.abbreviation}`
                  : `Win ${wins} games`;
                const lossDesc = losses === 1 ? `1 competitor loss` : `${losses} competitor losses`;
                const description = wins === 0 ? lossDesc : `${winDesc} + ${lossDesc}`;

                scenarios.push({ description, requirements });

                // Mark games as relevant
                for (const game of winGames) {
                  const opponent = game.homeTeam.id === teamId ? game.awayTeam : game.homeTeam;
                  relevantGamesMap.set(game.id, {
                    gameId: game.id,
                    week: game.week,
                    team1: game.homeTeam.id,
                    team2: game.awayTeam.id,
                    team1Name: game.homeTeam.abbreviation,
                    team2Name: game.awayTeam.abbreviation,
                    impact: 'team_must_win',
                    description: `${team.abbreviation} must beat ${opponent.abbreviation}`,
                  });
                }

                for (const game of lossGames) {
                  const homeIsCompetitor = competitorIds.has(game.homeTeam.id);
                  const competitor = homeIsCompetitor ? game.homeTeam : game.awayTeam;
                  const other = homeIsCompetitor ? game.awayTeam : game.homeTeam;

                  relevantGamesMap.set(game.id, {
                    gameId: game.id,
                    week: game.week,
                    team1: game.homeTeam.id,
                    team2: game.awayTeam.id,
                    team1Name: game.homeTeam.abbreviation,
                    team2Name: game.awayTeam.abbreviation,
                    impact: 'opponent_must_lose',
                    description: `${competitor.abbreviation} must lose to ${other.abbreviation}`,
                  });
                }
              }

              // Found a valid scenario, can break inner loop
              break;
            }
          }
        }
      }
    }
  }

  // Sort scenarios by complexity (fewer requirements first)
  scenarios.sort((a, b) => a.requirements.length - b.requirements.length);

  // Keep only the simplest scenarios (within 1 of minimum)
  const filteredScenarios = scenarios.filter(
    s => s.requirements.length <= minMagicNumber + 1
  ).slice(0, 5);

  return {
    number: minMagicNumber === Infinity ? null : minMagicNumber,
    winsNeeded: minWinsNeeded === Infinity ? 0 : minWinsNeeded,
    opponentLossesNeeded: minOpponentLossesNeeded === Infinity ? 0 : minOpponentLossesNeeded,
    relevantGames: Array.from(relevantGamesMap.values()),
    scenarios: filteredScenarios,
  };
}

// ============================================================================
// Phase 2: Path Calculation
// ============================================================================

/**
 * Determine the path type based on the resulting seed
 */
function getPathTypeFromSeed(seed: number | null): PathType | null {
  if (seed === null) return null;
  if (seed === 1) return 'bye';
  if (seed >= 2 && seed <= 4) return 'division';
  if (seed >= 5 && seed <= 7) return 'wildcard';
  return null;
}

/**
 * Simulate the outcome of a set of game selections and return the resulting seed
 */
function simulatePathSeed(
  teamId: string,
  games: Game[],
  baseSelections: Record<string, GameSelection>,
  additionalSelections: Record<string, GameSelection>
): number | null {
  const team = teams.find(t => t.id === teamId);
  if (!team) return null;

  // Combine base and additional selections
  const fullSelections: Record<string, GameSelection> = { ...baseSelections, ...additionalSelections };

  // Calculate standings with these selections
  const standings = calculatePlayoffSeedings(team.conference, teams, games, fullSelections);
  const teamStanding = standings.find(s => s.team.id === teamId);

  return teamStanding?.seed ?? null;
}

/**
 * Calculate all paths a team can take to make the playoffs
 *
 * Returns paths categorized by how the team would clinch:
 * - 'division': clinching as division winner (seeds 1-4)
 * - 'wildcard': clinching as wild card (seeds 5-7)
 * - 'bye': clinching the #1 seed (first-round bye)
 *
 * @param teamId - The team to calculate paths for
 * @param games - All games in the season
 * @param selections - Current game selections/results
 * @param goalType - The goal: 'playoff', 'division', or 'bye'
 * @returns Array of paths sorted by complexity (fewest requirements first)
 */
export function calculateTeamPaths(
  teamId: string,
  games: Game[],
  selections: Record<string, GameSelection>,
  goalType: GoalType
): TeamPath[] {
  const team = teams.find(t => t.id === teamId);
  if (!team) return [];

  // Check if eliminated first
  if (isTeamEliminatedFromGoal(teamId, games, selections, goalType)) {
    return [];
  }

  // Check if already clinched
  if (hasTeamClinched(teamId, games, selections, goalType)) {
    // Determine the current path type
    const standings = calculatePlayoffSeedings(team.conference, teams, games, selections);
    const teamStanding = standings.find(s => s.team.id === teamId);
    const seed = teamStanding?.seed ?? null;
    const pathType = getPathTypeFromSeed(seed);

    if (pathType) {
      return [{
        type: pathType,
        description: `Already clinched ${goalType}`,
        requirements: [],
        seed: seed ?? undefined,
      }];
    }
  }

  const paths: TeamPath[] = [];
  const seenPaths = new Set<string>();  // Deduplicate paths

  // Get remaining games
  const teamRemainingGames = getRemainingGames(teamId, games);
  const conferenceRemainingGames = getRemainingConferenceGames(team.conference, games);

  // Find competitor games
  const competitorGames = conferenceRemainingGames.filter(
    g => g.homeTeam.id !== teamId && g.awayTeam.id !== teamId
  );

  // Find competitors
  const competitors = findCompetitors(teamId, games, selections, goalType);
  const competitorIds = new Set(competitors.map(c => c.id));

  // Competitor remaining games
  const competitorRemainingGames = competitorGames.filter(
    g => competitorIds.has(g.homeTeam.id) || competitorIds.has(g.awayTeam.id)
  );

  const maxTeamWins = teamRemainingGames.length;
  const maxCompetitorLosses = Math.min(competitorRemainingGames.length, 4);
  const MAX_COMBINATIONS_PER_LEVEL = 15;
  const MAX_TOTAL_PATHS = 20;

  // Try combinations of team wins and competitor losses
  for (let wins = 0; wins <= maxTeamWins && paths.length < MAX_TOTAL_PATHS; wins++) {
    const winCombinations = getCombinations(teamRemainingGames, wins);
    let combinationsChecked = 0;

    for (const winGames of winCombinations) {
      combinationsChecked++;
      if (combinationsChecked > MAX_COMBINATIONS_PER_LEVEL) break;
      if (paths.length >= MAX_TOTAL_PATHS) break;

      // Set team's selections
      const teamSelections: Record<string, GameSelection> = {};

      for (const game of teamRemainingGames) {
        const isTeamHome = game.homeTeam.id === teamId;
        if (winGames.includes(game)) {
          teamSelections[game.id] = isTeamHome ? 'home' : 'away';
        } else {
          teamSelections[game.id] = isTeamHome ? 'away' : 'home';
        }
      }

      // Build requirements for team wins
      const winRequirements: ScenarioRequirement[] = winGames.map(game => {
        const result: 'team1_wins' | 'team2_wins' = game.homeTeam.id === teamId ? 'team1_wins' : 'team2_wins';
        return {
          gameId: game.id,
          result,
          team1: game.homeTeam.id,
          team2: game.awayTeam.id,
        };
      });

      // Check if team wins alone achieve the goal
      if (checkGoalAchieved(teamId, games, selections, teamSelections, goalType)) {
        const seed = simulatePathSeed(teamId, games, selections, teamSelections);
        const pathType = getPathTypeFromSeed(seed);

        if (pathType && matchesGoalType(pathType, goalType)) {
          const pathKey = winRequirements.map(r => `${r.gameId}:${r.result}`).sort().join('|');

          if (!seenPaths.has(pathKey)) {
            seenPaths.add(pathKey);

            const description = buildPathDescription(wins, 0, winGames, [], teamId);
            paths.push({
              type: pathType,
              description,
              requirements: winRequirements,
              seed: seed ?? undefined,
            });
          }
        }
        continue;
      }

      // Try adding competitor losses
      for (let losses = 1; losses <= maxCompetitorLosses && paths.length < MAX_TOTAL_PATHS; losses++) {
        const lossCombinations = getCombinations(competitorRemainingGames, losses);
        let lossComboChecked = 0;

        for (const lossGames of lossCombinations) {
          lossComboChecked++;
          if (lossComboChecked > MAX_COMBINATIONS_PER_LEVEL) break;
          if (paths.length >= MAX_TOTAL_PATHS) break;

          const fullSelections: Record<string, GameSelection> = { ...teamSelections };

          // Build loss requirements
          const lossRequirements: ScenarioRequirement[] = [];

          for (const game of lossGames) {
            const homeIsCompetitor = competitorIds.has(game.homeTeam.id);
            const awayIsCompetitor = competitorIds.has(game.awayTeam.id);

            if (homeIsCompetitor && !awayIsCompetitor) {
              fullSelections[game.id] = 'away';
              lossRequirements.push({
                gameId: game.id,
                result: 'team2_wins',
                team1: game.homeTeam.id,
                team2: game.awayTeam.id,
              });
            } else if (awayIsCompetitor && !homeIsCompetitor) {
              fullSelections[game.id] = 'home';
              lossRequirements.push({
                gameId: game.id,
                result: 'team1_wins',
                team1: game.homeTeam.id,
                team2: game.awayTeam.id,
              });
            } else if (homeIsCompetitor && awayIsCompetitor) {
              // Both are competitors, pick one to lose (home loses)
              fullSelections[game.id] = 'away';
              lossRequirements.push({
                gameId: game.id,
                result: 'team2_wins',
                team1: game.homeTeam.id,
                team2: game.awayTeam.id,
              });
            }
          }

          if (checkGoalAchieved(teamId, games, selections, fullSelections, goalType)) {
            const allRequirements = [...winRequirements, ...lossRequirements];
            const seed = simulatePathSeed(teamId, games, selections, fullSelections);
            const pathType = getPathTypeFromSeed(seed);

            if (pathType && matchesGoalType(pathType, goalType)) {
              const pathKey = allRequirements.map(r => `${r.gameId}:${r.result}`).sort().join('|');

              if (!seenPaths.has(pathKey)) {
                seenPaths.add(pathKey);

                const description = buildPathDescription(wins, losses, winGames, lossGames, teamId);
                paths.push({
                  type: pathType,
                  description,
                  requirements: allRequirements,
                  seed: seed ?? undefined,
                });
              }
            }
          }
        }
      }
    }
  }

  // Sort paths by complexity (fewest requirements first)
  paths.sort((a, b) => {
    // First by number of requirements
    if (a.requirements.length !== b.requirements.length) {
      return a.requirements.length - b.requirements.length;
    }
    // Then by seed (higher seed = better = lower number)
    if (a.seed !== undefined && b.seed !== undefined) {
      return a.seed - b.seed;
    }
    return 0;
  });

  return paths;
}

/**
 * Check if a path type satisfies a goal type
 */
function matchesGoalType(pathType: PathType, goalType: GoalType): boolean {
  switch (goalType) {
    case 'playoff':
      // All playoff types satisfy playoff goal
      return pathType === 'bye' || pathType === 'division' || pathType === 'wildcard';
    case 'division':
      // Only division winner types (bye is #1 seed, which is also division winner)
      return pathType === 'bye' || pathType === 'division';
    case 'bye':
      // Only #1 seed
      return pathType === 'bye';
    default:
      return false;
  }
}

/**
 * Build a human-readable description for a path
 */
function buildPathDescription(
  wins: number,
  losses: number,
  winGames: Game[],
  lossGames: Game[],
  teamId: string
): string {
  const parts: string[] = [];

  if (wins > 0) {
    if (wins === 1) {
      const game = winGames[0];
      const opponent = game.homeTeam.id === teamId ? game.awayTeam : game.homeTeam;
      parts.push(`Win vs ${opponent.abbreviation}`);
    } else {
      parts.push(`Win ${wins} games`);
    }
  }

  if (losses > 0) {
    if (losses === 1) {
      const game = lossGames[0];
      parts.push(`${game.homeTeam.abbreviation} or ${game.awayTeam.abbreviation} loses`);
    } else {
      parts.push(`${losses} competitor losses`);
    }
  }

  return parts.length > 0 ? parts.join(' + ') : 'Already clinched';
}

// ============================================================================
// Phase 4: Elimination Detection
// ============================================================================

/**
 * Calculate the best possible seed a team can achieve
 * (team wins all remaining, competitors lose all)
 */
function calculateBestPossibleSeed(
  teamId: string,
  games: Game[],
  selections: Record<string, GameSelection>
): number | null {
  const team = teams.find(t => t.id === teamId);
  if (!team) return null;

  const remainingGames = getRemainingConferenceGames(team.conference, games);
  const competitors = findCompetitors(teamId, games, selections, 'playoff');
  const competitorIds = new Set(competitors.map(c => c.id));

  // Best case: team wins all, competitors lose all
  const bestCaseSelections: Record<string, GameSelection> = {};

  for (const game of remainingGames) {
    const isTeamHome = game.homeTeam.id === teamId;
    const isTeamAway = game.awayTeam.id === teamId;
    const homeIsCompetitor = competitorIds.has(game.homeTeam.id);
    const awayIsCompetitor = competitorIds.has(game.awayTeam.id);

    if (isTeamHome || isTeamAway) {
      bestCaseSelections[game.id] = isTeamHome ? 'home' : 'away';
    } else if (homeIsCompetitor && !awayIsCompetitor) {
      bestCaseSelections[game.id] = 'away';
    } else if (awayIsCompetitor && !homeIsCompetitor) {
      bestCaseSelections[game.id] = 'home';
    } else if (homeIsCompetitor && awayIsCompetitor) {
      bestCaseSelections[game.id] = 'away'; // one must lose
    } else {
      bestCaseSelections[game.id] = 'home';
    }
  }

  const fullSelections = { ...selections, ...bestCaseSelections };
  const standings = calculatePlayoffSeedings(team.conference, teams, games, fullSelections);
  const teamStanding = standings.find(s => s.team.id === teamId);

  return teamStanding?.seed ?? null;
}

/**
 * Calculate the worst possible seed a team can achieve
 * (team loses all remaining, competitors win all)
 */
function calculateWorstPossibleSeed(
  teamId: string,
  games: Game[],
  selections: Record<string, GameSelection>
): number | null {
  const team = teams.find(t => t.id === teamId);
  if (!team) return null;

  const remainingGames = getRemainingConferenceGames(team.conference, games);

  // Worst case: team loses all, competitors win all
  const worstCaseSelections: Record<string, GameSelection> = {};

  for (const game of remainingGames) {
    const isTeamHome = game.homeTeam.id === teamId;
    const isTeamAway = game.awayTeam.id === teamId;

    if (isTeamHome || isTeamAway) {
      // Team loses
      worstCaseSelections[game.id] = isTeamHome ? 'away' : 'home';
    } else {
      // For other games, we pick outcomes that hurt the team most
      // Competitors winning helps them stay ahead
      worstCaseSelections[game.id] = 'home'; // arbitrary for non-team games
    }
  }

  const fullSelections = { ...selections, ...worstCaseSelections };
  const standings = calculatePlayoffSeedings(team.conference, teams, games, fullSelections);
  const teamStanding = standings.find(s => s.team.id === teamId);

  return teamStanding?.seed ?? null;
}

/**
 * Generate a reason string for elimination
 */
function generateEliminationReason(
  teamId: string,
  games: Game[],
  selections: Record<string, GameSelection>,
  goalType: GoalType,
  bestSeed: number | null
): string {
  const team = teams.find(t => t.id === teamId);
  if (!team) return 'Invalid team';

  const record = getTeamRecord(teamId, games, selections);
  const remainingCount = getRemainingGames(teamId, games).length;
  const maxWins = record.wins + remainingCount;

  switch (goalType) {
    case 'playoff':
      if (bestSeed === null || bestSeed > 7) {
        return `Cannot reach playoff position (best: ${maxWins} wins with ${remainingCount} games remaining)`;
      }
      return 'Eliminated from playoff contention';
    case 'division':
      if (bestSeed === null || bestSeed > 4) {
        // Find division leader
        const divisionTeams = getTeamsByDivision(team.division);
        const standings = calculatePlayoffSeedings(team.conference, teams, games, selections);
        const divLeader = standings.find(s => divisionTeams.some(dt => dt.id === s.team.id));
        if (divLeader) {
          return `Cannot catch division leader (${divLeader.team.abbreviation})`;
        }
        return 'Cannot win division';
      }
      return 'Eliminated from division race';
    case 'bye':
      if (bestSeed === null || bestSeed > 1) {
        return 'Cannot achieve #1 seed';
      }
      return 'Eliminated from bye race';
    default:
      return 'Eliminated';
  }
}

/**
 * Check elimination status for a specific goal
 *
 * @param teamId - The team to check
 * @param games - All games
 * @param selections - Current game selections/results
 * @param goalType - The goal to check elimination for
 * @returns EliminationResult with details
 */
export function checkElimination(
  teamId: string,
  games: Game[],
  selections: Record<string, GameSelection>,
  goalType: GoalType
): EliminationResult {
  const team = teams.find(t => t.id === teamId);

  // Invalid team
  if (!team) {
    return {
      isEliminated: true,
      eliminatedFrom: ['playoff', 'division', 'bye'],
      reason: 'Invalid team ID',
      bestPossibleSeed: null,
      worstPossibleSeed: null,
    };
  }

  // Calculate best and worst possible seeds
  const bestSeed = calculateBestPossibleSeed(teamId, games, selections);
  const worstSeed = calculateWorstPossibleSeed(teamId, games, selections);

  // Check elimination for the specific goal
  const isEliminated = isTeamEliminatedFromGoal(teamId, games, selections, goalType);

  // Determine which goals the team is eliminated from
  const eliminatedFrom: GoalType[] = [];

  if (isTeamEliminatedFromGoal(teamId, games, selections, 'playoff')) {
    eliminatedFrom.push('playoff');
  }
  if (isTeamEliminatedFromGoal(teamId, games, selections, 'division')) {
    eliminatedFrom.push('division');
  }
  if (isTeamEliminatedFromGoal(teamId, games, selections, 'bye')) {
    eliminatedFrom.push('bye');
  }

  // Generate reason if eliminated
  const reason = isEliminated
    ? generateEliminationReason(teamId, games, selections, goalType, bestSeed)
    : undefined;

  return {
    isEliminated,
    eliminatedFrom,
    reason,
    bestPossibleSeed: eliminatedFrom.includes('playoff') ? null : bestSeed,
    worstPossibleSeed: eliminatedFrom.includes('playoff') ? null : worstSeed,
  };
}

/**
 * Check elimination status for all goal types at once
 *
 * @param teamId - The team to check
 * @param games - All games
 * @param selections - Current game selections/results
 * @returns AllGoalsEliminationResult with status for each goal type
 */
export function checkEliminationAllGoals(
  teamId: string,
  games: Game[],
  selections: Record<string, GameSelection>
): AllGoalsEliminationResult {
  return {
    playoff: checkElimination(teamId, games, selections, 'playoff'),
    division: checkElimination(teamId, games, selections, 'division'),
    bye: checkElimination(teamId, games, selections, 'bye'),
  };
}

// ============================================================================
// Phase 5: Clinching Detection
// ============================================================================

/**
 * Calculate the worst possible seed a team can achieve for clinch verification
 * (team loses all remaining, competitors win all)
 */
function calculateWorstCaseSeedForClinch(
  teamId: string,
  games: Game[],
  selections: Record<string, GameSelection>
): number | null {
  const team = teams.find(t => t.id === teamId);
  if (!team) return null;

  const remainingGames = getRemainingConferenceGames(team.conference, games);

  // Worst case: team loses all, competitors win all
  const worstCaseSelections: Record<string, GameSelection> = { ...selections };

  for (const game of remainingGames) {
    if (worstCaseSelections[game.id]) continue; // Already selected

    const isTeamHome = game.homeTeam.id === teamId;
    const isTeamAway = game.awayTeam.id === teamId;

    if (isTeamHome || isTeamAway) {
      // Team loses
      worstCaseSelections[game.id] = isTeamHome ? 'away' : 'home';
    } else {
      // For other games, let competitors win
      worstCaseSelections[game.id] = 'home';
    }
  }

  const standings = calculatePlayoffSeedings(team.conference, teams, games, worstCaseSelections);
  const teamStanding = standings.find(s => s.team.id === teamId);

  return teamStanding?.seed ?? null;
}

/**
 * Check if a team has clinched a specific goal
 *
 * @param teamId - The team to check
 * @param games - All games
 * @param selections - Current game selections/results
 * @param goalType - The goal to check clinch for
 * @returns ClinchResult with details
 */
export function checkClinch(
  teamId: string,
  games: Game[],
  selections: Record<string, GameSelection>,
  goalType: GoalType
): ClinchResult {
  const team = teams.find(t => t.id === teamId);

  // Invalid team
  if (!team) {
    return {
      hasClinched: false,
      clinchType: null,
    };
  }

  // Check if team has clinched using worst-case analysis
  const hasClinched = hasTeamClinched(teamId, games, selections, goalType);

  if (!hasClinched) {
    return {
      hasClinched: false,
      clinchType: null,
    };
  }

  // Calculate guaranteed (worst-case) seed
  const guaranteedSeed = calculateWorstCaseSeedForClinch(teamId, games, selections);

  // Determine clinch type based on guaranteed seed
  let clinchType: GoalType | null = null;
  let clinchScenario = '';

  if (guaranteedSeed !== null) {
    if (guaranteedSeed === 1) {
      clinchType = 'bye';
      clinchScenario = 'Clinched #1 seed and first-round bye';
    } else if (guaranteedSeed <= 4) {
      clinchType = 'division';
      clinchScenario = `Clinched division title (seed ${guaranteedSeed} or better)`;
    } else if (guaranteedSeed <= 7) {
      clinchType = 'playoff';
      clinchScenario = `Clinched playoff spot (seed ${guaranteedSeed} or better)`;
    }
  }

  // For the specific goal type, verify clinch
  if (goalType === 'bye' && guaranteedSeed !== 1) {
    return { hasClinched: false, clinchType: null };
  }
  if (goalType === 'division' && (guaranteedSeed === null || guaranteedSeed > 4)) {
    return { hasClinched: false, clinchType: null };
  }
  if (goalType === 'playoff' && (guaranteedSeed === null || guaranteedSeed > 7)) {
    return { hasClinched: false, clinchType: null };
  }

  return {
    hasClinched: true,
    clinchType,
    clinchScenario,
    guaranteedSeed: guaranteedSeed ?? undefined,
  };
}

/**
 * Get clinch conditions - what needs to happen for a team to clinch
 *
 * @param teamId - The team to check
 * @param games - All games
 * @param selections - Current game selections/results
 * @param goalType - The goal to check conditions for
 * @returns Array of ClinchCondition describing how to clinch
 */
export function getClinchConditions(
  teamId: string,
  games: Game[],
  selections: Record<string, GameSelection>,
  goalType: GoalType
): ClinchCondition[] {
  const team = teams.find(t => t.id === teamId);
  if (!team) return [];

  // If already clinched, no conditions needed
  if (hasTeamClinched(teamId, games, selections, goalType)) {
    return [{
      type: 'win',
      description: `Already clinched ${goalType}`,
    }];
  }

  // If eliminated, no conditions possible
  if (isTeamEliminatedFromGoal(teamId, games, selections, goalType)) {
    return [];
  }

  const conditions: ClinchCondition[] = [];
  const teamRemainingGames = getRemainingGames(teamId, games);
  const competitors = findCompetitors(teamId, games, selections, goalType);
  const competitorIds = new Set(competitors.map(c => c.id));

  // Find competitor remaining games
  const conferenceRemainingGames = getRemainingConferenceGames(team.conference, games);
  const competitorGames = conferenceRemainingGames.filter(
    g => g.homeTeam.id !== teamId && g.awayTeam.id !== teamId &&
         (competitorIds.has(g.homeTeam.id) || competitorIds.has(g.awayTeam.id))
  );

  // Check "clinch with win" scenarios
  for (const game of teamRemainingGames) {
    const isTeamHome = game.homeTeam.id === teamId;
    const testSelections: Record<string, GameSelection> = {
      ...selections,
      [game.id]: isTeamHome ? 'home' : 'away',
    };

    if (hasTeamClinched(teamId, games, testSelections, goalType)) {
      const opponent = isTeamHome ? game.awayTeam : game.homeTeam;
      conditions.push({
        type: 'win',
        teamGame: game.id,
        description: `Clinch with win vs ${opponent.abbreviation} (Week ${game.week})`,
      });
    }
  }

  // Check "clinch with opponent loss" scenarios
  for (const game of competitorGames) {
    const homeIsCompetitor = competitorIds.has(game.homeTeam.id);
    const awayIsCompetitor = competitorIds.has(game.awayTeam.id);

    // Determine which team losing helps us
    let competitorToLose: Team | null = null;
    let selectionForLoss: GameSelection | null = null;

    if (homeIsCompetitor && !awayIsCompetitor) {
      competitorToLose = game.homeTeam;
      selectionForLoss = 'away';
    } else if (awayIsCompetitor && !homeIsCompetitor) {
      competitorToLose = game.awayTeam;
      selectionForLoss = 'home';
    } else if (homeIsCompetitor && awayIsCompetitor) {
      // Both are competitors - either losing helps, pick home to lose
      competitorToLose = game.homeTeam;
      selectionForLoss = 'away';
    }

    if (competitorToLose && selectionForLoss) {
      const testSelections: Record<string, GameSelection> = {
        ...selections,
        [game.id]: selectionForLoss,
      };

      if (hasTeamClinched(teamId, games, testSelections, goalType)) {
        const opponent = selectionForLoss === 'away' ? game.awayTeam : game.homeTeam;
        conditions.push({
          type: 'opponent_loses',
          opponentGame: game.id,
          opponent: competitorToLose.id,
          description: `Clinch if ${competitorToLose.abbreviation} loses to ${opponent.abbreviation} (Week ${game.week})`,
        });
      }
    }
  }

  // Check combined "win OR opponent loses" scenarios
  // (These would be identified by having both a win condition and opponent_loses condition)

  // Check "win AND opponent loses" scenarios
  // For each team game, check if winning + an opponent loss leads to clinch
  for (const teamGame of teamRemainingGames) {
    const isTeamHome = teamGame.homeTeam.id === teamId;
    const winSelection: Record<string, GameSelection> = {
      ...selections,
      [teamGame.id]: isTeamHome ? 'home' : 'away',
    };

    // If win alone clinches, already covered
    if (hasTeamClinched(teamId, games, winSelection, goalType)) continue;

    for (const compGame of competitorGames) {
      if (compGame.id === teamGame.id) continue;

      const homeIsCompetitor = competitorIds.has(compGame.homeTeam.id);
      const awayIsCompetitor = competitorIds.has(compGame.awayTeam.id);

      let selectionForLoss: GameSelection | null = null;
      let competitorToLose: Team | null = null;

      if (homeIsCompetitor && !awayIsCompetitor) {
        selectionForLoss = 'away';
        competitorToLose = compGame.homeTeam;
      } else if (awayIsCompetitor && !homeIsCompetitor) {
        selectionForLoss = 'home';
        competitorToLose = compGame.awayTeam;
      } else if (homeIsCompetitor && awayIsCompetitor) {
        selectionForLoss = 'away';
        competitorToLose = compGame.homeTeam;
      }

      if (selectionForLoss && competitorToLose) {
        const combinedSelections: Record<string, GameSelection> = {
          ...winSelection,
          [compGame.id]: selectionForLoss,
        };

        if (hasTeamClinched(teamId, games, combinedSelections, goalType)) {
          const teamOpponent = isTeamHome ? teamGame.awayTeam : teamGame.homeTeam;
          const compOpponent = selectionForLoss === 'away' ? compGame.awayTeam : compGame.homeTeam;

          conditions.push({
            type: 'win_and_opponent_loses',
            teamGame: teamGame.id,
            opponentGame: compGame.id,
            opponent: competitorToLose.id,
            description: `Clinch with win vs ${teamOpponent.abbreviation} AND ${competitorToLose.abbreviation} loses to ${compOpponent.abbreviation}`,
          });
        }
      }
    }
  }

  // Deduplicate and sort conditions by complexity
  const uniqueConditions = conditions.filter((c, i, arr) =>
    arr.findIndex(x => x.description === c.description) === i
  );

  // Sort: win < opponent_loses < win_or < win_and
  const typeOrder = { win: 0, opponent_loses: 1, win_or_opponent_loses: 2, win_and_opponent_loses: 3 };
  uniqueConditions.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

  return uniqueConditions;
}
