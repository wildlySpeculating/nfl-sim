// Conference and Division types
export type Conference = 'AFC' | 'NFC';

export type Division =
  | 'AFC East' | 'AFC North' | 'AFC South' | 'AFC West'
  | 'NFC East' | 'NFC North' | 'NFC South' | 'NFC West';

// Team types
export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  location: string;
  division: Division;
  conference: Conference;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
}

// Game types
export type GameStatus = 'scheduled' | 'in_progress' | 'final';
export type GameSelection = 'home' | 'away' | 'tie' | null;

export interface Game {
  id: string;
  week: number;
  homeTeam: Team;
  awayTeam: Team;
  kickoffTime: Date;
  status: GameStatus;
  homeScore: number | null;
  awayScore: number | null;
}

export interface GameWithSelection extends Game {
  selection: GameSelection;
}

// Record types
export interface Record {
  wins: number;
  losses: number;
  ties: number;
}

// Standing types
export interface TeamStanding {
  team: Team;
  wins: number;
  losses: number;
  ties: number;
  divisionWins: number;
  divisionLosses: number;
  divisionTies: number;
  conferenceWins: number;
  conferenceLosses: number;
  conferenceTies: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: string;
  lastFive: LastFiveGame[];
  isEliminated: boolean;
  clinched: 'division' | 'playoff' | 'bye' | null;
  seed: number | null;
  magicNumber: MagicNumber | null;
}

export interface MagicNumber {
  playoff: number | null;
  division: number | null;
  bye: number | null;
  scenarios: string[];
}

// Last 5 games result with details
export interface LastFiveGame {
  result: 'W' | 'L' | 'T';
  teamName: string;
  teamScore: number;
  opponentName: string;
  opponentScore: number;
  week: number;
  isProjected: boolean; // true if based on user selection, false if final
}

// Playoff bracket types
export interface PlayoffMatchup {
  higherSeed: Team | null;
  lowerSeed: Team | null;
  higherSeedScore: number | null;
  lowerSeedScore: number | null;
  winner: Team | null;
}

export interface ConferenceBracket {
  seeds: (Team | null)[];
  wildCard: PlayoffMatchup[];
  divisional: PlayoffMatchup[];
  championship: PlayoffMatchup;
}

export interface PlayoffBracket {
  afc: ConferenceBracket;
  nfc: ConferenceBracket;
  superBowl: {
    afc: Team | null;
    nfc: Team | null;
    winner: Team | null;
  };
}

// Scenario state types
export interface ScenarioState {
  selections: { [gameId: string]: GameSelection };
  playoffPicks: PlayoffPicks;
}

export interface PlayoffPicks {
  afc: {
    wildCard: (string | null)[];
    divisional: (string | null)[];
    championship: string | null;
  };
  nfc: {
    wildCard: (string | null)[];
    divisional: (string | null)[];
    championship: string | null;
  };
  superBowl: string | null;
}

// API response types
export interface EspnScoreboardResponse {
  events: EspnEvent[];
  week: {
    number: number;
  };
}

export interface EspnEvent {
  id: string;
  date: string;
  status: {
    type: {
      name: string;
      completed: boolean;
    };
  };
  competitions: [{
    competitors: [{
      homeAway: 'home' | 'away';
      team: {
        id: string;
        abbreviation: string;
        displayName: string;
        logo: string;
        color?: string;
        alternateColor?: string;
      };
      score?: string;
    }, {
      homeAway: 'home' | 'away';
      team: {
        id: string;
        abbreviation: string;
        displayName: string;
        logo: string;
        color?: string;
        alternateColor?: string;
      };
      score?: string;
    }];
  }];
}

// Path calculation types
export interface PlayoffPath {
  type: 'division' | 'wildcard' | 'bye';
  requirements: PathRequirement[];
  complexity: number; // Number of external outcomes needed
}

export interface PathRequirement {
  type: 'win' | 'loss' | 'tie';
  team: Team;
  opponent?: Team;
  gameId?: string;
}

// View types
export type ViewMode = 'week' | 'team';
export type Tab = 'games' | 'bracket';
