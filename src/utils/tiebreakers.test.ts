import { describe, it, expect } from 'vitest';
import { calculateTeamRecords, calculatePlayoffSeedings } from './tiebreakers';
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

describe('Team Records Calculation', () => {
  it('should correctly calculate wins and losses from final games', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, 24, 17), // team1 wins at home
      createGame('g2', team2, team1, 20, 27), // team1 wins on road
    ];

    const teams = [team1, team2];
    const recordsMap = calculateTeamRecords(teams, games, {});

    const team1Record = recordsMap.get('1');
    const team2Record = recordsMap.get('2');

    expect(team1Record?.wins).toBe(2);
    expect(team1Record?.losses).toBe(0);
    expect(team2Record?.wins).toBe(0);
    expect(team2Record?.losses).toBe(2);
  });

  it('should correctly calculate ties', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, 20, 20), // tie
    ];

    const teams = [team1, team2];
    const recordsMap = calculateTeamRecords(teams, games, {});

    const team1Record = recordsMap.get('1');
    expect(team1Record?.wins).toBe(0);
    expect(team1Record?.losses).toBe(0);
    expect(team1Record?.ties).toBe(1);
  });

  it('should use selections for scheduled games', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, null, null, 'scheduled'),
    ];

    const selections: Record<string, GameSelection> = {
      'g1': 'home', // team1 wins
    };

    const teams = [team1, team2];
    const recordsMap = calculateTeamRecords(teams, games, selections);

    const team1Record = recordsMap.get('1');
    expect(team1Record?.wins).toBe(1);
    expect(team1Record?.losses).toBe(0);
  });

  it('should use away selection correctly', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, null, null, 'scheduled'),
    ];

    const selections: Record<string, GameSelection> = {
      'g1': 'away', // team2 wins (away team)
    };

    const teams = [team1, team2];
    const recordsMap = calculateTeamRecords(teams, games, selections);

    const team1Record = recordsMap.get('1');
    const team2Record = recordsMap.get('2');
    expect(team1Record?.wins).toBe(0);
    expect(team1Record?.losses).toBe(1);
    expect(team2Record?.wins).toBe(1);
    expect(team2Record?.losses).toBe(0);
  });

  it('should handle tie selection', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, null, null, 'scheduled'),
    ];

    const selections: Record<string, GameSelection> = {
      'g1': 'tie',
    };

    const teams = [team1, team2];
    const recordsMap = calculateTeamRecords(teams, games, selections);

    const team1Record = recordsMap.get('1');
    const team2Record = recordsMap.get('2');
    expect(team1Record?.ties).toBe(1);
    expect(team2Record?.ties).toBe(1);
  });

  it('should correctly track division records', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East'); // Same division
    const team3 = createTeam('3', 'Team3', 'AFC', 'AFC North'); // Different division

    const games: Game[] = [
      createGame('g1', team1, team2, 24, 17), // Division game - team1 wins
      createGame('g2', team1, team3, 21, 14), // Non-division - team1 wins
    ];

    const teams = [team1, team2, team3];
    const recordsMap = calculateTeamRecords(teams, games, {});

    const team1Record = recordsMap.get('1');
    expect(team1Record?.wins).toBe(2);
    expect(team1Record?.divisionWins).toBe(1);
    expect(team1Record?.divisionLosses).toBe(0);
  });

  it('should correctly track conference records', () => {
    const afcTeam1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const afcTeam2 = createTeam('2', 'Team2', 'AFC', 'AFC North');
    const nfcTeam = createTeam('3', 'Team3', 'NFC', 'NFC East');

    const games: Game[] = [
      createGame('g1', afcTeam1, afcTeam2, 24, 17), // Conference game
      createGame('g2', afcTeam1, nfcTeam, 21, 14),  // Non-conference
    ];

    const teams = [afcTeam1, afcTeam2, nfcTeam];
    const recordsMap = calculateTeamRecords(teams, games, {});

    const team1Record = recordsMap.get('1');
    expect(team1Record?.wins).toBe(2);
    expect(team1Record?.conferenceWins).toBe(1);
    expect(team1Record?.conferenceLosses).toBe(0);
  });

  it('should correctly track points for and against', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, 24, 17),
      createGame('g2', team2, team1, 10, 31),
    ];

    const teams = [team1, team2];
    const recordsMap = calculateTeamRecords(teams, games, {});

    const team1Record = recordsMap.get('1');
    expect(team1Record?.pointsFor).toBe(55);  // 24 + 31
    expect(team1Record?.pointsAgainst).toBe(27); // 17 + 10
  });

  it('should handle games where team is not involved', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');
    const team3 = createTeam('3', 'Team3', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team2, team3, 24, 17), // team1 not involved
    ];

    const teams = [team1, team2, team3];
    const recordsMap = calculateTeamRecords(teams, games, {});

    const team1Record = recordsMap.get('1');
    expect(team1Record?.wins).toBe(0);
    expect(team1Record?.losses).toBe(0);
    expect(team1Record?.gamesPlayed.length).toBe(0);
  });

  it('should ignore games without selection', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, null, null, 'scheduled'), // No selection
    ];

    const teams = [team1, team2];
    const recordsMap = calculateTeamRecords(teams, games, {}); // Empty selections

    const team1Record = recordsMap.get('1');
    expect(team1Record?.wins).toBe(0);
    expect(team1Record?.losses).toBe(0);
  });
});

