# Team Needs Logic Implementation Checklist

This checklist tracks what needs to be implemented in `src/utils/teamNeeds.ts` to pass all 99 TDD tests.

---

## Interfaces to Export

### Core Result Types

- [ ] **MagicNumberResult**
  ```typescript
  interface MagicNumberResult {
    number: number | null;  // null = eliminated, 0 = clinched
    winsNeeded: number;
    opponentLossesNeeded: number;
    relevantGames: RelevantGame[];
    scenarios: ClinchScenario[];
  }
  ```

- [ ] **RelevantGame**
  ```typescript
  interface RelevantGame {
    gameId: string;
    week: number;
    team1: string;  // team ID
    team2: string;  // team ID
    impact: 'team_must_win' | 'opponent_must_lose' | 'helps_if_win' | 'helps_if_lose';
    description: string;
  }
  ```

- [ ] **ClinchScenario**
  ```typescript
  interface ClinchScenario {
    description: string;
    requirements: ScenarioRequirement[];
  }
  ```

- [ ] **ScenarioRequirement**
  ```typescript
  interface ScenarioRequirement {
    gameId: string;
    result: 'team1_wins' | 'team2_wins' | 'tie';
    team1: string;
    team2: string;
  }
  ```

- [ ] **TeamPath**
  ```typescript
  interface TeamPath {
    type: 'bye' | 'division' | 'wildcard';
    description: string;
    requirements: PathRequirement[];
    guaranteed: boolean;  // true if following this path GUARANTEES the goal
  }
  ```

- [ ] **PathRequirement**
  ```typescript
  interface PathRequirement {
    gameId: string;
    week: number;
    requirementType: 'team_wins' | 'team_loses' | 'opponent_wins' | 'opponent_loses';
    team: string;      // team that must win/lose
    opponent: string;  // their opponent in this game
    description: string;
  }
  ```

- [ ] **EliminationResult**
  ```typescript
  interface EliminationResult {
    isEliminated: boolean;
    eliminatedFrom: ('playoff' | 'division' | 'bye')[];
    reason?: string;
    bestPossibleSeed?: number | null;  // null if eliminated
    worstPossibleSeed?: number | null; // null if eliminated
  }
  ```

- [ ] **ClinchResult**
  ```typescript
  interface ClinchResult {
    hasClinched: boolean;
    clinchType: 'playoff' | 'division' | 'bye' | null;
    clinchScenario?: string;  // Description of what clinched
    guaranteedSeed?: number;  // Minimum seed guaranteed
  }
  ```

- [ ] **ClinchCondition**
  ```typescript
  interface ClinchCondition {
    type: 'win' | 'opponent_loses' | 'win_or_opponent_loses' | 'win_and_opponent_loses';
    teamGame?: string;       // Game ID for team's game
    opponentGame?: string;   // Game ID for opponent's game
    opponent?: string;       // Opponent team ID
    description: string;
  }
  ```

---

## Main Functions to Implement

### 1. Magic Number Calculation

- [ ] **`calculateMagicNumber(teamId, games, selections, goalType)`**
  - Signature: `(teamId: string, games: Game[], selections: Record<string, GameSelection>, goalType: 'playoff' | 'division' | 'bye') => MagicNumberResult`
  - Returns `number: 0` when already clinched
  - Returns `number: null` when eliminated
  - Correctly calculates `winsNeeded` component
  - Correctly calculates `opponentLossesNeeded` component
  - Magic number decreases when team wins
  - Magic number decreases when relevant opponent loses
  - Identifies all `relevantGames` with correct impact types
  - Generates all valid `scenarios` (minimal combinations to clinch)
  - Handles all three goal types independently
  - Returns appropriate error/null for invalid team ID
  - Handles empty game list gracefully

### 2. Path Calculation

