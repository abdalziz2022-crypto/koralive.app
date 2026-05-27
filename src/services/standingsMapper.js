export function mapLeagueStandings(rawResponse, homeTeam, awayTeam) {
  // Check if rawResponse returns standings list arrays from API
  if (rawResponse && rawResponse.standings && Array.isArray(rawResponse.standings)) {
    // Look for overall/TOTAL standings or pick the first available block
    const totalStanding = rawResponse.standings.find(s => s.type === 'TOTAL') || rawResponse.standings[0];
    if (totalStanding && totalStanding.table && Array.isArray(totalStanding.table)) {
      return totalStanding.table.map(row => {
        // Parse form: often looks like "W,D,W,L,W" from API
        let rawForm = row.form || '';
        if (typeof rawForm === 'string') {
          rawForm = rawForm.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
        }
        if (!Array.isArray(rawForm)) {
          rawForm = [];
        }

        // Check if team is part of the active match
        const isHome = homeTeam && (row.team?.id === homeTeam.id || row.team?.name === homeTeam.name || row.team?.shortName === homeTeam.name);
        const isAway = awayTeam && (row.team?.id === awayTeam.id || row.team?.name === awayTeam.name || row.team?.shortName === awayTeam.name);

        return {
          rank: row.position || 0,
          teamName: row.team?.shortName || row.team?.name || 'فريق رياضي',
          teamCrest: row.team?.crest || '',
          played: row.playedGames || 0,
          won: row.won || 0,
          draw: row.draw || 0,
          lost: row.lost || 0,
          gd: row.goalDifference !== undefined ? (row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference) : '0',
          points: row.points || 0,
          form: rawForm.slice(0, 5), // last 5 games
          isFeatured: !!(isHome || isAway)
        };
      });
    }
  }

  // Fallback state: Generate highly detailed and balanced mock standings 
  // with exact highlight support for the active playing teams
  const tableData = [];
  const homeName = homeTeam?.name || "صاحب الأرض";
  const awayName = awayTeam?.name || "الفريق الضيف";
  const homeCrest = homeTeam?.crest || "";
  const awayCrest = awayTeam?.crest || "";

  const teamsPreset = [
    { rank: 1, name: homeName, crest: homeCrest, isFeatured: true, won: 25, draw: 5, lost: 4, form: ['W', 'W', 'D', 'W', 'W'] },
    { rank: 2, name: awayName, crest: awayCrest, isFeatured: true, won: 23, draw: 6, lost: 5, form: ['W', 'D', 'W', 'L', 'W'] },
    { rank: 3, name: "ريال مدريد الإسباني", crest: "https://crests.thesportsdb.com/images/media/league/badge/765h6f1556012351.png", won: 21, draw: 8, lost: 5, form: ['W', 'W', 'L', 'W', 'D'] },
    { rank: 4, name: "بايرن ميونخ الألماني", crest: "", won: 19, draw: 8, lost: 7, form: ['L', 'W', 'W', 'D', 'W'] },
    { rank: 5, name: "باريس سان جيرمان", crest: "", won: 18, draw: 9, lost: 7, form: ['D', 'W', 'L', 'W', 'L'] },
    { rank: 6, name: "يوفنتوس تورينو الإيطالي", crest: "", won: 16, draw: 11, lost: 7, form: ['D', 'D', 'W', 'L', 'W'] },
    { rank: 7, name: "ميلان الإيطالي العريق", crest: "", won: 15, draw: 10, lost: 9, form: ['W', 'L', 'W', 'D', 'L'] },
    { rank: 8, name: "أتلتيكو مدريد الرياضي", crest: "", won: 14, draw: 11, lost: 9, form: ['L', 'W', 'D', 'W', 'D'] },
    { rank: 9, name: "بوروسيا دورتموند الألماني", crest: "", won: 13, draw: 12, lost: 9, form: ['D', 'L', 'L', 'W', 'W'] },
    { rank: 10, name: "سبورتينغ لشبونة البرتغالي", crest: "", won: 12, draw: 11, lost: 11, form: ['W', 'D', 'L', 'L', 'D'] }
  ];

  return teamsPreset.map(t => {
    const played = t.won + t.draw + t.lost;
    const gdVal = (t.won * 2) - (t.lost * 1.5);
    const gdRounded = Math.round(gdVal);
    const gdStr = gdRounded > 0 ? `+${gdRounded}` : `${gdRounded}`;
    const pts = t.won * 3 + t.draw;

    return {
      rank: t.rank,
      teamName: t.name,
      teamCrest: t.crest,
      played,
      won: t.won,
      draw: t.draw,
      lost: t.lost,
      gd: gdStr,
      points: pts,
      form: t.form,
      isFeatured: t.isFeatured
    };
  });
}
