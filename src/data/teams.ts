import type { Team, Division, Conference } from '@/types';

// All 32 NFL teams with their data
export const teams: Team[] = [
  // AFC East
  {
    id: '1',
    name: 'Bills',
    abbreviation: 'BUF',
    location: 'Buffalo',
    division: 'AFC East',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png',
    primaryColor: '#00338D',
    secondaryColor: '#C60C30'
  },
  {
    id: '2',
    name: 'Dolphins',
    abbreviation: 'MIA',
    location: 'Miami',
    division: 'AFC East',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png',
    primaryColor: '#008E97',
    secondaryColor: '#FC4C02'
  },
  {
    id: '3',
    name: 'Patriots',
    abbreviation: 'NE',
    location: 'New England',
    division: 'AFC East',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png',
    primaryColor: '#002244',
    secondaryColor: '#C60C30'
  },
  {
    id: '4',
    name: 'Jets',
    abbreviation: 'NYJ',
    location: 'New York',
    division: 'AFC East',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png',
    primaryColor: '#125740',
    secondaryColor: '#000000'
  },
  // AFC North
  {
    id: '5',
    name: 'Ravens',
    abbreviation: 'BAL',
    location: 'Baltimore',
    division: 'AFC North',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png',
    primaryColor: '#241773',
    secondaryColor: '#9E7C0C'
  },
  {
    id: '6',
    name: 'Bengals',
    abbreviation: 'CIN',
    location: 'Cincinnati',
    division: 'AFC North',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png',
    primaryColor: '#FB4F14',
    secondaryColor: '#000000'
  },
  {
    id: '7',
    name: 'Browns',
    abbreviation: 'CLE',
    location: 'Cleveland',
    division: 'AFC North',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png',
    primaryColor: '#311D00',
    secondaryColor: '#FF3C00'
  },
  {
    id: '8',
    name: 'Steelers',
    abbreviation: 'PIT',
    location: 'Pittsburgh',
    division: 'AFC North',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png',
    primaryColor: '#FFB612',
    secondaryColor: '#101820'
  },
  // AFC South
  {
    id: '9',
    name: 'Texans',
    abbreviation: 'HOU',
    location: 'Houston',
    division: 'AFC South',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png',
    primaryColor: '#03202F',
    secondaryColor: '#A71930'
  },
  {
    id: '10',
    name: 'Colts',
    abbreviation: 'IND',
    location: 'Indianapolis',
    division: 'AFC South',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png',
    primaryColor: '#002C5F',
    secondaryColor: '#A2AAAD'
  },
  {
    id: '11',
    name: 'Jaguars',
    abbreviation: 'JAX',
    location: 'Jacksonville',
    division: 'AFC South',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png',
    primaryColor: '#006778',
    secondaryColor: '#D7A22A'
  },
  {
    id: '12',
    name: 'Titans',
    abbreviation: 'TEN',
    location: 'Tennessee',
    division: 'AFC South',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png',
    primaryColor: '#0C2340',
    secondaryColor: '#4B92DB'
  },
  // AFC West
  {
    id: '13',
    name: 'Broncos',
    abbreviation: 'DEN',
    location: 'Denver',
    division: 'AFC West',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png',
    primaryColor: '#FB4F14',
    secondaryColor: '#002244'
  },
  {
    id: '14',
    name: 'Chiefs',
    abbreviation: 'KC',
    location: 'Kansas City',
    division: 'AFC West',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png',
    primaryColor: '#E31837',
    secondaryColor: '#FFB81C'
  },
  {
    id: '15',
    name: 'Raiders',
    abbreviation: 'LV',
    location: 'Las Vegas',
    division: 'AFC West',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png',
    primaryColor: '#000000',
    secondaryColor: '#A5ACAF'
  },
  {
    id: '16',
    name: 'Chargers',
    abbreviation: 'LAC',
    location: 'Los Angeles',
    division: 'AFC West',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png',
    primaryColor: '#0080C6',
    secondaryColor: '#FFC20E'
  },
  // NFC East
  {
    id: '17',
    name: 'Cowboys',
    abbreviation: 'DAL',
    location: 'Dallas',
    division: 'NFC East',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png',
    primaryColor: '#003594',
    secondaryColor: '#869397'
  },
  {
    id: '18',
    name: 'Giants',
    abbreviation: 'NYG',
    location: 'New York',
    division: 'NFC East',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png',
    primaryColor: '#0B2265',
    secondaryColor: '#A71930'
  },
  {
    id: '19',
    name: 'Eagles',
    abbreviation: 'PHI',
    location: 'Philadelphia',
    division: 'NFC East',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png',
    primaryColor: '#004C54',
    secondaryColor: '#A5ACAF'
  },
  {
    id: '20',
    name: 'Commanders',
    abbreviation: 'WSH',
    location: 'Washington',
    division: 'NFC East',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png',
    primaryColor: '#5A1414',
    secondaryColor: '#FFB612'
  },
  // NFC North
  {
    id: '21',
    name: 'Bears',
    abbreviation: 'CHI',
    location: 'Chicago',
    division: 'NFC North',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png',
    primaryColor: '#0B162A',
    secondaryColor: '#C83803'
  },
  {
    id: '22',
    name: 'Lions',
    abbreviation: 'DET',
    location: 'Detroit',
    division: 'NFC North',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png',
    primaryColor: '#0076B6',
    secondaryColor: '#B0B7BC'
  },
  {
    id: '23',
    name: 'Packers',
    abbreviation: 'GB',
    location: 'Green Bay',
    division: 'NFC North',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png',
    primaryColor: '#203731',
    secondaryColor: '#FFB612'
  },
  {
    id: '24',
    name: 'Vikings',
    abbreviation: 'MIN',
    location: 'Minnesota',
    division: 'NFC North',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png',
    primaryColor: '#4F2683',
    secondaryColor: '#FFC62F'
  },
  // NFC South
  {
    id: '25',
    name: 'Falcons',
    abbreviation: 'ATL',
    location: 'Atlanta',
    division: 'NFC South',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png',
    primaryColor: '#A71930',
    secondaryColor: '#000000'
  },
  {
    id: '26',
    name: 'Panthers',
    abbreviation: 'CAR',
    location: 'Carolina',
    division: 'NFC South',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png',
    primaryColor: '#0085CA',
    secondaryColor: '#101820'
  },
  {
    id: '27',
    name: 'Saints',
    abbreviation: 'NO',
    location: 'New Orleans',
    division: 'NFC South',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png',
    primaryColor: '#D3BC8D',
    secondaryColor: '#101820'
  },
  {
    id: '28',
    name: 'Buccaneers',
    abbreviation: 'TB',
    location: 'Tampa Bay',
    division: 'NFC South',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png',
    primaryColor: '#D50A0A',
    secondaryColor: '#34302B'
  },
  // NFC West
  {
    id: '29',
    name: 'Cardinals',
    abbreviation: 'ARI',
    location: 'Arizona',
    division: 'NFC West',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png',
    primaryColor: '#97233F',
    secondaryColor: '#000000'
  },
  {
    id: '30',
    name: 'Rams',
    abbreviation: 'LAR',
    location: 'Los Angeles',
    division: 'NFC West',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png',
    primaryColor: '#003594',
    secondaryColor: '#FFA300'
  },
  {
    id: '31',
    name: '49ers',
    abbreviation: 'SF',
    location: 'San Francisco',
    division: 'NFC West',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png',
    primaryColor: '#AA0000',
    secondaryColor: '#B3995D'
  },
  {
    id: '32',
    name: 'Seahawks',
    abbreviation: 'SEA',
    location: 'Seattle',
    division: 'NFC West',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png',
    primaryColor: '#002244',
    secondaryColor: '#69BE28'
  }
];

