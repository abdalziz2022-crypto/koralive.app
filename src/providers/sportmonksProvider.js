/**
 * Provider representing the Sportmonks API v3 structures.
 * Supports direct dynamic fetch calls with Sportmonks token configurations
 * and provides responsive structural nesting (under 'data' key) of football assets.
 */

import { mockMatches, mockLeagues } from '../lib/mockData';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const BASE_URL = 'https://api.sportmonks.com/v3/football';
const API_TOKEN = import.meta.env.VITE_SPORTMONKS_API_KEY || '';

export const sportmonksProvider = {
  name: 'sportmonks',

  async getMatches() {
    if (API_TOKEN) {
      try {
        const res = await fetch(`${BASE_URL}/fixtures?api_token=${API_TOKEN}&include=participants,scores,league`);
        if (res.ok) {
          const data = await res.json();
          return data.data || [];
        }
      } catch (err) {
        console.error('Sportmonks API live getMatches failed:', err);
      }
    }

    // High fidelity Sportmonks simulated structure fallback (data field)
    let systemMatches = mockMatches;
    try {
      const snap = await getDocs(collection(db, 'matches'));
      if (!snap.empty) {
        systemMatches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (_) {}

    return systemMatches.map((m, idx) => ({
      id: m.id || `sm-${idx}`,
      name: `${m.homeTeam} vs ${m.awayTeam}`,
      starting_at: m.startTime || new Date().toISOString(),
      state: { short_name: m.status },
      minute: m.minute || null,
      participants: [
        { id: idx * 2 + 1, name: m.homeTeam, image_path: m.homeLogo, meta: { location: 'home' } },
        { id: idx * 2 + 2, name: m.awayTeam, image_path: m.awayLogo, meta: { location: 'away' } }
      ],
      scores: [
        { participant_id: idx * 2 + 1, score: { goals: m.homeScore }, description: 'CURRENT' },
        { participant_id: idx * 2 + 2, score: { goals: m.awayScore }, description: 'CURRENT' }
      ],
      league: {
        name: m.league,
        image_path: m.leagueLogo
      }
    }));
  },

  async getMatch(id) {
    const rawId = String(id).replace('sm-', '');

    if (API_TOKEN) {
      try {
        const res = await fetch(`${BASE_URL}/fixtures/${rawId}?api_token=${API_TOKEN}&include=participants,scores,league`);
        if (res.ok) {
          const data = await res.json();
          return data.data;
        }
      } catch (err) {
        console.error(`Sportmonks API live getMatch(${id}) error:`, err);
      }
    }

    // Simulated specific match
    const foundMatch = mockMatches.find(m => String(m.id) === String(rawId)) || mockMatches[0];
    return {
      id: `sm-${foundMatch.id}`,
      name: `${foundMatch.homeTeam} vs ${foundMatch.awayTeam}`,
      starting_at: foundMatch.startTime,
      state: { short_name: foundMatch.status },
      minute: foundMatch.minute,
      participants: [
        { id: 101, name: foundMatch.homeTeam, image_path: foundMatch.homeLogo, meta: { location: 'home' } },
        { id: 102, name: foundMatch.awayTeam, image_path: foundMatch.awayLogo, meta: { location: 'away' } }
      ],
      scores: [
        { participant_id: 101, score: { goals: foundMatch.homeScore }, description: 'CURRENT' },
        { participant_id: 102, score: { goals: foundMatch.awayScore }, description: 'CURRENT' }
      ],
      league: {
        name: foundMatch.league,
        image_path: foundMatch.leagueLogo
      }
    };
  },

  async getStandings(leagueId) {
    if (API_TOKEN) {
      try {
        const res = await fetch(`${BASE_URL}/standings/live/leagues/${leagueId}?api_token=${API_TOKEN}&include=team`);
        if (res.ok) {
          const data = await res.json();
          return data.data || [];
        }
      } catch (err) {
        console.error(`Sportmonks API live getStandings(${leagueId}) error:`, err);
      }
    }

    // High fidelity mock standings list inside 'data' nesting
    const mockStandings = [
      {
        position: 1,
        team_id: 501,
        points: 85,
        team: { name: 'الهلال', image_path: 'https://api.dicebear.com/7.x/initials/svg?seed=Hilal' },
        overall: { games_played: 30, won: 27, drawn: 2, lost: 1, goals_difference: 43, goals_for: 75, goals_against: 32 }
      },
      {
        position: 2,
        team_id: 502,
        points: 74,
        team: { name: 'النصر', image_path: 'https://api.dicebear.com/7.x/initials/svg?seed=Nassr' },
        overall: { games_played: 30, won: 23, drawn: 5, lost: 2, goals_difference: 31, goals_for: 68, goals_against: 37 }
      },
      {
        position: 3,
        team_id: 503,
        points: 62,
        team: { name: 'الأهلي', image_path: 'https://api.dicebear.com/7.x/initials/svg?seed=Ahli' },
        overall: { games_played: 30, won: 19, drawn: 5, lost: 6, goals_difference: 19, goals_for: 55, goals_against: 36 }
      }
    ];

    return { data: mockStandings };
  },

  async getTeam(id) {
    if (API_TOKEN) {
      try {
        const res = await fetch(`${BASE_URL}/teams/${id}?api_token=${API_TOKEN}&include=country,venue`);
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch (err) {
        console.error(`Sportmonks API live getTeam(${id}) error:`, err);
      }
    }

    return {
      data: {
        id: id,
        name: decodeURIComponent(id),
        image_path: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(id)}`,
        country: { name: 'السعودية' },
        venue: { name: 'استاد الملك فهد الدولي 🏟️' }
      }
    };
  },

  async getLeague(id) {
    if (API_TOKEN) {
      try {
        const res = await fetch(`${BASE_URL}/leagues/${id}?api_token=${API_TOKEN}`);
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch (err) {
        console.error(`Sportmonks API live getLeague(${id}) error:`, err);
      }
    }

    const decodedName = decodeURIComponent(id);
    return {
      data: {
        id: id,
        name: decodedName,
        image_path: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(decodedName)}`
      }
    };
  }
};
