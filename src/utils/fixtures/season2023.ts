/**
 * 2023 NFL Regular Season Game Data
 *
 * All 272 games from the 2023 NFL regular season with actual scores.
 * Data fetched from ESPN API.
 *
 * Expected Final Playoff Seeds:
 * AFC: 1-Ravens(13-4), 2-Bills(11-6), 3-Chiefs(11-6), 4-Texans(10-7),
 *      5-Browns(11-6), 6-Dolphins(11-6), 7-Steelers(10-7)
 * NFC: 1-49ers(12-5), 2-Cowboys(12-5), 3-Lions(12-5), 4-Buccaneers(9-8),
 *      5-Eagles(11-6), 6-Rams(10-7), 7-Packers(9-8)
 */

import type { CompactGame } from './season2024';

export const SEASON_2023_GAMES: CompactGame[] = [
  // Week 1
  { id: '401547353', week: 1, home: 'KC', away: 'DET', homeScore: 20, awayScore: 21 },
  { id: '401547403', week: 1, home: 'ATL', away: 'CAR', homeScore: 24, awayScore: 10 },
  { id: '401547397', week: 1, home: 'CLE', away: 'CIN', homeScore: 24, awayScore: 3 },
  { id: '401547404', week: 1, home: 'IND', away: 'JAX', homeScore: 21, awayScore: 31 },
  { id: '401547398', week: 1, home: 'MIN', away: 'TB', homeScore: 17, awayScore: 20 },
  { id: '401547399', week: 1, home: 'NO', away: 'TEN', homeScore: 16, awayScore: 15 },
  { id: '401547405', week: 1, home: 'PIT', away: 'SF', homeScore: 7, awayScore: 30 },
  { id: '401547406', week: 1, home: 'WSH', away: 'ARI', homeScore: 20, awayScore: 16 },
  { id: '401547396', week: 1, home: 'BAL', away: 'HOU', homeScore: 25, awayScore: 9 },
  { id: '401547407', week: 1, home: 'CHI', away: 'GB', homeScore: 20, awayScore: 38 },
  { id: '401547400', week: 1, home: 'DEN', away: 'LV', homeScore: 16, awayScore: 17 },
  { id: '401547402', week: 1, home: 'NE', away: 'PHI', homeScore: 20, awayScore: 25 },
  { id: '401547401', week: 1, home: 'LAC', away: 'MIA', homeScore: 34, awayScore: 36 },
  { id: '401547408', week: 1, home: 'SEA', away: 'LAR', homeScore: 13, awayScore: 30 },
  { id: '401547409', week: 1, home: 'NYG', away: 'DAL', homeScore: 0, awayScore: 40 },
  { id: '401547352', week: 1, home: 'NYJ', away: 'BUF', homeScore: 22, awayScore: 16 },

  // Week 2
  { id: '401547410', week: 2, home: 'PHI', away: 'MIN', homeScore: 34, awayScore: 28 },
  { id: '401547417', week: 2, home: 'ATL', away: 'GB', homeScore: 25, awayScore: 24 },
  { id: '401547411', week: 2, home: 'BUF', away: 'LV', homeScore: 38, awayScore: 10 },
  { id: '401547412', week: 2, home: 'CIN', away: 'BAL', homeScore: 24, awayScore: 27 },
  { id: '401547418', week: 2, home: 'DET', away: 'SEA', homeScore: 31, awayScore: 37 },
  { id: '401547414', week: 2, home: 'TEN', away: 'LAC', homeScore: 27, awayScore: 24 },
  { id: '401547420', week: 2, home: 'TB', away: 'CHI', homeScore: 27, awayScore: 17 },
  { id: '401547413', week: 2, home: 'JAX', away: 'KC', homeScore: 9, awayScore: 17 },
  { id: '401547419', week: 2, home: 'HOU', away: 'IND', homeScore: 20, awayScore: 31 },
  { id: '401547422', week: 2, home: 'LAR', away: 'SF', homeScore: 23, awayScore: 30 },
  { id: '401547421', week: 2, home: 'ARI', away: 'NYG', homeScore: 28, awayScore: 31 },
  { id: '401547415', week: 2, home: 'DAL', away: 'NYJ', homeScore: 30, awayScore: 10 },
  { id: '401547416', week: 2, home: 'DEN', away: 'WSH', homeScore: 33, awayScore: 35 },
  { id: '401547423', week: 2, home: 'NE', away: 'MIA', homeScore: 17, awayScore: 24 },
  { id: '401547425', week: 2, home: 'CAR', away: 'NO', homeScore: 17, awayScore: 20 },
  { id: '401547424', week: 2, home: 'PIT', away: 'CLE', homeScore: 26, awayScore: 22 },

  // Week 3
  { id: '401547426', week: 3, home: 'SF', away: 'NYG', homeScore: 30, awayScore: 12 },
  { id: '401547428', week: 3, home: 'CLE', away: 'TEN', homeScore: 27, awayScore: 3 },
  { id: '401547433', week: 3, home: 'DET', away: 'ATL', homeScore: 20, awayScore: 6 },
  { id: '401547434', week: 3, home: 'GB', away: 'NO', homeScore: 18, awayScore: 17 },
  { id: '401547429', week: 3, home: 'MIA', away: 'DEN', homeScore: 70, awayScore: 20 },
  { id: '401547436', week: 3, home: 'MIN', away: 'LAC', homeScore: 24, awayScore: 28 },
  { id: '401547430', week: 3, home: 'NYJ', away: 'NE', homeScore: 10, awayScore: 15 },
  { id: '401547431', week: 3, home: 'WSH', away: 'BUF', homeScore: 3, awayScore: 37 },
  { id: '401547435', week: 3, home: 'JAX', away: 'HOU', homeScore: 17, awayScore: 37 },
  { id: '401547427', week: 3, home: 'BAL', away: 'IND', homeScore: 19, awayScore: 22 },
  { id: '401547432', week: 3, home: 'SEA', away: 'CAR', homeScore: 37, awayScore: 27 },
  { id: '401547438', week: 3, home: 'KC', away: 'CHI', homeScore: 41, awayScore: 10 },
  { id: '401547437', week: 3, home: 'ARI', away: 'DAL', homeScore: 28, awayScore: 16 },
  { id: '401547439', week: 3, home: 'LV', away: 'PIT', homeScore: 18, awayScore: 23 },
  { id: '401547440', week: 3, home: 'TB', away: 'PHI', homeScore: 11, awayScore: 25 },
  { id: '401547441', week: 3, home: 'CIN', away: 'LAR', homeScore: 19, awayScore: 16 },

  // Week 4
  { id: '401547442', week: 4, home: 'GB', away: 'DET', homeScore: 20, awayScore: 34 },
  { id: '401547227', week: 4, home: 'JAX', away: 'ATL', homeScore: 23, awayScore: 7 },
  { id: '401547443', week: 4, home: 'BUF', away: 'MIA', homeScore: 48, awayScore: 20 },
  { id: '401547444', week: 4, home: 'CHI', away: 'DEN', homeScore: 28, awayScore: 31 },
  { id: '401547445', week: 4, home: 'CLE', away: 'BAL', homeScore: 3, awayScore: 28 },
  { id: '401547452', week: 4, home: 'TEN', away: 'CIN', homeScore: 27, awayScore: 3 },
  { id: '401547449', week: 4, home: 'IND', away: 'LAR', homeScore: 23, awayScore: 29 },
  { id: '401547450', week: 4, home: 'NO', away: 'TB', homeScore: 9, awayScore: 26 },
  { id: '401547451', week: 4, home: 'PHI', away: 'WSH', homeScore: 34, awayScore: 31 },
  { id: '401547448', week: 4, home: 'CAR', away: 'MIN', homeScore: 13, awayScore: 21 },
  { id: '401547446', week: 4, home: 'HOU', away: 'PIT', homeScore: 30, awayScore: 6 },
  { id: '401547447', week: 4, home: 'LAC', away: 'LV', homeScore: 24, awayScore: 17 },
  { id: '401547453', week: 4, home: 'DAL', away: 'NE', homeScore: 38, awayScore: 3 },
  { id: '401547454', week: 4, home: 'SF', away: 'ARI', homeScore: 35, awayScore: 16 },
  { id: '401547455', week: 4, home: 'NYJ', away: 'KC', homeScore: 20, awayScore: 23 },
  { id: '401547456', week: 4, home: 'NYG', away: 'SEA', homeScore: 3, awayScore: 24 },

  // Week 5
  { id: '401547457', week: 5, home: 'WSH', away: 'CHI', homeScore: 20, awayScore: 40 },
  { id: '401547228', week: 5, home: 'BUF', away: 'JAX', homeScore: 20, awayScore: 25 },
  { id: '401547463', week: 5, home: 'ATL', away: 'HOU', homeScore: 21, awayScore: 19 },
  { id: '401547464', week: 5, home: 'DET', away: 'CAR', homeScore: 42, awayScore: 24 },
  { id: '401547458', week: 5, home: 'IND', away: 'TEN', homeScore: 23, awayScore: 16 },
  { id: '401547465', week: 5, home: 'MIA', away: 'NYG', homeScore: 31, awayScore: 16 },
  { id: '401547459', week: 5, home: 'NE', away: 'NO', homeScore: 0, awayScore: 34 },
  { id: '401547460', week: 5, home: 'PIT', away: 'BAL', homeScore: 17, awayScore: 10 },
  { id: '401547467', week: 5, home: 'LAR', away: 'PHI', homeScore: 14, awayScore: 23 },
  { id: '401547466', week: 5, home: 'ARI', away: 'CIN', homeScore: 20, awayScore: 34 },
  { id: '401547461', week: 5, home: 'DEN', away: 'NYJ', homeScore: 21, awayScore: 31 },
  { id: '401547462', week: 5, home: 'MIN', away: 'KC', homeScore: 20, awayScore: 27 },
  { id: '401547354', week: 5, home: 'SF', away: 'DAL', homeScore: 42, awayScore: 10 },
  { id: '401547468', week: 5, home: 'LV', away: 'GB', homeScore: 17, awayScore: 13 },

  // Week 6
  { id: '401547469', week: 6, home: 'KC', away: 'DEN', homeScore: 19, awayScore: 8 },
  { id: '401547229', week: 6, home: 'TEN', away: 'BAL', homeScore: 16, awayScore: 24 },
  { id: '401547470', week: 6, home: 'ATL', away: 'WSH', homeScore: 16, awayScore: 24 },
  { id: '401547475', week: 6, home: 'CHI', away: 'MIN', homeScore: 13, awayScore: 19 },
  { id: '401547471', week: 6, home: 'CIN', away: 'SEA', homeScore: 17, awayScore: 13 },
  { id: '401547476', week: 6, home: 'CLE', away: 'SF', homeScore: 19, awayScore: 17 },
  { id: '401547473', week: 6, home: 'MIA', away: 'CAR', homeScore: 42, awayScore: 21 },
  { id: '401547472', week: 6, home: 'JAX', away: 'IND', homeScore: 37, awayScore: 20 },
  { id: '401547477', week: 6, home: 'HOU', away: 'NO', homeScore: 20, awayScore: 13 },
  { id: '401547474', week: 6, home: 'LV', away: 'NE', homeScore: 21, awayScore: 17 },
  { id: '401547479', week: 6, home: 'LAR', away: 'ARI', homeScore: 26, awayScore: 9 },
  { id: '401547480', week: 6, home: 'NYJ', away: 'PHI', homeScore: 20, awayScore: 14 },
  { id: '401547478', week: 6, home: 'TB', away: 'DET', homeScore: 6, awayScore: 20 },
  { id: '401547481', week: 6, home: 'BUF', away: 'NYG', homeScore: 14, awayScore: 9 },
  { id: '401547482', week: 6, home: 'LAC', away: 'DAL', homeScore: 17, awayScore: 20 },

  // Week 7
  { id: '401547483', week: 7, home: 'NO', away: 'JAX', homeScore: 24, awayScore: 31 },
  { id: '401547490', week: 7, home: 'CHI', away: 'LV', homeScore: 30, awayScore: 12 },
  { id: '401547484', week: 7, home: 'IND', away: 'CLE', homeScore: 38, awayScore: 39 },
  { id: '401547485', week: 7, home: 'NE', away: 'BUF', homeScore: 29, awayScore: 25 },
  { id: '401547486', week: 7, home: 'NYG', away: 'WSH', homeScore: 14, awayScore: 7 },
  { id: '401547491', week: 7, home: 'TB', away: 'ATL', homeScore: 13, awayScore: 16 },
  { id: '401547489', week: 7, home: 'BAL', away: 'DET', homeScore: 38, awayScore: 6 },
  { id: '401547492', week: 7, home: 'LAR', away: 'PIT', homeScore: 17, awayScore: 24 },
  { id: '401547493', week: 7, home: 'SEA', away: 'ARI', homeScore: 20, awayScore: 10 },
  { id: '401547487', week: 7, home: 'DEN', away: 'GB', homeScore: 19, awayScore: 17 },
  { id: '401547488', week: 7, home: 'KC', away: 'LAC', homeScore: 31, awayScore: 17 },
  { id: '401547494', week: 7, home: 'PHI', away: 'MIA', homeScore: 31, awayScore: 17 },
  { id: '401547495', week: 7, home: 'MIN', away: 'SF', homeScore: 22, awayScore: 17 },

  // Week 8
  { id: '401547496', week: 8, home: 'BUF', away: 'TB', homeScore: 24, awayScore: 18 },
  { id: '401547505', week: 8, home: 'DAL', away: 'LAR', homeScore: 43, awayScore: 20 },
  { id: '401547506', week: 8, home: 'GB', away: 'MIN', homeScore: 10, awayScore: 24 },
  { id: '401547500', week: 8, home: 'TEN', away: 'ATL', homeScore: 28, awayScore: 23 },
  { id: '401547507', week: 8, home: 'IND', away: 'NO', homeScore: 27, awayScore: 38 },
  { id: '401547497', week: 8, home: 'MIA', away: 'NE', homeScore: 31, awayScore: 17 },
  { id: '401547498', week: 8, home: 'NYG', away: 'NYJ', homeScore: 10, awayScore: 13 },
  { id: '401547499', week: 8, home: 'PIT', away: 'JAX', homeScore: 10, awayScore: 20 },
  { id: '401547508', week: 8, home: 'WSH', away: 'PHI', homeScore: 31, awayScore: 38 },
  { id: '401547504', week: 8, home: 'CAR', away: 'HOU', homeScore: 15, awayScore: 13 },
  { id: '401547509', week: 8, home: 'SEA', away: 'CLE', homeScore: 24, awayScore: 20 },
  { id: '401547502', week: 8, home: 'DEN', away: 'KC', homeScore: 24, awayScore: 9 },
  { id: '401547501', week: 8, home: 'ARI', away: 'BAL', homeScore: 24, awayScore: 31 },
  { id: '401547503', week: 8, home: 'SF', away: 'CIN', homeScore: 17, awayScore: 31 },
  { id: '401547510', week: 8, home: 'LAC', away: 'CHI', homeScore: 30, awayScore: 13 },
  { id: '401547511', week: 8, home: 'DET', away: 'LV', homeScore: 26, awayScore: 14 },

  // Week 9
  { id: '401547512', week: 9, home: 'PIT', away: 'TEN', homeScore: 20, awayScore: 16 },
  { id: '401547230', week: 9, home: 'KC', away: 'MIA', homeScore: 21, awayScore: 14 },
  { id: '401547518', week: 9, home: 'ATL', away: 'MIN', homeScore: 28, awayScore: 31 },
  { id: '401547514', week: 9, home: 'CLE', away: 'ARI', homeScore: 27, awayScore: 0 },
  { id: '401547519', week: 9, home: 'GB', away: 'LAR', homeScore: 20, awayScore: 3 },
  { id: '401547520', week: 9, home: 'NE', away: 'WSH', homeScore: 17, awayScore: 20 },
  { id: '401547516', week: 9, home: 'NO', away: 'CHI', homeScore: 24, awayScore: 17 },
  { id: '401547513', week: 9, home: 'BAL', away: 'SEA', homeScore: 37, awayScore: 3 },
  { id: '401547515', week: 9, home: 'HOU', away: 'TB', homeScore: 39, awayScore: 37 },
  { id: '401547517', week: 9, home: 'CAR', away: 'IND', homeScore: 13, awayScore: 27 },
  { id: '401547521', week: 9, home: 'LV', away: 'NYG', homeScore: 30, awayScore: 6 },
  { id: '401547522', week: 9, home: 'PHI', away: 'DAL', homeScore: 28, awayScore: 23 },
  { id: '401547523', week: 9, home: 'CIN', away: 'BUF', homeScore: 24, awayScore: 18 },
  { id: '401547524', week: 9, home: 'NYJ', away: 'LAC', homeScore: 6, awayScore: 27 },

  // Week 10
  { id: '401547525', week: 10, home: 'CHI', away: 'CAR', homeScore: 16, awayScore: 13 },
  { id: '401547231', week: 10, home: 'NE', away: 'IND', homeScore: 6, awayScore: 10 },
  { id: '401547526', week: 10, home: 'CIN', away: 'HOU', homeScore: 27, awayScore: 30 },
  { id: '401547533', week: 10, home: 'MIN', away: 'NO', homeScore: 27, awayScore: 19 },
  { id: '401547527', week: 10, home: 'PIT', away: 'GB', homeScore: 23, awayScore: 19 },
  { id: '401547528', week: 10, home: 'TB', away: 'TEN', homeScore: 20, awayScore: 6 },
  { id: '401547532', week: 10, home: 'JAX', away: 'SF', homeScore: 3, awayScore: 34 },
  { id: '401547531', week: 10, home: 'BAL', away: 'CLE', homeScore: 31, awayScore: 33 },
  { id: '401547529', week: 10, home: 'ARI', away: 'ATL', homeScore: 25, awayScore: 23 },
  { id: '401547530', week: 10, home: 'LAC', away: 'DET', homeScore: 38, awayScore: 41 },
  { id: '401547534', week: 10, home: 'DAL', away: 'NYG', homeScore: 49, awayScore: 17 },
  { id: '401547535', week: 10, home: 'SEA', away: 'WSH', homeScore: 29, awayScore: 26 },
  { id: '401547536', week: 10, home: 'LV', away: 'NYJ', homeScore: 16, awayScore: 12 },
  { id: '401547537', week: 10, home: 'BUF', away: 'DEN', homeScore: 22, awayScore: 24 },

  // Week 11
  { id: '401547538', week: 11, home: 'BAL', away: 'CIN', homeScore: 34, awayScore: 20 },
  { id: '401547539', week: 11, home: 'CLE', away: 'PIT', homeScore: 13, awayScore: 10 },
  { id: '401547546', week: 11, home: 'DET', away: 'CHI', homeScore: 31, awayScore: 26 },
  { id: '401547547', week: 11, home: 'GB', away: 'LAC', homeScore: 23, awayScore: 20 },
  { id: '401547542', week: 11, home: 'MIA', away: 'LV', homeScore: 20, awayScore: 13 },
  { id: '401547548', week: 11, home: 'WSH', away: 'NYG', homeScore: 19, awayScore: 31 },
  { id: '401547545', week: 11, home: 'CAR', away: 'DAL', homeScore: 10, awayScore: 33 },
  { id: '401547541', week: 11, home: 'JAX', away: 'TEN', homeScore: 34, awayScore: 14 },
  { id: '401547540', week: 11, home: 'HOU', away: 'ARI', homeScore: 21, awayScore: 16 },
  { id: '401547549', week: 11, home: 'SF', away: 'TB', homeScore: 27, awayScore: 14 },
  { id: '401547543', week: 11, home: 'BUF', away: 'NYJ', homeScore: 32, awayScore: 6 },
  { id: '401547544', week: 11, home: 'LAR', away: 'SEA', homeScore: 17, awayScore: 16 },
  { id: '401547550', week: 11, home: 'DEN', away: 'MIN', homeScore: 21, awayScore: 20 },
  { id: '401547345', week: 11, home: 'KC', away: 'PHI', homeScore: 17, awayScore: 21 },

  // Week 12
  { id: '401547552', week: 12, home: 'DET', away: 'GB', homeScore: 22, awayScore: 29 },
  { id: '401547551', week: 12, home: 'DAL', away: 'WSH', homeScore: 45, awayScore: 10 },
  { id: '401547553', week: 12, home: 'SEA', away: 'SF', homeScore: 13, awayScore: 31 },
  { id: '401547242', week: 12, home: 'NYJ', away: 'MIA', homeScore: 13, awayScore: 34 },
  { id: '401547559', week: 12, home: 'ATL', away: 'NO', homeScore: 24, awayScore: 15 },
  { id: '401547554', week: 12, home: 'CIN', away: 'PIT', homeScore: 10, awayScore: 16 },
  { id: '401547561', week: 12, home: 'TEN', away: 'CAR', homeScore: 17, awayScore: 10 },
  { id: '401547556', week: 12, home: 'IND', away: 'TB', homeScore: 27, awayScore: 20 },
  { id: '401547560', week: 12, home: 'NYG', away: 'NE', homeScore: 10, awayScore: 7 },
  { id: '401547555', week: 12, home: 'HOU', away: 'JAX', homeScore: 21, awayScore: 24 },
  { id: '401547563', week: 12, home: 'DEN', away: 'CLE', homeScore: 29, awayScore: 12 },
  { id: '401547562', week: 12, home: 'ARI', away: 'LAR', homeScore: 14, awayScore: 37 },
  { id: '401547557', week: 12, home: 'LV', away: 'KC', homeScore: 17, awayScore: 31 },
  { id: '401547558', week: 12, home: 'PHI', away: 'BUF', homeScore: 37, awayScore: 34 },
  { id: '401547564', week: 12, home: 'LAC', away: 'BAL', homeScore: 10, awayScore: 20 },
  { id: '401547565', week: 12, home: 'MIN', away: 'CHI', homeScore: 10, awayScore: 12 },

  // Week 13
  { id: '401547566', week: 13, home: 'DAL', away: 'SEA', homeScore: 41, awayScore: 35 },
  { id: '401547570', week: 13, home: 'TEN', away: 'IND', homeScore: 28, awayScore: 31 },
  { id: '401547567', week: 13, home: 'NE', away: 'LAC', homeScore: 0, awayScore: 6 },
  { id: '401547572', week: 13, home: 'NO', away: 'DET', homeScore: 28, awayScore: 33 },
  { id: '401547573', week: 13, home: 'NYJ', away: 'ATL', homeScore: 8, awayScore: 13 },
  { id: '401547568', week: 13, home: 'PIT', away: 'ARI', homeScore: 10, awayScore: 24 },
  { id: '401547574', week: 13, home: 'WSH', away: 'MIA', homeScore: 15, awayScore: 45 },
  { id: '401547571', week: 13, home: 'HOU', away: 'DEN', homeScore: 22, awayScore: 17 },
  { id: '401547569', week: 13, home: 'TB', away: 'CAR', homeScore: 21, awayScore: 18 },
  { id: '401547575', week: 13, home: 'LAR', away: 'CLE', homeScore: 36, awayScore: 19 },
  { id: '401547276', week: 13, home: 'PHI', away: 'SF', homeScore: 19, awayScore: 42 },
  { id: '401547576', week: 13, home: 'GB', away: 'KC', homeScore: 27, awayScore: 19 },
  { id: '401547577', week: 13, home: 'JAX', away: 'CIN', homeScore: 31, awayScore: 34 },

  // Week 14
  { id: '401547578', week: 14, home: 'PIT', away: 'NE', homeScore: 18, awayScore: 21 },
  { id: '401547579', week: 14, home: 'ATL', away: 'TB', homeScore: 25, awayScore: 29 },
  { id: '401547586', week: 14, home: 'CHI', away: 'DET', homeScore: 28, awayScore: 13 },
  { id: '401547580', week: 14, home: 'CIN', away: 'IND', homeScore: 34, awayScore: 14 },
  { id: '401547581', week: 14, home: 'CLE', away: 'JAX', homeScore: 31, awayScore: 27 },
  { id: '401547587', week: 14, home: 'NO', away: 'CAR', homeScore: 28, awayScore: 6 },
  { id: '401547582', week: 14, home: 'NYJ', away: 'HOU', homeScore: 30, awayScore: 6 },
  { id: '401547585', week: 14, home: 'BAL', away: 'LAR', homeScore: 37, awayScore: 31 },
  { id: '401547588', week: 14, home: 'LV', away: 'MIN', homeScore: 0, awayScore: 3 },
  { id: '401547589', week: 14, home: 'SF', away: 'SEA', homeScore: 28, awayScore: 16 },
  { id: '401547583', week: 14, home: 'KC', away: 'BUF', homeScore: 17, awayScore: 20 },
  { id: '401547584', week: 14, home: 'LAC', away: 'DEN', homeScore: 7, awayScore: 24 },
  { id: '401547590', week: 14, home: 'DAL', away: 'PHI', homeScore: 33, awayScore: 13 },
  { id: '401547592', week: 14, home: 'MIA', away: 'TEN', homeScore: 27, awayScore: 28 },
  { id: '401547591', week: 14, home: 'NYG', away: 'GB', homeScore: 24, awayScore: 22 },

  // Week 15
  { id: '401547593', week: 15, home: 'LV', away: 'LAC', homeScore: 63, awayScore: 21 },
  { id: '401547604', week: 15, home: 'CIN', away: 'MIN', homeScore: 27, awayScore: 24 },
  { id: '401547607', week: 15, home: 'IND', away: 'PIT', homeScore: 30, awayScore: 13 },
  { id: '401547606', week: 15, home: 'DET', away: 'DEN', homeScore: 42, awayScore: 17 },
  { id: '401547605', week: 15, home: 'CLE', away: 'CHI', homeScore: 20, awayScore: 17 },
  { id: '401547598', week: 15, home: 'GB', away: 'TB', homeScore: 20, awayScore: 34 },
  { id: '401547595', week: 15, home: 'TEN', away: 'HOU', homeScore: 16, awayScore: 19 },
  { id: '401547594', week: 15, home: 'MIA', away: 'NYJ', homeScore: 30, awayScore: 0 },
  { id: '401547608', week: 15, home: 'NE', away: 'KC', homeScore: 17, awayScore: 27 },
  { id: '401547599', week: 15, home: 'NO', away: 'NYG', homeScore: 24, awayScore: 6 },
  { id: '401547603', week: 15, home: 'CAR', away: 'ATL', homeScore: 9, awayScore: 7 },
  { id: '401547597', week: 15, home: 'LAR', away: 'WSH', homeScore: 28, awayScore: 20 },
  { id: '401547596', week: 15, home: 'ARI', away: 'SF', homeScore: 29, awayScore: 45 },
  { id: '401547600', week: 15, home: 'BUF', away: 'DAL', homeScore: 31, awayScore: 10 },
  { id: '401547602', week: 15, home: 'JAX', away: 'BAL', homeScore: 7, awayScore: 23 },
  { id: '401547601', week: 15, home: 'SEA', away: 'PHI', homeScore: 20, awayScore: 17 },

  // Week 16
  { id: '401547609', week: 16, home: 'LAR', away: 'NO', homeScore: 30, awayScore: 22 },
  { id: '401547610', week: 16, home: 'PIT', away: 'CIN', homeScore: 34, awayScore: 11 },
  { id: '401547611', week: 16, home: 'LAC', away: 'BUF', homeScore: 22, awayScore: 24 },
  { id: '401547616', week: 16, home: 'ATL', away: 'IND', homeScore: 29, awayScore: 10 },
  { id: '401547614', week: 16, home: 'TEN', away: 'SEA', homeScore: 17, awayScore: 20 },
  { id: '401547618', week: 16, home: 'MIN', away: 'DET', homeScore: 24, awayScore: 30 },
  { id: '401547613', week: 16, home: 'NYJ', away: 'WSH', homeScore: 30, awayScore: 28 },
  { id: '401547617', week: 16, home: 'CAR', away: 'GB', homeScore: 30, awayScore: 33 },
  { id: '401547612', week: 16, home: 'HOU', away: 'CLE', homeScore: 22, awayScore: 36 },
  { id: '401547615', week: 16, home: 'TB', away: 'JAX', homeScore: 30, awayScore: 12 },
  { id: '401547619', week: 16, home: 'CHI', away: 'ARI', homeScore: 27, awayScore: 16 },
  { id: '401547620', week: 16, home: 'MIA', away: 'DAL', homeScore: 22, awayScore: 20 },
  { id: '401547621', week: 16, home: 'DEN', away: 'NE', homeScore: 23, awayScore: 26 },
  { id: '401547351', week: 16, home: 'KC', away: 'LV', homeScore: 14, awayScore: 20 },
  { id: '401547241', week: 16, home: 'PHI', away: 'NYG', homeScore: 33, awayScore: 25 },
  { id: '401547622', week: 16, home: 'SF', away: 'BAL', homeScore: 19, awayScore: 33 },

  // Week 17
  { id: '401547623', week: 17, home: 'CLE', away: 'NYJ', homeScore: 37, awayScore: 20 },
  { id: '401547624', week: 17, home: 'DAL', away: 'DET', homeScore: 20, awayScore: 19 },
  { id: '401547626', week: 17, home: 'BUF', away: 'NE', homeScore: 27, awayScore: 21 },
  { id: '401547627', week: 17, home: 'CHI', away: 'ATL', homeScore: 37, awayScore: 17 },
  { id: '401547628', week: 17, home: 'IND', away: 'LV', homeScore: 23, awayScore: 20 },
  { id: '401547632', week: 17, home: 'NYG', away: 'LAR', homeScore: 25, awayScore: 26 },
  { id: '401547633', week: 17, home: 'PHI', away: 'ARI', homeScore: 31, awayScore: 35 },
  { id: '401547634', week: 17, home: 'TB', away: 'NO', homeScore: 13, awayScore: 23 },
  { id: '401547635', week: 17, home: 'WSH', away: 'SF', homeScore: 10, awayScore: 27 },
  { id: '401547629', week: 17, home: 'JAX', away: 'CAR', homeScore: 26, awayScore: 0 },
  { id: '401547625', week: 17, home: 'BAL', away: 'MIA', homeScore: 56, awayScore: 19 },
  { id: '401547631', week: 17, home: 'HOU', away: 'TEN', homeScore: 26, awayScore: 3 },
  { id: '401547636', week: 17, home: 'SEA', away: 'PIT', homeScore: 23, awayScore: 30 },
  { id: '401547630', week: 17, home: 'DEN', away: 'LAC', homeScore: 16, awayScore: 9 },
  { id: '401547235', week: 17, home: 'KC', away: 'CIN', homeScore: 25, awayScore: 17 },
  { id: '401547637', week: 17, home: 'MIN', away: 'GB', homeScore: 10, awayScore: 33 },

  // Week 18
  { id: '401547639', week: 18, home: 'BAL', away: 'PIT', homeScore: 10, awayScore: 17 },
  { id: '401547644', week: 18, home: 'IND', away: 'HOU', homeScore: 19, awayScore: 23 },
  { id: '401547641', week: 18, home: 'CIN', away: 'CLE', homeScore: 31, awayScore: 14 },
  { id: '401547642', week: 18, home: 'DET', away: 'MIN', homeScore: 30, awayScore: 20 },
  { id: '401547652', week: 18, home: 'TEN', away: 'JAX', homeScore: 28, awayScore: 20 },
  { id: '401547648', week: 18, home: 'NE', away: 'NYJ', homeScore: 3, awayScore: 17 },
  { id: '401547649', week: 18, home: 'NO', away: 'ATL', homeScore: 48, awayScore: 17 },
  { id: '401547640', week: 18, home: 'CAR', away: 'TB', homeScore: 0, awayScore: 9 },
  { id: '401547643', week: 18, home: 'GB', away: 'CHI', homeScore: 17, awayScore: 9 },
  { id: '401547646', week: 18, home: 'LV', away: 'DEN', homeScore: 27, awayScore: 14 },
  { id: '401547650', week: 18, home: 'NYG', away: 'PHI', homeScore: 27, awayScore: 10 },
  { id: '401547638', week: 18, home: 'ARI', away: 'SEA', homeScore: 20, awayScore: 21 },
  { id: '401547645', week: 18, home: 'LAC', away: 'KC', homeScore: 12, awayScore: 13 },
  { id: '401547651', week: 18, home: 'SF', away: 'LAR', homeScore: 20, awayScore: 21 },
  { id: '401547653', week: 18, home: 'WSH', away: 'DAL', homeScore: 10, awayScore: 38 },
  { id: '401547647', week: 18, home: 'MIA', away: 'BUF', homeScore: 14, awayScore: 21 },
];

