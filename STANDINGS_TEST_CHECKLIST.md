# Standings Logic Test Checklist

A comprehensive checklist for testing all standings, tiebreaker, playoff seeding, and draft order logic.

---

## 1. Basic Team Record Calculations

### Win/Loss/Tie Tracking
- [ ] Wins increment correctly for final games
- [ ] Losses increment correctly for final games
- [ ] Ties increment correctly for final games (rare but possible)
- [ ] Win percentage calculated correctly: `(wins + ties * 0.5) / total`
- [ ] Win percentage handles 0 games played (no division by zero)
- [ ] Records update when user makes/changes selections for unplayed games
- [ ] Records don't count games without a selection
- [ ] Records don't count in-progress games without a selection

### Division Record Tracking
- [ ] Division wins tracked only for games within same division
- [ ] Division losses tracked correctly
- [ ] Division ties tracked correctly
- [ ] Division record ignores non-division opponents
- [ ] Division record correct when team plays same opponent twice
- [ ] Division games: 6 total per team (2 vs each of 3 division rivals)

### Conference Record Tracking
- [ ] Conference wins tracked only for games within same conference
- [ ] Conference losses tracked correctly
- [ ] Conference ties tracked correctly
- [ ] Conference record ignores non-conference opponents
- [ ] Conference games: typically 13-14 per team (varies by schedule)

### Points For/Against
- [ ] Points for accumulates from final game scores
- [ ] Points against accumulates from final game scores
- [ ] Point differential calculated correctly (PF - PA)
- [ ] Projected games use estimated scores (home win: 24-17, away win: 17-24)
- [ ] Ties use estimated score (20-20)
- [ ] Points don't count from games without selections

---

## 2. Tiebreaker Logic

### Step 1: Head-to-Head Record
- [ ] H2H only applies when ALL tied teams have played each other
- [ ] H2H with 2 teams: better record wins
- [ ] H2H with 3+ teams: check if one team beat all others
- [ ] H2H tie within the tiebreaker falls through to next step
- [ ] H2H correctly handles teams that split series (1-1)
- [ ] H2H correctly handles season sweep (2-0)
- [ ] H2H not used if tied teams haven't all played each other

### Step 2: Division Record (Division Ties Only)
- [ ] Division record tiebreaker only used for division title races
- [ ] Division record NOT used for wild card tiebreakers
- [ ] Better division win% wins the tiebreaker
- [ ] Division record tie falls through to next step

### Step 3: Common Games Record
- [ ] Common games identified correctly (opponents both teams played)
- [ ] Minimum 4 common games required to use this tiebreaker
- [ ] If < 4 common games, skip to next tiebreaker
- [ ] Common games win% calculated correctly
- [ ] Common games includes games vs common opponents only
- [ ] Each common opponent counted once (not per game)

### Step 4: Conference Record
- [ ] Conference win% used as tiebreaker
- [ ] Higher conference win% wins
- [ ] Conference record tie falls through to next step

### Step 5: Strength of Victory (SOV)
- [ ] SOV = average win% of teams defeated
- [ ] Only includes opponents the team beat (not lost to)
- [ ] Handles teams with 0 wins (SOV = 0)
- [ ] SOV calculated from final game results only
- [ ] Higher SOV wins the tiebreaker

### Step 6: Strength of Schedule (SOS)
- [ ] SOS = average win% of all opponents played
- [ ] Includes ALL opponents (wins, losses, ties)
- [ ] Handles teams that played same opponent multiple times
- [ ] Higher SOS wins the tiebreaker (harder schedule)
- [ ] SOS calculated from final game results only

### Step 7: Conference Points Ranking
- [ ] Combined ranking of points scored and points allowed
- [ ] Better combined ranking wins
- [ ] Points ranking within conference only

### Steps 8-11: Point Differential (Simplified)
- [ ] Net points (PF - PA) used as final tiebreaker
- [ ] Higher point differential wins
- [ ] If still tied, order may be arbitrary (document behavior)

### Tiebreaker Edge Cases
- [ ] 2-way tie resolved correctly
- [ ] 3-way tie resolved correctly
- [ ] 4-way tie resolved correctly (rare but possible)
- [ ] Tiebreaker chains: if step breaks some teams but not all, re-run from step 1
- [ ] Division vs Wild Card: different tiebreaker paths used appropriately

---

## 3. Division Winner Determination

### Basic Division Winner
- [ ] Team with best record in division wins division
- [ ] Division winner gets seed 1-4 (depending on other division winners)
- [ ] Division winner marked with `clinched: 'division'`
- [ ] Only 1 division winner per division

