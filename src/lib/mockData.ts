import { Match, League } from '../types';

export const mockMatches: Match[] = [
  {
    id: 'm1',
    homeTeam: 'ريال مدريد',
    awayTeam: 'برشلونة',
    homeLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=RM',
    awayLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=FCB',
    homeScore: 2,
    awayScore: 1,
    status: 'LIVE',
    league: 'الدوري الإسباني',
    leagueLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=Liga',
    startTime: new Date().toISOString(),
    minute: 74,
    streamingLinks: [
      { label: 'سيرفر 1', url: 'https://test-streams.mux.dev/x36xhzz/main.m3u8', quality: '1080p' },
      { label: 'سيرفر 2', url: 'https://test-streams.mux.dev/x36xhzz/main.m3u8', quality: '720p' }
    ],
    commentator: 'عصام الشوالي',
    channel: 'beIN Sports 1'
  },
  {
    id: 'm2',
    homeTeam: 'الهلال',
    awayTeam: 'النصر',
    homeLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=HIL',
    awayLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=NAS',
    homeScore: 0,
    awayScore: 0,
    status: 'UPCOMING',
    league: 'الدوري السعودي',
    leagueLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=SPL',
    startTime: new Date(Date.now() + 3600000).toISOString(),
    streamingLinks: [],
    commentator: 'فهد العتيبي',
    channel: 'SSC 1'
  },
  {
    id: 'm3',
    homeTeam: 'ليفربول',
    awayTeam: 'مانشستر سيتي',
    homeLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=LIV',
    awayLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=MCI',
    homeScore: 3,
    awayScore: 3,
    status: 'FINISHED',
    league: 'الدوري الإنجليزي',
    leagueLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=PL',
    startTime: new Date(Date.now() - 86400000).toISOString(),
    streamingLinks: [],
    commentator: 'حفيظ دراجي',
    channel: 'beIN Sports 2'
  }
];

export const mockLeagues: League[] = [
  { id: 'l1', name: 'الدوري الإسباني', country: 'Spain', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=Liga' },
  { id: 'l2', name: 'الدوري السعودي', country: 'Saudi Arabia', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=SPL' },
  { id: 'l3', name: 'الدوري الإنجليزي', country: 'England', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=PL' },
  { id: 'l4', name: 'دوري أبطال أوروبا', country: 'Europe', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UCL' }
];