// Helper functions
export const getTeamById = (id: string): Team | undefined =>
  teams.find(team => team.id === id);

export const getTeamByAbbreviation = (abbr: string): Team | undefined =>
  teams.find(team => team.abbreviation === abbr.toUpperCase());

export const getTeamsByDivision = (division: Division): Team[] =>
  teams.filter(team => team.division === division);

export const getTeamsByConference = (conference: Conference): Team[] =>
  teams.filter(team => team.conference === conference);

export const divisions: Division[] = [
  'AFC East', 'AFC North', 'AFC South', 'AFC West',
  'NFC East', 'NFC North', 'NFC South', 'NFC West'
];

export const conferences: Conference[] = ['AFC', 'NFC'];

// ESPN team ID mapping (ESPN uses different IDs)
export const espnTeamIdMap: Record<string, string> = {
  '1': 'buf', '2': 'mia', '3': 'ne', '4': 'nyj',
  '5': 'bal', '6': 'cin', '7': 'cle', '8': 'pit',
  '9': 'hou', '10': 'ind', '11': 'jax', '12': 'ten',
  '13': 'den', '14': 'kc', '15': 'lv', '16': 'lac',
  '17': 'dal', '18': 'nyg', '19': 'phi', '20': 'wsh',
  '21': 'chi', '22': 'det', '23': 'gb', '24': 'min',
  '25': 'atl', '26': 'car', '27': 'no', '28': 'tb',
  '29': 'ari', '30': 'lar', '31': 'sf', '32': 'sea'
};

// Reverse mapping for ESPN API responses
export const espnAbbreviationToTeamId: Record<string, string> = {
  'BUF': '1', 'MIA': '2', 'NE': '3', 'NYJ': '4',
  'BAL': '5', 'CIN': '6', 'CLE': '7', 'PIT': '8',
  'HOU': '9', 'IND': '10', 'JAX': '11', 'TEN': '12',
  'DEN': '13', 'KC': '14', 'LV': '15', 'LAC': '16',
  'DAL': '17', 'NYG': '18', 'PHI': '19', 'WSH': '20',
  'CHI': '21', 'DET': '22', 'GB': '23', 'MIN': '24',
  'ATL': '25', 'CAR': '26', 'NO': '27', 'TB': '28',
  'ARI': '29', 'LAR': '30', 'SF': '31', 'SEA': '32'
};