/**
 * 2023 NFL Playoff Seedings (ACTUAL NFL RESULTS)
 *
 * These are the correct NFL playoff seedings. Our tiebreaker implementation
 * has bugs that cause it to produce different results for some scenarios.
 * Tests should expect these correct values and FAIL until bugs are fixed.
 *
 * Known bugs tracked in REGRESSION_ERRORS_CHECKLIST.md:
 * - Error #1: AFC seeds 5/6 - Our system swaps Browns/Dolphins
 * - Error #2: NFC seeds 1-3 - Our system reorders 49ers/Cowboys/Lions
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

// Full AFC conference standings per ESPN
export const EXPECTED_2023_AFC_SEEDINGS = {
  1: { teamId: '5', name: 'Ravens', record: '13-4', division: 'AFC North' },
  2: { teamId: '1', name: 'Bills', record: '11-6', division: 'AFC East' },
  3: { teamId: '14', name: 'Chiefs', record: '11-6', division: 'AFC West' },
  4: { teamId: '9', name: 'Texans', record: '10-7', division: 'AFC South' },
  5: { teamId: '7', name: 'Browns', record: '11-6', division: 'AFC North' },
  6: { teamId: '2', name: 'Dolphins', record: '11-6', division: 'AFC East' },
  7: { teamId: '8', name: 'Steelers', record: '10-7', division: 'AFC North' },
  8: { teamId: '6', name: 'Bengals', record: '9-8', division: 'AFC North' },
  9: { teamId: '11', name: 'Jaguars', record: '9-8', division: 'AFC South' },
  10: { teamId: '10', name: 'Colts', record: '9-8', division: 'AFC South' },
  11: { teamId: '15', name: 'Raiders', record: '8-9', division: 'AFC West' },
  12: { teamId: '13', name: 'Broncos', record: '8-9', division: 'AFC West' },
  13: { teamId: '4', name: 'Jets', record: '7-10', division: 'AFC East' },
  14: { teamId: '12', name: 'Titans', record: '6-11', division: 'AFC South' },
  15: { teamId: '16', name: 'Chargers', record: '5-12', division: 'AFC West' },
  16: { teamId: '3', name: 'Patriots', record: '4-13', division: 'AFC East' },
};

// Full NFC conference standings per ESPN
export const EXPECTED_2023_NFC_SEEDINGS = {
  1: { teamId: '31', name: '49ers', record: '12-5', division: 'NFC West' },
  2: { teamId: '17', name: 'Cowboys', record: '12-5', division: 'NFC East' },
  3: { teamId: '22', name: 'Lions', record: '12-5', division: 'NFC North' },
  4: { teamId: '28', name: 'Buccaneers', record: '9-8', division: 'NFC South' },
  5: { teamId: '19', name: 'Eagles', record: '11-6', division: 'NFC East' },
  6: { teamId: '30', name: 'Rams', record: '10-7', division: 'NFC West' },
  7: { teamId: '23', name: 'Packers', record: '9-8', division: 'NFC North' },
  8: { teamId: '32', name: 'Seahawks', record: '9-8', division: 'NFC West' },
  9: { teamId: '27', name: 'Saints', record: '9-8', division: 'NFC South' },
  10: { teamId: '24', name: 'Vikings', record: '7-10', division: 'NFC North' },
  11: { teamId: '21', name: 'Bears', record: '7-10', division: 'NFC North' },
  12: { teamId: '25', name: 'Falcons', record: '7-10', division: 'NFC South' },
  13: { teamId: '18', name: 'Giants', record: '6-11', division: 'NFC East' },
  14: { teamId: '20', name: 'Commanders', record: '4-13', division: 'NFC East' },
  15: { teamId: '29', name: 'Cardinals', record: '4-13', division: 'NFC West' },
  16: { teamId: '26', name: 'Panthers', record: '2-15', division: 'NFC South' },
};

/**
 * Notable tiebreaker scenarios from 2023 season
 */
