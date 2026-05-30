import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Play, Clock } from 'lucide-react-native';

interface MatchCardProps {
  match: any;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export default function MatchCard({ match, isBookmarked, onToggleBookmark }: MatchCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/match/${match.id}`);
  };

  const getStatusText = () => {
    if (typeof match.status === 'object') {
      return match.status.long || match.status.short || 'قريباً';
    }
    return match.status || 'قريباً';
  };

  const isLive = match.isLive || match.status?.short === 'LIVE' || match.status?.long === 'In Progress';
  const elapsed = match.minute || match.status?.elapsed;

  return (
    <Pressable 
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        isLive && styles.liveCard,
        pressed && styles.pressed
      ]}
    >
      {/* League Header */}
      <View style={styles.header}>
        <View style={styles.leagueContainer}>
          <Image 
            source={{ uri: match.league?.logo || match.leagueLogo || 'https://media.api-sports.io/football/leagues/39.png' }} 
            style={styles.leagueLogo}
            defaultSource={require('../assets/favicon.png')}
          />
          <Text style={styles.leagueName} numberOfLines={1}>
            {match.league?.name || match.league || 'الدوري'}
          </Text>
        </View>
        
        {/* Favorite Trigger */}
        <Pressable hitSlop={12} onPress={onToggleBookmark}>
          <Heart 
            size={20} 
            color={isBookmarked ? '#f43f5e' : '#9ca3af'} 
            fill={isBookmarked ? '#f43f5e' : 'transparent'} 
          />
        </Pressable>
      </View>

      {/* Matching Scoreboard Body */}
      <View style={styles.scoreboard}>
        {/* Home Team */}
        <View style={styles.teamSection}>
          <Image 
            source={{ uri: match.homeTeam?.logo || match.homeLogo || 'https://media.api-sports.io/football/teams/2939.png' }} 
            style={styles.teamLogo}
          />
          <Text style={styles.teamName} numberOfLines={1}>
            {match.homeTeam?.name || match.homeTeam || 'المضيف'}
          </Text>
        </View>

        {/* Score & Timing */}
        <View style={styles.scoreSection}>
          {isLive || match.status?.short === 'FT' || match.homeScore !== undefined ? (
            <View style={styles.scoreRow}>
              <Text style={styles.scoreText}>
                {match.score?.home ?? match.homeScore ?? 0}
              </Text>
              <Text style={styles.scoreSeparator}>-</Text>
              <Text style={styles.scoreText}>
                {match.score?.away ?? match.awayScore ?? 0}
              </Text>
            </View>
          ) : (
            <View style={styles.upcomingContainer}>
              <Clock size={16} color="#10b981" />
              <Text style={styles.timeText}>
                {match.startTime ? new Date(match.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'قريباً'}
              </Text>
            </View>
          )}

          {/* Minute or Status Pill */}
          {isLive ? (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>مباشر {elapsed ? `${elapsed}'` : ''}</Text>
            </View>
          ) : (
            <View style={[styles.statusPill, match.status?.short === 'FT' && styles.finishedPill]}>
              <Text style={styles.statusText}>
                {match.status?.short === 'FT' ? 'انتهت' : getStatusText()}
              </Text>
            </View>
          )}
        </View>

        {/* Away Team */}
        <View style={styles.teamSection}>
          <Image 
            source={{ uri: match.awayTeam?.logo || match.awayLogo || 'https://media.api-sports.io/football/teams/2911.png' }} 
            style={styles.teamLogo}
          />
          <Text style={styles.teamName} numberOfLines={1}>
            {match.awayTeam?.name || match.awayTeam || 'الضيف'}
          </Text>
        </View>
      </View>

      {/* Streaming Badge Quick Access Indicator */}
      {(match.channel || match.commentator || match.streamingLinks?.length > 0) && (
        <View style={styles.footer}>
          <View style={styles.channelRow}>
            <Play size={12} color="#10b981" style={{ marginRight: 4 }} />
            <Text style={styles.footerText}>
              {match.channel || 'بث مباشر'} • {match.commentator || 'مشاهدة المباراة'}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0c1223',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  liveCard: {
    borderColor: 'rgba(16, 185, 129, 0.35)', // Glowing border
    shadowColor: '#10b981',
    shadowOpacity: 0.1,
  },
  pressed: {
    opacity: Platform.OS === 'ios' ? 0.8 : 0.9,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row-reverse', // RTL Friendly
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth:1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    paddingBottom: 10,
    marginBottom: 12,
  },
  leagueContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  leagueLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  leagueName: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  teamSection: {
    flex: 2,
    alignItems: 'center',
  },
  teamLogo: {
    width: 52,
    height: 52,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  teamName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    maxWidth: 100,
  },
  scoreSection: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    marginHorizontal: 12,
  },
  scoreSeparator: {
    color: '#10b981',
    fontSize: 22,
    fontWeight: '600',
  },
  upcomingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 6,
  },
  timeText: {
    color: '#10b981',
    fontWeight: '900',
    fontSize: 14,
    marginLeft: 4,
  },
  livePill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)', // Soft red overlay
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginLeft: 4,
  },
  liveText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '900',
  },
  statusPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  finishedPill: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
  },
  statusText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '800',
  },
  footer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
  },
  channelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
  }
});