### Division Winner Tiebreakers
- [ ] 2-way tie for division uses full tiebreaker process
- [ ] H2H between the two teams checked first
- [ ] 3-way tie for division handled correctly
- [ ] 4-way tie for division handled correctly (all 4 teams tied)
- [ ] Division record (step 2) used for division ties

### Division Winner Seeding (1-4)
- [ ] Best division winner gets seed 1 (first-round bye)
- [ ] Division winners sorted by record, then tiebreakers
- [ ] Tiebreakers between division winners use wild card rules (not division rules)
- [ ] Correct seed assigned to each division winner

---

## 4. Wild Card Seeding

### Wild Card Qualification
- [ ] Top 3 non-division winners per conference make wild card
- [ ] Wild card teams get seeds 5, 6, 7
- [ ] Wild card teams sorted by record first
- [ ] Wild card includes teams from any division

### Wild Card Tiebreakers
- [ ] Same conference tiebreakers apply (no division record step)
- [ ] H2H used if wild card contenders played each other
- [ ] 2-way wild card tie resolved correctly
- [ ] 3-way wild card tie resolved correctly
- [ ] Multiple teams from same division can make wild card
- [ ] Cross-division wild card tie uses conference tiebreakers

### Wild Card Edge Cases
- [ ] Team misses playoffs despite better record than division winner
- [ ] All 3 wild cards from different divisions
- [ ] 2 wild cards from same division
- [ ] Wild card race with 4+ teams competing for 3 spots

---

## 5. Complete Playoff Seeding

### 7-Team Playoff Structure
- [ ] Exactly 7 teams per conference make playoffs
- [ ] Seeds 1-4: Division winners
- [ ] Seeds 5-7: Wild card teams
- [ ] Seed 1 gets first-round bye
- [ ] Seeds 2-7 play in Wild Card round

### Playoff Bracket Matchups
- [ ] Wild Card: 2 vs 7, 3 vs 6, 4 vs 5
- [ ] Higher seed always hosts
- [ ] Divisional: 1 vs lowest remaining, 2 vs other winner (if 2 is highest remaining)
- [ ] Conference Championship: remaining 2 teams, higher seed hosts
- [ ] Super Bowl: AFC champion vs NFC champion

### Clinched Status
- [ ] `clinched: 'bye'` when team clinches #1 seed
- [ ] `clinched: 'division'` when team clinches division but not bye
- [ ] `clinched: 'wildcard'` when team clinches playoff but not division
- [ ] Clinched status only set when mathematically certain
- [ ] Clinched status updates as games are played

### Non-Playoff Teams
- [ ] Exactly 9 teams per conference miss playoffs
- [ ] Non-playoff teams have `seed: null`
- [ ] Non-playoff teams sorted by record (best to worst for display)
- [ ] Eliminated teams marked with `isEliminated: true`

---

## 6. Draft Order Logic

### Non-Playoff Teams (Picks 1-18)
- [ ] All 18 non-playoff teams included
- [ ] Sorted by record: worst record picks first
- [ ] Ties broken by SOS (lower SOS = weaker opponents = picks earlier)
- [ ] Pick 1 goes to team with worst record
- [ ] Pick 18 goes to best non-playoff team

### Wild Card Losers (Picks 19-24)
- [ ] All 6 Wild Card losers included (3 per conference)
- [ ] Sorted by record: worst record picks first
- [ ] SOS tiebreaker for same record
- [ ] Picks assigned as games are decided or picked
- [ ] User picks for unplayed games create provisional draft positions

### Divisional Losers (Picks 25-28)
- [ ] All 4 Divisional losers included (2 per conference)
- [ ] Sorted by record: worst record picks first
- [ ] SOS tiebreaker for same record
- [ ] Pick ranges shown when not all games decided
- [ ] Pick ranges consider all 8 potential divisional losers

### Conference Championship Losers (Picks 29-30)
- [ ] Both CCG losers included
- [ ] Sorted by record: worse record picks 29
- [ ] SOS tiebreaker for same record
- [ ] Pick ranges shown when not all games decided

### Super Bowl (Picks 31-32)
- [ ] Super Bowl loser picks 31
- [ ] Super Bowl winner picks 32
- [ ] Handles user pick for unplayed Super Bowl
- [ ] Actual result overrides user pick

### Draft Order SOS Calculation
- [ ] SOS calculated from regular season games only
- [ ] SOS = average opponent win%
- [ ] Lower SOS = weaker schedule = picks earlier (tiebreaker)
- [ ] SOS handles teams that played same opponent twice

---

## 7. Pick Range Calculations

### Range Logic
- [ ] Range shown when pick position depends on other game outcomes
- [ ] Minimum pick: best case (all potential losers with worse records lose)
- [ ] Maximum pick: worst case (all potential losers with better records lose)
- [ ] Range displayed as "X-Y" format
- [ ] Range highlighted in different color (amber)

