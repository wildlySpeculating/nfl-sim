/**
 * 2024 NFL Regular Season Game Data
 *
 * All 272 games from the 2024 NFL regular season with actual scores.
 * Data fetched from ESPN API.
 *
 * Expected Final Playoff Seeds:
 * AFC: 1-Chiefs(15-2), 2-Bills(13-4), 3-Ravens(12-5), 4-Texans(10-7),
 *      5-Chargers(11-6), 6-Steelers(10-7), 7-Broncos(10-7)
 * NFC: 1-Lions(15-2), 2-Eagles(14-3), 3-Buccaneers(10-7), 4-Rams(10-7),
 *      5-Vikings(14-3), 6-Commanders(12-5), 7-Packers(11-6)
 */

export interface CompactGame {
  id: string;
  week: number;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
}

export const SEASON_2024_GAMES: CompactGame[] = [
  // Week 1
  { id: '401671789', week: 1, home: 'KC', away: 'BAL', homeScore: 27, awayScore: 20 },
  { id: '401671805', week: 1, home: 'PHI', away: 'GB', homeScore: 34, awayScore: 29 },
  { id: '401671744', week: 1, home: 'ATL', away: 'PIT', homeScore: 10, awayScore: 18 },
  { id: '401671617', week: 1, home: 'BUF', away: 'ARI', homeScore: 34, awayScore: 28 },
  { id: '401671719', week: 1, home: 'CHI', away: 'TEN', homeScore: 24, awayScore: 17 },
  { id: '401671628', week: 1, home: 'CIN', away: 'NE', homeScore: 10, awayScore: 16 },
  { id: '401671861', week: 1, home: 'IND', away: 'HOU', homeScore: 27, awayScore: 29 },
  { id: '401671849', week: 1, home: 'MIA', away: 'JAX', homeScore: 20, awayScore: 17 },
  { id: '401671734', week: 1, home: 'NO', away: 'CAR', homeScore: 47, awayScore: 10 },
  { id: '401671712', week: 1, home: 'NYG', away: 'MIN', homeScore: 6, awayScore: 28 },
  { id: '401671659', week: 1, home: 'LAC', away: 'LV', homeScore: 22, awayScore: 10 },
  { id: '401671664', week: 1, home: 'SEA', away: 'DEN', homeScore: 26, awayScore: 20 },
  { id: '401671761', week: 1, home: 'CLE', away: 'DAL', homeScore: 17, awayScore: 33 },
  { id: '401671770', week: 1, home: 'TB', away: 'WSH', homeScore: 37, awayScore: 20 },
  { id: '401671792', week: 1, home: 'DET', away: 'LAR', homeScore: 26, awayScore: 20 },
  { id: '401671696', week: 1, home: 'SF', away: 'NYJ', homeScore: 32, awayScore: 19 },

  // Week 2
  { id: '401671807', week: 2, home: 'MIA', away: 'BUF', homeScore: 10, awayScore: 31 },
  { id: '401671709', week: 2, home: 'DAL', away: 'NO', homeScore: 19, awayScore: 44 },
  { id: '401671721', week: 2, home: 'DET', away: 'TB', homeScore: 16, awayScore: 20 },
  { id: '401671723', week: 2, home: 'GB', away: 'IND', homeScore: 16, awayScore: 10 },
  { id: '401671636', week: 2, home: 'TEN', away: 'NYJ', homeScore: 17, awayScore: 24 },
  { id: '401671645', week: 2, home: 'MIN', away: 'SF', homeScore: 23, awayScore: 17 },
  { id: '401671702', week: 2, home: 'NE', away: 'SEA', homeScore: 20, awayScore: 23 },
  { id: '401671716', week: 2, home: 'WSH', away: 'NYG', homeScore: 21, awayScore: 18 },
  { id: '401671652', week: 2, home: 'CAR', away: 'LAC', homeScore: 3, awayScore: 26 },
  { id: '401671635', week: 2, home: 'JAX', away: 'CLE', homeScore: 13, awayScore: 18 },
  { id: '401671624', week: 2, home: 'BAL', away: 'LV', homeScore: 23, awayScore: 26 },
  { id: '401671754', week: 2, home: 'ARI', away: 'LAR', homeScore: 41, awayScore: 10 },
  { id: '401671668', week: 2, home: 'DEN', away: 'PIT', homeScore: 6, awayScore: 13 },
  { id: '401671670', week: 2, home: 'KC', away: 'CIN', homeScore: 26, awayScore: 25 },
  { id: '401671786', week: 2, home: 'HOU', away: 'CHI', homeScore: 19, awayScore: 13 },
  { id: '401671691', week: 2, home: 'PHI', away: 'ATL', homeScore: 21, awayScore: 22 },

  // Week 3
  { id: '401671808', week: 3, home: 'NYJ', away: 'NE', homeScore: 24, awayScore: 3 },
  { id: '401671855', week: 3, home: 'CLE', away: 'NYG', homeScore: 15, awayScore: 21 },
  { id: '401671823', week: 3, home: 'TEN', away: 'GB', homeScore: 14, awayScore: 30 },
  { id: '401671865', week: 3, home: 'IND', away: 'CHI', homeScore: 21, awayScore: 16 },
  { id: '401671646', week: 3, home: 'MIN', away: 'HOU', homeScore: 34, awayScore: 7 },
  { id: '401671736', week: 3, home: 'NO', away: 'PHI', homeScore: 12, awayScore: 15 },
  { id: '401671632', week: 3, home: 'PIT', away: 'LAC', homeScore: 20, awayScore: 10 },
  { id: '401671741', week: 3, home: 'TB', away: 'DEN', homeScore: 7, awayScore: 26 },
  { id: '401671658', week: 3, home: 'LV', away: 'CAR', homeScore: 22, awayScore: 36 },
  { id: '401671662', week: 3, home: 'SEA', away: 'MIA', homeScore: 24, awayScore: 3 },
  { id: '401671763', week: 3, home: 'DAL', away: 'BAL', homeScore: 25, awayScore: 28 },
  { id: '401671772', week: 3, home: 'LAR', away: 'SF', homeScore: 27, awayScore: 24 },
  { id: '401671771', week: 3, home: 'ARI', away: 'DET', homeScore: 13, awayScore: 20 },
  { id: '401671793', week: 3, home: 'ATL', away: 'KC', homeScore: 17, awayScore: 22 },
  { id: '401671682', week: 3, home: 'BUF', away: 'JAX', homeScore: 47, awayScore: 10 },
  { id: '401671490', week: 3, home: 'CIN', away: 'WSH', homeScore: 33, awayScore: 38 },

  // Week 4
  { id: '401671812', week: 4, home: 'NYG', away: 'DAL', homeScore: 15, awayScore: 20 },
  { id: '401671727', week: 4, home: 'ATL', away: 'NO', homeScore: 26, awayScore: 24 },
  { id: '401671871', week: 4, home: 'CHI', away: 'LAR', homeScore: 24, awayScore: 18 },
  { id: '401671643', week: 4, home: 'GB', away: 'MIN', homeScore: 29, awayScore: 31 },
  { id: '401671867', week: 4, home: 'IND', away: 'PIT', homeScore: 27, awayScore: 24 },
  { id: '401671622', week: 4, home: 'NYJ', away: 'DEN', homeScore: 9, awayScore: 10 },
  { id: '401671740', week: 4, home: 'TB', away: 'PHI', homeScore: 33, awayScore: 16 },
  { id: '401671745', week: 4, home: 'CAR', away: 'CIN', homeScore: 24, awayScore: 34 },
  { id: '401671857', week: 4, home: 'HOU', away: 'JAX', homeScore: 24, awayScore: 20 },
  { id: '401671755', week: 4, home: 'ARI', away: 'WSH', homeScore: 14, awayScore: 42 },
  { id: '401671758', week: 4, home: 'SF', away: 'NE', homeScore: 30, awayScore: 13 },
  { id: '401671672', week: 4, home: 'LV', away: 'CLE', homeScore: 20, awayScore: 16 },
  { id: '401671674', week: 4, home: 'LAC', away: 'KC', homeScore: 10, awayScore: 17 },
  { id: '401671783', week: 4, home: 'BAL', away: 'BUF', homeScore: 35, awayScore: 10 },
  { id: '401671683', week: 4, home: 'MIA', away: 'TEN', homeScore: 12, awayScore: 31 },
  { id: '401671491', week: 4, home: 'DET', away: 'SEA', homeScore: 42, awayScore: 29 },

  // Week 5
  { id: '401671815', week: 5, home: 'ATL', away: 'TB', homeScore: 36, awayScore: 30 },
  { id: '401671804', week: 5, home: 'MIN', away: 'NYJ', homeScore: 23, awayScore: 17 },
  { id: '401671872', week: 5, home: 'CHI', away: 'CAR', homeScore: 36, awayScore: 10 },
  { id: '401671626', week: 5, home: 'CIN', away: 'BAL', homeScore: 38, awayScore: 41 },
  { id: '401671700', week: 5, home: 'NE', away: 'MIA', homeScore: 10, awayScore: 15 },
  { id: '401671718', week: 5, home: 'WSH', away: 'CLE', homeScore: 34, awayScore: 13 },
  { id: '401671633', week: 5, home: 'JAX', away: 'IND', homeScore: 37, awayScore: 34 },
  { id: '401671859', week: 5, home: 'HOU', away: 'BUF', homeScore: 23, awayScore: 20 },
  { id: '401671747', week: 5, home: 'DEN', away: 'LV', homeScore: 34, awayScore: 18 },
  { id: '401671756', week: 5, home: 'SF', away: 'ARI', homeScore: 23, awayScore: 24 },
  { id: '401671679', week: 5, home: 'LAR', away: 'GB', homeScore: 19, awayScore: 24 },
  { id: '401671680', week: 5, home: 'SEA', away: 'NYG', homeScore: 20, awayScore: 29 },
  { id: '401671784', week: 5, home: 'PIT', away: 'DAL', homeScore: 17, awayScore: 20 },
  { id: '401671687', week: 5, home: 'KC', away: 'NO', homeScore: 26, awayScore: 13 },

  // Week 6
  { id: '401671819', week: 6, home: 'SEA', away: 'SF', homeScore: 24, awayScore: 36 },
  { id: '401671802', week: 6, home: 'CHI', away: 'JAX', homeScore: 35, awayScore: 16 },
  { id: '401671722', week: 6, home: 'GB', away: 'ARI', homeScore: 34, awayScore: 13 },
  { id: '401671820', week: 6, home: 'TEN', away: 'IND', homeScore: 17, awayScore: 20 },
  { id: '401671619', week: 6, home: 'NE', away: 'HOU', homeScore: 21, awayScore: 41 },
  { id: '401671735', week: 6, home: 'NO', away: 'TB', homeScore: 27, awayScore: 51 },
  { id: '401671714', week: 6, home: 'PHI', away: 'CLE', homeScore: 20, awayScore: 16 },
  { id: '401671625', week: 6, home: 'BAL', away: 'WSH', homeScore: 30, awayScore: 23 },
  { id: '401671655', week: 6, home: 'DEN', away: 'LAC', homeScore: 16, awayScore: 23 },
  { id: '401671657', week: 6, home: 'LV', away: 'PIT', homeScore: 13, awayScore: 32 },
  { id: '401671764', week: 6, home: 'DAL', away: 'DET', homeScore: 9, awayScore: 47 },
  { id: '401671769', week: 6, home: 'CAR', away: 'ATL', homeScore: 20, awayScore: 38 },
  { id: '401671791', week: 6, home: 'NYG', away: 'CIN', homeScore: 7, awayScore: 17 },
  { id: '401671684', week: 6, home: 'NYJ', away: 'BUF', homeScore: 20, awayScore: 23 },

  // Week 7
  { id: '401671816', week: 7, home: 'NO', away: 'DEN', homeScore: 10, awayScore: 33 },
  { id: '401671801', week: 7, home: 'JAX', away: 'NE', homeScore: 32, awayScore: 16 },
  { id: '401671730', week: 7, home: 'ATL', away: 'SEA', homeScore: 14, awayScore: 34 },
  { id: '401671616', week: 7, home: 'BUF', away: 'TEN', homeScore: 34, awayScore: 10 },
  { id: '401671853', week: 7, home: 'CLE', away: 'CIN', homeScore: 14, awayScore: 21 },
  { id: '401671644', week: 7, home: 'GB', away: 'HOU', homeScore: 24, awayScore: 22 },
  { id: '401671864', week: 7, home: 'IND', away: 'MIA', homeScore: 16, awayScore: 10 },
  { id: '401671724', week: 7, home: 'MIN', away: 'DET', homeScore: 29, awayScore: 31 },
  { id: '401671710', week: 7, home: 'NYG', away: 'PHI', homeScore: 3, awayScore: 28 },
  { id: '401671663', week: 7, home: 'LAR', away: 'LV', homeScore: 20, awayScore: 15 },
  { id: '401671640', week: 7, home: 'WSH', away: 'CAR', homeScore: 40, awayScore: 7 },
  { id: '401671777', week: 7, home: 'SF', away: 'KC', homeScore: 18, awayScore: 28 },
  { id: '401671785', week: 7, home: 'PIT', away: 'NYJ', homeScore: 37, awayScore: 15 },
  { id: '401671695', week: 7, home: 'TB', away: 'BAL', homeScore: 31, awayScore: 41 },
  { id: '401671699', week: 7, home: 'ARI', away: 'LAC', homeScore: 17, awayScore: 15 },

  // Week 8
  { id: '401671817', week: 8, home: 'LAR', away: 'MIN', homeScore: 30, awayScore: 20 },
  { id: '401671667', week: 8, home: 'CIN', away: 'PHI', homeScore: 17, awayScore: 37 },
  { id: '401671852', week: 8, home: 'CLE', away: 'BAL', homeScore: 29, awayScore: 24 },
  { id: '401671720', week: 8, home: 'DET', away: 'TEN', homeScore: 52, awayScore: 14 },
  { id: '401671850', week: 8, home: 'MIA', away: 'ARI', homeScore: 27, awayScore: 28 },
  { id: '401671618', week: 8, home: 'NE', away: 'NYJ', homeScore: 25, awayScore: 22 },
  { id: '401671739', week: 8, home: 'TB', away: 'ATL', homeScore: 26, awayScore: 31 },
  { id: '401671707', week: 8, home: 'JAX', away: 'GB', homeScore: 27, awayScore: 30 },
  { id: '401671856', week: 8, home: 'HOU', away: 'IND', homeScore: 23, awayScore: 20 },
  { id: '401671750', week: 8, home: 'LAC', away: 'NO', homeScore: 26, awayScore: 8 },
  { id: '401671760', week: 8, home: 'SEA', away: 'BUF', homeScore: 10, awayScore: 31 },
  { id: '401671600', week: 8, home: 'DEN', away: 'CAR', homeScore: 28, awayScore: 14 },
  { id: '401671671', week: 8, home: 'LV', away: 'KC', homeScore: 20, awayScore: 27 },
  { id: '401671599', week: 8, home: 'WSH', away: 'CHI', homeScore: 18, awayScore: 15 },
  { id: '401671795', week: 8, home: 'SF', away: 'DAL', homeScore: 30, awayScore: 24 },
  { id: '401671685', week: 8, home: 'PIT', away: 'NYG', homeScore: 26, awayScore: 18 },

  // Week 9
  { id: '401671809', week: 9, home: 'NYJ', away: 'HOU', homeScore: 21, awayScore: 13 },
  { id: '401671728', week: 9, home: 'ATL', away: 'DAL', homeScore: 27, awayScore: 21 },
  { id: '401671493', week: 9, home: 'BUF', away: 'MIA', homeScore: 30, awayScore: 27 },
  { id: '401671704', week: 9, home: 'CIN', away: 'LV', homeScore: 41, awayScore: 24 },
  { id: '401671629', week: 9, home: 'CLE', away: 'LAC', homeScore: 10, awayScore: 27 },
  { id: '401671822', week: 9, home: 'TEN', away: 'NE', homeScore: 20, awayScore: 17 },
  { id: '401671711', week: 9, home: 'NYG', away: 'WSH', homeScore: 22, awayScore: 27 },
  { id: '401671650', week: 9, home: 'CAR', away: 'NO', homeScore: 23, awayScore: 22 },
  { id: '401671623', week: 9, home: 'BAL', away: 'DEN', homeScore: 41, awayScore: 10 },
  { id: '401671797', week: 9, home: 'PHI', away: 'JAX', homeScore: 28, awayScore: 23 },
  { id: '401671661', week: 9, home: 'ARI', away: 'CHI', homeScore: 29, awayScore: 9 },
  { id: '401671767', week: 9, home: 'GB', away: 'DET', homeScore: 14, awayScore: 24 },
  { id: '401671776', week: 9, home: 'SEA', away: 'LAR', homeScore: 20, awayScore: 26 },
  { id: '401671647', week: 9, home: 'MIN', away: 'IND', homeScore: 21, awayScore: 13 },
  { id: '401671688', week: 9, home: 'KC', away: 'TB', homeScore: 30, awayScore: 24 },

  // Week 10
  { id: '401671810', week: 10, home: 'BAL', away: 'CIN', homeScore: 35, awayScore: 34 },
  { id: '401671803', week: 10, home: 'CAR', away: 'NYG', homeScore: 20, awayScore: 17 },
  { id: '401671873', week: 10, home: 'CHI', away: 'NE', homeScore: 3, awayScore: 19 },
  { id: '401671863', week: 10, home: 'IND', away: 'BUF', homeScore: 20, awayScore: 30 },
  { id: '401671637', week: 10, home: 'KC', away: 'DEN', homeScore: 16, awayScore: 14 },
  { id: '401671733', week: 10, home: 'NO', away: 'ATL', homeScore: 20, awayScore: 17 },
  { id: '401671742', week: 10, home: 'TB', away: 'SF', homeScore: 20, awayScore: 23 },
  { id: '401671641', week: 10, home: 'WSH', away: 'PIT', homeScore: 27, awayScore: 28 },
  { id: '401671708', week: 10, home: 'JAX', away: 'MIN', homeScore: 7, awayScore: 12 },
  { id: '401671751', week: 10, home: 'LAC', away: 'TEN', homeScore: 27, awayScore: 17 },
  { id: '401671676', week: 10, home: 'DAL', away: 'PHI', homeScore: 6, awayScore: 34 },
  { id: '401671678', week: 10, home: 'ARI', away: 'NYJ', homeScore: 31, awayScore: 6 },
  { id: '401671787', week: 10, home: 'HOU', away: 'DET', homeScore: 23, awayScore: 26 },
  { id: '401671693', week: 10, home: 'LAR', away: 'MIA', homeScore: 15, awayScore: 23 },

  // Week 11
  { id: '401671813', week: 11, home: 'PHI', away: 'WSH', homeScore: 26, awayScore: 18 },
  { id: '401671869', week: 11, home: 'CHI', away: 'GB', homeScore: 19, awayScore: 20 },
  { id: '401671642', week: 11, home: 'DET', away: 'JAX', homeScore: 52, awayScore: 6 },
  { id: '401671824', week: 11, home: 'TEN', away: 'MIN', homeScore: 13, awayScore: 23 },
  { id: '401671851', week: 11, home: 'MIA', away: 'LV', homeScore: 34, awayScore: 19 },
  { id: '401671701', week: 11, home: 'NE', away: 'LAR', homeScore: 22, awayScore: 28 },
  { id: '401671746', week: 11, home: 'NO', away: 'CLE', homeScore: 35, awayScore: 14 },
  { id: '401671782', week: 11, home: 'NYJ', away: 'IND', homeScore: 27, awayScore: 28 },
  { id: '401671630', week: 11, home: 'PIT', away: 'BAL', homeScore: 18, awayScore: 16 },
  { id: '401671748', week: 11, home: 'DEN', away: 'ATL', homeScore: 38, awayScore: 6 },
  { id: '401671757', week: 11, home: 'SF', away: 'SEA', homeScore: 17, awayScore: 20 },
  { id: '401671665', week: 11, home: 'BUF', away: 'KC', homeScore: 30, awayScore: 21 },
  { id: '401671675', week: 11, home: 'LAC', away: 'CIN', homeScore: 34, awayScore: 27 },
  { id: '401671694', week: 11, home: 'DAL', away: 'HOU', homeScore: 10, awayScore: 34 },

  // Week 12
  { id: '401671875', week: 12, home: 'CLE', away: 'PIT', homeScore: 24, awayScore: 19 },
  { id: '401671870', week: 12, home: 'CHI', away: 'MIN', homeScore: 27, awayScore: 30 },
  { id: '401671866', week: 12, home: 'IND', away: 'DET', homeScore: 6, awayScore: 24 },
  { id: '401671847', week: 12, home: 'MIA', away: 'NE', homeScore: 34, awayScore: 15 },
  { id: '401671638', week: 12, home: 'NYG', away: 'TB', homeScore: 7, awayScore: 30 },
  { id: '401671715', week: 12, home: 'WSH', away: 'DAL', homeScore: 26, awayScore: 34 },
  { id: '401671651', week: 12, home: 'CAR', away: 'KC', homeScore: 27, awayScore: 30 },
  { id: '401671858', week: 12, home: 'HOU', away: 'TEN', homeScore: 27, awayScore: 32 },
  { id: '401671656', week: 12, home: 'LV', away: 'DEN', homeScore: 19, awayScore: 29 },
  { id: '401671768', week: 12, home: 'GB', away: 'SF', homeScore: 38, awayScore: 10 },
  { id: '401671775', week: 12, home: 'SEA', away: 'ARI', homeScore: 16, awayScore: 6 },
  { id: '401671794', week: 12, home: 'LAR', away: 'PHI', homeScore: 20, awayScore: 37 },
  { id: '401671689', week: 12, home: 'LAC', away: 'BAL', homeScore: 23, awayScore: 30 },

  // Week 13
  { id: '401671492', week: 13, home: 'DET', away: 'CHI', homeScore: 23, awayScore: 20 },
  { id: '401671779', week: 13, home: 'DAL', away: 'NYG', homeScore: 27, awayScore: 20 },
  { id: '401671798', week: 13, home: 'GB', away: 'MIA', homeScore: 30, awayScore: 17 },
  { id: '401671806', week: 13, home: 'KC', away: 'LV', homeScore: 19, awayScore: 17 },
  { id: '401671649', week: 13, home: 'ATL', away: 'LAC', homeScore: 13, awayScore: 17 },
  { id: '401671627', week: 13, home: 'CIN', away: 'PIT', homeScore: 38, awayScore: 44 },
  { id: '401671726', week: 13, home: 'MIN', away: 'ARI', homeScore: 23, awayScore: 22 },
  { id: '401671620', week: 13, home: 'NE', away: 'IND', homeScore: 24, awayScore: 25 },
  { id: '401671703', week: 13, home: 'NYJ', away: 'SEA', homeScore: 21, awayScore: 26 },
  { id: '401671743', week: 13, home: 'WSH', away: 'TEN', homeScore: 42, awayScore: 19 },
  { id: '401671705', week: 13, home: 'JAX', away: 'HOU', homeScore: 20, awayScore: 23 },
  { id: '401671753', week: 13, home: 'NO', away: 'LAR', homeScore: 14, awayScore: 21 },
  { id: '401671752', week: 13, home: 'CAR', away: 'TB', homeScore: 23, awayScore: 26 },
  { id: '401671666', week: 13, home: 'BAL', away: 'PHI', homeScore: 19, awayScore: 24 },
  { id: '401671781', week: 13, home: 'BUF', away: 'SF', homeScore: 35, awayScore: 10 },
  { id: '401671686', week: 13, home: 'DEN', away: 'CLE', homeScore: 41, awayScore: 32 },

  // Week 14
  { id: '401671814', week: 14, home: 'DET', away: 'GB', homeScore: 34, awayScore: 31 },
  { id: '401671821', week: 14, home: 'TEN', away: 'JAX', homeScore: 6, awayScore: 10 },
  { id: '401671848', week: 14, home: 'MIA', away: 'NYJ', homeScore: 32, awayScore: 26 },
  { id: '401671648', week: 14, home: 'MIN', away: 'ATL', homeScore: 42, awayScore: 21 },
  { id: '401671601', week: 14, home: 'NYG', away: 'NO', homeScore: 11, awayScore: 14 },
  { id: '401671713', week: 14, home: 'PHI', away: 'CAR', homeScore: 22, awayScore: 16 },
  { id: '401671631', week: 14, home: 'PIT', away: 'CLE', homeScore: 27, awayScore: 14 },
  { id: '401671654', week: 14, home: 'TB', away: 'LV', homeScore: 28, awayScore: 13 },
  { id: '401671660', week: 14, home: 'ARI', away: 'SEA', homeScore: 18, awayScore: 30 },
  { id: '401671773', week: 14, home: 'LAR', away: 'BUF', homeScore: 44, awayScore: 42 },
  { id: '401671774', week: 14, home: 'SF', away: 'CHI', homeScore: 38, awayScore: 13 },
  { id: '401671788', week: 14, home: 'KC', away: 'LAC', homeScore: 19, awayScore: 17 },
  { id: '401671690', week: 14, home: 'DAL', away: 'CIN', homeScore: 20, awayScore: 27 },

  // Week 15
  { id: '401671818', week: 15, home: 'SF', away: 'LAR', homeScore: 6, awayScore: 12 },
  { id: '401671854', week: 15, home: 'CLE', away: 'KC', homeScore: 7, awayScore: 21 },
  { id: '401671825', week: 15, home: 'TEN', away: 'CIN', homeScore: 27, awayScore: 37 },
  { id: '401671737', week: 15, home: 'NO', away: 'WSH', homeScore: 19, awayScore: 20 },
  { id: '401671639', week: 15, home: 'NYG', away: 'BAL', homeScore: 14, awayScore: 35 },
  { id: '401671731', week: 15, home: 'CAR', away: 'DAL', homeScore: 14, awayScore: 30 },
  { id: '401671706', week: 15, home: 'JAX', away: 'NYJ', homeScore: 25, awayScore: 32 },
  { id: '401671860', week: 15, home: 'HOU', away: 'MIA', homeScore: 20, awayScore: 12 },
  { id: '401671669', week: 15, home: 'DEN', away: 'IND', homeScore: 31, awayScore: 13 },
  { id: '401671681', week: 15, home: 'DET', away: 'BUF', homeScore: 42, awayScore: 48 },
  { id: '401671766', week: 15, home: 'PHI', away: 'PIT', homeScore: 27, awayScore: 13 },
  { id: '401671677', week: 15, home: 'ARI', away: 'NE', homeScore: 30, awayScore: 17 },
  { id: '401671762', week: 15, home: 'LAC', away: 'TB', homeScore: 17, awayScore: 40 },
  { id: '401671796', week: 15, home: 'SEA', away: 'GB', homeScore: 13, awayScore: 30 },
  { id: '401671489', week: 15, home: 'MIN', away: 'CHI', homeScore: 30, awayScore: 12 },
  { id: '401671697', week: 15, home: 'LV', away: 'ATL', homeScore: 9, awayScore: 15 },

  // Week 16
  { id: '401671749', week: 16, home: 'LAC', away: 'DEN', homeScore: 34, awayScore: 27 },
  { id: '401671780', week: 16, home: 'KC', away: 'HOU', homeScore: 27, awayScore: 19 },
  { id: '401671778', week: 16, home: 'BAL', away: 'PIT', homeScore: 34, awayScore: 17 },
  { id: '401671729', week: 16, home: 'ATL', away: 'NYG', homeScore: 34, awayScore: 7 },
  { id: '401671868', week: 16, home: 'CHI', away: 'DET', homeScore: 17, awayScore: 34 },
  { id: '401671811', week: 16, home: 'CIN', away: 'CLE', homeScore: 24, awayScore: 6 },
  { id: '401671862', week: 16, home: 'IND', away: 'TEN', homeScore: 38, awayScore: 30 },
  { id: '401671621', week: 16, home: 'NYJ', away: 'LAR', homeScore: 9, awayScore: 19 },
  { id: '401671717', week: 16, home: 'WSH', away: 'PHI', homeScore: 36, awayScore: 33 },
  { id: '401671732', week: 16, home: 'CAR', away: 'ARI', homeScore: 36, awayScore: 30 },
  { id: '401671759', week: 16, home: 'SEA', away: 'MIN', homeScore: 24, awayScore: 27 },
  { id: '401671494', week: 16, home: 'BUF', away: 'NE', homeScore: 24, awayScore: 21 },
  { id: '401671673', week: 16, home: 'LV', away: 'JAX', homeScore: 19, awayScore: 14 },
  { id: '401671874', week: 16, home: 'MIA', away: 'SF', homeScore: 29, awayScore: 17 },
  { id: '401671790', week: 16, home: 'DAL', away: 'TB', homeScore: 26, awayScore: 24 },
  { id: '401671692', week: 16, home: 'GB', away: 'NO', homeScore: 34, awayScore: 0 },

  // Week 17
  { id: '401671799', week: 17, home: 'PIT', away: 'KC', homeScore: 10, awayScore: 29 },
  { id: '401671800', week: 17, home: 'HOU', away: 'BAL', homeScore: 2, awayScore: 31 },
  { id: '401671876', week: 17, home: 'CHI', away: 'SEA', homeScore: 3, awayScore: 6 },
  { id: '401671832', week: 17, home: 'NE', away: 'LAC', homeScore: 7, awayScore: 40 },
  { id: '401671835', week: 17, home: 'CIN', away: 'DEN', homeScore: 30, awayScore: 24 },
  { id: '401671829', week: 17, home: 'LAR', away: 'ARI', homeScore: 13, awayScore: 9 },
  { id: '401671495', week: 17, home: 'BUF', away: 'NYJ', homeScore: 40, awayScore: 14 },
  { id: '401671738', week: 17, home: 'NO', away: 'LV', homeScore: 10, awayScore: 25 },
  { id: '401671846', week: 17, home: 'NYG', away: 'IND', homeScore: 45, awayScore: 33 },
  { id: '401671765', week: 17, home: 'PHI', away: 'DAL', homeScore: 41, awayScore: 7 },
  { id: '401671653', week: 17, home: 'TB', away: 'CAR', homeScore: 48, awayScore: 14 },
  { id: '401671634', week: 17, home: 'JAX', away: 'TEN', homeScore: 20, awayScore: 13 },
  { id: '401671877', week: 17, home: 'CLE', away: 'MIA', homeScore: 3, awayScore: 20 },
  { id: '401671725', week: 17, home: 'MIN', away: 'GB', homeScore: 27, awayScore: 25 },
  { id: '401671842', week: 17, home: 'WSH', away: 'ATL', homeScore: 30, awayScore: 24 },
  { id: '401671698', week: 17, home: 'SF', away: 'DET', homeScore: 34, awayScore: 40 },

  // Week 18
  { id: '401671834', week: 18, home: 'BAL', away: 'CLE', homeScore: 35, awayScore: 10 },
  { id: '401671836', week: 18, home: 'PIT', away: 'CIN', homeScore: 17, awayScore: 19 },
  { id: '401671827', week: 18, home: 'ATL', away: 'CAR', homeScore: 38, awayScore: 44 },
  { id: '401671840', week: 18, home: 'DAL', away: 'WSH', homeScore: 19, awayScore: 23 },
  { id: '401671844', week: 18, home: 'GB', away: 'CHI', homeScore: 22, awayScore: 24 },
  { id: '401671826', week: 18, home: 'TEN', away: 'HOU', homeScore: 14, awayScore: 23 },
  { id: '401671837', week: 18, home: 'IND', away: 'JAX', homeScore: 26, awayScore: 23 },
  { id: '401671831', week: 18, home: 'NE', away: 'BUF', homeScore: 23, awayScore: 16 },
  { id: '401671841', week: 18, home: 'PHI', away: 'NYG', homeScore: 20, awayScore: 13 },
  { id: '401671828', week: 18, home: 'TB', away: 'NO', homeScore: 27, awayScore: 19 },
  { id: '401671838', week: 18, home: 'DEN', away: 'KC', homeScore: 38, awayScore: 0 },
  { id: '401671839', week: 18, home: 'LV', away: 'LAC', homeScore: 20, awayScore: 34 },
  { id: '401671830', week: 18, home: 'LAR', away: 'SEA', homeScore: 25, awayScore: 30 },
  { id: '401671833', week: 18, home: 'NYJ', away: 'MIA', homeScore: 32, awayScore: 20 },
  { id: '401671845', week: 18, home: 'ARI', away: 'SF', homeScore: 47, awayScore: 24 },
  { id: '401671843', week: 18, home: 'DET', away: 'MIN', homeScore: 31, awayScore: 9 },
];

