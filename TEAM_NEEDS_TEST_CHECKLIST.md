# "What does <<TEAM>> need?" Test Checklist

This document outlines all tests needed to verify correct behavior of the team needs/paths/magic number logic. Tests will be written first (TDD), then implementation will follow.

---

## Test Categories

1. [Scenario Simulation Tests](#1-scenario-simulation-tests)
2. [Magic Number Tests](#2-magic-number-tests)
3. [Path Type Tests](#3-path-type-tests)
4. [Elimination Detection Tests](#4-elimination-detection-tests)
5. [Clinching Scenario Tests](#5-clinching-scenario-tests)
6. [Tiebreaker-Aware Tests](#6-tiebreaker-aware-tests)
7. [Division Race Tests](#7-division-race-tests)
8. [Edge Case Tests](#8-edge-case-tests)

---

## 1. Scenario Simulation Tests

These tests verify that path calculations consider ALL relevant games, not just the target team's games.

### 1.1 Basic "Team Wins + Opponent Loses" Scenarios
- [x] Team A at 10-5 needs to win 1 game OR have Team B (also 10-5) lose 1 game to clinch
- [x] Team A needs to win AND Team B needs to lose (both conditions required)
- [x] Team A clinches if Team B loses, regardless of Team A's result
- [x] Path should list specific opponent games that matter (e.g., "Team B must lose to Team C in Week 17")

### 1.2 Multiple Competitor Scenarios
- [x] Team A competing against 3 other teams for final wildcard spot
- [x] Path shows all relevant games from all competitors
- [x] Correctly identifies which combination of results clinches

### 1.3 Conference-Wide Impact
- [x] Changes in one division affect wildcard race in another division
- [x] Path calculation considers all 16 conference teams' remaining games

---

## 2. Magic Number Tests

These tests verify magic number calculations follow true NFL math: Team Wins Needed + Opponent Losses Needed.

### 2.1 Basic Magic Number Calculation
- [x] Team with 3-game lead: magic number should be small (opponent losses help)
- [x] Magic number decreases when team wins
- [x] Magic number decreases when relevant opponent loses
- [x] Magic number of 0 means clinched
- [x] Magic number of null means eliminated

### 2.2 Magic Number Components
- [x] Returns both "wins needed" and "opponent losses needed" components
- [x] Correctly identifies WHICH opponents' losses matter
- [x] Shows minimum combination (e.g., "2 wins" or "1 win + 1 opponent loss" or "2 opponent losses")

### 2.3 Different Goal Types
- [x] Playoff magic number (make top 7)
- [x] Division magic number (win division)
- [x] Bye magic number (get #1 seed)
- [x] Each goal type has independent magic number

### 2.4 Magic Number Edge Cases
- [x] Team already clinched returns 0
- [x] Eliminated team returns null
- [x] Week 18 with 1 game remaining
- [x] All games in conference are final (season over)

---

## 3. Path Type Tests

These tests verify paths are correctly categorized.

### 3.1 Playoff Path Types
- [x] Team clinching as division winner gets path type 'division', not 'wildcard'
- [x] Team clinching as wildcard gets path type 'wildcard'
- [x] Team clinching #1 seed gets path type 'bye'

### 3.2 Path Goal Accuracy
- [x] 'playoff' goal: any seed 1-7 satisfies
- [x] 'division' goal: only seeds 1-4 satisfy (division winners)
- [x] 'bye' goal: only seed 1 satisfies

### 3.3 Multiple Paths
- [x] Team may have multiple paths to same goal (different combinations)
- [x] Paths sorted by complexity (fewest requirements first)
- [x] Each path is independently valid (following it guarantees the goal)

---

## 4. Elimination Detection Tests

These tests verify accurate elimination detection considering worst-case scenarios.

### 4.1 True Elimination
- [x] Team cannot make playoffs even if they win out AND all competitors lose out
- [x] Team eliminated by record alone (can't catch 7th place team)
- [x] Team eliminated by tiebreaker (same record but loses all tiebreakers)

### 4.2 Not Eliminated (Edge Cases)
- [x] Team with losing record but many games remaining is NOT eliminated early
- [x] Team behind in standings but with favorable remaining schedule
- [x] Team that would win tiebreaker if records are equal

### 4.3 Elimination Scenarios
- [x] Worst-case simulation: team wins all, competitors also win all
- [x] If team still makes playoffs in worst-case, they're not eliminated
- [x] Must consider all 2^N outcomes of remaining games (or smart pruning)

### 4.4 Division vs Wildcard Elimination
- [x] Team can be eliminated from division race but not playoffs
- [x] Team can be eliminated from bye race but not division
- [x] Separate elimination status for each goal type

---

## 5. Clinching Scenario Tests

These tests verify accurate clinch detection.

### 5.1 Clinch Types
- [x] Clinched playoff spot (any seed 1-7)
- [x] Clinched division title (seeds 1-4)
- [x] Clinched first-round bye (seed 1 only)
- [x] Clinched home field throughout (seed 1 only)

### 5.2 Clinch Conditions
- [x] "Clinch with win" - team clinches if they win, regardless of other results
- [x] "Clinch with loss by X" - team clinches if opponent loses
- [x] "Clinch with win OR loss by X" - either condition sufficient
- [x] "Clinch with win AND loss by X" - both conditions required

### 5.3 Clinch Verification
- [x] After clinch condition met, verify team actually has the seed/status
- [x] Clinch survives all possible remaining game outcomes
- [x] No scenario exists where clinched status is lost

---

## 6. Tiebreaker-Aware Tests

These tests verify tiebreaker implications are considered.

### 6.1 Head-to-Head Tiebreakers
- [x] Two tied teams: winner of H2H game clinches tiebreaker
- [x] Path highlights upcoming H2H games as critical
- [x] Completed H2H games affect path requirements

### 6.2 Division Record Tiebreakers
- [x] Division games weighted more heavily for division title
- [x] Path identifies division games as high-priority
- [x] Division record calculated correctly for tiebreaker

### 6.3 Conference Record Tiebreakers
- [x] Conference games matter for wildcard tiebreaker
- [x] Non-conference games don't affect conference record
- [x] Path shows conference record implications

### 6.4 Strength of Victory/Schedule
- [x] SoV/SoS correctly calculated
- [x] Games against good teams matter more for SoV
- [x] Path considers SoV implications when relevant

### 6.5 Common Opponents
- [x] Common opponent record calculated for tied teams
- [x] Path identifies games against common opponents
- [x] Minimum 4 common opponents required for this tiebreaker

---

## 7. Division Race Tests

These tests verify division-specific scenarios.

### 7.1 Division Clinching
- [x] Team clinches division when no other division team can catch them
- [x] Division clinch considers all remaining games in division
- [x] Tiebreakers within division correctly applied

### 7.2 Division Games Priority
- [x] Winning division game more valuable than non-division for division title
- [x] Path prioritizes division games when division title is goal
- [x] Division sweep tiebreaker considered

### 7.3 Same Division Competitors
- [x] Two teams in same division fighting for title
- [x] H2H between them is most critical game
- [x] Path correctly identifies "must win division game"

---

## 8. Edge Case Tests

### 8.1 Week 18 Scenarios
- [x] "Win and in" correctly identified
- [x] "Win or [opponent] loses and in" correctly identified
- [x] Complex Week 18 tiebreaker scenarios
- [x] All games in Week 18 are considered

### 8.2 Tie Games
- [x] Tie as valid outcome in path calculation
- [x] Tie affects standings correctly (0.5 win, 0.5 loss)
- [x] Tiebreaker implications of tie games

### 8.3 Multi-Team Ties
- [x] 3+ teams tied: correct tiebreaker procedure
- [x] Path calculation for multi-team tiebreaker scenarios
- [x] Elimination when losing multi-team tiebreaker

### 8.4 Controls Own Destiny
- [x] Team "controls destiny" if winning out guarantees goal
- [x] Team does NOT control destiny if they need help
- [x] Flag/indicator for "controls own destiny" status

### 8.5 Invalid/Empty Data
- [x] Invalid team ID returns appropriate error/null
- [x] No games returns appropriate response
- [x] Partial season data handled correctly

---

## Test Data Requirements

### Real Team Data
- [x] Use actual NFL team IDs from `@/data/teams`
- [x] Correct division assignments
- [x] Correct conference assignments

### Game Scenarios
- [x] Helper functions to create realistic game sets
- [x] Support for partial seasons (some games final, some scheduled)
- [x] Support for tie games

### Verification
- [ ] Each test should verify against known-correct NFL scenarios when possible
- [ ] Cross-reference with historical data (e.g., 2024 Week 17 scenarios)

---

## Implementation Order

1. **Phase 1: Core Magic Number Tests** (2.1, 2.2, 2.3, 2.4) - ✅ IMPLEMENTED (17 tests)
2. **Phase 2: Basic Path Tests** (3.1, 3.2, 3.3) - ✅ IMPLEMENTED (13 tests)
3. **Phase 3: Scenario Simulation Tests** (1.1, 1.2, 1.3) - ✅ IMPLEMENTED (11 tests)
4. **Phase 4: Elimination Tests** (4.1, 4.2, 4.3, 4.4) - ✅ IMPLEMENTED (13 tests)
5. **Phase 5: Clinching Tests** (5.1, 5.2, 5.3) - ✅ IMPLEMENTED (12 tests)
6. **Phase 6: Tiebreaker Tests** (6.1, 6.2, 6.3, 6.4, 6.5) - ✅ IMPLEMENTED (14 tests)
7. **Phase 7: Division Tests** (7.1, 7.2, 7.3) - ✅ IMPLEMENTED (7 tests)
8. **Phase 8: Edge Cases** (8.1-8.5) - ✅ IMPLEMENTED (12 tests)

**Total: 99 tests written across all 8 phases. All phases fully implemented.**

---

## Notes

- Tests should be written BEFORE implementation (TDD)
- Each test should initially fail (red)
- Implementation should make tests pass (green)
- Refactor while keeping tests green
- No shortcuts - all tests must verify actual correct behavior