- [ ] **`calculateTeamPaths(teamId, games, selections, goalType)`**
  - Signature: `(teamId: string, games: Game[], selections: Record<string, GameSelection>, goalType: 'playoff' | 'division' | 'bye') => TeamPath[]`
  - Returns paths with correct `type` based on HOW team would clinch:
    - Division winner making playoffs → `type: 'division'`
    - Wildcard making playoffs → `type: 'wildcard'`
    - #1 seed → `type: 'bye'`
  - Generates requirements that include OPPONENT outcomes (not just team's games)
  - Each path is independently valid (guarantees the goal)
  - Paths sorted by complexity (fewest requirements first)
  - Can return multiple paths for same goal
  - Handles partial seasons (some games final, some scheduled)
  - `guaranteed` flag correctly set based on whether path ensures goal
  - Returns empty array or error indicator for eliminated teams
  - Returns appropriate error for invalid team ID
  - Handles empty game list gracefully

### 3. Elimination Detection

- [ ] **`checkElimination(teamId, games, selections, goalType)`**
  - Signature: `(teamId: string, games: Game[], selections: Record<string, GameSelection>, goalType: 'playoff' | 'division' | 'bye') => EliminationResult`
  - Correctly identifies true elimination (can't make goal even winning out + all help)
  - Does NOT falsely eliminate teams that still have a path
  - Considers worst-case scenarios (opponents all win)
  - Calculates `bestPossibleSeed` correctly
  - Calculates `worstPossibleSeed` correctly
  - Provides meaningful `reason` for elimination
  - Handles tiebreaker implications in elimination math

- [ ] **`checkEliminationAllGoals(teamId, games, selections)`**
  - Signature: `(teamId: string, games: Game[], selections: Record<string, GameSelection>) => EliminationResult`
  - Checks elimination status for all goal types simultaneously
  - Returns combined `eliminatedFrom` array

### 4. Clinch Detection

- [ ] **`checkClinch(teamId, games, selections, goalType)`**
  - Signature: `(teamId: string, games: Game[], selections: Record<string, GameSelection>, goalType: 'playoff' | 'division' | 'bye') => ClinchResult`
  - Correctly identifies clinched playoff spot
  - Correctly identifies clinched division title
  - Correctly identifies clinched first-round bye
  - Verifies clinch survives ALL possible remaining outcomes
  - Sets `guaranteedSeed` correctly
  - Provides meaningful `clinchScenario` description

- [ ] **`getClinchConditions(teamId, games, selections, goalType)`**
  - Signature: `(teamId: string, games: Game[], selections: Record<string, GameSelection>, goalType: 'playoff' | 'division' | 'bye') => ClinchCondition[]`
  - Identifies "clinch with win" scenarios
  - Identifies "clinch with opponent loss" scenarios
  - Identifies "clinch with win OR opponent loss" scenarios
  - Identifies "clinch with win AND opponent loss" scenarios
  - Returns conditions for upcoming week only

### 5. Destiny Check

- [ ] **`checkControlsDestiny(teamId, games, selections, goalType)`**
  - Signature: `(teamId: string, games: Game[], selections: Record<string, GameSelection>, goalType: 'playoff' | 'division' | 'bye') => boolean`
  - Returns `true` if winning out guarantees the goal regardless of other results
  - Returns `false` if team needs help from other results

---

## Core Algorithm Requirements

### Scenario Simulation Engine

- [ ] **Full Outcome Enumeration**
  - Must consider ALL remaining conference games, not just target team's games
  - Must simulate opponent outcomes in path calculations
  - Must handle exponential combinations efficiently (smart pruning)

- [ ] **Best/Worst Case Analysis**
  - For elimination: simulate team wins all + opponents also win all
  - For clinching: verify team maintains position across ALL outcome combinations
  - Must be exhaustive, not heuristic

### Tiebreaker Integration

- [ ] **Head-to-Head**
  - Correctly apply H2H tiebreaker for 2-team ties
  - Identify upcoming H2H games as critical
  - Track completed H2H results

- [ ] **Division Record**
  - Calculate division record correctly
  - Weight division games appropriately for division title goal
  - Apply division record tiebreaker

- [ ] **Conference Record**
  - Calculate conference record correctly
  - Apply for wildcard tiebreaker scenarios

- [ ] **Common Opponents**
  - Identify common opponents between tied teams
  - Require minimum 4 common opponents
  - Calculate common opponent record

- [ ] **Strength of Victory (SoV)**
  - Calculate combined wins of teams defeated
  - Apply when earlier tiebreakers don't resolve

- [ ] **Strength of Schedule (SoS)**
  - Calculate combined wins of all opponents
  - Apply when SoV doesn't resolve

- [ ] **Multi-Team Tiebreakers**
  - Handle 3+ team ties correctly
  - Apply different rules for multi-team scenarios
  - Re-apply from start when reduced to 2 teams

---

## Edge Cases to Handle

### Week 18 / Final Week

- [ ] "Win and in" scenario identification
- [ ] "Win or X loses and in" identification
- [ ] All games considered (no premature cutoff)
- [ ] Proper handling when season is complete

### Tie Games

- [ ] Count ties as 0.5 win + 0.5 loss in standings
- [ ] Consider tie as valid outcome in path calculation
- [ ] Handle tiebreaker implications of tied games

### Data Edge Cases

- [ ] Invalid team ID returns appropriate error/null
- [ ] Empty games array returns appropriate response
- [ ] Partial season data handled correctly
- [ ] Games in progress handled appropriately

---

## Helper Functions Needed

- [ ] **`getRemainingGames(teamId, games)`** - Get team's remaining scheduled games
- [ ] **`getConferenceRemainingGames(conference, games)`** - Get all remaining conference games
- [ ] **`simulateOutcomes(games, selections)`** - Generate all possible outcome combinations
- [ ] **`calculateStandingsWithOutcomes(games, selections, outcomeSet)`** - Get standings for a specific outcome combination
- [ ] **`wouldTeamMakePlayoffs(teamId, standings)`** - Check if team is in top 7
- [ ] **`wouldTeamWinDivision(teamId, standings)`** - Check if team wins division
- [ ] **`wouldTeamGetBye(teamId, standings)`** - Check if team is #1 seed
- [ ] **`getHeadToHeadRecord(team1, team2, games)`** - Get H2H record between two teams
- [ ] **`getDivisionRecord(teamId, games)`** - Get team's division record
- [ ] **`getConferenceRecord(teamId, games)`** - Get team's conference record
- [ ] **`getCommonOpponentRecord(team1, team2, games)`** - Get common opponent records
- [ ] **`calculateSoV(teamId, games)`** - Calculate strength of victory
- [ ] **`calculateSoS(teamId, games)`** - Calculate strength of schedule
- [ ] **`applyTiebreaker(teams, games, tiebreakerLevel)`** - Apply specific tiebreaker
- [ ] **`resolveTie(teams, games)`** - Full tiebreaker resolution

---

## Integration Points

### Existing Code to Use

- [ ] `calculatePlayoffSeedings()` from `src/utils/playoffSeedings.ts`
- [ ] `teams`, `getTeamsByConference`, `getTeamsByDivision` from `@/data/teams`
- [ ] `Game`, `GameSelection`, `Team`, `TeamStanding` types from `@/types`

### Files to Create/Modify

- [ ] Create `src/utils/teamNeeds.ts` - Main implementation
- [ ] Update `src/utils/teamNeeds.test.ts` - Remove placeholder assertions, add real assertions
- [ ] May need to refactor `src/utils/playoffSeedings.ts` for reuse

---

## Test Coverage Summary

| Phase | Test Count | Category |
|-------|------------|----------|
| 1 | 17 | Core Magic Number |
| 2 | 13 | Basic Paths |
| 3 | 11 | Scenario Simulation |
| 4 | 13 | Elimination Detection |
| 5 | 12 | Clinching Scenarios |
| 6 | 14 | Tiebreaker-Aware |
| 7 | 8 | Division Races |
| 8 | 11 | Edge Cases |
| **Total** | **99** | |

---

## Implementation Priority

1. **Foundation**
   - [ ] Interface definitions
   - [ ] Helper functions for standings/tiebreakers
   - [ ] Outcome simulation engine

2. **Core Functions**
   - [ ] `checkElimination()` - Needed to know if paths exist
   - [ ] `checkClinch()` - Needed to know current status
   - [ ] `calculateTeamPaths()` - Core path finding
   - [ ] `calculateMagicNumber()` - Derived from paths

3. **Advanced Features**
   - [ ] `getClinchConditions()` - Week-specific conditions
   - [ ] `checkControlsDestiny()` - Destiny flag
   - [ ] Multi-team tiebreaker handling
   - [ ] Full tiebreaker hierarchy

4. **Polish**
   - [ ] Edge case handling
   - [ ] Error handling
   - [ ] Performance optimization

---

## Quality Requirements

**CRITICAL: No shortcuts or approximations acceptable.**

- All calculations must use actual data, not proxies
- Every path shown must be verified as real
- Magic numbers must reflect true NFL math (wins + opponent losses)
- All tiebreaker implications must be considered
- If showing "Team X needs Y", that must be 100% accurate