/**
 * Expected 2024 NFL Playoff Seedings (actual results)
 *
 * Team IDs reference:
 * AFC East: Bills(1), Dolphins(2), Patriots(3), Jets(4)
 * AFC North: Ravens(5), Bengals(6), Browns(7), Steelers(8)
 * AFC South: Texans(9), Colts(10), Jaguars(11), Titans(12)
 * AFC West: Broncos(13), Chiefs(14), Raiders(15), Chargers(16)
 * NFC East: Cowboys(17), Giants(18), Eagles(19), Commanders(20)
 * NFC North: Bears(21), Lions(22), Packers(23), Vikings(24)
 * NFC South: Falcons(25), Panthers(26), Saints(27), Buccaneers(28)
 * NFC West: Cardinals(29), Rams(30), 49ers(31), Seahawks(32)
 */
// Full AFC conference standings per ESPN (verified 2026-01-18)
export const EXPECTED_2024_AFC_SEEDINGS = {
  1: { teamId: '14', name: 'Chiefs', record: '15-2', division: 'AFC West' },
  2: { teamId: '1', name: 'Bills', record: '13-4', division: 'AFC East' },
  3: { teamId: '5', name: 'Ravens', record: '12-5', division: 'AFC North' },
  4: { teamId: '9', name: 'Texans', record: '10-7', division: 'AFC South' },
  5: { teamId: '16', name: 'Chargers', record: '11-6', division: 'AFC West' },
  6: { teamId: '8', name: 'Steelers', record: '10-7', division: 'AFC North' },
  7: { teamId: '13', name: 'Broncos', record: '10-7', division: 'AFC West' },
  8: { teamId: '6', name: 'Bengals', record: '9-8', division: 'AFC North' },
  9: { teamId: '10', name: 'Colts', record: '8-9', division: 'AFC South' },
  10: { teamId: '2', name: 'Dolphins', record: '8-9', division: 'AFC East' },
  11: { teamId: '4', name: 'Jets', record: '5-12', division: 'AFC East' },
  12: { teamId: '11', name: 'Jaguars', record: '4-13', division: 'AFC South' },
  13: { teamId: '3', name: 'Patriots', record: '4-13', division: 'AFC East' },
  14: { teamId: '15', name: 'Raiders', record: '4-13', division: 'AFC West' },
  15: { teamId: '7', name: 'Browns', record: '3-14', division: 'AFC North' },
  16: { teamId: '12', name: 'Titans', record: '3-14', division: 'AFC South' },
};