export const TIEBREAKER_SCENARIOS_2023 = {
  // AFC: Four 11-6 teams (Bills, Chiefs, Browns, Dolphins)
  fourElevenSixAFC: {
    description: 'Four AFC teams finished 11-6, requiring tiebreakers for seeds 2-3 and 5-6',
    teams: ['1', '14', '7', '2'], // Bills, Chiefs, Browns, Dolphins
    expectedOrder: ['1', '14', '7', '2'], // Bills 2, Chiefs 3, Browns 5, Dolphins 6
    notes: 'Bills and Chiefs won divisions, Browns and Dolphins wild cards',
  },

  // NFC: Three 12-5 division winners (49ers, Cowboys, Lions)
  threeTwelveFiveNFC: {
    description: '49ers, Cowboys, and Lions all finished 12-5 as division winners',
    teams: ['31', '17', '22'], // 49ers, Cowboys, Lions
    expectedOrder: ['31', '17', '22'], // 49ers 1, Cowboys 2, Lions 3
    notes: 'Tiebreakers determined seeding order among these three division winners',
  },

  // NFC South: Buccaneers (9-8) won division
  buccaneersWeakDivisionWinner: {
    description: 'Buccaneers won NFC South with 9-8 record (division with no winning records)',
    divisionWinner: '28',
    notes: 'Worst division winner record, but still gets seed 4 as division winner',
  },

  // NFC 7 seed: Packers (9-8) vs Saints (9-8)
  packersVsSaints: {
    description: 'Packers beat Saints in tiebreaker for final NFC wild card spot',
    teams: ['23', '27'], // Packers, Saints
    expectedWinner: '23', // Packers got 7 seed
    notes: 'Both 9-8, tiebreaker gave Packers the playoff spot',
  },
};