### Divisional Round Ranges (Picks 25-28)
- [ ] With 0 games decided: ranges based on all 8 participants
- [ ] With 1 game decided: ranges narrowed based on known loser
- [ ] With 2 games decided: ranges further narrowed
- [ ] With 3 games decided: one team's position may be locked
- [ ] With 4 games decided: all positions locked (no ranges)

### Conference Championship Ranges (Picks 29-30)
- [ ] With 0 games decided: both teams show 29-30 range
- [ ] With 1 game decided: known loser's position depends on other game
- [ ] With 2 games decided: both positions locked

### Range Calculation Edge Cases
- [ ] Team with clearly worst record: range might be just "25"
- [ ] Team with clearly best record: range might be just "28"
- [ ] Multiple teams with same record: wider ranges
- [ ] SOS tiebreaker affects range boundaries

---

## 8. Magic Numbers

### Playoff Magic Number
- [ ] Magic number = wins needed to clinch playoff spot
- [ ] Returns 0 if already clinched
- [ ] Returns null if mathematically eliminated
- [ ] Decrements as team wins OR competitors lose
- [ ] Accounts for remaining schedule

### Division Magic Number
- [ ] Magic number = wins needed to clinch division
- [ ] Lower than or equal to playoff magic number
- [ ] Returns 0 if already clinched division
- [ ] Returns null if can't win division

### Bye Magic Number
- [ ] Magic number = wins needed to clinch #1 seed
- [ ] Lowest of the three magic numbers
- [ ] Returns 0 if already clinched bye
- [ ] Returns null if can't get bye

### Magic Number Edge Cases
- [ ] Team controls own destiny: magic number ≤ remaining games
- [ ] Team needs help: magic number > remaining games
- [ ] Week 18 scenarios: magic number should be 0 or 1
- [ ] Tiebreaker scenarios affect magic number accuracy

---

## 9. Elimination Detection

### Playoff Elimination
- [ ] Team eliminated if can't make top 7 even winning all remaining games
- [ ] Accounts for best possible record
- [ ] Accounts for worst possible records of competitors
- [ ] Accounts for tiebreakers (may not be eliminated if tiebreaker favorable)

### Elimination Display
- [ ] Eliminated teams marked with `isEliminated: true`
- [ ] Eliminated teams grayed out in standings display
- [ ] Elimination status updates after each game

### Elimination Edge Cases
- [ ] Team with losing record still not eliminated (early season)
- [ ] Team with winning record eliminated (late season)
- [ ] Tiebreaker scenarios where team is "soft" eliminated

---

## 10. Streak and Last 5 Calculations

### Current Streak
- [ ] Streak format: "W3", "L2", "T1"
- [ ] Streak counts consecutive results of same type
- [ ] Streak resets on different result
- [ ] Streak includes projected games (from selections)
- [ ] Streak ignores games without selection
- [ ] Streak returns "-" if no games played

### Last 5 Games
- [ ] Shows most recent 5 games (or fewer if < 5 played)
- [ ] Ordered from most recent to oldest
- [ ] Includes: result (W/L/T), scores, opponent, week
- [ ] Projected games marked with `isProjected: true`
- [ ] Projected games show 1-0 or 0-1 scores
- [ ] Final games show actual scores

### Streak/Last 5 Edge Cases
- [ ] Team with fewer than 5 games played
- [ ] Team on bye week
- [ ] Mix of final and projected games
- [ ] All games projected (early season simulation)

---

## 11. Edge Cases and Boundary Conditions

### Schedule Edge Cases
- [ ] Team with bye week (missing week in schedule)
- [ ] Week 18 scenarios (final week)
- [ ] Thursday/Monday games (same week, different days)
- [ ] Postponed/rescheduled games

### Game State Edge Cases
- [ ] In-progress game without selection (should not count)
- [ ] Final game with no score data (should use 0-0 or error)
- [ ] Game between teams from different conferences
- [ ] Game marked final but score is 0-0 (defensive game)

### Selection Edge Cases
- [ ] User changes selection after making initial pick
- [ ] User clears selection (should revert to unselected)
- [ ] Selection for game that becomes final (actual result should override)
- [ ] Conflicting selections (same team picked twice in a week)

### Tiebreaker Edge Cases
- [ ] All 4 division teams tied at end of season
- [ ] 8-way tie for 3 wild card spots
- [ ] 0-0 head-to-head (both games tied)
- [ ] Team with 0 wins (SOV = 0, edge case for division by zero)

### Draft Order Edge Cases
- [ ] Multiple teams with identical record AND SOS
- [ ] Playoff team with worse record than non-playoff team
- [ ] Trade scenarios (team has multiple picks) - out of scope but note
- [ ] Pick order when user has partial playoff bracket filled

