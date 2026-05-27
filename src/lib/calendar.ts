import { Match } from '../types';

export function downloadICS(match: Match) {
  const startTime = new Date(match.startTime);
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hours match duration

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const summary = `${match.homeTeam} vs ${match.awayTeam}`;
  const description = `شاهد مباراة ${match.homeTeam} ضد ${match.awayTeam} في ${match.league}. الرابط: ${window.location.origin}/match/${match.id}`;
  const location = match.league;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PROID:-//Goal Time//Match Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${match.id}@goaltime.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startTime)}`,
    `DTEND:${formatDate(endTime)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'DESCRIPTION:تذكير بالمباراة',
    'ACTION:DISPLAY',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${match.homeTeam}_vs_${match.awayTeam}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
