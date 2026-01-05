import { useMemo } from 'react';
import type { Game, GameSelection, TeamStanding, Conference, PlayoffBracket } from '@/types';
import { teams } from '@/data/teams';
import { calculatePlayoffSeedings, calculateTeamRecords } from '@/utils/tiebreakers';
import { calculateStreak, calculateLastFive, isTeamEliminated, calculateMagicNumber, calculateTeamPaths } from '@/utils/teamPaths';
import type { MagicNumber } from '@/types';

interface UseStandingsReturn {
  afcStandings: TeamStanding[];
  nfcStandings: TeamStanding[];
  playoffBracket: PlayoffBracket;
  getTeamStanding: (teamId: string) => TeamStanding | undefined;
}

export function useStandings(
  games: Game[],
  selections: Record<string, GameSelection>
): UseStandingsReturn {
  const standings = useMemo(() => {
    const afcStandingsBase = calculatePlayoffSeedings('AFC', teams, games, selections);
    const nfcStandingsBase = calculatePlayoffSeedings('NFC', teams, games, selections);

    // Enhance standings with streak, last 5, elimination status, and magic numbers
    const enhanceStandings = (standingsList: TeamStanding[]): TeamStanding[] => {
      return standingsList.map(standing => {
        const streak = calculateStreak(standing.team.id, games, selections);
        const lastFive = calculateLastFive(standing.team.id, games, selections);
        const eliminated = standing.seed === null && isTeamEliminated(standing.team.id, games, selections);

        // Calculate magic numbers if not clinched/eliminated
        let magicNumber: MagicNumber | null = null;
        if (!standing.clinched && !eliminated) {
          const playoffMagic = calculateMagicNumber(standing.team.id, games, selections, standingsList, 'playoff');
          const divisionMagic = calculateMagicNumber(standing.team.id, games, selections, standingsList, 'division');
          const byeMagic = calculateMagicNumber(standing.team.id, games, selections, standingsList, 'bye');

          magicNumber = {
            playoff: playoffMagic.number,
            division: divisionMagic.number,
            bye: byeMagic.number,
            scenarios: [...playoffMagic.scenarios, ...divisionMagic.scenarios],
          };
        }

        return {
          ...standing,
          streak,
          lastFive,
          isEliminated: eliminated,
          magicNumber,
        };
      });
    };

    const afcStandings = enhanceStandings(afcStandingsBase);
    const nfcStandings = enhanceStandings(nfcStandingsBase);

    return { afcStandings, nfcStandings };
  }, [games, selections]);

  const playoffBracket = useMemo((): PlayoffBracket => {
    const afcSeeds = standings.afcStandings.filter(s => s.seed !== null).sort((a, b) => a.seed! - b.seed!);
    const nfcSeeds = standings.nfcStandings.filter(s => s.seed !== null).sort((a, b) => a.seed! - b.seed!);

    // Wild Card matchups (1 seed has bye)
    // 2 vs 7, 3 vs 6, 4 vs 5
    const createMatchup = (seeds: TeamStanding[], high: number, low: number) => ({
      higherSeed: seeds[high - 1]?.team || null,
      lowerSeed: seeds[low - 1]?.team || null,
      higherSeedScore: null,
      lowerSeedScore: null,
      winner: null,
    });

    return {
      afc: {
        seeds: afcSeeds.map(s => s.team),
        wildCard: [
          createMatchup(afcSeeds, 2, 7),
          createMatchup(afcSeeds, 3, 6),
          createMatchup(afcSeeds, 4, 5),
        ],
        divisional: [
          { higherSeed: null, lowerSeed: null, higherSeedScore: null, lowerSeedScore: null, winner: null },
          { higherSeed: null, lowerSeed: null, higherSeedScore: null, lowerSeedScore: null, winner: null },
        ],
        championship: { higherSeed: null, lowerSeed: null, higherSeedScore: null, lowerSeedScore: null, winner: null },
      },
      nfc: {
        seeds: nfcSeeds.map(s => s.team),
        wildCard: [
          createMatchup(nfcSeeds, 2, 7),
          createMatchup(nfcSeeds, 3, 6),
          createMatchup(nfcSeeds, 4, 5),
        ],
        divisional: [
          { higherSeed: null, lowerSeed: null, higherSeedScore: null, lowerSeedScore: null, winner: null },
          { higherSeed: null, lowerSeed: null, higherSeedScore: null, lowerSeedScore: null, winner: null },
        ],
        championship: { higherSeed: null, lowerSeed: null, higherSeedScore: null, lowerSeedScore: null, winner: null },
      },
      superBowl: {
        afc: null,
        nfc: null,
        winner: null,
      },
    };
  }, [standings]);

  const getTeamStanding = useMemo(() => {
    const standingMap = new Map<string, TeamStanding>();
    for (const s of [...standings.afcStandings, ...standings.nfcStandings]) {
      standingMap.set(s.team.id, s);
    }
    return (teamId: string) => standingMap.get(teamId);
  }, [standings]);

  return {
    afcStandings: standings.afcStandings,
    nfcStandings: standings.nfcStandings,
    playoffBracket,
    getTeamStanding,
  };
}

// Helper to format record string
export function formatRecord(standing: TeamStanding): string {
  if (standing.ties > 0) {
    return `${standing.wins}-${standing.losses}-${standing.ties}`;
  }
  return `${standing.wins}-${standing.losses}`;
}

// Helper to format division record
export function formatDivisionRecord(standing: TeamStanding): string {
  if (standing.divisionTies > 0) {
    return `${standing.divisionWins}-${standing.divisionLosses}-${standing.divisionTies}`;
  }
  return `${standing.divisionWins}-${standing.divisionLosses}`;
}

// Helper to format conference record
export function formatConferenceRecord(standing: TeamStanding): string {
  if (standing.conferenceTies > 0) {
    return `${standing.conferenceWins}-${standing.conferenceLosses}-${standing.conferenceTies}`;
  }
  return `${standing.conferenceWins}-${standing.conferenceLosses}`;
}

// Helper to get point differential with sign
export function formatPointDiff(standing: TeamStanding): string {
  const diff = standing.pointsFor - standing.pointsAgainst;
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}