// Full NFC conference standings per ESPN (verified 2026-01-18)
export const EXPECTED_2024_NFC_SEEDINGS = {
  1: { teamId: '22', name: 'Lions', record: '15-2', division: 'NFC North' },
  2: { teamId: '19', name: 'Eagles', record: '14-3', division: 'NFC East' },
  3: { teamId: '28', name: 'Buccaneers', record: '10-7', division: 'NFC South' },
  4: { teamId: '30', name: 'Rams', record: '10-7', division: 'NFC West' },
  5: { teamId: '24', name: 'Vikings', record: '14-3', division: 'NFC North' },
  6: { teamId: '20', name: 'Commanders', record: '12-5', division: 'NFC East' },
  7: { teamId: '23', name: 'Packers', record: '11-6', division: 'NFC North' },
  8: { teamId: '32', name: 'Seahawks', record: '10-7', division: 'NFC West' },
  9: { teamId: '25', name: 'Falcons', record: '8-9', division: 'NFC South' },
  10: { teamId: '29', name: 'Cardinals', record: '8-9', division: 'NFC West' },
  11: { teamId: '17', name: 'Cowboys', record: '7-10', division: 'NFC East' },
  12: { teamId: '31', name: '49ers', record: '6-11', division: 'NFC West' },
  13: { teamId: '21', name: 'Bears', record: '5-12', division: 'NFC North' },
  14: { teamId: '26', name: 'Panthers', record: '5-12', division: 'NFC South' },
  15: { teamId: '27', name: 'Saints', record: '5-12', division: 'NFC South' },
  16: { teamId: '18', name: 'Giants', record: '3-14', division: 'NFC East' },
};