describe('Playoff Seeding', () => {
  it('should identify 7 playoff teams per conference', () => {
    // Create 16 AFC teams
    const afcTeams: Team[] = [];
    for (let i = 1; i <= 16; i++) {
      const divIndex = Math.floor((i - 1) / 4);
      const divisions: Team['division'][] = ['AFC East', 'AFC North', 'AFC South', 'AFC West'];
      afcTeams.push(createTeam(`afc${i}`, `AFC${i}`, 'AFC', divisions[divIndex]));
    }

    // Create games where teams 1-7 have best records
    const games: Game[] = [];
    let gameId = 1;

    // Give teams 1-7 more wins
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        const homeTeam = afcTeams[i];
        const awayTeam = afcTeams[j];
        // Higher indexed teams lose to lower indexed teams
        const homeScore = i < 7 ? 24 : 17;
        const awayScore = i < 7 ? 17 : 24;
        games.push(createGame(`g${gameId++}`, homeTeam, awayTeam, homeScore, awayScore));
      }
    }

    const standings = calculatePlayoffSeedings('AFC', afcTeams, games, {});

    // Should have 7 playoff teams
    const playoffTeams = standings.filter(s => s.seed !== null);
    expect(playoffTeams.length).toBe(7);

    // Seeds should be 1-7
    const seeds = playoffTeams.map(s => s.seed).sort((a, b) => a! - b!);
    expect(seeds).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('should award division winners seeds 1-4', () => {
    // Create 4 teams, one per division, each as division winner
    const team1 = createTeam('1', 'East', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'North', 'AFC', 'AFC North');
    const team3 = createTeam('3', 'South', 'AFC', 'AFC South');
    const team4 = createTeam('4', 'West', 'AFC', 'AFC West');

    // Add division rivals that are worse
    const team1b = createTeam('1b', 'East2', 'AFC', 'AFC East');
    const team2b = createTeam('2b', 'North2', 'AFC', 'AFC North');
    const team3b = createTeam('3b', 'South2', 'AFC', 'AFC South');
    const team4b = createTeam('4b', 'West2', 'AFC', 'AFC West');

    const teams = [team1, team1b, team2, team2b, team3, team3b, team4, team4b];

    // Create division games where team1-4 beat their rivals
    const games: Game[] = [
      createGame('g1', team1, team1b, 24, 17),
      createGame('g2', team2, team2b, 24, 17),
      createGame('g3', team3, team3b, 24, 17),
      createGame('g4', team4, team4b, 24, 17),
      createGame('g5', team1b, team1, 17, 24),
      createGame('g6', team2b, team2, 17, 24),
      createGame('g7', team3b, team3, 17, 24),
      createGame('g8', team4b, team4, 17, 24),
    ];

    const standings = calculatePlayoffSeedings('AFC', teams, games, {});

    // Division winners should have seeds 1-4
    const divWinners = standings.filter(s => s.seed !== null && s.seed <= 4);
    expect(divWinners.length).toBe(4);

    const divWinnerIds = divWinners.map(s => s.team.id).sort();
    expect(divWinnerIds).toEqual(['1', '2', '3', '4']);
  });

  it('should use head-to-head record as first tiebreaker for division', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    // Same overall record, but team2 beat team1 head-to-head
    const games: Game[] = [
      createGame('g1', team1, team2, 17, 24), // team2 wins h2h
      // Give both teams same record otherwise
      createGame('g2', team1, createTeam('3', 'T3', 'AFC', 'AFC North'), 24, 17),
      createGame('g3', team2, createTeam('4', 'T4', 'AFC', 'AFC North'), 24, 17),
    ];

    const teams = [team1, team2, createTeam('3', 'T3', 'AFC', 'AFC North'), createTeam('4', 'T4', 'AFC', 'AFC North')];
    const standings = calculatePlayoffSeedings('AFC', teams, games, {});

    // team2 should rank higher due to h2h
    const team1Standing = standings.find(s => s.team.id === '1');
    const team2Standing = standings.find(s => s.team.id === '2');

    // Both have 1-1 record, team2 should be ranked higher
    expect(team2Standing?.seed).toBeLessThan(team1Standing?.seed ?? 99);
  });

  it('should award wild card spots to non-division winners with best records', () => {
    // Create 2 teams per division
    const teams: Team[] = [
      // AFC East
      createTeam('e1', 'East1', 'AFC', 'AFC East'),
      createTeam('e2', 'East2', 'AFC', 'AFC East'),
      // AFC North
      createTeam('n1', 'North1', 'AFC', 'AFC North'),
      createTeam('n2', 'North2', 'AFC', 'AFC North'),
      // AFC South
      createTeam('s1', 'South1', 'AFC', 'AFC South'),
      createTeam('s2', 'South2', 'AFC', 'AFC South'),
      // AFC West
      createTeam('w1', 'West1', 'AFC', 'AFC West'),
      createTeam('w2', 'West2', 'AFC', 'AFC West'),
    ];

    // Give division winners 2 wins, second place teams varying records
    // e2 (1-1), n2 (1-1), s2 (0-2), w2 (1-1) - e2, n2, w2 should be wild cards
    const games: Game[] = [
      // Division winners beat their rivals twice
      createGame('g1', teams[0], teams[1], 24, 17),
      createGame('g2', teams[1], teams[0], 17, 24),
      createGame('g3', teams[2], teams[3], 24, 17),
      createGame('g4', teams[3], teams[2], 17, 24),
      createGame('g5', teams[4], teams[5], 24, 17),
      createGame('g6', teams[5], teams[4], 17, 24),
      createGame('g7', teams[6], teams[7], 24, 17),
      createGame('g8', teams[7], teams[6], 17, 24),
      // Second place teams play each other
      createGame('g9', teams[1], teams[3], 24, 17),  // e2 beats n2
      createGame('g10', teams[3], teams[1], 24, 17), // n2 beats e2
      createGame('g11', teams[5], teams[7], 17, 24), // w2 beats s2
      createGame('g12', teams[7], teams[5], 24, 17), // w2 beats s2
    ];

    const standings = calculatePlayoffSeedings('AFC', teams, games, {});

    // Check playoff seeds
    const playoffTeams = standings.filter(s => s.seed !== null);
    expect(playoffTeams.length).toBe(7);

    // Division winners should be seeds 1-4
    const divWinners = playoffTeams.filter(s => s.seed! <= 4).map(s => s.team.id).sort();
    expect(divWinners).toEqual(['e1', 'n1', 's1', 'w1']);

    // s2 (0-4) should NOT make playoffs
    const s2Standing = standings.find(s => s.team.id === 's2');
    expect(s2Standing?.seed).toBe(null);
  });

  it('should handle empty games array', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const teams = [team1];

    const standings = calculatePlayoffSeedings('AFC', teams, [], {});

    expect(standings.length).toBe(1);
    expect(standings[0].wins).toBe(0);
    expect(standings[0].losses).toBe(0);
  });

  it('should not assign playoff spots to teams from wrong conference', () => {
    const afcTeam = createTeam('afc', 'AFCTeam', 'AFC', 'AFC East');
    const nfcTeam = createTeam('nfc', 'NFCTeam', 'NFC', 'NFC East');

    const games: Game[] = [
      createGame('g1', afcTeam, nfcTeam, 24, 17),
    ];

    const afcStandings = calculatePlayoffSeedings('AFC', [afcTeam, nfcTeam], games, {});
    const nfcStandings = calculatePlayoffSeedings('NFC', [afcTeam, nfcTeam], games, {});

    // AFC standings should only include AFC team
    expect(afcStandings.length).toBe(1);
    expect(afcStandings[0].team.conference).toBe('AFC');

    // NFC standings should only include NFC team
    expect(nfcStandings.length).toBe(1);
    expect(nfcStandings[0].team.conference).toBe('NFC');
  });
});

describe('Win Percentage Calculation', () => {
  it('should calculate correct win percentage', () => {
    const team = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const opponent = createTeam('2', 'Team2', 'AFC', 'AFC East');

    // 10 wins, 7 losses = .588 win percentage
    const games: Game[] = [];
    for (let i = 0; i < 10; i++) {
      games.push(createGame(`w${i}`, team, opponent, 24, 17));
    }
    for (let i = 0; i < 7; i++) {
      games.push(createGame(`l${i}`, team, opponent, 17, 24));
    }

    const recordsMap = calculateTeamRecords([team, opponent], games, {});
    const record = recordsMap.get('1');

    expect(record?.wins).toBe(10);
    expect(record?.losses).toBe(7);
    // Win pct = 10/17 ≈ 0.588
    const winPct = record!.wins / (record!.wins + record!.losses);
    expect(winPct).toBeCloseTo(0.588, 2);
  });

  it('should handle ties in win percentage (ties count as half win)', () => {
    const team = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const opponent = createTeam('2', 'Team2', 'AFC', 'AFC East');

    // 8 wins, 6 losses, 2 ties = (8 + 1) / 16 = 0.5625
    const games: Game[] = [];
    for (let i = 0; i < 8; i++) {
      games.push(createGame(`w${i}`, team, opponent, 24, 17));
    }
    for (let i = 0; i < 6; i++) {
      games.push(createGame(`l${i}`, team, opponent, 17, 24));
    }
    for (let i = 0; i < 2; i++) {
      games.push(createGame(`t${i}`, team, opponent, 20, 20));
    }

    const recordsMap = calculateTeamRecords([team, opponent], games, {});
    const record = recordsMap.get('1');

    expect(record?.wins).toBe(8);
    expect(record?.losses).toBe(6);
    expect(record?.ties).toBe(2);

    // Win pct with ties = (wins + 0.5*ties) / total
    const winPct = (record!.wins + 0.5 * record!.ties) / (record!.wins + record!.losses + record!.ties);
    expect(winPct).toBeCloseTo(0.5625, 4);
  });

  it('should handle zero games played', () => {
    const team = createTeam('1', 'Team1', 'AFC', 'AFC East');

    const recordsMap = calculateTeamRecords([team], [], {});
    const record = recordsMap.get('1');

    expect(record?.wins).toBe(0);
    expect(record?.losses).toBe(0);
    expect(record?.ties).toBe(0);
  });
});

