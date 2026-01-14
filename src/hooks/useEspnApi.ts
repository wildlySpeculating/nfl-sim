import { useState, useEffect, useCallback, useRef } from 'react';
import type { Game, Team, GameStatus } from '@/types';
import { getTeamByAbbreviation } from '@/data/teams';

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
const CURRENT_SEASON = 2025;
const REGULAR_SEASON_TYPE = 2;
const POSTSEASON_TYPE = 3;

export interface PlayoffGame {
  id: string;
  round: 'wildCard' | 'divisional' | 'championship' | 'superBowl';
  conference: 'afc' | 'nfc' | null; // null for Super Bowl
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  status: GameStatus;
  winnerId: string | null;
}

export interface EspnTeamStanding {
  teamId: string;
  wins: number;
  losses: number;
  ties: number;
  playoffSeed: number | null;
  divisionWins: number;
  divisionLosses: number;
  conferenceWins: number;
  conferenceLosses: number;
  pointsFor: number;
  pointsAgainst: number;
}

interface UseEspnApiReturn {
  games: Game[];
  playoffGames: PlayoffGame[];
  espnStandings: EspnTeamStanding[];
  currentWeek: number;
  isLoading: boolean;
  error: string | null;
  isStale: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 60 * 1000; // 1 minute
const STALE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchWithRetry<T>(
  url: string,
  retries = 3,
  delay = 1000
): Promise<T> {
  const cacheKey = url;
  const cached = cache.get(cacheKey) as CacheEntry<T> | undefined;

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json() as T;
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      if (attempt === retries - 1) {
        // On final retry, return cached data if available (even if stale)
        if (cached) {
          return cached.data;
        }
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
  throw new Error('Failed to fetch after retries');
}

function parseEspnGame(event: EspnEvent): Game | null {
  try {
    const competition = event.competitions[0];
    const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');
    const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');

    if (!homeCompetitor || !awayCompetitor) return null;

    const homeTeam = getTeamByAbbreviation(homeCompetitor.team.abbreviation);
    const awayTeam = getTeamByAbbreviation(awayCompetitor.team.abbreviation);

    if (!homeTeam || !awayTeam) return null;

    let status: GameStatus = 'scheduled';
    if (event.status.type.completed) {
      status = 'final';
    } else if (event.status.type.name === 'STATUS_IN_PROGRESS' ||
               event.status.type.name === 'STATUS_HALFTIME') {
      status = 'in_progress';
    }

    return {
      id: event.id,
      week: 0, // Will be set by caller
      homeTeam,
      awayTeam,
      kickoffTime: new Date(event.date),
      status,
      homeScore: homeCompetitor.score ? parseInt(homeCompetitor.score, 10) : null,
      awayScore: awayCompetitor.score ? parseInt(awayCompetitor.score, 10) : null,
    };
  } catch {
    return null;
  }
}

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

function parsePlayoffGame(event: EspnEvent, round: PlayoffGame['round']): PlayoffGame | null {
  try {
    const competition = event.competitions[0];
    const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');
    const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');

    if (!homeCompetitor || !awayCompetitor) return null;

    const homeTeam = getTeamByAbbreviation(homeCompetitor.team.abbreviation);
    const awayTeam = getTeamByAbbreviation(awayCompetitor.team.abbreviation);

    if (!homeTeam || !awayTeam) return null;

    let status: GameStatus = 'scheduled';
    if (event.status.type.completed) {
      status = 'final';
    } else if (event.status.type.name === 'STATUS_IN_PROGRESS' ||
               event.status.type.name === 'STATUS_HALFTIME') {
      status = 'in_progress';
    }

    const homeScore = homeCompetitor.score ? parseInt(homeCompetitor.score, 10) : null;
    const awayScore = awayCompetitor.score ? parseInt(awayCompetitor.score, 10) : null;

    let winnerId: string | null = null;
    if (status === 'final' && homeScore !== null && awayScore !== null) {
      winnerId = homeScore > awayScore ? homeTeam.id : awayTeam.id;
    }

    // Determine conference (null for Super Bowl)
    let conference: 'afc' | 'nfc' | null = null;
    if (round !== 'superBowl') {
      conference = homeTeam.conference === 'AFC' ? 'afc' : 'nfc';
    }

    return {
      id: event.id,
      round,
      conference,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      status,
      winnerId,
    };
  } catch {
    return null;
  }
}

// Parse ESPN standings response
interface EspnStandingsEntry {
  team: { abbreviation: string };
  stats: { id?: string; name: string; value: number; displayValue?: string }[];
}

interface EspnStandingsResponse {
  children: {
    standings: {
      entries: EspnStandingsEntry[];
    };
  }[];
}

function parseEspnStandings(data: EspnStandingsResponse): EspnTeamStanding[] {
  const standings: EspnTeamStanding[] = [];

  for (const division of data.children) {
    for (const entry of division.standings.entries) {
      const team = getTeamByAbbreviation(entry.team.abbreviation);
      if (!team) continue;

      const getStat = (name: string): number => {
        const stat = entry.stats.find(s => s.name === name);
        return stat?.value ?? 0;
      };

      // Parse division record from displayValue (e.g., "5-1")
      const divRecord = entry.stats.find(s => s.name === 'divisionRecord')?.displayValue || '0-0';
      const [divWins, divLosses] = divRecord.split('-').map(Number);

      // Parse conference record
      const confRecord = entry.stats.find(s => s.id === '906')?.displayValue || '0-0';
      const [confWins, confLosses] = confRecord.split('-').map(Number);

      const playoffSeedValue = getStat('playoffSeed');

      standings.push({
        teamId: team.id,
        wins: getStat('wins'),
        losses: getStat('losses'),
        ties: getStat('ties'),
        playoffSeed: playoffSeedValue > 0 && playoffSeedValue <= 7 ? playoffSeedValue : null,
        divisionWins: divWins || 0,
        divisionLosses: divLosses || 0,
        conferenceWins: confWins || 0,
        conferenceLosses: confLosses || 0,
        pointsFor: getStat('pointsFor'),
        pointsAgainst: getStat('pointsAgainst'),
      });
    }
  }

  return standings;
}

export function useEspnApi(pollInterval = 45000): UseEspnApiReturn {
  const [games, setGames] = useState<Game[]>([]);
  const [playoffGames, setPlayoffGames] = useState<PlayoffGame[]>([]);
  const [espnStandings, setEspnStandings] = useState<EspnTeamStanding[]>([]);
  const [currentWeek, setCurrentWeek] = useState(18);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);
  const pollTimerRef = useRef<number | null>(null);

  const fetchAllWeeks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, get current week
      const currentWeekUrl = `${ESPN_BASE_URL}/scoreboard?seasontype=${REGULAR_SEASON_TYPE}`;
      const currentWeekData = await fetchWithRetry<EspnScoreboardResponse>(currentWeekUrl);
      // Cap at week 18 for regular season (if past regular season, show week 18)
      const week = Math.min(currentWeekData.week?.number || 18, 18);
      setCurrentWeek(week);

      // Fetch all weeks (1-18 for regular season)
      const allGames: Game[] = [];
      const weekPromises: Promise<void>[] = [];

      for (let w = 1; w <= 18; w++) {
        const promise = (async () => {
          try {
            const url = `${ESPN_BASE_URL}/scoreboard?week=${w}&seasontype=${REGULAR_SEASON_TYPE}&dates=${CURRENT_SEASON}`;
            const data = await fetchWithRetry<EspnScoreboardResponse>(url);

            for (const event of data.events) {
              const game = parseEspnGame(event);
              if (game) {
                game.week = w;
                allGames.push(game);
              }
            }
          } catch (e) {
            console.error(`Error fetching week ${w}:`, e);
          }
        })();
        weekPromises.push(promise);
      }

      await Promise.all(weekPromises);

      // Sort games by week then by kickoff time
      allGames.sort((a, b) => {
        if (a.week !== b.week) return a.week - b.week;
        return a.kickoffTime.getTime() - b.kickoffTime.getTime();
      });

      setGames(allGames);

      // Fetch playoff games
      const allPlayoffGames: PlayoffGame[] = [];
      const playoffRounds: { week: number; round: PlayoffGame['round'] }[] = [
        { week: 1, round: 'wildCard' },
        { week: 2, round: 'divisional' },
        { week: 3, round: 'championship' },
        { week: 4, round: 'superBowl' },
      ];

      const playoffPromises = playoffRounds.map(async ({ week: playoffWeek, round }) => {
        try {
          const url = `${ESPN_BASE_URL}/scoreboard?week=${playoffWeek}&seasontype=${POSTSEASON_TYPE}&dates=${CURRENT_SEASON}`;
          const data = await fetchWithRetry<EspnScoreboardResponse>(url);

          for (const event of data.events) {
            const game = parsePlayoffGame(event, round);
            if (game) {
              allPlayoffGames.push(game);
            }
          }
        } catch (e) {
          // Playoff data may not be available yet
          console.log(`Playoff week ${playoffWeek} not available yet`);
        }
      });

      await Promise.all(playoffPromises);
      setPlayoffGames(allPlayoffGames);

      // Fetch standings from ESPN
      try {
        const standingsUrl = 'https://site.api.espn.com/apis/v2/sports/football/nfl/standings';
        const standingsData = await fetchWithRetry<EspnStandingsResponse>(standingsUrl);
        const parsedStandings = parseEspnStandings(standingsData);
        setEspnStandings(parsedStandings);
      } catch (e) {
        console.error('Error fetching standings:', e);
      }

      setLastUpdated(new Date());
      setIsStale(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch games');
      setIsStale(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchAllWeeks();
  }, [fetchAllWeeks]);

  // Initial fetch
  useEffect(() => {
    fetchAllWeeks();
  }, [fetchAllWeeks]);

  // Polling for live updates
  useEffect(() => {
    const hasLiveGames = games.some(g => g.status === 'in_progress');

    if (hasLiveGames && pollInterval > 0) {
      pollTimerRef.current = window.setInterval(() => {
        fetchAllWeeks();
      }, pollInterval);
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [games, pollInterval, fetchAllWeeks]);

  // Check staleness
  useEffect(() => {
    const checkStale = setInterval(() => {
      if (lastUpdated && Date.now() - lastUpdated.getTime() > STALE_TTL) {
        setIsStale(true);
      }
    }, 30000);

    return () => clearInterval(checkStale);
  }, [lastUpdated]);

  return {
    games,
    playoffGames,
    espnStandings,
    currentWeek,
    isLoading,
    error,
    isStale,
    lastUpdated,
    refresh,
  };
}

// Hook for fetching specific team schedule
export function useTeamSchedule(teamId: string) {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSchedule() {
      setIsLoading(true);
      try {
        const url = `${ESPN_BASE_URL}/teams/${teamId}/schedule?season=${CURRENT_SEASON}`;
        const data = await fetchWithRetry<{ events: EspnEvent[] }>(url);

        const teamGames = data.events
          .map(event => parseEspnGame(event))
          .filter((game): game is Game => game !== null);

        setGames(teamGames);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch schedule');
      } finally {
        setIsLoading(false);
      }
    }

    if (teamId) {
      fetchSchedule();
    }
  }, [teamId]);

  return { games, isLoading, error };
}