/**
 * Notable tiebreaker scenarios from 2024 season
 */
export const TIEBREAKER_SCENARIOS_2024 = {
  // AFC 6/7: Steelers (10-7) vs Broncos (10-7)
  steelersVsBroncos: {
    description: 'Steelers won 6th seed over Broncos',
    teams: ['8', '13'],
    expectedOrder: ['8', '13'],
    notes: 'Both 10-7, tiebreaker determined seeding',
  },

  // NFC 3/4: Rams (10-7) vs Buccaneers (10-7) - both division winners
  // BUG: Our system produces wrong order. See REGRESSION_ERRORS_CHECKLIST.md
  ramsVsBuccaneers: {
    description: 'Rams (NFC West winner) seeded 3rd, Buccaneers (NFC South winner) seeded 4th',
    teams: ['30', '28'],
    expectedOrder: ['30', '28'], // Rams 3, Buccaneers 4
    notes: 'Both 10-7 division winners, conference record or other tiebreaker determined order',
  },

  // NFC North: Vikings (14-3) as wild card behind Lions (15-2)
  vikingsWildCard: {
    description: 'Vikings finished 14-3 but as 5th seed wild card',
    divisionWinner: '22',
    wildCard: '24',
    notes: 'Lions won division at 15-2, Vikings had better record than some division winners but are wild card',
  },
};