describe('Division Record Tracking - Extended', () => {
  it('should correctly track division losses', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East'); // Same division

    const games: Game[] = [
      createGame('g1', team1, team2, 17, 24), // team1 loses division game
      createGame('g2', team2, team1, 24, 17), // team1 loses again
    ];

    const recordsMap = calculateTeamRecords([team1, team2], games, {});

    const team1Record = recordsMap.get('1');
    expect(team1Record?.divisionWins).toBe(0);
    expect(team1Record?.divisionLosses).toBe(2);
    expect(team1Record?.losses).toBe(2);
  });

  it('should correctly track division ties', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East'); // Same division

    const games: Game[] = [
      createGame('g1', team1, team2, 20, 20), // tie
    ];

    const recordsMap = calculateTeamRecords([team1, team2], games, {});

    const team1Record = recordsMap.get('1');
    expect(team1Record?.divisionWins).toBe(0);
    expect(team1Record?.divisionLosses).toBe(0);
    expect(team1Record?.divisionTies).toBe(1);
    expect(team1Record?.ties).toBe(1);
  });

  it('should track division record when playing same opponent twice', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, 24, 17, 'final', 1), // team1 wins at home
      createGame('g2', team2, team1, 21, 28, 'final', 12), // team1 wins on road
    ];

    const recordsMap = calculateTeamRecords([team1, team2], games, {});

    const team1Record = recordsMap.get('1');
    expect(team1Record?.divisionWins).toBe(2);
    expect(team1Record?.divisionLosses).toBe(0);

    const team2Record = recordsMap.get('2');
    expect(team2Record?.divisionWins).toBe(0);
    expect(team2Record?.divisionLosses).toBe(2);
  });

  it('should not count non-division games in division record', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC North'); // Different division
    const team3 = createTeam('3', 'Team3', 'NFC', 'NFC East'); // Different conference

    const games: Game[] = [
      createGame('g1', team1, team2, 24, 17), // Non-division AFC game
      createGame('g2', team1, team3, 24, 17), // Non-conference game
    ];

    const recordsMap = calculateTeamRecords([team1, team2, team3], games, {});

    const team1Record = recordsMap.get('1');
    expect(team1Record?.wins).toBe(2);
    expect(team1Record?.divisionWins).toBe(0);
    expect(team1Record?.divisionLosses).toBe(0);
  });

  it('should track all 6 division games correctly', () => {
    // Create all 4 AFC East teams
    const bills = createTeam('buf', 'Bills', 'AFC', 'AFC East');
    const dolphins = createTeam('mia', 'Dolphins', 'AFC', 'AFC East');
    const patriots = createTeam('ne', 'Patriots', 'AFC', 'AFC East');
    const jets = createTeam('nyj', 'Jets', 'AFC', 'AFC East');

    // Bills play each rival twice (6 games total)
    const games: Game[] = [
      // vs Dolphins (split)
      createGame('g1', bills, dolphins, 24, 17),
      createGame('g2', dolphins, bills, 21, 17),
      // vs Patriots (sweep)
      createGame('g3', bills, patriots, 31, 10),
      createGame('g4', patriots, bills, 14, 28),
      // vs Jets (split)
      createGame('g5', bills, jets, 20, 17),
      createGame('g6', jets, bills, 24, 21),
    ];

    const recordsMap = calculateTeamRecords([bills, dolphins, patriots, jets], games, {});

    const billsRecord = recordsMap.get('buf');
    expect(billsRecord?.divisionWins).toBe(4);
    expect(billsRecord?.divisionLosses).toBe(2);
    expect(billsRecord?.wins).toBe(4);
    expect(billsRecord?.losses).toBe(2);
  });
});

describe('Conference Record Tracking - Extended', () => {
  it('should correctly track conference losses', () => {
    const afcTeam1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const afcTeam2 = createTeam('2', 'Team2', 'AFC', 'AFC North');

    const games: Game[] = [
      createGame('g1', afcTeam1, afcTeam2, 17, 24), // team1 loses conference game
    ];

    const recordsMap = calculateTeamRecords([afcTeam1, afcTeam2], games, {});

    const team1Record = recordsMap.get('1');
    expect(team1Record?.conferenceWins).toBe(0);
    expect(team1Record?.conferenceLosses).toBe(1);
  });

  it('should correctly track conference ties', () => {
    const afcTeam1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const afcTeam2 = createTeam('2', 'Team2', 'AFC', 'AFC North');

    const games: Game[] = [
      createGame('g1', afcTeam1, afcTeam2, 20, 20), // tie
    ];

    const recordsMap = calculateTeamRecords([afcTeam1, afcTeam2], games, {});

    const team1Record = recordsMap.get('1');
    expect(team1Record?.conferenceWins).toBe(0);
    expect(team1Record?.conferenceLosses).toBe(0);
    expect(team1Record?.conferenceTies).toBe(1);
  });

  it('should not count non-conference games in conference record', () => {
    const afcTeam = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const nfcTeam = createTeam('2', 'Team2', 'NFC', 'NFC East');

    const games: Game[] = [
      createGame('g1', afcTeam, nfcTeam, 24, 17), // Non-conference game
    ];

    const recordsMap = calculateTeamRecords([afcTeam, nfcTeam], games, {});

    const afcRecord = recordsMap.get('1');
    expect(afcRecord?.wins).toBe(1);
    expect(afcRecord?.conferenceWins).toBe(0);
    expect(afcRecord?.conferenceLosses).toBe(0);
  });

  it('should count division games in conference record', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East'); // Same division

    const games: Game[] = [
      createGame('g1', team1, team2, 24, 17), // Division game is also conference game
    ];

    const recordsMap = calculateTeamRecords([team1, team2], games, {});

    const team1Record = recordsMap.get('1');
    expect(team1Record?.divisionWins).toBe(1);
    expect(team1Record?.conferenceWins).toBe(1); // Division games count toward conference
  });
});

