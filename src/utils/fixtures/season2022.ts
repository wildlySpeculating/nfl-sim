/**
 * 2022 NFL Regular Season Game Data
 *
 * All 272 games from the 2022 NFL regular season with actual scores.
 * Data fetched from ESPN API.
 *
 * Note: The Week 17 Bengals vs Bills game (id: 401437947) was cancelled
 * after Damar Hamlin's cardiac arrest. Scores are 0-0 in our data.
 *
 * Expected Final Playoff Seeds:
 * AFC: 1-Chiefs(14-3), 2-Bills(13-3), 3-Bengals(12-4), 4-Jaguars(9-8),
 *      5-Chargers(10-7), 6-Ravens(10-7), 7-Dolphins(9-8)
 * NFC: 1-Eagles(14-3), 2-49ers(13-4), 3-Vikings(13-4), 4-Buccaneers(8-9),
 *      5-Cowboys(12-5), 6-Giants(9-7-1), 7-Seahawks(9-8)
 */

import type { CompactGame } from './season2024';

export const SEASON_2022_GAMES: CompactGame[] = [
  // Week 1
  { id: '401437654', week: 1, home: 'LAR', away: 'BUF', homeScore: 10, awayScore: 31 },
  { id: '401437650', week: 1, home: 'ATL', away: 'NO', homeScore: 26, awayScore: 27 },
  { id: '401437647', week: 1, home: 'CHI', away: 'SF', homeScore: 19, awayScore: 10 },
  { id: '401437634', week: 1, home: 'CIN', away: 'PIT', homeScore: 20, awayScore: 23 },
  { id: '401437648', week: 1, home: 'DET', away: 'PHI', homeScore: 35, awayScore: 38 },
  { id: '401437630', week: 1, home: 'MIA', away: 'NE', homeScore: 20, awayScore: 7 },
  { id: '401437632', week: 1, home: 'NYJ', away: 'BAL', homeScore: 9, awayScore: 24 },
  { id: '401437646', week: 1, home: 'WSH', away: 'JAX', homeScore: 28, awayScore: 22 },
  { id: '401437651', week: 1, home: 'CAR', away: 'CLE', homeScore: 24, awayScore: 26 },
  { id: '401437637', week: 1, home: 'HOU', away: 'IND', homeScore: 20, awayScore: 20 },
  { id: '401437640', week: 1, home: 'TEN', away: 'NYG', homeScore: 20, awayScore: 21 },
  { id: '401437649', week: 1, home: 'MIN', away: 'GB', homeScore: 23, awayScore: 7 },
  { id: '401437653', week: 1, home: 'ARI', away: 'KC', homeScore: 21, awayScore: 44 },
  { id: '401437643', week: 1, home: 'LAC', away: 'LV', homeScore: 24, awayScore: 19 },
  { id: '401437644', week: 1, home: 'DAL', away: 'TB', homeScore: 3, awayScore: 19 },
  { id: '401437655', week: 1, home: 'SEA', away: 'DEN', homeScore: 17, awayScore: 16 },

  // Week 2
  { id: '401434030', week: 2, home: 'KC', away: 'LAC', homeScore: 27, awayScore: 24 },
  { id: '401437635', week: 2, home: 'CLE', away: 'NYJ', homeScore: 30, awayScore: 31 },
  { id: '401437732', week: 2, home: 'DET', away: 'WSH', homeScore: 36, awayScore: 27 },
  { id: '401437652', week: 2, home: 'NO', away: 'TB', homeScore: 10, awayScore: 20 },
  { id: '401437645', week: 2, home: 'NYG', away: 'CAR', homeScore: 19, awayScore: 16 },
  { id: '401437636', week: 2, home: 'PIT', away: 'NE', homeScore: 14, awayScore: 17 },
  { id: '401437639', week: 2, home: 'JAX', away: 'IND', homeScore: 24, awayScore: 0 },
  { id: '401437633', week: 2, home: 'BAL', away: 'MIA', homeScore: 38, awayScore: 42 },
  { id: '401437733', week: 2, home: 'LAR', away: 'ATL', homeScore: 31, awayScore: 27 },
  { id: '401437605', week: 2, home: 'SF', away: 'SEA', homeScore: 27, awayScore: 7 },
  { id: '401437734', week: 2, home: 'DAL', away: 'CIN', homeScore: 20, awayScore: 17 },
  { id: '401437641', week: 2, home: 'DEN', away: 'HOU', homeScore: 16, awayScore: 9 },
  { id: '401437642', week: 2, home: 'LV', away: 'ARI', homeScore: 23, awayScore: 29 },
  { id: '401437606', week: 2, home: 'GB', away: 'CHI', homeScore: 27, awayScore: 10 },
  { id: '401436831', week: 2, home: 'BUF', away: 'TEN', homeScore: 41, awayScore: 7 },
  { id: '401436832', week: 2, home: 'PHI', away: 'MIN', homeScore: 24, awayScore: 7 },

  // Week 3
  { id: '401437735', week: 3, home: 'CLE', away: 'PIT', homeScore: 29, awayScore: 17 },
  { id: '401437737', week: 3, home: 'CHI', away: 'HOU', homeScore: 23, awayScore: 20 },
  { id: '401437741', week: 3, home: 'TEN', away: 'LV', homeScore: 24, awayScore: 22 },
  { id: '401437638', week: 3, home: 'IND', away: 'KC', homeScore: 20, awayScore: 17 },
  { id: '401437738', week: 3, home: 'MIA', away: 'BUF', homeScore: 21, awayScore: 19 },
  { id: '401437739', week: 3, home: 'MIN', away: 'DET', homeScore: 28, awayScore: 24 },
  { id: '401437631', week: 3, home: 'NE', away: 'BAL', homeScore: 26, awayScore: 37 },
  { id: '401437740', week: 3, home: 'NYJ', away: 'CIN', homeScore: 12, awayScore: 27 },
  { id: '401437742', week: 3, home: 'WSH', away: 'PHI', homeScore: 8, awayScore: 24 },
  { id: '401437736', week: 3, home: 'CAR', away: 'NO', homeScore: 22, awayScore: 14 },
  { id: '401437743', week: 3, home: 'LAC', away: 'JAX', homeScore: 10, awayScore: 38 },
  { id: '401437744', week: 3, home: 'ARI', away: 'LAR', homeScore: 12, awayScore: 20 },
  { id: '401437745', week: 3, home: 'SEA', away: 'ATL', homeScore: 23, awayScore: 27 },
  { id: '401437607', week: 3, home: 'TB', away: 'GB', homeScore: 12, awayScore: 14 },
  { id: '401437746', week: 3, home: 'DEN', away: 'SF', homeScore: 11, awayScore: 10 },
  { id: '401437747', week: 3, home: 'NYG', away: 'DAL', homeScore: 16, awayScore: 23 },

  // Week 4
  { id: '401437748', week: 4, home: 'CIN', away: 'MIA', homeScore: 27, awayScore: 15 },
  { id: '401435639', week: 4, home: 'NO', away: 'MIN', homeScore: 25, awayScore: 28 },
  { id: '401437749', week: 4, home: 'ATL', away: 'CLE', homeScore: 23, awayScore: 20 },
  { id: '401437751', week: 4, home: 'DAL', away: 'WSH', homeScore: 25, awayScore: 10 },
  { id: '401437752', week: 4, home: 'DET', away: 'SEA', homeScore: 45, awayScore: 48 },
  { id: '401437754', week: 4, home: 'IND', away: 'TEN', homeScore: 17, awayScore: 24 },
  { id: '401437755', week: 4, home: 'NYG', away: 'CHI', homeScore: 20, awayScore: 12 },
  { id: '401437756', week: 4, home: 'PHI', away: 'JAX', homeScore: 29, awayScore: 21 },
  { id: '401437757', week: 4, home: 'PIT', away: 'NYJ', homeScore: 20, awayScore: 24 },
  { id: '401437750', week: 4, home: 'BAL', away: 'BUF', homeScore: 20, awayScore: 23 },
  { id: '401437753', week: 4, home: 'HOU', away: 'LAC', homeScore: 24, awayScore: 34 },
  { id: '401437758', week: 4, home: 'CAR', away: 'ARI', homeScore: 16, awayScore: 26 },
  { id: '401437759', week: 4, home: 'GB', away: 'NE', homeScore: 27, awayScore: 24 },
  { id: '401437760', week: 4, home: 'LV', away: 'DEN', homeScore: 32, awayScore: 23 },
  { id: '401437470', week: 4, home: 'TB', away: 'KC', homeScore: 31, awayScore: 41 },
  { id: '401437761', week: 4, home: 'SF', away: 'LAR', homeScore: 24, awayScore: 9 },

  // Week 5
  { id: '401437762', week: 5, home: 'DEN', away: 'IND', homeScore: 9, awayScore: 12 },
  { id: '401435640', week: 5, home: 'GB', away: 'NYG', homeScore: 22, awayScore: 27 },
  { id: '401437763', week: 5, home: 'BUF', away: 'PIT', homeScore: 38, awayScore: 3 },
  { id: '401437764', week: 5, home: 'CLE', away: 'LAC', homeScore: 28, awayScore: 30 },
  { id: '401437766', week: 5, home: 'MIN', away: 'CHI', homeScore: 29, awayScore: 22 },
  { id: '401437767', week: 5, home: 'NE', away: 'DET', homeScore: 29, awayScore: 0 },
  { id: '401437768', week: 5, home: 'NO', away: 'SEA', homeScore: 39, awayScore: 32 },
  { id: '401437769', week: 5, home: 'NYJ', away: 'MIA', homeScore: 40, awayScore: 17 },
  { id: '401437770', week: 5, home: 'TB', away: 'ATL', homeScore: 21, awayScore: 15 },
  { id: '401437771', week: 5, home: 'WSH', away: 'TEN', homeScore: 17, awayScore: 21 },
  { id: '401437765', week: 5, home: 'JAX', away: 'HOU', homeScore: 6, awayScore: 13 },
  { id: '401437772', week: 5, home: 'CAR', away: 'SF', homeScore: 15, awayScore: 37 },
  { id: '401437774', week: 5, home: 'LAR', away: 'DAL', homeScore: 10, awayScore: 22 },
  { id: '401437773', week: 5, home: 'ARI', away: 'PHI', homeScore: 17, awayScore: 20 },
  { id: '401437775', week: 5, home: 'BAL', away: 'CIN', homeScore: 19, awayScore: 17 },
  { id: '401437776', week: 5, home: 'KC', away: 'LV', homeScore: 30, awayScore: 29 },

  // Week 6
  { id: '401437777', week: 6, home: 'CHI', away: 'WSH', homeScore: 7, awayScore: 12 },
  { id: '401437778', week: 6, home: 'ATL', away: 'SF', homeScore: 28, awayScore: 14 },
  { id: '401437779', week: 6, home: 'CLE', away: 'NE', homeScore: 15, awayScore: 38 },
  { id: '401437780', week: 6, home: 'GB', away: 'NYJ', homeScore: 10, awayScore: 27 },
  { id: '401437781', week: 6, home: 'IND', away: 'JAX', homeScore: 34, awayScore: 27 },
  { id: '401437782', week: 6, home: 'MIA', away: 'MIN', homeScore: 16, awayScore: 24 },
  { id: '401437783', week: 6, home: 'NO', away: 'CIN', homeScore: 26, awayScore: 30 },
  { id: '401437784', week: 6, home: 'NYG', away: 'BAL', homeScore: 24, awayScore: 20 },
  { id: '401437785', week: 6, home: 'PIT', away: 'TB', homeScore: 20, awayScore: 18 },
  { id: '401437786', week: 6, home: 'LAR', away: 'CAR', homeScore: 24, awayScore: 10 },
  { id: '401437787', week: 6, home: 'SEA', away: 'ARI', homeScore: 19, awayScore: 9 },
  { id: '401437788', week: 6, home: 'KC', away: 'BUF', homeScore: 20, awayScore: 24 },
  { id: '401437789', week: 6, home: 'PHI', away: 'DAL', homeScore: 26, awayScore: 17 },
  { id: '401437790', week: 6, home: 'LAC', away: 'DEN', homeScore: 19, awayScore: 16 },

  // Week 7
  { id: '401437791', week: 7, home: 'ARI', away: 'NO', homeScore: 42, awayScore: 34 },
  { id: '401437794', week: 7, home: 'CIN', away: 'ATL', homeScore: 35, awayScore: 17 },
  { id: '401437795', week: 7, home: 'DAL', away: 'DET', homeScore: 24, awayScore: 6 },
  { id: '401437797', week: 7, home: 'TEN', away: 'IND', homeScore: 19, awayScore: 10 },
  { id: '401437798', week: 7, home: 'WSH', away: 'GB', homeScore: 23, awayScore: 21 },
  { id: '401437793', week: 7, home: 'CAR', away: 'TB', homeScore: 21, awayScore: 3 },
  { id: '401437796', week: 7, home: 'JAX', away: 'NYG', homeScore: 17, awayScore: 23 },
  { id: '401437792', week: 7, home: 'BAL', away: 'CLE', homeScore: 23, awayScore: 20 },
  { id: '401437799', week: 7, home: 'DEN', away: 'NYJ', homeScore: 9, awayScore: 16 },
  { id: '401437800', week: 7, home: 'LV', away: 'HOU', homeScore: 38, awayScore: 20 },
  { id: '401437801', week: 7, home: 'LAC', away: 'SEA', homeScore: 23, awayScore: 37 },
  { id: '401437802', week: 7, home: 'SF', away: 'KC', homeScore: 23, awayScore: 44 },
  { id: '401437803', week: 7, home: 'MIA', away: 'PIT', homeScore: 16, awayScore: 10 },
  { id: '401437804', week: 7, home: 'NE', away: 'CHI', homeScore: 14, awayScore: 33 },

  // Week 8
  { id: '401437805', week: 8, home: 'TB', away: 'BAL', homeScore: 22, awayScore: 27 },
  { id: '401435641', week: 8, home: 'JAX', away: 'DEN', homeScore: 17, awayScore: 21 },
  { id: '401437806', week: 8, home: 'ATL', away: 'CAR', homeScore: 37, awayScore: 34 },
  { id: '401437807', week: 8, home: 'DAL', away: 'CHI', homeScore: 49, awayScore: 29 },
  { id: '401437808', week: 8, home: 'DET', away: 'MIA', homeScore: 27, awayScore: 31 },
  { id: '401437809', week: 8, home: 'MIN', away: 'ARI', homeScore: 34, awayScore: 26 },
  { id: '401437810', week: 8, home: 'NO', away: 'LV', homeScore: 24, awayScore: 0 },
  { id: '401437811', week: 8, home: 'NYJ', away: 'NE', homeScore: 17, awayScore: 22 },
  { id: '401437812', week: 8, home: 'PHI', away: 'PIT', homeScore: 35, awayScore: 13 },
  { id: '401437813', week: 8, home: 'HOU', away: 'TEN', homeScore: 10, awayScore: 17 },
  { id: '401437814', week: 8, home: 'IND', away: 'WSH', homeScore: 16, awayScore: 17 },
  { id: '401437815', week: 8, home: 'LAR', away: 'SF', homeScore: 14, awayScore: 31 },
  { id: '401437816', week: 8, home: 'SEA', away: 'NYG', homeScore: 27, awayScore: 13 },
  { id: '401437817', week: 8, home: 'BUF', away: 'GB', homeScore: 27, awayScore: 17 },
  { id: '401437818', week: 8, home: 'CLE', away: 'CIN', homeScore: 32, awayScore: 13 },

  // Week 9
  { id: '401437819', week: 9, home: 'HOU', away: 'PHI', homeScore: 17, awayScore: 29 },
  { id: '401437820', week: 9, home: 'ATL', away: 'LAC', homeScore: 17, awayScore: 20 },
  { id: '401437821', week: 9, home: 'CHI', away: 'MIA', homeScore: 32, awayScore: 35 },
  { id: '401437822', week: 9, home: 'CIN', away: 'CAR', homeScore: 42, awayScore: 21 },
  { id: '401437823', week: 9, home: 'DET', away: 'GB', homeScore: 15, awayScore: 9 },
  { id: '401437825', week: 9, home: 'NE', away: 'IND', homeScore: 26, awayScore: 3 },
  { id: '401437826', week: 9, home: 'NYJ', away: 'BUF', homeScore: 20, awayScore: 17 },
  { id: '401437827', week: 9, home: 'WSH', away: 'MIN', homeScore: 17, awayScore: 20 },
  { id: '401437824', week: 9, home: 'JAX', away: 'LV', homeScore: 27, awayScore: 20 },
  { id: '401437828', week: 9, home: 'ARI', away: 'SEA', homeScore: 21, awayScore: 31 },
  { id: '401437829', week: 9, home: 'TB', away: 'LAR', homeScore: 16, awayScore: 13 },
  { id: '401437830', week: 9, home: 'KC', away: 'TEN', homeScore: 20, awayScore: 17 },
  { id: '401437831', week: 9, home: 'NO', away: 'BAL', homeScore: 13, awayScore: 27 },

  // Week 10
  { id: '401437832', week: 10, home: 'CAR', away: 'ATL', homeScore: 25, awayScore: 15 },
  { id: '401435638', week: 10, home: 'TB', away: 'SEA', homeScore: 21, awayScore: 16 },
  { id: '401437833', week: 10, home: 'BUF', away: 'MIN', homeScore: 30, awayScore: 33 },
  { id: '401437834', week: 10, home: 'CHI', away: 'DET', homeScore: 30, awayScore: 31 },
  { id: '401437839', week: 10, home: 'TEN', away: 'DEN', homeScore: 17, awayScore: 10 },
  { id: '401437835', week: 10, home: 'KC', away: 'JAX', homeScore: 27, awayScore: 17 },
  { id: '401437836', week: 10, home: 'MIA', away: 'CLE', homeScore: 39, awayScore: 17 },
  { id: '401437837', week: 10, home: 'NYG', away: 'HOU', homeScore: 24, awayScore: 16 },
  { id: '401437838', week: 10, home: 'PIT', away: 'NO', homeScore: 20, awayScore: 10 },
  { id: '401437840', week: 10, home: 'LV', away: 'IND', homeScore: 20, awayScore: 25 },
  { id: '401437131', week: 10, home: 'GB', away: 'DAL', homeScore: 31, awayScore: 28 },
  { id: '401437841', week: 10, home: 'LAR', away: 'ARI', homeScore: 17, awayScore: 27 },
  { id: '401437842', week: 10, home: 'SF', away: 'LAC', homeScore: 22, awayScore: 16 },
  { id: '401437843', week: 10, home: 'PHI', away: 'WSH', homeScore: 21, awayScore: 32 },

  // Week 11
  { id: '401437844', week: 11, home: 'GB', away: 'TEN', homeScore: 17, awayScore: 27 },
  { id: '401437845', week: 11, home: 'ATL', away: 'CHI', homeScore: 27, awayScore: 24 },
  { id: '401437847', week: 11, home: 'BUF', away: 'CLE', homeScore: 31, awayScore: 23 },
  { id: '401437849', week: 11, home: 'IND', away: 'PHI', homeScore: 16, awayScore: 17 },
  { id: '401437850', week: 11, home: 'NE', away: 'NYJ', homeScore: 10, awayScore: 3 },
  { id: '401437851', week: 11, home: 'NO', away: 'LAR', homeScore: 27, awayScore: 20 },
  { id: '401437852', week: 11, home: 'NYG', away: 'DET', homeScore: 18, awayScore: 31 },
  { id: '401437846', week: 11, home: 'BAL', away: 'CAR', homeScore: 13, awayScore: 3 },
  { id: '401437848', week: 11, home: 'HOU', away: 'WSH', homeScore: 10, awayScore: 23 },
  { id: '401437853', week: 11, home: 'DEN', away: 'LV', homeScore: 16, awayScore: 22 },
  { id: '401437855', week: 11, home: 'MIN', away: 'DAL', homeScore: 3, awayScore: 40 },
  { id: '401437856', week: 11, home: 'PIT', away: 'CIN', homeScore: 30, awayScore: 37 },
  { id: '401437854', week: 11, home: 'LAC', away: 'KC', homeScore: 27, awayScore: 30 },
  { id: '401435642', week: 11, home: 'ARI', away: 'SF', homeScore: 10, awayScore: 38 },

  // Week 12
  { id: '401437857', week: 12, home: 'DET', away: 'BUF', homeScore: 25, awayScore: 28 },
  { id: '401437858', week: 12, home: 'DAL', away: 'NYG', homeScore: 28, awayScore: 20 },
  { id: '401437859', week: 12, home: 'MIN', away: 'NE', homeScore: 33, awayScore: 26 },
  { id: '401437861', week: 12, home: 'CLE', away: 'TB', homeScore: 23, awayScore: 17 },
  { id: '401437865', week: 12, home: 'TEN', away: 'CIN', homeScore: 16, awayScore: 20 },
  { id: '401437863', week: 12, home: 'MIA', away: 'HOU', homeScore: 30, awayScore: 15 },
  { id: '401437864', week: 12, home: 'NYJ', away: 'CHI', homeScore: 31, awayScore: 10 },
  { id: '401437866', week: 12, home: 'WSH', away: 'ATL', homeScore: 19, awayScore: 13 },
  { id: '401437860', week: 12, home: 'CAR', away: 'DEN', homeScore: 23, awayScore: 10 },
  { id: '401437862', week: 12, home: 'JAX', away: 'BAL', homeScore: 28, awayScore: 27 },
  { id: '401437867', week: 12, home: 'ARI', away: 'LAC', homeScore: 24, awayScore: 25 },
  { id: '401437868', week: 12, home: 'SEA', away: 'LV', homeScore: 34, awayScore: 40 },
  { id: '401437869', week: 12, home: 'KC', away: 'LAR', homeScore: 26, awayScore: 10 },
  { id: '401437870', week: 12, home: 'SF', away: 'NO', homeScore: 13, awayScore: 0 },
  { id: '401437871', week: 12, home: 'PHI', away: 'GB', homeScore: 40, awayScore: 33 },
  { id: '401437872', week: 12, home: 'IND', away: 'PIT', homeScore: 17, awayScore: 24 },

  // Week 13
  { id: '401437873', week: 13, home: 'NE', away: 'BUF', homeScore: 10, awayScore: 24 },
  { id: '401437874', week: 13, home: 'ATL', away: 'PIT', homeScore: 16, awayScore: 19 },
  { id: '401437876', week: 13, home: 'CHI', away: 'GB', homeScore: 19, awayScore: 28 },
  { id: '401437877', week: 13, home: 'DET', away: 'JAX', homeScore: 40, awayScore: 14 },
  { id: '401437879', week: 13, home: 'MIN', away: 'NYJ', homeScore: 27, awayScore: 22 },
  { id: '401437880', week: 13, home: 'NYG', away: 'WSH', homeScore: 20, awayScore: 20 },
  { id: '401437881', week: 13, home: 'PHI', away: 'TEN', homeScore: 35, awayScore: 10 },
  { id: '401437875', week: 13, home: 'BAL', away: 'DEN', homeScore: 10, awayScore: 9 },
  { id: '401437878', week: 13, home: 'HOU', away: 'CLE', homeScore: 14, awayScore: 27 },
  { id: '401437882', week: 13, home: 'LAR', away: 'SEA', homeScore: 23, awayScore: 27 },
  { id: '401437883', week: 13, home: 'SF', away: 'MIA', homeScore: 33, awayScore: 17 },
  { id: '401437884', week: 13, home: 'CIN', away: 'KC', homeScore: 27, awayScore: 24 },
  { id: '401437885', week: 13, home: 'LV', away: 'LAC', homeScore: 27, awayScore: 20 },
  { id: '401437886', week: 13, home: 'DAL', away: 'IND', homeScore: 54, awayScore: 19 },
  { id: '401437887', week: 13, home: 'TB', away: 'NO', homeScore: 17, awayScore: 16 },

  // Week 14
  { id: '401437888', week: 14, home: 'LAR', away: 'LV', homeScore: 17, awayScore: 16 },
  { id: '401437889', week: 14, home: 'BUF', away: 'NYJ', homeScore: 20, awayScore: 12 },
  { id: '401437890', week: 14, home: 'CIN', away: 'CLE', homeScore: 23, awayScore: 10 },
  { id: '401437891', week: 14, home: 'DAL', away: 'HOU', homeScore: 27, awayScore: 23 },
  { id: '401437892', week: 14, home: 'DET', away: 'MIN', homeScore: 34, awayScore: 23 },
  { id: '401437895', week: 14, home: 'TEN', away: 'JAX', homeScore: 22, awayScore: 36 },
  { id: '401437893', week: 14, home: 'NYG', away: 'PHI', homeScore: 22, awayScore: 48 },
  { id: '401437894', week: 14, home: 'PIT', away: 'BAL', homeScore: 14, awayScore: 16 },
  { id: '401437899', week: 14, home: 'DEN', away: 'KC', homeScore: 28, awayScore: 34 },
  { id: '401437897', week: 14, home: 'SF', away: 'TB', homeScore: 35, awayScore: 7 },
  { id: '401437898', week: 14, home: 'SEA', away: 'CAR', homeScore: 24, awayScore: 30 },
  { id: '401437896', week: 14, home: 'LAC', away: 'MIA', homeScore: 23, awayScore: 17 },
  { id: '401437900', week: 14, home: 'ARI', away: 'NE', homeScore: 13, awayScore: 27 },

  // Week 15
  { id: '401437901', week: 15, home: 'SEA', away: 'SF', homeScore: 13, awayScore: 21 },
  { id: '401437904', week: 15, home: 'MIN', away: 'IND', homeScore: 39, awayScore: 36 },
  { id: '401437903', week: 15, home: 'CLE', away: 'BAL', homeScore: 13, awayScore: 3 },
  { id: '401437902', week: 15, home: 'BUF', away: 'MIA', homeScore: 32, awayScore: 29 },
  { id: '401437908', week: 15, home: 'CHI', away: 'PHI', homeScore: 20, awayScore: 25 },
  { id: '401437905', week: 15, home: 'NO', away: 'ATL', homeScore: 21, awayScore: 18 },
  { id: '401437911', week: 15, home: 'NYJ', away: 'DET', homeScore: 17, awayScore: 20 },
  { id: '401437907', week: 15, home: 'CAR', away: 'PIT', homeScore: 16, awayScore: 24 },
  { id: '401437910', week: 15, home: 'JAX', away: 'DAL', homeScore: 40, awayScore: 34 },
  { id: '401437909', week: 15, home: 'HOU', away: 'KC', homeScore: 24, awayScore: 30 },
  { id: '401437912', week: 15, home: 'DEN', away: 'ARI', homeScore: 24, awayScore: 15 },
  { id: '401437915', week: 15, home: 'LV', away: 'NE', homeScore: 30, awayScore: 24 },
  { id: '401437913', week: 15, home: 'LAC', away: 'TEN', homeScore: 17, awayScore: 14 },
  { id: '401437914', week: 15, home: 'TB', away: 'CIN', homeScore: 23, awayScore: 34 },
  { id: '401437906', week: 15, home: 'WSH', away: 'NYG', homeScore: 12, awayScore: 20 },
  { id: '401437916', week: 15, home: 'GB', away: 'LAR', homeScore: 24, awayScore: 12 },

  // Week 16
  { id: '401437917', week: 16, home: 'NYJ', away: 'JAX', homeScore: 3, awayScore: 19 },
  { id: '401437920', week: 16, home: 'CHI', away: 'BUF', homeScore: 13, awayScore: 35 },
  { id: '401437921', week: 16, home: 'CLE', away: 'NO', homeScore: 10, awayScore: 17 },
  { id: '401437922', week: 16, home: 'KC', away: 'SEA', homeScore: 24, awayScore: 10 },
  { id: '401437923', week: 16, home: 'MIN', away: 'NYG', homeScore: 27, awayScore: 24 },
  { id: '401437924', week: 16, home: 'NE', away: 'CIN', homeScore: 18, awayScore: 22 },
  { id: '401437919', week: 16, home: 'CAR', away: 'DET', homeScore: 37, awayScore: 23 },
  { id: '401437918', week: 16, home: 'BAL', away: 'ATL', homeScore: 17, awayScore: 9 },
  { id: '401437925', week: 16, home: 'TEN', away: 'HOU', homeScore: 14, awayScore: 19 },
  { id: '401437926', week: 16, home: 'SF', away: 'WSH', homeScore: 37, awayScore: 20 },
  { id: '401437927', week: 16, home: 'DAL', away: 'PHI', homeScore: 40, awayScore: 34 },
  { id: '401437928', week: 16, home: 'PIT', away: 'LV', homeScore: 13, awayScore: 10 },
  { id: '401437929', week: 16, home: 'MIA', away: 'GB', homeScore: 20, awayScore: 26 },
  { id: '401436983', week: 16, home: 'LAR', away: 'DEN', homeScore: 51, awayScore: 14 },
  { id: '401437930', week: 16, home: 'ARI', away: 'TB', homeScore: 16, awayScore: 19 },
  { id: '401437931', week: 16, home: 'IND', away: 'LAC', homeScore: 3, awayScore: 20 },

  // Week 17
  { id: '401437932', week: 17, home: 'TEN', away: 'DAL', homeScore: 13, awayScore: 27 },
  { id: '401437933', week: 17, home: 'ATL', away: 'ARI', homeScore: 20, awayScore: 19 },
  { id: '401437935', week: 17, home: 'DET', away: 'CHI', homeScore: 41, awayScore: 10 },
  { id: '401437937', week: 17, home: 'KC', away: 'DEN', homeScore: 27, awayScore: 24 },
  { id: '401437938', week: 17, home: 'NE', away: 'MIA', homeScore: 23, awayScore: 21 },
  { id: '401437939', week: 17, home: 'NYG', away: 'IND', homeScore: 38, awayScore: 10 },
  { id: '401437940', week: 17, home: 'PHI', away: 'NO', homeScore: 10, awayScore: 20 },
  { id: '401437941', week: 17, home: 'TB', away: 'CAR', homeScore: 30, awayScore: 24 },
  { id: '401437942', week: 17, home: 'WSH', away: 'CLE', homeScore: 10, awayScore: 24 },
  { id: '401437936', week: 17, home: 'HOU', away: 'JAX', homeScore: 3, awayScore: 31 },
  { id: '401437943', week: 17, home: 'LV', away: 'SF', homeScore: 34, awayScore: 37 },
  { id: '401437944', week: 17, home: 'SEA', away: 'NYJ', homeScore: 23, awayScore: 6 },
  { id: '401437945', week: 17, home: 'GB', away: 'MIN', homeScore: 41, awayScore: 17 },
  { id: '401437946', week: 17, home: 'LAC', away: 'LAR', homeScore: 31, awayScore: 10 },
  { id: '401437934', week: 17, home: 'BAL', away: 'PIT', homeScore: 13, awayScore: 16 },
  // Cancelled game - Damar Hamlin cardiac arrest
  { id: '401437947', week: 17, home: 'CIN', away: 'BUF', homeScore: 0, awayScore: 0 },

  // Week 18
  { id: '401437961', week: 18, home: 'LV', away: 'KC', homeScore: 13, awayScore: 31 },
  { id: '401437954', week: 18, home: 'JAX', away: 'TEN', homeScore: 20, awayScore: 16 },
  { id: '401437948', week: 18, home: 'ATL', away: 'TB', homeScore: 30, awayScore: 17 },
  { id: '401437949', week: 18, home: 'BUF', away: 'NE', homeScore: 35, awayScore: 23 },
  { id: '401437950', week: 18, home: 'CHI', away: 'MIN', homeScore: 13, awayScore: 29 },
  { id: '401437951', week: 18, home: 'CIN', away: 'BAL', homeScore: 27, awayScore: 16 },
  { id: '401437953', week: 18, home: 'IND', away: 'HOU', homeScore: 31, awayScore: 32 },
  { id: '401437955', week: 18, home: 'MIA', away: 'NYJ', homeScore: 11, awayScore: 6 },
  { id: '401437956', week: 18, home: 'NO', away: 'CAR', homeScore: 7, awayScore: 10 },
  { id: '401437958', week: 18, home: 'PIT', away: 'CLE', homeScore: 28, awayScore: 14 },
  { id: '401437960', week: 18, home: 'DEN', away: 'LAC', homeScore: 31, awayScore: 28 },
  { id: '401437957', week: 18, home: 'PHI', away: 'NYG', homeScore: 22, awayScore: 16 },
  { id: '401437962', week: 18, home: 'SF', away: 'ARI', homeScore: 38, awayScore: 13 },
  { id: '401437963', week: 18, home: 'SEA', away: 'LAR', homeScore: 19, awayScore: 16 },
  { id: '401437959', week: 18, home: 'WSH', away: 'DAL', homeScore: 26, awayScore: 6 },
  { id: '401437952', week: 18, home: 'GB', away: 'DET', homeScore: 16, awayScore: 20 },
];

