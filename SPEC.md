# NFL Playoff Scenarios

An interactive web application for exploring NFL playoff scenarios by selecting game outcomes and visualizing their impact on standings and the playoff bracket.

## Overview

Users can select winners (or ties) for remaining NFL games, organized by week or by team. The app calculates playoff implications in real-time, displays an interactive bracket, and allows full playoff simulation through the Super Bowl.

---

## Tech Stack

- **Frontend**: Plain React (no Next.js)
- **Styling**: Tailwind CSS
- **Data Source**: ESPN unofficial API
- **Deployment**: Flexible (optimize for simplest maintenance)
- **PWA**: Full offline support with background sync

---

## Core Features

### 1. Game Selection

#### Two View Modes (Tabbed Interface)
- **Week View**: Games organized chronologically by kickoff time (Thursday → Sunday early → Sunday late → Sunday/Monday night)
- **Team View**: Games grouped by team, allowing bulk selections

#### Selection Options
- Win (Home or Away)
- Tie (supported in calculations)

#### Conflict Resolution
When selecting by team creates conflicts (e.g., "Eagles win all remaining" vs "Cowboys win all remaining" when they play each other):
- Collect all conflicts
- Present **modal list** showing all conflicting games with radio buttons
- User resolves each conflict before applying selections

#### Impossible Scenario Handling
- **Block selections** that lead to mathematically impossible outcomes
- Disabled options show **tooltip on hover/tap** explaining why (e.g., "Team X is mathematically eliminated")
- Eliminated teams appear **grayed out** throughout the UI

### 2. Standings Display

#### Stats Shown (Full Breakdown)
- Win-Loss-Tie record
- Division record
- Conference record
- Point differential
- Current streak
- Last 5 games

#### Visual Indicators
- **Team colors and official logos** used throughout
- **Grayed out** eliminated teams
- **Magic numbers** with detailed breakdown (e.g., "Clinch playoff: 2 more wins OR 1 win + DAL loss")
- **Dramatic animations** when standings change due to selections

#### Completed Games
- Show **full scores** (e.g., "Chiefs 27 - Bills 24")

### 3. Playoff Bracket

#### Format
- 14-team format (7 per conference)
- Single bye for #1 seeds
- **Interactive clickable bracket**

#### Functionality
- Users can simulate through **all playoff rounds**: Wild Card → Divisional → Conference Championship → Super Bowl
- Clicking a matchup allows selecting the winner
- **Cascade clear**: Changing an earlier round result automatically clears all downstream selections

#### Season Transition
- **Dual mode**: Regular season results remain visible alongside active playoff bracket when playoffs begin

### 4. Team-Focused Presets ("What Does [Team] Need?")

#### Paths Calculation
- Calculate all valid paths to playoffs
- **Separate paths** for:
  - Clinching division title
  - Clinching wild card spot
  - Clinching first-round bye

#### Presentation (Interactive Explore)
- Show **simplest path first** (fewest external outcomes needed)
- "Show more paths" option to explore alternatives
- Each path shows required game outcomes

### 5. Tiebreaker Implementation

Full NFL tiebreaker hierarchy calculated from game results:

1. Head-to-head record
2. Division record (division opponents)
3. Common games record
4. Conference record
5. Strength of victory
6. Strength of schedule
7. Best combined ranking in conference (points scored/allowed)
8. Best combined ranking in all games
9. Best net points in common games
10. Best net points in all games
11. Best net touchdowns in all games
12. Coin toss

All calculations derived from actual/projected game results.

---

## Data & Synchronization

### ESPN API Integration
- **Polling interval**: 30-60 seconds during live games
- **Stale data indicator**: Banner shown when data is outdated

### Error Handling (Comprehensive)
1. **Cache fallback**: Show last cached data if API fails
2. **Auto retry**: Exponential backoff for failed requests
3. **Manual retry**: "Retry" button when in error state
4. Scenario building allowed on cached/stale data

### Edge Cases
- **Postponed/rescheduled games**: Trust API completely (API-driven)
- **Ties**: Fully supported as selectable outcomes

---

## Sharing & Persistence

### URL Encoding
- **Base64 compressed** format for shortest URLs
- Encodes **full state**: regular season selections AND playoff bracket picks
- Example: `?s=eJxLzs9NUcov...`

### Stale URL Handling (Partial Apply)
When loading a shared URL after games have been played:
- Apply selections only for games that haven't happened yet
- Ignore selections for completed games
- No warning, seamless experience

### Reset Feature
- Single **"Reset All"** button
- Confirmation dialog before clearing

---

## PWA & Offline

### Capabilities
- **Installable** as standalone app
- **Offline mode**: Full functionality with cached data
- **Background sync**: Update data when connection restored
- **Stale warning**: Clear indicator when using offline data