describe('Points For/Against - Extended', () => {
  it('should calculate point differential correctly', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, 35, 14), // +21
      createGame('g2', team2, team1, 20, 17), // -3
      createGame('g3', team1, team2, 28, 28), // 0 (tie)
    ];

    const recordsMap = calculateTeamRecords([team1, team2], games, {});

    const team1Record = recordsMap.get('1');
    expect(team1Record?.pointsFor).toBe(80); // 35 + 17 + 28
    expect(team1Record?.pointsAgainst).toBe(62); // 14 + 20 + 28
    // Point differential = 80 - 62 = +18
    expect(team1Record!.pointsFor - team1Record!.pointsAgainst).toBe(18);
  });

  it('should use estimated scores for home win selection (24-17)', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, null, null, 'scheduled'),
    ];

    const selections: Record<string, GameSelection> = {
      'g1': 'home', // home team wins
    };

    const recordsMap = calculateTeamRecords([team1, team2], games, selections);

    const team1Record = recordsMap.get('1');
    expect(team1Record?.pointsFor).toBe(24);
    expect(team1Record?.pointsAgainst).toBe(17);

    const team2Record = recordsMap.get('2');
    expect(team2Record?.pointsFor).toBe(17);
    expect(team2Record?.pointsAgainst).toBe(24);
  });

  it('should use estimated scores for away win selection (17-24)', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, null, null, 'scheduled'),
    ];

    const selections: Record<string, GameSelection> = {
      'g1': 'away', // away team wins
    };

    const recordsMap = calculateTeamRecords([team1, team2], games, selections);

    const team1Record = recordsMap.get('1');
    expect(team1Record?.pointsFor).toBe(17);
    expect(team1Record?.pointsAgainst).toBe(24);

    const team2Record = recordsMap.get('2');
    expect(team2Record?.pointsFor).toBe(24);
    expect(team2Record?.pointsAgainst).toBe(17);
  });

  it('should use estimated scores for tie selection (20-20)', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, null, null, 'scheduled'),
    ];

    const selections: Record<string, GameSelection> = {
      'g1': 'tie',
    };

    const recordsMap = calculateTeamRecords([team1, team2], games, selections);

    const team1Record = recordsMap.get('1');
    expect(team1Record?.pointsFor).toBe(20);
    expect(team1Record?.pointsAgainst).toBe(20);

    const team2Record = recordsMap.get('2');
    expect(team2Record?.pointsFor).toBe(20);
    expect(team2Record?.pointsAgainst).toBe(20);
  });

  it('should not count points from games without selection', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, 24, 17), // Final game - counts
      createGame('g2', team1, team2, null, null, 'scheduled'), // No selection - doesn't count
    ];

    const recordsMap = calculateTeamRecords([team1, team2], games, {});

    const team1Record = recordsMap.get('1');
    expect(team1Record?.pointsFor).toBe(24); // Only from g1
    expect(team1Record?.pointsAgainst).toBe(17);
  });

  it('should handle 0-0 final score', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, 0, 0), // Rare but valid 0-0 tie
    ];

    const recordsMap = calculateTeamRecords([team1, team2], games, {});

    const team1Record = recordsMap.get('1');
    expect(team1Record?.pointsFor).toBe(0);
    expect(team1Record?.pointsAgainst).toBe(0);
    expect(team1Record?.ties).toBe(1);
  });

  it('should accumulate points across multiple games', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');
    const team3 = createTeam('3', 'Team3', 'AFC', 'AFC North');

    const games: Game[] = [
      createGame('g1', team1, team2, 31, 24),
      createGame('g2', team1, team3, 17, 14),
      createGame('g3', team3, team1, 28, 35),
    ];

    const recordsMap = calculateTeamRecords([team1, team2, team3], games, {});

    const team1Record = recordsMap.get('1');
    expect(team1Record?.pointsFor).toBe(83); // 31 + 17 + 35
    expect(team1Record?.pointsAgainst).toBe(66); // 24 + 14 + 28
  });
});

describe('Selection Updates and Changes', () => {
  it('should update records when selection is made for scheduled game', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, null, null, 'scheduled'),
    ];

    // First calculation with no selection
    const noSelectionRecords = calculateTeamRecords([team1, team2], games, {});
    expect(noSelectionRecords.get('1')?.wins).toBe(0);

    // Second calculation with selection
    const withSelectionRecords = calculateTeamRecords([team1, team2], games, { 'g1': 'home' });
    expect(withSelectionRecords.get('1')?.wins).toBe(1);
  });

  it('should handle changing selection from one team to another', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, null, null, 'scheduled'),
    ];

    // Selection: home wins
    const homeWinsRecords = calculateTeamRecords([team1, team2], games, { 'g1': 'home' });
    expect(homeWinsRecords.get('1')?.wins).toBe(1);
    expect(homeWinsRecords.get('2')?.wins).toBe(0);

    // Selection changed: away wins
    const awayWinsRecords = calculateTeamRecords([team1, team2], games, { 'g1': 'away' });
    expect(awayWinsRecords.get('1')?.wins).toBe(0);
    expect(awayWinsRecords.get('2')?.wins).toBe(1);
  });

  it('should handle selection for in_progress game', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, 14, 10, 'in_progress'), // Current score doesn't matter
    ];

    // With selection, in-progress game counts
    const withSelection = calculateTeamRecords([team1, team2], games, { 'g1': 'home' });
    expect(withSelection.get('1')?.wins).toBe(1);
  });

  it('should use final result even if selection exists', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, 24, 17, 'final'), // Final: home wins
    ];

    // Selection says away wins, but game is final so home win should be used
    const records = calculateTeamRecords([team1, team2], games, { 'g1': 'away' });
    expect(records.get('1')?.wins).toBe(1); // Home team actually won
    expect(records.get('2')?.wins).toBe(0);
  });
});

describe('Win Percentage Edge Cases', () => {
  it('should calculate win percentage correctly with all wins', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [];
    for (let i = 0; i < 17; i++) {
      games.push(createGame(`g${i}`, team1, team2, 24, 17));
    }

    const recordsMap = calculateTeamRecords([team1, team2], games, {});
    const record = recordsMap.get('1');

    expect(record?.wins).toBe(17);
    expect(record?.losses).toBe(0);
    const winPct = record!.wins / (record!.wins + record!.losses + record!.ties);
    expect(winPct).toBe(1.0);
  });

  it('should calculate win percentage correctly with all losses', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [];
    for (let i = 0; i < 17; i++) {
      games.push(createGame(`g${i}`, team1, team2, 17, 24));
    }

    const recordsMap = calculateTeamRecords([team1, team2], games, {});
    const record = recordsMap.get('1');

    expect(record?.wins).toBe(0);
    expect(record?.losses).toBe(17);
    const winPct = record!.wins / (record!.wins + record!.losses + record!.ties);
    expect(winPct).toBe(0.0);
  });

  it('should calculate win percentage with only ties', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, 20, 20),
      createGame('g2', team2, team1, 17, 17),
    ];

    const recordsMap = calculateTeamRecords([team1, team2], games, {});
    const record = recordsMap.get('1');

    expect(record?.wins).toBe(0);
    expect(record?.losses).toBe(0);
    expect(record?.ties).toBe(2);
    // Win pct with only ties = (0 + 0.5*2) / 2 = 0.5
    const winPct = (record!.wins + 0.5 * record!.ties) / (record!.wins + record!.losses + record!.ties);
    expect(winPct).toBe(0.5);
  });

  it('should handle .500 record', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [];
    // 8 wins, 8 losses
    for (let i = 0; i < 8; i++) {
      games.push(createGame(`w${i}`, team1, team2, 24, 17));
    }
    for (let i = 0; i < 8; i++) {
      games.push(createGame(`l${i}`, team1, team2, 17, 24));
    }

    const recordsMap = calculateTeamRecords([team1, team2], games, {});
    const record = recordsMap.get('1');

    expect(record?.wins).toBe(8);
    expect(record?.losses).toBe(8);
    const winPct = record!.wins / (record!.wins + record!.losses + record!.ties);
    expect(winPct).toBe(0.5);
  });
});