// Full AFC conference standings per ESPN (2022 had cancelled CIN-BUF game)
export const EXPECTED_2022_AFC_SEEDINGS = {
  1: { teamId: '14', name: 'Chiefs', record: '14-3', division: 'AFC West' },
  2: { teamId: '1', name: 'Bills', record: '13-3', division: 'AFC East' },
  3: { teamId: '6', name: 'Bengals', record: '12-4', division: 'AFC North' },
  4: { teamId: '11', name: 'Jaguars', record: '9-8', division: 'AFC South' },
  5: { teamId: '16', name: 'Chargers', record: '10-7', division: 'AFC West' },
  6: { teamId: '5', name: 'Ravens', record: '10-7', division: 'AFC North' },
  7: { teamId: '2', name: 'Dolphins', record: '9-8', division: 'AFC East' },
  8: { teamId: '8', name: 'Steelers', record: '9-8', division: 'AFC North' },
  9: { teamId: '3', name: 'Patriots', record: '8-9', division: 'AFC East' },
  10: { teamId: '4', name: 'Jets', record: '7-10', division: 'AFC East' },
  11: { teamId: '12', name: 'Titans', record: '7-10', division: 'AFC South' },
  12: { teamId: '7', name: 'Browns', record: '7-10', division: 'AFC North' },
  13: { teamId: '15', name: 'Raiders', record: '6-11', division: 'AFC West' },
  14: { teamId: '13', name: 'Broncos', record: '5-12', division: 'AFC West' },
  15: { teamId: '10', name: 'Colts', record: '4-12-1', division: 'AFC South' },
  16: { teamId: '9', name: 'Texans', record: '3-13-1', division: 'AFC South' },
};