---

## Visual Design

### Theming
- **Team colors and logos**: Official branding used for team representation
- **Dark mode**: Follows system preference automatically

### Animations
- **Dramatic reveal** when selections change standings
- Teams animate moving up/down in standings
- Bracket updates with smooth transitions

### Responsive Design
- **Desktop primary** experience
- Standard responsive breakpoints for mobile
- Touch-friendly on mobile devices

---

## Accessibility

- Semantic HTML structure
- Proper focus management
- ARIA labels where needed
- Keyboard navigable (standard)

---

## Privacy

- **No analytics tracking** whatsoever
- No user accounts
- All state stored locally or in URL

---

## Scope Limitations

- **Current 2024-25 season only** (hardcoded)
- **No historical data** or past season comparisons
- Rebuild required annually for new season

---

## Data Model

### Game
```typescript
interface Game {
  id: string;
  week: number;
  homeTeam: Team;
  awayTeam: Team;
  kickoffTime: Date;
  status: 'scheduled' | 'in_progress' | 'final';
  homeScore?: number;
  awayScore?: number;
  userSelection?: 'home' | 'away' | 'tie' | null;
}
```

### Team
```typescript
interface Team {
  id: string;
  name: string;
  abbreviation: string;
  division: Division;
  conference: 'AFC' | 'NFC';
  logo: string;
  primaryColor: string;
  secondaryColor: string;
}

interface TeamStanding {
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
  lastFive: ('W' | 'L' | 'T')[];
  isEliminated: boolean;
  clinched?: 'division' | 'playoff' | 'bye';
  magicNumber?: MagicNumber;
}

interface MagicNumber {
  playoff: number | null;
  division: number | null;
  bye: number | null;
  scenarios: string[]; // "2 wins OR 1 win + DAL loss"
}
```

### Playoff Bracket
```typescript
interface PlayoffBracket {
  afc: ConferenceBracket;
  nfc: ConferenceBracket;
  superBowl: {
    teams: [Team | null, Team | null];
    winner: Team | null;
  };
}

interface ConferenceBracket {
  seeds: (Team | null)[];
  wildCard: PlayoffMatchup[];
  divisional: PlayoffMatchup[];
  championship: PlayoffMatchup;
}

interface PlayoffMatchup {
  higherSeed: Team | null;
  lowerSeed: Team | null;
  winner: Team | null;
}
```

### URL State
```typescript
interface ScenarioState {
  regularSeason: Record<string, 'home' | 'away' | 'tie'>; // gameId -> selection
  playoffs: {
    afc: {
      wildCard: (string | null)[];    // winner team IDs
      divisional: (string | null)[];
      championship: string | null;
    };
    nfc: {
      wildCard: (string | null)[];
      divisional: (string | null)[];
      championship: string | null;
    };
    superBowl: string | null;
  };
}
```

---

## Component Architecture

```
App
├── Header
│   ├── Logo
│   ├── SeasonInfo
│   └── ResetButton
├── TabNavigation (Week View | Team View)
├── MainContent
│   ├── WeekView
│   │   ├── WeekSelector
│   │   └── GameList
│   │       └── GameCard (with selection buttons)
│   └── TeamView
│       ├── TeamSelector
│       └── TeamGameList
│           └── GameCard
├── Sidebar
│   ├── StandingsPanel
│   │   ├── AFCStandings
│   │   └── NFCStandings
│   └── TeamNeedsPanel (What does [Team] need?)
├── PlayoffBracket
│   ├── AFCBracket
│   ├── NFCBracket
│   └── SuperBowl
├── ConflictModal (batch resolution)
└── ShareButton (generates URL)
```

---

## API Endpoints (ESPN Unofficial)

### Scoreboard
```
GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
?dates=YYYYMMDD
&week=N
&seasontype=2 (regular season)
```

### Standings
```
GET https://site.api.espn.com/apis/v2/sports/football/nfl/standings
?season=2024
&seasontype=2
```

### Teams
```
GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams
```

### Schedule
```
GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{teamId}/schedule
```

---

## Key Implementation Notes

1. **Tiebreaker calculations** are complex - consider using a dedicated module with comprehensive test coverage

2. **Magic number calculations** require simulating all possible remaining game outcomes

3. **URL compression** should use a library like `lz-string` for Base64 encoding

4. **PWA service worker** needs careful cache invalidation strategy for live data

5. **Team logos** may need proxy/caching due to ESPN hotlinking policies

6. **Animation performance** - use CSS transforms and `will-change` for smooth standings animations

7. **Elimination detection** requires checking if any combination of remaining results can lead to playoffs
