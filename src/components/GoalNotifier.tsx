import React, { useEffect, useRef, useState } from 'react';
import { useMatches } from '../context/MatchContext';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useError } from '../context/ErrorContext';
import { Match } from '../types';

export default function GoalNotifier() {
  const { matches } = useMatches();
  const [user] = useAuthState(auth);
  const [notifiedMatches, setNotifiedMatches] = useState<string[]>([]);
  const { showToast } = useError();
  const prevMatchesRef = useRef<Match[]>([]);

  // Listen to user's notified matches list in real-time
  useEffect(() => {
    if (!user) {
      setNotifiedMatches([]);
      return;
    }
    const docRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setNotifiedMatches(data.notifiedMatches || []);
      }
    }, (error) => {
      console.error("Error in GoalNotifier listening to user document:", error);
    });
    return () => unsub();
  }, [user]);

  // Watch for live updates on matches
  useEffect(() => {
    if (matches.length === 0) return;

    if (prevMatchesRef.current.length === 0) {
      prevMatchesRef.current = matches;
      return;
    }

    matches.forEach((currentMatch) => {
      const prevMatch = prevMatchesRef.current.find((m) => m.id === currentMatch.id);
      
      if (prevMatch) {
        // Verify if user turned on notifications for this specific match
        const isUserInterested = notifiedMatches.includes(currentMatch.id);

        if (isUserInterested) {
          // 1. Home team scored
          if (currentMatch.homeScore > prevMatch.homeScore) {
            showToast(
              `⚽ هددددف! فريق ${currentMatch.homeTeam} يسجل في شباك ${currentMatch.awayTeam}! النتيجة الآن: [ ${currentMatch.homeTeam} ${currentMatch.homeScore} - ${currentMatch.awayScore} ${currentMatch.awayTeam} ] 🔥`,
              'success'
            );
          }
          // 2. Away team scored
          if (currentMatch.awayScore > prevMatch.awayScore) {
            showToast(
              `⚽ هددددف! فريق ${currentMatch.awayTeam} يسجل في شباك ${currentMatch.homeTeam}! النتيجة الآن: [ ${currentMatch.homeTeam} ${currentMatch.homeScore} - ${currentMatch.awayScore} ${currentMatch.awayTeam} ] 🔥`,
              'success'
            );
          }
          // 3. Match ended alert
          if (currentMatch.status === 'FINISHED' && prevMatch.status !== 'FINISHED') {
            showToast(
              `🏁 انتهت المباراة! النتيجة النهائية: [ ${currentMatch.homeTeam} ${currentMatch.homeScore} - ${currentMatch.awayScore} ${currentMatch.awayTeam} ]`,
              'info'
            );
          }
          // 4. Match kicked off alert
          if (currentMatch.status === 'LIVE' && prevMatch.status === 'UPCOMING') {
            showToast(
              `🔔 بدأت المباراة الآن! بالتوفيق للفريقين: ${currentMatch.homeTeam} ضد ${currentMatch.awayTeam} ⚽`,
              'info'
            );
          }
        }
      }
    });

    prevMatchesRef.current = matches;
  }, [matches, notifiedMatches, showToast]);

  return null;
}
