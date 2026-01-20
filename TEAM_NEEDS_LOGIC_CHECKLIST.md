# "What does <<TEAM>> need?" Logic Review Checklist

This document identifies potential issues in the team path/magic number calculation logic found in `src/utils/teamPaths.ts` and displayed in `src/components/games/TeamView.tsx`.

---

## Summary of Issues Found

| Category | Issue Count | Severity |
|----------|-------------|----------|
| Logic Errors | 5 | High |
| Incomplete Implementation | 6 | Medium |
| Edge Cases | 4 | Medium |
| Dead Code | 1 | Low |
| Display Issues | 2 | Low |

---

## High Severity Issues

### 1. Incomplete Scenario Simulation
**File:** `teamPaths.ts` - `findMinimalPath()` (lines 161-230)
**File:** `teamPaths.ts` - `isTeamEliminated()` (lines 317-339)

- [ ] **Problem:** Path calculation only sets selections for the target team's games, not other conference games
- [ ] When checking if a team makes playoffs, the function sets the team to win/lose specific games but leaves OTHER teams' games unselected
- [ ] This means `calculatePlayoffSeedings()` runs with incomplete data
- [ ] Result: Paths may be incorrect because other teams' outcomes aren't considered

**Example:** Team A needs to win 2 games AND have Team B lose 1 game. Current logic only shows "Win 2 games" without the "Team B must lose" requirement.

---

### 2. Magic Number Calculation Is Oversimplified
**File:** `teamPaths.ts` - `calculateMagicNumber()` (lines 258-314)

- [ ] **Problem:** Magic number only counts team's required wins, ignoring opponent losses
- [ ] Traditional NFL magic number = Team Wins Needed + Opponent Losses Needed
- [ ] Current implementation at line 301: `magicNumber = simplestPath.requirements.length` only counts wins
- [ ] Scenario descriptions (lines 307-309) only mention wins, not "X wins OR Y losses"

**Example:** True magic number might be 3 (team needs 2 wins + 1 opponent loss), but current code shows 2.

---

### 3. Path Type Mismatch for Playoff Goal
**File:** `teamPaths.ts` - `findMinimalPath()` (line 220)

- [ ] **Problem:** When `goalType === 'playoff'`, the returned path type is always `'wildcard'`
- [ ] A team making playoffs as a **division winner** (seeds 1-4) would incorrectly get a `type: 'wildcard'` path
- [ ] This affects display in TeamView which filters paths by type

**Code:**
```typescript
return {
  type: goalType === 'playoff' ? 'wildcard' : goalType,  // Always 'wildcard' for playoff
  ...
}
```

---

### 4. Elimination Detection Doesn't Consider Worst-Case for Opponents
**File:** `teamPaths.ts` - `isTeamEliminated()` (lines 317-339)

- [ ] **Problem:** Best-case calculation for team doesn't set worst-case for opponents
- [ ] Lines 328-331 create selections where target team wins all remaining games
- [ ] But other teams' remaining games are left unselected (not set to losses)
- [ ] Could mark teams as "not eliminated" when they actually are (if opponents winning out would block them)

---

### 5. No Bye Path Calculated via Minimal Path Finding
**File:** `teamPaths.ts` - `calculateTeamPaths()` (lines 143-153)

- [ ] **Problem:** `findMinimalPath()` is called for 'playoff' and 'division' goals, but NOT for 'bye'
- [ ] Bye path is only calculated through the "win all" scenario (lines 118-124)
- [ ] A team might be able to clinch a bye with fewer wins than "win all" if other teams lose

**Current code only does:**
```typescript
const minimalPlayoffPath = findMinimalPath(..., 'playoff');
const minimalDivisionPath = findMinimalPath(..., 'division');
// Missing: findMinimalPath(..., 'bye')
```

---

## Medium Severity Issues

### 6. Division Race Not Properly Isolated
**File:** `teamPaths.ts` - `findMinimalPath()` for division goal

- [ ] **Problem:** Division title calculation doesn't specifically prioritize division opponents
- [ ] Winning a game against a division opponent is more valuable than against a non-division opponent
- [ ] Current logic treats all remaining games equally
- [ ] Should highlight division games as more important for division title

---

### 7. No Head-to-Head Game Highlighting
**File:** `teamPaths.ts` - path requirements

- [ ] **Problem:** If two teams are tied and play each other, that game should be flagged as critical
- [ ] Current logic doesn't identify or prioritize head-to-head matchups
- [ ] User should see "Must beat [Rival] in Week X" prominently

---

### 8. "Controls Own Destiny" Not Explicitly Tracked
**File:** `teamPaths.ts`

- [ ] **Problem:** No explicit flag for "team controls their own destiny"
- [ ] A team controls destiny if they can clinch by winning out regardless of other results
- [ ] This is important information that should be displayed
- [ ] Would require simulating team winning all + other teams also winning all

---

### 9. Tiebreaker-Specific Games Not Identified
**File:** `teamPaths.ts` - path calculation

- [ ] **Problem:** Doesn't identify which games affect tiebreakers
- [ ] A team might need to win SPECIFIC games (not just ANY games) to win tiebreakers
- [ ] Conference record, division record, common opponents all matter
- [ ] Current logic just counts wins needed, not which wins matter most

---

### 10. Clinched Status Check Has Gaps
**File:** `teamPaths.ts` - `calculateTeamPaths()` (lines 78-90)