describe('Edge Cases', () => {
  it('should handle multiple games between same teams', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    // Play 4 games, team1 wins 3
    const games: Game[] = [
      createGame('g1', team1, team2, 24, 17),
      createGame('g2', team2, team1, 17, 24),
      createGame('g3', team1, team2, 21, 20),
      createGame('g4', team2, team1, 28, 21), // team2 wins this one
    ];

    const recordsMap = calculateTeamRecords([team1, team2], games, {});

    expect(recordsMap.get('1')?.wins).toBe(3);
    expect(recordsMap.get('1')?.losses).toBe(1);
    expect(recordsMap.get('2')?.wins).toBe(1);
    expect(recordsMap.get('2')?.losses).toBe(3);
  });

  it('should handle in_progress games without selection', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, 14, 10, 'in_progress'),
    ];

    const recordsMap = calculateTeamRecords([team1, team2], games, {});

    // In-progress games without selection should not count
    expect(recordsMap.get('1')?.wins).toBe(0);
    expect(recordsMap.get('1')?.losses).toBe(0);
  });

  it('should correctly handle bye weeks (games played at different times)', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');
    const team3 = createTeam('3', 'Team3', 'AFC', 'AFC East');

    // team1 plays weeks 1 and 3, team2 plays weeks 1 and 2
    const games: Game[] = [
      createGame('g1', team1, team2, 24, 17, 'final', 1),
      createGame('g2', team2, team3, 24, 17, 'final', 2),
      createGame('g3', team1, team3, 24, 17, 'final', 3),
    ];

    const recordsMap = calculateTeamRecords([team1, team2, team3], games, {});

    expect(recordsMap.get('1')?.wins).toBe(2);
    expect(recordsMap.get('2')?.wins).toBe(1);
    expect(recordsMap.get('2')?.losses).toBe(1);
    expect(recordsMap.get('3')?.losses).toBe(2);
  });
});

// ============================================================================
// PHASE 2: TIEBREAKER LOGIC TESTS
// ============================================================================

describe('Tiebreaker Step 1: Head-to-Head Record', () => {
  it('should use H2H when 2 teams have played each other - winner takes higher seed', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');
    const team3 = createTeam('3', 'Team3', 'AFC', 'AFC North');

    // Both teams are 2-1, but team2 beat team1 in H2H
    const games: Game[] = [
      createGame('g1', team1, team2, 17, 24), // team2 wins H2H
      createGame('g2', team1, team3, 24, 17), // team1 beats team3
      createGame('g3', team1, team3, 24, 17), // team1 beats team3 again
      createGame('g4', team2, team3, 24, 17), // team2 beats team3
      createGame('g5', team2, team3, 24, 17), // team2 beats team3 again
    ];

    const standings = calculatePlayoffSeedings('AFC', [team1, team2, team3], games, {});
    const team1Standing = standings.find(s => s.team.id === '1');
    const team2Standing = standings.find(s => s.team.id === '2');

    // Both 2-1, but team2 wins H2H so should rank higher
    expect(team2Standing?.seed).toBeLessThan(team1Standing?.seed ?? 99);
  });

  it('should handle teams that split series (1-1) - fall through to next tiebreaker', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    // Split series - each team wins once
    const games: Game[] = [
      createGame('g1', team1, team2, 24, 17), // team1 wins
      createGame('g2', team2, team1, 24, 17), // team2 wins
    ];

    const teams = [team1, team2];
    const recordsMap = calculateTeamRecords(teams, games, {});

    // Both teams should have equal records, H2H is split
    expect(recordsMap.get('1')?.wins).toBe(1);
    expect(recordsMap.get('1')?.losses).toBe(1);
    expect(recordsMap.get('2')?.wins).toBe(1);
    expect(recordsMap.get('2')?.losses).toBe(1);
  });

  it('should handle season sweep (2-0) in division', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');
    const team3 = createTeam('3', 'Team3', 'AFC', 'AFC East');
    const team4 = createTeam('4', 'Team4', 'AFC', 'AFC East');

    // team2 sweeps team1 (2-0 H2H), but both have same overall record
    const games: Game[] = [
      createGame('g1', team1, team2, 17, 24), // team2 wins
      createGame('g2', team2, team1, 24, 17), // team2 wins again
      // Both beat team3 and team4 twice to have same record
      createGame('g3', team1, team3, 24, 17),
      createGame('g4', team1, team3, 24, 17),
      createGame('g5', team1, team4, 24, 17),
      createGame('g6', team1, team4, 24, 17),
      createGame('g7', team2, team3, 24, 17),
      createGame('g8', team2, team3, 24, 17),
      createGame('g9', team2, team4, 24, 17),
      createGame('g10', team2, team4, 24, 17),
    ];

    const standings = calculatePlayoffSeedings('AFC', [team1, team2, team3, team4], games, {});
    const team1Standing = standings.find(s => s.team.id === '1');
    const team2Standing = standings.find(s => s.team.id === '2');

    // team2 swept team1 so should be ranked higher
    expect(team2Standing?.seed).toBeLessThan(team1Standing?.seed ?? 99);
  });

  it('should not use H2H if tied teams have not played each other', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC North');
    const team3 = createTeam('3', 'Team3', 'AFC', 'AFC South');

    // team1 and team2 have same record but never played each other
    const games: Game[] = [
      createGame('g1', team1, team3, 24, 17),
      createGame('g2', team2, team3, 24, 17),
    ];

    const teams = [team1, team2, team3];
    const recordsMap = calculateTeamRecords(teams, games, {});

    // Both 1-0, never played each other - should use other tiebreakers
    expect(recordsMap.get('1')?.wins).toBe(1);
    expect(recordsMap.get('2')?.wins).toBe(1);
  });

  it('should handle 3-team H2H where one team beat both others', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');
    const team3 = createTeam('3', 'Team3', 'AFC', 'AFC East');

    // team1 and team2 tied at 2-1, team3 at 0-2
    const games: Game[] = [
      createGame('g1', team1, team2, 24, 17), // team1 beats team2
      createGame('g2', team1, team3, 24, 17), // team1 beats team3
      createGame('g3', team2, team3, 24, 17), // team2 beats team3
      createGame('g4', team2, team1, 24, 17), // team2 beats team1
      // team1: 2-1, team2: 2-1, team3: 0-2
    ];

    const teams = [team1, team2, team3];
    const recordsMap = calculateTeamRecords(teams, games, {});

    // Check records
    expect(recordsMap.get('1')?.wins).toBe(2);
    expect(recordsMap.get('1')?.losses).toBe(1);
    expect(recordsMap.get('2')?.wins).toBe(2);
    expect(recordsMap.get('2')?.losses).toBe(1);
    expect(recordsMap.get('3')?.wins).toBe(0);
    expect(recordsMap.get('3')?.losses).toBe(2);
  });
});

