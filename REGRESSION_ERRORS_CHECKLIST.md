# Regression Errors Checklist

This file tracks bugs discovered through historical season regression testing. Each entry represents a case where our tiebreaker implementation produces different results than the actual NFL seedings.

**These are bugs that need to be fixed.** The NFL results are the source of truth.

---

## Summary

| Season | Errors Found | Failing Tests | Status |
|--------|--------------|---------------|--------|
| 2024   | 0            | 0             | ✅ All passing |
| 2023   | 0            | 0             | ✅ All passing |
| 2022   | 0            | 0             | ✅ All passing |
| 2021   | 0            | 0             | ✅ All passing |
| 2020   | 0            | 0             | ✅ All passing |

**Total: 0 bugs - All 206 historical season tests passing**

---

## 2024 Season ✅ FIXED

### Error #1: NFC Division Winner Seeds 3/4 Reversed - ✅ RESOLVED

**What NFL produced:**
- Seed 3: Rams (10-7) - NFC West champion
- Seed 4: Buccaneers (10-7) - NFC South champion

**What our system now produces:** ✅ Correct
- Seed 3: Rams (10-7)
- Seed 4: Buccaneers (10-7)

**Resolution:** Fixed through tiebreaker improvements - all tests passing.

**Investigation completed:**
- [x] Check Rams vs Buccaneers conference records for 2024
- [x] Check if they played head-to-head
- [x] Identify common opponents and calculate common games record
- [x] Calculate SoV for both teams
- [x] Calculate SoS for both teams
- [x] Determine which tiebreaker step the NFL used
- [x] Fix the bug in our implementation

**Test file:** `src/utils/historicalSeasons.test.ts` - ✅ PASSING
**Fixture file:** `src/utils/fixtures/season2024.ts`

---

## 2023 Season ✅ FIXED

### Error #1: AFC Wild Card Seeds 5/6 Reversed - ✅ RESOLVED

**What NFL produced:**
- Seed 5: Browns (11-6)
- Seed 6: Dolphins (11-6)

**What our system now produces:** ✅ Correct
- Seed 5: Browns (11-6)
- Seed 6: Dolphins (11-6)

**Resolution:** Fixed through tiebreaker improvements - all tests passing.

**Investigation completed:**
- [x] Check Browns vs Dolphins conference records for 2023
- [x] Identify common opponents and calculate common games record
- [x] Calculate SoV for both teams
- [x] Calculate SoS for both teams
- [x] Determine which tiebreaker step the NFL used
- [x] Fix the bug in our implementation

**Test file:** `src/utils/historicalSeasons.test.ts` - ✅ PASSING
**Fixture file:** `src/utils/fixtures/season2023.ts`

---

### Error #2: NFC Division Winner Seeds 1/2/3 Wrong Order - ✅ RESOLVED

**What NFL produced:**
- Seed 1: 49ers (12-5) - NFC West winner
- Seed 2: Cowboys (12-5) - NFC East winner
- Seed 3: Lions (12-5) - NFC North winner

**What our system now produces:** ✅ Correct
- Seed 1: 49ers (12-5)
- Seed 2: Cowboys (12-5)
- Seed 3: Lions (12-5)

**Resolution:** Fixed through tiebreaker improvements - all tests passing.

**Investigation completed:**
- [x] Check if 49ers, Cowboys, Lions all played each other in 2023
- [x] If so, calculate head-to-head records
- [x] Check conference records for all three teams
- [x] Identify common opponents and calculate common games records
- [x] Calculate SoV for all three teams
- [x] Calculate SoS for all three teams
- [x] Determine which tiebreaker step the NFL used
- [x] Fix the bug in our implementation

**Test file:** `src/utils/historicalSeasons.test.ts` - ✅ PASSING
**Fixture file:** `src/utils/fixtures/season2023.ts`

---

## 2022 Season ✅ FIXED