- [ ] **Problem:** Early return logic for clinched teams is incomplete
- [ ] Line 82-84: If clinched division, comment says "can still calculate bye path" but doesn't actually do anything special
- [ ] Line 85-87: If clinched playoff, comment says "can still calculate division/bye paths" but no special handling
- [ ] These paths should still be calculated and displayed

---

### 11. Requirements Don't Include "Other Team Must Lose" Scenarios
**File:** `teamPaths.ts` - `PathRequirement` interface (lines 12-20)

- [ ] **Problem:** PathRequirement only has 'win' | 'loss' | 'tie' for the TARGET team
- [ ] No way to express "Opponent X must lose to Team Y"
- [ ] Real playoff scenarios often require specific losses by competitors
- [ ] Interface needs expansion to support competitor outcomes

**Current interface:**
```typescript
interface PathRequirement {
  type: 'win' | 'loss' | 'tie';
  teamId: string;        // Always the target team
  // No field for "other team must do X"
}
```

---

## Edge Cases

### 12. Eliminated Team Returns Invalid Path
**File:** `teamPaths.ts` - `calculateTeamPaths()` (lines 88-90)

- [ ] **Problem:** Eliminated teams return a path with `complexity: Infinity`
- [ ] Should probably return empty array or a different indicator
- [ ] `Infinity` complexity could cause sorting issues

**Code:**
```typescript
if (teamStanding?.isEliminated) {
  return [{ type: 'wildcard', description: 'Mathematically eliminated...', requirements: [], complexity: Infinity }];
}
```

---

### 13. Week 18 / Final Week Edge Cases
**File:** `teamPaths.ts`

- [ ] **Problem:** No special handling for final week scenarios
- [ ] In Week 18, some games may be flexed or have playoff implications
- [ ] "Win and in" scenarios should be clearly identified
- [ ] Simultaneous game scenarios not considered (e.g., "If Team A loses at 1pm, Team B clinches before their 4pm game")

---

### 14. Tie Game Handling in Paths
**File:** `teamPaths.ts` - `findMinimalPath()` (lines 177-189)

- [ ] **Problem:** Path finding doesn't consider tie scenarios
- [ ] Only sets games to win or loss, never considers ties as valid outcomes
- [ ] While ties are rare, a tie might be sufficient for some clinching scenarios
- [ ] Especially relevant for SoV/SoS tiebreakers

---

### 15. Multi-Team Tiebreaker Scenarios
**File:** `teamPaths.ts`

- [ ] **Problem:** Three-or-more team tiebreaker scenarios not handled
- [ ] Current logic only considers pairwise comparisons
- [ ] NFL tiebreakers for 3+ teams have different rules
- [ ] A team's path might depend on complex multi-team interactions

---

## Low Severity Issues

### 16. Dead Code - Unused Variable
**File:** `teamPaths.ts` - `calculateTeamPaths()` (line 96)

- [ ] **Problem:** `currentStatus` is calculated but never used
- [ ] This is dead code that should be removed or utilized

**Code:**
```typescript
const currentStatus = checkPlayoffStatus(teamId, games, currentSelections, {});
// currentStatus is never referenced after this
```

---

### 17. Display Shows Only First Path of Each Type
**File:** `TeamView.tsx` (lines 200-208)

- [ ] **Problem:** Only shows `.slice(0, 1)` of each path type
- [ ] User might want to see alternative paths
- [ ] Consider adding "show more" option or displaying complexity/probability

---

### 18. Path Description Could Be More Specific
**File:** `teamPaths.ts` - `findMinimalPath()` (lines 213-217)

- [ ] **Problem:** Description is generic "Win X of Y remaining games"
- [ ] Doesn't specify WHICH games or against WHOM
- [ ] Could be more helpful: "Beat [Team A] and [Team B]"

**Current:**
```typescript
const description = wins === 1
  ? `Win 1 game (vs ${requirements[0].opponentName})`  // Only specific for 1 win
  : `Win ${wins} of ${numGames} remaining games`;      // Generic for 2+ wins
```

---

## Testing Gaps

### Tests That Should Be Added

- [ ] Test path calculation when team needs opponent to lose (not just own wins)
- [ ] Test division title path prioritizes division opponents
- [ ] Test bye path calculation with fewer than "win all" games
- [ ] Test eliminated team path return value
- [ ] Test Week 18 "win and in" scenarios
- [ ] Test multi-team tiebreaker scenarios
- [ ] Test head-to-head game identification
- [ ] Test magic number with mixed win/loss requirements

---

## Recommended Priority Order

1. **Fix incomplete scenario simulation** - Other teams' outcomes must be considered
2. **Fix magic number calculation** - Should include opponent losses
3. **Fix path type for division-winner playoff clinch**
4. **Add bye path minimal calculation**
5. **Add "controls own destiny" indicator**
6. **Expand PathRequirement to include competitor outcomes**
7. **Remove dead code**
8. **Improve path descriptions**

---

## Requirements

**IMPORTANT: No shortcuts or approximations are acceptable in this logic.**

- All calculations must use actual data, not proxies
- Scenarios must be fully accurate, not "good enough"
- Every path shown must be a real, verified path to the goal
- Magic numbers must reflect true NFL clinching math (wins + opponent losses)
- All tiebreaker implications must be considered
- If showing "Team X needs Y", that must be 100% accurate

The current implementation takes multiple shortcuts that produce inaccurate results. These must all be fixed.