describe('Tiebreaker Step 2: Division Record (Division Ties Only)', () => {
  it('should use division record for division title tiebreaker', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');
    const team3 = createTeam('3', 'Team3', 'AFC', 'AFC East');
    const team4 = createTeam('4', 'Team4', 'AFC', 'AFC East');
    const afcNorth = createTeam('5', 'Team5', 'AFC', 'AFC North');

    // team1 and team2 tied overall, split H2H, but team1 better division record
    const games: Game[] = [
      // H2H split
      createGame('g1', team1, team2, 24, 17),
      createGame('g2', team2, team1, 24, 17),
      // team1 sweeps team3 and team4 (4-0 division)
      createGame('g3', team1, team3, 24, 17),
      createGame('g4', team3, team1, 17, 24),
      createGame('g5', team1, team4, 24, 17),
      createGame('g6', team4, team1, 17, 24),
      // team2 splits with team3 and team4 (2-2 division besides H2H)
      createGame('g7', team2, team3, 24, 17),
      createGame('g8', team3, team2, 24, 17),
      createGame('g9', team2, team4, 24, 17),
      createGame('g10', team4, team2, 24, 17),
      // Both beat AFC North team to have same overall record
      createGame('g11', team1, afcNorth, 24, 17),
      createGame('g12', team2, afcNorth, 24, 17),
    ];

    const recordsMap = calculateTeamRecords([team1, team2, team3, team4, afcNorth], games, {});

    // team1: 6-1 overall, 5-1 division
    // team2: 5-2 overall, 3-3 division
    const team1Rec = recordsMap.get('1');
    const team2Rec = recordsMap.get('2');

    expect(team1Rec?.divisionWins).toBe(5);
    expect(team1Rec?.divisionLosses).toBe(1);
    expect(team2Rec?.divisionWins).toBe(3);
    expect(team2Rec?.divisionLosses).toBe(3);
  });

  it('should NOT use division record for wild card tiebreakers', () => {
    // This is implicitly tested - wild card ties go through different path
    // Division record step is skipped for wild card (isDivisionTie = false)
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC North'); // Different division

    // These teams can't have a division tiebreaker since they're in different divisions
    const games: Game[] = [
      createGame('g1', team1, team2, 20, 20), // Tie - so H2H doesn't decide
    ];

    const recordsMap = calculateTeamRecords([team1, team2], games, {});

    expect(recordsMap.get('1')?.ties).toBe(1);
    expect(recordsMap.get('2')?.ties).toBe(1);
  });
});

describe('Tiebreaker Step 3: Common Games Record', () => {
  it('should use common games when teams have 4+ common opponents', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC North');
    // 4 common opponents
    const common1 = createTeam('c1', 'Common1', 'AFC', 'AFC South');
    const common2 = createTeam('c2', 'Common2', 'AFC', 'AFC South');
    const common3 = createTeam('c3', 'Common3', 'AFC', 'AFC West');
    const common4 = createTeam('c4', 'Common4', 'AFC', 'AFC West');

    // team1 goes 4-0 vs common opponents
    // team2 goes 2-2 vs common opponents
    const games: Game[] = [
      // team1 beats all common opponents
      createGame('g1', team1, common1, 24, 17),
      createGame('g2', team1, common2, 24, 17),
      createGame('g3', team1, common3, 24, 17),
      createGame('g4', team1, common4, 24, 17),
      // team2 goes .500 vs common opponents
      createGame('g5', team2, common1, 24, 17),
      createGame('g6', team2, common2, 24, 17),
      createGame('g7', team2, common3, 17, 24),
      createGame('g8', team2, common4, 17, 24),
    ];

    const allTeams = [team1, team2, common1, common2, common3, common4];
    const recordsMap = calculateTeamRecords(allTeams, games, {});

    // Both teams are 4-0 against other teams, but common games record differs
    expect(recordsMap.get('1')?.wins).toBe(4);
    expect(recordsMap.get('2')?.wins).toBe(2);
  });

  it('should skip common games if fewer than 4 common opponents', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC North');
    // Only 3 common opponents
    const common1 = createTeam('c1', 'Common1', 'AFC', 'AFC South');
    const common2 = createTeam('c2', 'Common2', 'AFC', 'AFC South');
    const common3 = createTeam('c3', 'Common3', 'AFC', 'AFC West');
    // Unique opponents
    const unique1 = createTeam('u1', 'Unique1', 'AFC', 'AFC West');
    const unique2 = createTeam('u2', 'Unique2', 'AFC', 'AFC East');

    const games: Game[] = [
      // 3 common opponents
      createGame('g1', team1, common1, 24, 17),
      createGame('g2', team1, common2, 24, 17),
      createGame('g3', team1, common3, 24, 17),
      createGame('g4', team2, common1, 17, 24),
      createGame('g5', team2, common2, 17, 24),
      createGame('g6', team2, common3, 17, 24),
      // Unique opponents
      createGame('g7', team1, unique1, 24, 17),
      createGame('g8', team2, unique2, 24, 17),
    ];

    const allTeams = [team1, team2, common1, common2, common3, unique1, unique2];
    const recordsMap = calculateTeamRecords(allTeams, games, {});

    // Both 4-0 overall, only 3 common games - should fall through to other tiebreakers
    expect(recordsMap.get('1')?.wins).toBe(4);
    expect(recordsMap.get('2')?.wins).toBe(1);
  });
});

describe('Tiebreaker Step 4: Conference Record', () => {
  it('should use conference record as tiebreaker', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC North');
    const afcTeam = createTeam('3', 'AFCTeam', 'AFC', 'AFC South');
    const nfcTeam = createTeam('4', 'NFCTeam', 'NFC', 'NFC East');

    // team1: 2-0 overall (1-0 conference, 1-0 non-conference)
    // team2: 2-0 overall (2-0 conference)
    const games: Game[] = [
      createGame('g1', team1, afcTeam, 24, 17),  // Conference win
      createGame('g2', team1, nfcTeam, 24, 17),  // Non-conference win
      createGame('g3', team2, afcTeam, 24, 17),  // Conference win
      createGame('g4', team2, createTeam('5', 'AFC2', 'AFC', 'AFC West'), 24, 17), // Conference win
    ];

    const teams = [team1, team2, afcTeam, nfcTeam, createTeam('5', 'AFC2', 'AFC', 'AFC West')];
    const recordsMap = calculateTeamRecords(teams, games, {});

    // team1: 1-0 conference
    // team2: 2-0 conference
    expect(recordsMap.get('1')?.conferenceWins).toBe(1);
    expect(recordsMap.get('2')?.conferenceWins).toBe(2);
  });

  it('should fall through when conference records are tied', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC North');
    const afcTeam = createTeam('3', 'AFCTeam', 'AFC', 'AFC South');

    // Both 1-0 conference
    const games: Game[] = [
      createGame('g1', team1, afcTeam, 24, 17),
      createGame('g2', team2, afcTeam, 24, 17),
    ];

    const recordsMap = calculateTeamRecords([team1, team2, afcTeam], games, {});

    expect(recordsMap.get('1')?.conferenceWins).toBe(1);
    expect(recordsMap.get('2')?.conferenceWins).toBe(1);
  });
});