---

## 12. Integration Tests

### Full Season Simulation
- [ ] Simulate complete regular season with random outcomes
- [ ] Verify exactly 14 teams make playoffs (7 per conference)
- [ ] Verify exactly 8 division winners (4 per conference)
- [ ] Verify standings are deterministic (same inputs = same outputs)

### Playoff Bracket Flow
- [ ] Wild Card selections unlock Divisional round
- [ ] Divisional selections unlock Conference Championship
- [ ] Conference Championship selections unlock Super Bowl
- [ ] Super Bowl selection completes bracket
- [ ] Changing earlier round selection cascades to later rounds

### Draft Order Flow
- [ ] Non-playoff picks available after regular season
- [ ] Wild Card loser picks available after Wild Card round
- [ ] Divisional loser picks available after Divisional round
- [ ] CCG loser picks available after Conference Championships
- [ ] Super Bowl picks available after Super Bowl
- [ ] Complete 32-pick order when all games decided

### Real Game Data Integration
- [ ] Final games from API override user selections
- [ ] Standings update when real game completes
- [ ] Playoff bracket locks completed games
- [ ] Draft order reflects actual results

### Performance Tests
- [ ] Standings calculation completes in < 100ms
- [ ] Draft order calculation completes in < 100ms
- [ ] No memory leaks with repeated calculations
- [ ] Handles 272 regular season games efficiently

---

## 13. Display and Formatting Tests

### Standings Display
- [ ] Record format: "W-L" or "W-L-T" if ties exist
- [ ] Division record format: "W-L" or "W-L-T"
- [ ] Conference record format: "W-L" or "W-L-T"
- [ ] Point differential format: "+123" or "-45"
- [ ] Streak display: "W3", "L2", "T1", or "-"

### Draft Order Display
- [ ] Pick number displayed correctly (1-32)
- [ ] Pick range displayed as "25-28" when uncertain
- [ ] Reason displayed with correct color coding
- [ ] Team logo and name displayed correctly
- [ ] Record displayed correctly

### Playoff Bracket Display
- [ ] Correct matchups for each round
- [ ] Higher seed shown as home team
- [ ] Winner advances to next round correctly
- [ ] TBD shown for undecided matchups
- [ ] Locked games visually distinguished

---

## 14. Specific NFL Rule Compliance

### Official NFL Tiebreaker Order (Verify Implementation)
1. [ ] Head-to-head (if applicable)
2. [ ] Best won-lost-tied percentage in games played within the division (division ties only)
3. [ ] Best won-lost-tied percentage in common games
4. [ ] Best won-lost-tied percentage in games played within the conference
5. [ ] Strength of victory
6. [ ] Strength of schedule
7. [ ] Best combined ranking among conference teams in points scored and points allowed
8. [ ] Best combined ranking among all teams in points scored and points allowed
9. [ ] Best net points in common games
10. [ ] Best net points in all games
11. [ ] Best net touchdowns in all games
12. [ ] Coin toss (not implemented - document behavior)

### Wild Card Tiebreaker Differences
- [ ] Division record step skipped for wild card ties
- [ ] Head-to-head only if all teams played each other
- [ ] If tiebreaker doesn't resolve all teams, apply to remaining tied teams from step 1

### Three-or-More Team Tiebreaker Rules
- [ ] Apply tiebreakers collectively first
- [ ] If one team wins, remaining teams re-start from step 1
- [ ] Continue until all ties resolved

---

## 15. Regression Tests

### Known Bug Scenarios (Add as Discovered)
- [ ] Scenario: [Description of previously found bug]
- [ ] Expected: [Expected behavior]
- [ ] Actual: [What was happening before fix]

### Historical Season Validation
- [ ] 2024 season: verify standings match official NFL standings
- [ ] 2023 season: verify standings match official NFL standings
- [ ] Verify tiebreaker outcomes match historical record

---

## Test Data Requirements

### Minimum Test Data Sets Needed
1. Simple 2-team division tie (H2H resolves)
2. Simple 2-team division tie (H2H doesn't resolve, needs division record)
3. 3-team division tie
4. 2-team wild card tie (same division)
5. 2-team wild card tie (different divisions)
6. 3-team wild card tie (all different divisions)
7. Complete playoff bracket (all games decided)
8. Partial playoff bracket (some games pending)
9. Week 18 standings (final regular season)
10. Mid-season standings (magic numbers relevant)

---

## Notes

- Current implementation simplifies steps 8-11 to just point differential
- Coin toss (step 12) not implemented - tied teams may have arbitrary order
- Common games requires minimum 4 games to be used as tiebreaker
- Point estimates for projected games: home win 24-17, away win 17-24, tie 20-20