// Full NFC conference standings per ESPN
export const EXPECTED_2022_NFC_SEEDINGS = {
  1: { teamId: '19', name: 'Eagles', record: '14-3', division: 'NFC East' },
  2: { teamId: '31', name: '49ers', record: '13-4', division: 'NFC West' },
  3: { teamId: '24', name: 'Vikings', record: '13-4', division: 'NFC North' },
  4: { teamId: '28', name: 'Buccaneers', record: '8-9', division: 'NFC South' },
  5: { teamId: '17', name: 'Cowboys', record: '12-5', division: 'NFC East' },
  6: { teamId: '18', name: 'Giants', record: '9-7-1', division: 'NFC East' },
  7: { teamId: '32', name: 'Seahawks', record: '9-8', division: 'NFC West' },
  8: { teamId: '22', name: 'Lions', record: '9-8', division: 'NFC North' },
  9: { teamId: '20', name: 'Commanders', record: '8-8-1', division: 'NFC East' },
  10: { teamId: '23', name: 'Packers', record: '8-9', division: 'NFC North' },
  11: { teamId: '26', name: 'Panthers', record: '7-10', division: 'NFC South' },
  12: { teamId: '27', name: 'Saints', record: '7-10', division: 'NFC South' },
  13: { teamId: '25', name: 'Falcons', record: '7-10', division: 'NFC South' },
  14: { teamId: '30', name: 'Rams', record: '5-12', division: 'NFC West' },
  15: { teamId: '29', name: 'Cardinals', record: '4-13', division: 'NFC West' },
  16: { teamId: '21', name: 'Bears', record: '3-14', division: 'NFC North' },
};

/**
 * Helper to convert fixture data to Game objects for testing
 */
export function fixture2022ToGames() {
  const { teams } = require('@/data/teams');
  const { espnAbbreviationToTeamId } = require('@/data/teams');

  return SEASON_2022_GAMES.map(g => {
    const homeTeamId = espnAbbreviationToTeamId[g.home];
    const awayTeamId = espnAbbreviationToTeamId[g.away];
    const homeTeam = teams.find((t: { id: string }) => t.id === homeTeamId);
    const awayTeam = teams.find((t: { id: string }) => t.id === awayTeamId);

    return {
      id: g.id,
      week: g.week,
      homeTeam,
      awayTeam,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      completed: g.homeScore !== null && g.awayScore !== null,
      isTie: g.homeScore === g.awayScore && g.homeScore !== null,
    };
  });
}