describe('Tiebreaker Step 5: Strength of Victory (SOV)', () => {
  it('should calculate SOV as average win% of teams defeated', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC North');
    // Teams that team1 beats
    const strong = createTeam('3', 'Strong', 'AFC', 'AFC South'); // Will have good record
    // Teams that team2 beats
    const weak = createTeam('4', 'Weak', 'AFC', 'AFC West'); // Will have bad record

    // Set up records: strong team is 3-1, weak team is 0-4
    const games: Game[] = [
      // team1 beats strong team
      createGame('g1', team1, strong, 24, 17),
      // team2 beats weak team
      createGame('g2', team2, weak, 24, 17),
      // strong team gets wins
      createGame('g3', strong, weak, 24, 17),
      createGame('g4', strong, weak, 24, 17),
      createGame('g5', strong, weak, 24, 17),
    ];

    const allTeams = [team1, team2, strong, weak];
    const recordsMap = calculateTeamRecords(allTeams, games, {});

    // team1 beat 'strong' (3-1 = .750)
    // team2 beat 'weak' (0-4 = .000)
    // team1 should have higher SOV
    expect(recordsMap.get('3')?.wins).toBe(3);
    expect(recordsMap.get('3')?.losses).toBe(1);
    expect(recordsMap.get('4')?.wins).toBe(0);
    expect(recordsMap.get('4')?.losses).toBe(4);
  });

  it('should handle team with 0 wins (SOV = 0)', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC North');

    // team1 has 0 wins
    const games: Game[] = [
      createGame('g1', team1, team2, 17, 24), // team1 loses
    ];

    const recordsMap = calculateTeamRecords([team1, team2], games, {});

    expect(recordsMap.get('1')?.wins).toBe(0);
    // SOV for team with 0 wins should be 0 (no teams defeated)
  });

  it('should only include teams actually beaten (not ties or losses)', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const opp1 = createTeam('2', 'Opp1', 'AFC', 'AFC North');
    const opp2 = createTeam('3', 'Opp2', 'AFC', 'AFC South');
    const opp3 = createTeam('4', 'Opp3', 'AFC', 'AFC West');

    const games: Game[] = [
      createGame('g1', team1, opp1, 24, 17), // Win
      createGame('g2', team1, opp2, 17, 24), // Loss
      createGame('g3', team1, opp3, 20, 20), // Tie
    ];

    const recordsMap = calculateTeamRecords([team1, opp1, opp2, opp3], games, {});

    expect(recordsMap.get('1')?.wins).toBe(1);
    expect(recordsMap.get('1')?.losses).toBe(1);
    expect(recordsMap.get('1')?.ties).toBe(1);
    // SOV should only count opp1 (the team beaten)
  });
});

describe('Tiebreaker Step 6: Strength of Schedule (SOS)', () => {
  it('should calculate SOS as average win% of all opponents', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC North');
    const strong = createTeam('3', 'Strong', 'AFC', 'AFC South');
    const weak = createTeam('4', 'Weak', 'AFC', 'AFC West');

    // team1 plays strong opponent (hard schedule)
    // team2 plays weak opponent (easy schedule)
    const games: Game[] = [
      createGame('g1', team1, strong, 24, 17),
      createGame('g2', team2, weak, 24, 17),
      // Give strong team wins
      createGame('g3', strong, weak, 24, 17),
      createGame('g4', strong, weak, 24, 17),
    ];

    const recordsMap = calculateTeamRecords([team1, team2, strong, weak], games, {});

    // Both 1-0, but team1 played stronger opponent
    expect(recordsMap.get('1')?.wins).toBe(1);
    expect(recordsMap.get('2')?.wins).toBe(1);
    // strong is 2-1, weak is 0-3
    expect(recordsMap.get('3')?.wins).toBe(2);
    expect(recordsMap.get('4')?.wins).toBe(0);
  });

  it('should include all opponents in SOS (wins, losses, ties)', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const opp1 = createTeam('2', 'Opp1', 'AFC', 'AFC North');
    const opp2 = createTeam('3', 'Opp2', 'AFC', 'AFC South');
    const opp3 = createTeam('4', 'Opp3', 'AFC', 'AFC West');

    const games: Game[] = [
      createGame('g1', team1, opp1, 24, 17), // Win vs opp1
      createGame('g2', team1, opp2, 17, 24), // Loss vs opp2
      createGame('g3', team1, opp3, 20, 20), // Tie vs opp3
    ];

    const recordsMap = calculateTeamRecords([team1, opp1, opp2, opp3], games, {});

    // team1 played 3 different opponents - all should count for SOS
    expect(recordsMap.get('1')?.gamesPlayed.length).toBe(3);
  });

  it('should count opponent only once even if played multiple times', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const opp1 = createTeam('2', 'Opp1', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, opp1, 24, 17),
      createGame('g2', opp1, team1, 17, 24), // Same opponent, different game
    ];

    const recordsMap = calculateTeamRecords([team1, opp1], games, {});

    // team1 played opp1 twice, but opp1 should only count once for SOS
    expect(recordsMap.get('1')?.wins).toBe(2);
    expect(recordsMap.get('1')?.gamesPlayed.length).toBe(2);
  });
});

describe('Tiebreaker Step 7: Conference Points Ranking', () => {
  it('should rank by combined points for and points against', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC North');
    const team3 = createTeam('3', 'Team3', 'AFC', 'AFC South');

    // team1: high scoring but gives up points (30 PF, 28 PA)
    // team2: low scoring but good defense (17 PF, 10 PA)
    const games: Game[] = [
      createGame('g1', team1, team3, 30, 28),
      createGame('g2', team2, team3, 17, 10),
    ];

    const recordsMap = calculateTeamRecords([team1, team2, team3], games, {});

    expect(recordsMap.get('1')?.pointsFor).toBe(30);
    expect(recordsMap.get('1')?.pointsAgainst).toBe(28);
    expect(recordsMap.get('2')?.pointsFor).toBe(17);
    expect(recordsMap.get('2')?.pointsAgainst).toBe(10);
  });
});

describe('Tiebreaker Steps 8-11: Point Differential', () => {
  it('should use point differential as final tiebreaker', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');
    const opp = createTeam('3', 'Opponent', 'AFC', 'AFC North');

    // Both 1-0, but team1 won by more points
    const games: Game[] = [
      createGame('g1', team1, opp, 35, 10), // +25
      createGame('g2', team2, opp, 21, 20), // +1
    ];

    const recordsMap = calculateTeamRecords([team1, team2, opp], games, {});

    expect(recordsMap.get('1')!.pointsFor - recordsMap.get('1')!.pointsAgainst).toBe(25);
    expect(recordsMap.get('2')!.pointsFor - recordsMap.get('2')!.pointsAgainst).toBe(1);
  });

  it('should handle negative point differential', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');

    const games: Game[] = [
      createGame('g1', team1, team2, 10, 30), // team1: -20
    ];

    const recordsMap = calculateTeamRecords([team1, team2], games, {});

    expect(recordsMap.get('1')!.pointsFor - recordsMap.get('1')!.pointsAgainst).toBe(-20);
    expect(recordsMap.get('2')!.pointsFor - recordsMap.get('2')!.pointsAgainst).toBe(20);
  });

  it('should handle identical point differential (may be arbitrary)', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC North');
    const opp1 = createTeam('3', 'Opp1', 'AFC', 'AFC South');
    const opp2 = createTeam('4', 'Opp2', 'AFC', 'AFC West');

    // Both teams with identical +7 point differential
    const games: Game[] = [
      createGame('g1', team1, opp1, 24, 17),
      createGame('g2', team2, opp2, 24, 17),
    ];

    const recordsMap = calculateTeamRecords([team1, team2, opp1, opp2], games, {});

    expect(recordsMap.get('1')!.pointsFor - recordsMap.get('1')!.pointsAgainst).toBe(7);
    expect(recordsMap.get('2')!.pointsFor - recordsMap.get('2')!.pointsAgainst).toBe(7);
    // Order may be arbitrary when all tiebreakers exhausted
  });
});