Note: The 2022 season had a cancelled game (Bengals-Bills Week 17, due to Damar Hamlin's cardiac arrest). This game is stored as 0-0 in our data and may affect record calculations.

### Error #1: AFC Wild Card Seeds 5/6 Reversed - ✅ RESOLVED

**What NFL produced:**
- Seed 5: Chargers (10-7)
- Seed 6: Ravens (10-7)

**What our system now produces:** ✅ Correct
- Seed 5: Chargers (10-7)
- Seed 6: Ravens (10-7)

**Resolution:** Fixed through tiebreaker improvements - all tests passing.

**Investigation completed:**
- [x] Check Chargers vs Ravens conference records for 2022
- [x] Check if they played head-to-head
- [x] Identify common opponents and calculate common games record
- [x] Calculate SoV for both teams
- [x] Calculate SoS for both teams
- [x] Determine which tiebreaker step the NFL used
- [x] Fix the bug in our implementation

**Test file:** `src/utils/historicalSeasons.test.ts` - ✅ PASSING
**Fixture file:** `src/utils/fixtures/season2022.ts`

---

### Error #2: NFC Division Winner Seeds 2/3 Reversed - ✅ RESOLVED

**What NFL produced:**
- Seed 2: 49ers (13-4) - NFC West winner
- Seed 3: Vikings (13-4) - NFC North winner

**What our system now produces:** ✅ Correct
- Seed 2: 49ers (13-4)
- Seed 3: Vikings (13-4)

**Resolution:** Fixed through tiebreaker improvements - all tests passing.

**Investigation completed:**
- [x] Check 49ers vs Vikings conference records for 2022
- [x] Check if they played head-to-head
- [x] Identify common opponents and calculate common games record
- [x] Calculate SoV for both teams
- [x] Calculate SoS for both teams
- [x] Determine which tiebreaker step the NFL used
- [x] Fix the bug in our implementation

**Test file:** `src/utils/historicalSeasons.test.ts` - ✅ PASSING
**Fixture file:** `src/utils/fixtures/season2022.ts`

---

### Error #3: NFC Wild Card Seed 7 Wrong (Lions instead of Seahawks) - ✅ RESOLVED

**What NFL produced:**
- Seed 6: Giants (9-7-1)
- Seed 7: Seahawks (9-8)

**What our system now produces:** ✅ Correct
- Seed 6: Giants (9-7-1)
- Seed 7: Seahawks (9-8)

**Resolution:** Fixed through tiebreaker improvements - all tests passing. The original bug was a calculation issue, not data corruption.

**Investigation completed:**
- [x] Verify Lions record calculation (should be 3-13-1)
- [x] Verify Seahawks record calculation (should be 9-8)
- [x] Check if cancelled CIN-BUF game affects NFC standings somehow
- [x] Debug why Lions are appearing at seed 7
- [x] Debug why Seahawks are not making playoffs
- [x] Fix the bug in our implementation

**Test file:** `src/utils/historicalSeasons.test.ts` - ✅ PASSING
**Fixture file:** `src/utils/fixtures/season2022.ts`

---

## 2021 Season ✅ FIXED

Note: The 2021 season had one tie game (PIT-DET Week 10, 16-16). The Steelers finished 9-7-1.

### Error #1: AFC Wild Card Seeds 5/6 Reversed - ✅ RESOLVED

**What NFL produced:**
- Seed 5: Raiders (10-7)
- Seed 6: Patriots (10-7)

**What our system now produces:** ✅ Correct
- Seed 5: Raiders (10-7)
- Seed 6: Patriots (10-7)

**Resolution:** Fixed through tiebreaker improvements - all tests passing.

**Investigation completed:**
- [x] Identify which team has ID '3' in our system
- [x] Debug why team '3' is appearing in playoffs (should it be?)
- [x] Check Raiders vs Patriots conference records for 2021
- [x] Identify common opponents and calculate common games record
- [x] Calculate SoV for both teams
- [x] Calculate SoS for both teams
- [x] Determine which tiebreaker step the NFL used
- [x] Fix the bug in our implementation

**Test file:** `src/utils/historicalSeasons.test.ts` - ✅ PASSING
**Fixture file:** `src/utils/fixtures/season2021.ts`

---

### Error #2: NFC Wild Card Seed 5 Wrong - ✅ RESOLVED

**What NFL produced:**
- Seed 5: Cardinals (11-6)

**What our system now produces:** ✅ Correct
- Seed 5: Cardinals (11-6)

**Resolution:** Fixed through tiebreaker improvements - all tests passing.

**Investigation completed:**
- [x] Identify which team has ID '29' in our system
- [x] Check if Cardinals are being calculated with correct record (11-6)
- [x] Debug why team '29' is ranked ahead of Cardinals
- [x] Fix the bug in our implementation

**Test file:** `src/utils/historicalSeasons.test.ts` - ✅ PASSING
**Fixture file:** `src/utils/fixtures/season2021.ts`

---

## 2020 Season Results

**Status: ✅ All tests passing**

The 2020 NFL season regression tests pass correctly. Our tiebreaker implementation accurately reproduces the historical playoff seedings for this season.

**Key facts about 2020 season:**
- First year with 7-team playoff format (expanded from 6)
- 17-week season (no Week 18), 256 total games
- One tie game: PHI-CIN Week 3 (23-23)
- Washington won NFC East with 7-9 record (weakest division winner)
- Buccaneers (11-5) as wild card went on to win Super Bowl LV

**Notable tiebreakers correctly resolved:**
- Four 11-5 AFC teams (Titans, Ravens, Browns, Colts) seeded correctly at 4-7
- Saints (12-4) over Seahawks (12-4) for NFC seeds 2/3
- Bears (8-8) over Cardinals (8-8) for NFC 7 seed

**Test file:** `src/utils/historicalSeasons.test.ts` - "Phase 16: 2020 NFL Season Historical Regression Tests"
**Fixture file:** `src/utils/fixtures/season2020.ts`

---

## Investigation Process

For each error, follow this process:

1. **Gather data:**
   - Get both teams' full game-by-game results for the season
   - Calculate: overall record, conference record, division record
   - Identify head-to-head games (if any)
   - Identify common opponents

2. **Walk through NFL tiebreaker steps:**
   1. Head-to-head (if applicable)
   2. Division record (division ties only - skip for wild card/cross-division)
   3. Common games (minimum 4 common opponents)
   4. Conference record
   5. Strength of Victory
   6. Strength of Schedule
   7. Conference points ranking
   8. Net points in common games
   9. Net points in all games
   10. Net touchdowns
   11. Coin toss

3. **Find the discrepancy:**
   - Which step does our code use to break the tie?
   - Which step did the NFL use?
   - Is our calculation for that step correct?

4. **Fix the bug:**
   - Update `src/utils/tiebreakers.ts`
   - Update tests to expect correct NFL results
   - Verify fix doesn't break other seasons

---

## Notes

- All errors discovered through `src/utils/historicalSeasons.test.ts` have been resolved
- Fixture data from ESPN API: `scripts/fetch2024Season.ts` (modify YEAR constant for each season)
- NFL tiebreaker rules reference: https://www.nfl.com/standings/tie-breaking-procedures
- 2022 season has a cancelled game (CIN-BUF Week 17, Damar Hamlin cardiac arrest) stored as 0-0
- 2021 season has a tie game (PIT-DET Week 10, 16-16)
- 2020 season has a tie game (PHI-CIN Week 3, 23-23)
- ✅ All SoV/SoS tiebreakers now correctly match NFL results
