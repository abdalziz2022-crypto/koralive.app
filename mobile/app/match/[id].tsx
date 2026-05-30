import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  Pressable, 
  ActivityIndicator, 
  Dimensions,
  StyleProp,
  ViewStyle,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode, Audio } from 'expo-av';
import { Play, Pause, RefreshCw, Layers, Users, BarChart3, Clock, AlertTriangle } from 'lucide-react-native';
import { auth, db, saveContinueWatching } from '../../config/firebase';

const { width } = Dimensions.get('window');

const DETAILS_MOCK: { [key: string]: any } = {
  "apf-1": {
    id: "apf-1",
    homeTeam: { id: 2939, name: "الهلال", logo: "https://media.api-sports.io/football/teams/2939.png" },
    awayTeam: { id: 2911, name: "النصر", logo: "https://media.api-sports.io/football/teams/2911.png" },
    score: { home: 2, away: 1 },
    minute: 78,
    isLive: true,
    status: { short: 'LIVE', elapsed: 78, long: 'الشوط الثاني' },
    league: { id: 307, name: "دوري روشن السعودي للمحترفين", logo: "https://media.api-sports.io/football/leagues/307.png" },
    stadium: "ملعب المملكة أرينا، الرياض",
    referee: "باستيان دانكيرت (المانيا)",
    channel: "SSC Sports 1 HD",
    commentator: "فهد العتيبي",
    streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8", // Solid HLS demo stream URL
    timeline: [
      { minute: 12, type: 'Goal', teamId: 2939, player: 'ألكسندر ميتروفيتش', assist: 'سافيتش', detail: 'تسديدة قوية' },
      { minute: 34, type: 'Card', teamId: 2911, player: 'ماني', detail: 'بطاقة صفراء' },
      { minute: 45, type: 'subst', teamId: 2939, player: 'سالم الدوسري', subOut: 'مالكوم', elapsed: '45+1' },
      { minute: 56, type: 'Goal', teamId: 2911, player: 'كريستيانو رونالدو', assist: 'بروزوفيتش', detail: 'ركلة جزاء' },
      { minute: 72, type: 'Goal', teamId: 2939, player: 'سالم الدوسري', assist: 'ميتروفيتش', detail: 'رأسية مميزة' }
    ],
    lineups: {
      home: {
        formation: "4-2-3-1",
        startXI: [
          { player: { name: "ياسين بونو", number: 37, position: 'G' } },
          { player: { name: "كوليبالي", number: 3, position: 'D' } },
          { player: { name: "علي البليهي", number: 5, position: 'D' } },
          { player: { name: "سعود عبد الحميد", number: 66, position: 'D' } },
          { player: { name: "رينان لودي", number: 6, position: 'D' } },
          { player: { name: "روبن نيفيز", number: 8, position: 'M' } },
          { player: { name: "سيرجي سافيتش", number: 22, position: 'M' } },
          { player: { name: "مالكوم", number: 77, position: 'M', substituted: true, subTime: '45+1', reason: 'إصابة تكتيكية' } },
          { player: { name: "سالم الدوسري", number: 29, position: 'M', injured: true } },
          { player: { name: "ميتروفيتش", number: 9, position: 'F' } }
        ]
      },
      away: {
        formation: "4-3-3",
        startXI: [
          { player: { name: "بينتو", number: 24, position: 'G' } },
          { player: { name: "علي لاجامي", number: 4, position: 'D' } },
          { player: { name: "سلطان الغنام", number: 2, position: 'D' } },
          { player: { name: "إيميرك لابورت", number: 27, position: 'D' } },
          { player: { name: "عبد الإله العمري", number: 78, position: 'D' } },
          { player: { name: "بروزوفيتش", number: 77, position: 'M' } },
          { player: { name: "أتافيو", number: 25, position: 'M' } },
          { player: { name: "تاليسكا", number: 94, position: 'F', substituted: true, subTime: '68' } },
          { player: { name: "ساديو ماني", number: 10, position: 'F' } },
          { player: { name: "كريستيانو رونالدو", number: 7, position: 'F' } }
        ]
      }
    },
    compareStats: [
      { title: "دقة التمرير 🎯", home: "88%", away: "82%", barHome: 88, barAway: 82 },
      { title: "الالتحامات الناجحة ⚔️", home: "54%", away: "46%", barHome: 54, barAway: 46 },
      { title: "الاستحواذ على الكرة ⚽", home: "56%", away: "44%", barHome: 56, barAway: 44 },
      { title: "التسديدات على المرمى ⚡", home: "7", away: "5", barHome: 58, barAway: 42 }
    ]
  }
};

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const videoRef = useRef<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'STREAM' | 'LINEUPS' | 'STATS'>('STREAM');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSubTime, setShowSubTime] = useState<string | null>(null);

  useEffect(() => {
    // Enable background audio for sports commentary
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldRouteThroughEarpieceIOS: false,
      staysActiveInBackground: true,
    }).catch(() => {});

    // Retrieve match config matching parameters
    const matchId = Array.isArray(id) ? id[0] : id;
    const item = DETAILS_MOCK[matchId] || DETAILS_MOCK["apf-1"]; // Fallback to AlHilal match
    
    setMatch(item);
    setLoading(false);

    // Register stream in Continue Watching History immediately upon visiting
    if (auth.currentUser) {
      saveContinueWatching(
        auth.currentUser.uid, 
        item.id, 
        item.streamUrl, 
        `${item.homeTeam.name} - ${item.awayTeam.name}`
      ).catch(() => {});
    }
  }, [id]);

  if (loading || !match) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    } catch (e) {
      console.warn("Video reproduction error:", e);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Dynamic Scoreboard Row */}
      <View style={styles.scoreboardRow}>
        <View style={styles.teamBadgeBox}>
          <Image source={{ uri: match.homeTeam.logo }} style={styles.logoItem} />
          <Text style={styles.teamTitleText}>{match.homeTeam.name}</Text>
        </View>

        <View style={styles.scoreCounterBox}>
          <Text style={styles.leagueLabelText} numberOfLines={1}>{match.league.name}</Text>
          <View style={styles.numbersFlex}>
            <Text style={styles.scoreNumber}>{match.score.home}</Text>
            <Text style={styles.greenHyphen}>-</Text>
            <Text style={styles.scoreNumber}>{match.score.away}</Text>
          </View>
          <View style={styles.liveMinuteBadge}>
            <View style={styles.liveDotRed} />
            <Text style={styles.elapsedText}>الشوط الثاني {match.minute}'</Text>
          </View>
        </View>

        <View style={styles.teamBadgeBox}>
          <Image source={{ uri: match.awayTeam.logo }} style={styles.logoItem} />
          <Text style={styles.teamTitleText}>{match.awayTeam.name}</Text>
        </View>
      </View>

      {/* Segment Controllers */}
      <View style={styles.detailsSegments}>
        <Pressable 
          onPress={() => setActiveTab('STREAM')}
          style={[styles.segmentBtn, activeTab === 'STREAM' && styles.activeSeg]}
        >
          <Play size={14} color={activeTab === 'STREAM' ? '#10b981' : '#9ca3af'} />
          <Text style={[styles.segmentText, activeTab === 'STREAM' && styles.activeSegText]}>البث المباشر</Text>
        </Pressable>

        <Pressable 
          onPress={() => setActiveTab('LINEUPS')}
          style={[styles.segmentBtn, activeTab === 'LINEUPS' && styles.activeSeg]}
        >
          <Users size={14} color={activeTab === 'LINEUPS' ? '#10b981' : '#9ca3af'} />
          <Text style={[styles.segmentText, activeTab === 'LINEUPS' && styles.activeSegText]}>التشكيلة</Text>
        </Pressable>

        <Pressable 
          onPress={() => setActiveTab('STATS')}
          style={[styles.segmentBtn, activeTab === 'STATS' && styles.activeSeg]}
        >
          <BarChart3 size={14} color={activeTab === 'STATS' ? '#10b981' : '#9ca3af'} />
          <Text style={[styles.segmentText, activeTab === 'STATS' && styles.activeSegText]}>المقارنات والإحصائيات</Text>
        </Pressable>
      </View>

      {/* Content Tabs Area */}
      {activeTab === 'STREAM' && (
        <View style={styles.streamSection}>
          <View style={styles.videoPlayerContainer}>
            <Video
              ref={videoRef}
              source={{ uri: match.streamUrl }}
              style={styles.embeddedVideo}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isMuted={false}
              useNativeControls
              onError={(e) => console.log('Video error:', e)}
            />
            
            {!isPlaying && (
              <Pressable style={styles.customVideoOverlay} onPress={handlePlayPause}>
                <View style={styles.playIconButton}>
                  <Play size={32} color="#ffffff" fill="#ffffff" />
                </View>
                <Text style={styles.overlayPlayLabel}>انقر لبدء البث المباشر HD</Text>
              </Pressable>
            )}
          </View>

          {/* Commentary metadata details */}
          <View style={styles.streamDetailsBox}>
            <View style={styles.detailMetaRow}>
              <Text style={styles.metaValueText}>{match.channel}</Text>
              <Text style={styles.metaLabelText}>القناة الناقلة :</Text>
            </View>
            <View style={styles.detailMetaRow}>
              <Text style={styles.metaValueText}>{match.commentator}</Text>
              <Text style={styles.metaLabelText}>المعلق الرياضي :</Text>
            </View>
            <View style={styles.detailMetaRow}>
              <Text style={styles.metaValueText}>{match.stadium}</Text>
              <Text style={styles.metaLabelText}>الملعب والموقع :</Text>
            </View>
          </View>
        </View>
      )}

      {activeTab === 'LINEUPS' && (
        <View style={styles.lineupLayout}>
          <Text style={styles.lineupSubTitle}>التشكيل التكتيكي والتبديلات</Text>
          
          <View style={styles.lineupsDuo}>
            {/* Home Lineup */}
            <View style={styles.lineupTeamCol}>
              <Text style={styles.teamColTitle}>{match.homeTeam.name} ({match.lineups.home.formation})</Text>
              {match.lineups.home.startXI.map((node: any, idx: number) => (
                <Pressable 
                  key={idx} 
                  style={styles.playerNodeRow}
                  onPress={() => {
                    if (node.player.substituted) {
                      setShowSubTime(`تبديل في الدقيقة ${node.player.subTime}`);
                    } else if (node.player.injured) {
                      setShowSubTime('إرهاق وإصابة عضلية طفيفة ⚠️');
                    } else {
                      setShowSubTime(null);
                    }
                  }}
                >
                  <Text style={styles.nodeNumber}>{node.player.number}</Text>
                  <Text style={styles.nodeNameText}>{node.player.name}</Text>
                  
                  {/* Injured glowing bar indicator */}
                  {node.player.injured && (
                    <View style={styles.injuredFlicker}>
                      <AlertTriangle size={12} color="#f43f5e" />
                      <Text style={styles.injuredLabel}>إصابة</Text>
                    </View>
                  )}

                  {/* Substituted glowing visual indicator */}
                  {node.player.substituted && (
                    <View style={styles.subbedFlicker}>
                      <RefreshCw size={10} color="#10b981" />
                      <Text style={styles.subbedLabel}>{node.player.subTime}'</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            {/* Away Lineup */}
            <View style={styles.lineupTeamCol}>
              <Text style={styles.teamColTitle}>{match.awayTeam.name} ({match.lineups.away.formation})</Text>
              {match.lineups.away.startXI.map((node: any, idx: number) => (
                <Pressable 
                  key={idx} 
                  style={styles.playerNodeRow}
                  onPress={() => {
                    if (node.player.substituted) {
                      setShowSubTime(`تبديل في الدقيقة ${node.player.subTime}`);
                    } else if (node.player.injured) {
                      setShowSubTime('خروج بالتنسيق الميداني للتأمين ⚠️');
                    } else {
                      setShowSubTime(null);
                    }
                  }}
                >
                  <Text style={styles.nodeNumber}>{node.player.number}</Text>
                  <Text style={styles.nodeNameText}>{node.player.name}</Text>
                  
                  {node.player.injured && (
                    <View style={styles.injuredFlicker}>
                      <AlertTriangle size={12} color="#f43f5e" />
                      <Text style={styles.injuredLabel}>إصابة</Text>
                    </View>
                  )}

                  {node.player.substituted && (
                    <View style={styles.subbedFlicker}>
                      <RefreshCw size={10} color="#10b981" />
                      <Text style={styles.subbedLabel}>{node.player.subTime}'</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
          
          {/* Custom micro interaction alerts representing popup states */}
          {showSubTime && (
            <View style={styles.tooltipPill}>
              <Text style={styles.tooltipText}>{showSubTime}</Text>
            </View>
          )}
        </View>
      )}

      {activeTab === 'STATS' && (
        <View style={styles.statsLayout}>
          <Text style={styles.statsHeadlineText}>مقارنة ومطابقة الأقسام واللاعبين</Text>
          
          {match.compareStats.map((stat: any, idx: number) => (
            <View key={idx} style={styles.statGraphBlock}>
              <View style={styles.statLabelRow}>
                <Text style={styles.graphHomeVal}>{stat.home}</Text>
                <Text style={styles.graphTitleText}>{stat.title}</Text>
                <Text style={styles.graphAwayVal}>{stat.away}</Text>
              </View>

              {/* Graphical side-by-side progression bar as requested */}
              <View style={styles.linearGraphFrame}>
                <View style={[styles.graphCoreFill, styles.homeGraphColor, { width: `${stat.barHome / 2}%` }]} />
                <View style={[styles.graphCoreFill, styles.awayGraphColor, { width: `${stat.barAway / 2}%` }]} />
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreboardRow: {
    flexDirection: 'row',
    backgroundColor: '#0c1223',
    padding: 20,
    borderBottomWidth:1.5,
    borderBottomColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamBadgeBox: {
    flex: 2,
    alignItems: 'center',
  },
  logoItem: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  teamTitleText: {
    color: '#ffffff',
    fontWeight: '950',
    fontSize: 14,
    textAlign: 'center',
  },
  scoreCounterBox: {
    flex: 3,
    alignItems: 'center',
  },
  leagueLabelText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
    maxWidth: 120,
  },
  numbersFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  scoreNumber: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '950',
    marginHorizontal: 8,
  },
  greenHyphen: {
    color: '#10b981',
    fontSize: 26,
    fontWeight: '800',
  },
  liveMinuteBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  liveDotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginLeft: 4,
  },
  elapsedText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '900',
  },
  detailsSegments: {
    flexDirection: 'row-reverse',
    backgroundColor: '#0c1223',
    padding: 10,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  activeSeg: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  segmentText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '800',
  },
  activeSegText: {
    color: '#10b981',
  },
  streamSection: {
    padding: 16,
  },
  videoPlayerContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  embeddedVideo: {
    width: '100%',
    height: '100%',
  },
  customVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 7, 18, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconButton: {
    backgroundColor: '#10b981',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  overlayPlayLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  streamDetailsBox: {
    backgroundColor: '#0c1223',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  detailMetaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  metaLabelText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '850',
  },
  metaValueText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  lineupLayout: {
    padding: 16,
  },
  lineupSubTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 16,
  },
  lineupsDuo: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 12,
  },
  lineupTeamCol: {
    flex: 1,
    backgroundColor: '#0c1223',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  teamColTitle: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  playerNodeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  nodeNumber: {
    color: '#34d399',
    fontWeight: '950',
    fontSize: 11,
    width: 22,
    textAlign: 'center',
  },
  nodeNameText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    flex: 1,
    textAlign: 'right',
    marginRight: 6,
  },
  injuredFlicker: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  injuredLabel: {
    color: '#f43f5e',
    fontSize: 9,
    fontWeight: '900',
    marginRight: 2,
  },
  subbedFlicker: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
  },
  subbedLabel: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
  },
  tooltipPill: {
    backgroundColor: '#1f2937',
    padding: 10,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  tooltipText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '900',
  },
  statsLayout: {
    padding: 16,
  },
  statsHeadlineText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '950',
    textAlign: 'right',
    marginBottom: 16,
  },
  statGraphBlock: {
    marginBottom: 16,
  },
  statLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  graphHomeVal: {
    color: '#10b981',
    fontWeight: '950',
    fontSize: 13,
  },
  graphAwayVal: {
    color: '#9ca3af',
    fontWeight: '950',
    fontSize: 13,
  },
  graphTitleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  linearGraphFrame: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1f2937',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  graphCoreFill: {
    height: '100%',
  },
  homeGraphColor: {
    backgroundColor: '#10b981',
  },
  awayGraphColor: {
    backgroundColor: '#4b5563',
  }
});