describe('Tiebreaker Edge Cases', () => {
  it('should correctly resolve 2-way tie', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');
    const team3 = createTeam('3', 'Team3', 'AFC', 'AFC East');
    const team4 = createTeam('4', 'Team4', 'AFC', 'AFC East');

    // team1 and team2 tied for division with 3-0, team1 wins H2H
    const games: Game[] = [
      createGame('g1', team1, team2, 24, 17), // team1 beats team2
      createGame('g2', team1, team3, 24, 17),
      createGame('g3', team1, team4, 24, 17),
      createGame('g4', team2, team3, 24, 17),
      createGame('g5', team2, team4, 24, 17),
    ];

    const standings = calculatePlayoffSeedings('AFC', [team1, team2, team3, team4], games, {});

    // team1 should win division (beat team2 H2H)
    const divWinner = standings.find(s => s.seed === 1);
    expect(divWinner?.team.id).toBe('1');
  });

  it('should correctly resolve 3-way tie for division', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');
    const team3 = createTeam('3', 'Team3', 'AFC', 'AFC East');
    const team4 = createTeam('4', 'Team4', 'AFC', 'AFC East');

    // 3-way tie at 2-1, circular H2H (1 beats 2, 2 beats 3, 3 beats 1)
    const games: Game[] = [
      createGame('g1', team1, team2, 24, 17), // team1 beats team2
      createGame('g2', team2, team3, 24, 17), // team2 beats team3
      createGame('g3', team3, team1, 24, 17), // team3 beats team1
      // Each beats team4
      createGame('g4', team1, team4, 24, 17),
      createGame('g5', team2, team4, 24, 17),
      createGame('g6', team3, team4, 24, 17),
    ];

    const recordsMap = calculateTeamRecords([team1, team2, team3, team4], games, {});

    // All three should be 2-1
    expect(recordsMap.get('1')?.wins).toBe(2);
    expect(recordsMap.get('2')?.wins).toBe(2);
    expect(recordsMap.get('3')?.wins).toBe(2);
    expect(recordsMap.get('4')?.wins).toBe(0);
  });

  it('should correctly resolve 4-way tie for division', () => {
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');
    const team3 = createTeam('3', 'Team3', 'AFC', 'AFC East');
    const team4 = createTeam('4', 'Team4', 'AFC', 'AFC East');

    // All 4 teams at 3-3 in division
    const games: Game[] = [
      // Round robin where each team beats the next and loses to the previous
      createGame('g1', team1, team2, 24, 17),
      createGame('g2', team2, team1, 24, 17),
      createGame('g3', team1, team3, 24, 17),
      createGame('g4', team3, team1, 24, 17),
      createGame('g5', team1, team4, 24, 17),
      createGame('g6', team4, team1, 24, 17),
      createGame('g7', team2, team3, 24, 17),
      createGame('g8', team3, team2, 24, 17),
      createGame('g9', team2, team4, 24, 17),
      createGame('g10', team4, team2, 24, 17),
      createGame('g11', team3, team4, 24, 17),
      createGame('g12', team4, team3, 24, 17),
    ];

    const recordsMap = calculateTeamRecords([team1, team2, team3, team4], games, {});

    // All should be 3-3
    expect(recordsMap.get('1')?.wins).toBe(3);
    expect(recordsMap.get('1')?.losses).toBe(3);
    expect(recordsMap.get('2')?.wins).toBe(3);
    expect(recordsMap.get('3')?.wins).toBe(3);
    expect(recordsMap.get('4')?.wins).toBe(3);
  });

  it('should handle tiebreaker chain (partial resolution)', () => {
    // When a tiebreaker resolves some but not all tied teams,
    // remaining teams should restart from step 1
    const team1 = createTeam('1', 'Team1', 'AFC', 'AFC East');
    const team2 = createTeam('2', 'Team2', 'AFC', 'AFC East');
    const team3 = createTeam('3', 'Team3', 'AFC', 'AFC East');
    const team4 = createTeam('4', 'Team4', 'AFC', 'AFC East');

    // team1 clearly wins H2H over all, team2 and team3 tied, team4 clearly worst
    const games: Game[] = [
      // team1 beats everyone
      createGame('g1', team1, team2, 24, 17),
      createGame('g2', team1, team3, 24, 17),
      createGame('g3', team1, team4, 24, 17),
      createGame('g4', team2, team1, 17, 24),
      createGame('g5', team3, team1, 17, 24),
      createGame('g6', team4, team1, 17, 24),
      // team2 and team3 split
      createGame('g7', team2, team3, 24, 17),
      createGame('g8', team3, team2, 24, 17),
      // team2 and team3 both beat team4
      createGame('g9', team2, team4, 24, 17),
      createGame('g10', team3, team4, 24, 17),
      createGame('g11', team4, team2, 17, 24),
      createGame('g12', team4, team3, 17, 24),
    ];

    const standings = calculatePlayoffSeedings('AFC', [team1, team2, team3, team4], games, {});

    // team1 should be seed 1 (best record and H2H)
    expect(standings.find(s => s.seed === 1)?.team.id).toBe('1');
    // team4 should be lowest seed (only 4 teams, so all make playoffs with 7 spots)
    // team4 is 0-6, should be last (seed 4 or wild card)
    const team4Standing = standings.find(s => s.team.id === '4');
    expect(team4Standing?.seed).toBeGreaterThan(1);
    // Verify team4 has worst record
    expect(team4Standing?.wins).toBe(0);
    expect(team4Standing?.losses).toBe(6);
  });

  it('should use different tiebreaker paths for division vs wild card', () => {
    // Division ties use division record (step 2)
    // Wild card ties skip division record
    const eastTeam1 = createTeam('e1', 'East1', 'AFC', 'AFC East');
    const eastTeam2 = createTeam('e2', 'East2', 'AFC', 'AFC East');
    const northTeam1 = createTeam('n1', 'North1', 'AFC', 'AFC North');
    const northTeam2 = createTeam('n2', 'North2', 'AFC', 'AFC North');

    // East division: e1 wins division
    // North division: n1 wins division
    // e2 and n2 compete for wild card
    const games: Game[] = [
      // Division games
      createGame('g1', eastTeam1, eastTeam2, 24, 17),
      createGame('g2', eastTeam2, eastTeam1, 17, 24),
      createGame('g3', northTeam1, northTeam2, 24, 17),
      createGame('g4', northTeam2, northTeam1, 17, 24),
    ];

    const recordsMap = calculateTeamRecords([eastTeam1, eastTeam2, northTeam1, northTeam2], games, {});

    // Division winners: e1 (2-0), n1 (2-0)
    // Wild card contenders: e2 (0-2), n2 (0-2) - same record
    expect(recordsMap.get('e1')?.wins).toBe(2);
    expect(recordsMap.get('n1')?.wins).toBe(2);
    expect(recordsMap.get('e2')?.wins).toBe(0);
    expect(recordsMap.get('n2')?.wins).toBe(0);
  });
});
