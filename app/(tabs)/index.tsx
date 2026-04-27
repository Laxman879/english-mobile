import { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';

interface Word    { _id: string; word: string; meaning: string; image?: string; translations?: Record<string,string>; examples?: { past?: string; present?: string; future?: string }; }
interface Story   { _id: string; storyText: string; image?: string; }
interface Playlist{ _id: string; name: string; image?: string; items?: unknown[]; }
interface Streak  { streakCount: number; streakDates: string[]; }

export default function HomeScreen() {
  const { user } = useAuth();
  const { C } = useTheme();
  const router = useRouter();

  const s = StyleSheet.create({
  root:               { flex: 1, backgroundColor: C.bg },
  center:             { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:             { padding: 16, paddingBottom: 32, gap: 16 },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  logoRow:            { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon:           { width: 32, height: 32, borderRadius: 10, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  logoTitle:          { fontSize: 14, fontWeight: '800', color: C.text },
  logoSub:            { fontSize: 10, color: C.muted },
  streakBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: C.fireSoft, borderRadius: 12, borderWidth: 1, borderColor: `${C.fire}33` },
  streakNum:          { fontSize: 13, fontWeight: '800', color: C.fire },
  greetRow:           { gap: 2 },
  greetSub:           { fontSize: 11, fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  greetTitle:         { fontSize: 26, fontWeight: '900', color: C.text },
  greetDesc:          { fontSize: 13, color: C.text2 },
  statsRow:           { flexDirection: 'row', gap: 10 },
  statCard:           { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.border },
  statIcon:           { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  statVal:            { fontSize: 18, fontWeight: '900' },
  statLabel:          { fontSize: 9, color: C.muted, fontWeight: '700', textAlign: 'center' },
  card:               { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardGradientBar:    { height: 4, backgroundColor: C.primary },
  cardBody:           { padding: 16, gap: 12 },
  cardHeader:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  cardHeaderLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardHeaderIcon:     { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cardHeaderTitle:    { fontSize: 13, fontWeight: '700', color: C.text },
  cardHeaderSub:      { fontSize: 10, color: C.muted },
  viewAllBtn:         { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText:        { fontSize: 12, fontWeight: '700', color: C.primary },
  wotdTopRow:         { flexDirection: 'row', alignItems: 'center' },
  wotdBadge:          { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: C.primary, borderRadius: 99 },
  wotdBadgeText:      { fontSize: 10, fontWeight: '800', color: C.primaryFg, textTransform: 'uppercase', letterSpacing: 1 },
  wotdWordRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wotdWord:           { fontSize: 42, fontWeight: '900', color: C.text },
  speakBtn:           { width: 36, height: 36, borderRadius: 18, backgroundColor: C.blueSoft, justifyContent: 'center', alignItems: 'center' },
  speakBtnActive:     { backgroundColor: C.blue },
  definitionBox:      { backgroundColor: C.card2, borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: C.primary },
  definitionText:     { fontSize: 13, color: C.text, lineHeight: 20 },
  sectionLabel:       { fontSize: 9, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 2 },
  translationsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  translationCard:    { flex: 1, minWidth: '45%', backgroundColor: C.card2, borderRadius: 12, padding: 10, alignItems: 'center' },
  translationLang:    { fontSize: 9, fontWeight: '800', color: C.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  translationVal:     { fontSize: 16, fontWeight: '700', color: C.text },
  exampleBox:         { backgroundColor: C.card2, borderRadius: 12, padding: 10 },
  exampleTense:       { fontSize: 9, fontWeight: '800', color: C.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  exampleText:        { fontSize: 13, color: C.text, lineHeight: 18 },
  emptyCard:          { padding: 32, alignItems: 'center', gap: 8 },
  emptyTitle:         { fontSize: 15, fontWeight: '800', color: C.text },
  emptyDesc:          { fontSize: 12, color: C.muted, textAlign: 'center' },
  emptyBtn:           { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: C.primary, borderRadius: 12 },
  emptyBtnText:       { fontSize: 12, fontWeight: '700', color: C.primaryFg },
  emptySmall:         { padding: 20, alignItems: 'center', gap: 8 },
  emptySmallText:     { fontSize: 12, color: C.muted },
  emptySmallBtn:      { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: C.primary, borderRadius: 10 },
  emptySmallBtnText:  { fontSize: 11, fontWeight: '700', color: C.primaryFg },
  wordScroll:         {},
  wordMiniCard:       { width: 110, backgroundColor: C.card2, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  wordMiniImg:        { width: '100%', height: 70 },
  wordMiniImgFallback:{ backgroundColor: C.primarySoft, justifyContent: 'center', alignItems: 'center' },
  wordMiniInfo:       { padding: 8 },
  wordMiniWord:       { fontSize: 13, fontWeight: '800', color: C.text },
  wordMiniTelugu:     { fontSize: 11, color: C.primary, fontWeight: '600' },
  wordMiniMeaning:    { fontSize: 10, color: C.muted, lineHeight: 14 },
  plRow:              { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, backgroundColor: C.card2, borderRadius: 14, borderWidth: 1, borderColor: C.border },
  plRowImg:           { width: 44, height: 44, borderRadius: 10 },
  plRowImgFallback:   { backgroundColor: C.fireSoft, justifyContent: 'center', alignItems: 'center' },
  plRowName:          { fontSize: 13, fontWeight: '700', color: C.text },
  plRowSub:           { fontSize: 10, color: C.muted },
  storyCard:          { width: 180, height: 160, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  storyImg:           { width: '100%', height: '100%', position: 'absolute' },
  storyImgFallback:   { backgroundColor: C.primarySoft, justifyContent: 'center', alignItems: 'center' },
  storyOverlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  storyBadge:         { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: C.primary, borderRadius: 99 },
  storyBadgeText:     { fontSize: 9, fontWeight: '800', color: '#fff' },
  storyInfo:          { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  storyTitle:         { fontSize: 12, fontWeight: '800', color: '#fff', marginBottom: 2 },
  storyExcerpt:       { fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 14 },
  tipCard:            { backgroundColor: C.primarySoft, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: `${C.primary}33`, gap: 6 },
  tipLabel:           { fontSize: 10, fontWeight: '800', color: C.primary, textTransform: 'uppercase', letterSpacing: 1 },
  tipText:            { fontSize: 12, color: C.text2, lineHeight: 18 },
  tipLink:            { fontSize: 12, fontWeight: '700', color: C.primary },
});
  const firstName = user?.name?.split(' ')[0] || 'Learner';
  const [featuredWord, setFeaturedWord] = useState<Word | null>(null);
  const [savedWords, setSavedWords]     = useState<Word[]>([]);
  const [stories, setStories]           = useState<Story[]>([]);
  const [playlists, setPlaylists]       = useState<Playlist[]>([]);
  const [streak, setStreak]             = useState<Streak>({ streakCount: 0, streakDates: [] });
  const [loading, setLoading]           = useState(true);
  const [speaking, setSpeaking]         = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/words/featured').then(r => setFeaturedWord({ ...r.data.word })).catch(() => {}),
      api.get('/words').then(r => setSavedWords(r.data.slice(0, 6))).catch(() => {}),
      api.get('/stories').then(r => setStories(r.data.slice(0, 3))).catch(() => {}),
      api.get('/playlists').then(r => setPlaylists(r.data.slice(0, 4))).catch(() => {}),
      api.get('/auth/streak-history').then(r => setStreak(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const handleSpeak = () => {
    if (!featuredWord) return;
    Speech.stop();
    setSpeaking(true);
    Speech.speak(featuredWord.word, { language: 'en-US', rate: 0.85, onDone: () => setSpeaking(false) });
  };

  const translations = featuredWord?.translations ? Object.entries(featuredWord.translations) : [];

  if (loading) return (
    <SafeAreaView style={s.root}>
      <View style={s.center}><ActivityIndicator color={C.primary} size="large" /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.logoRow}>
            <View style={s.logoIcon}><Ionicons name="flash" size={16} color={C.primaryFg} /></View>
            <View>
              <Text style={s.logoTitle}>Polyglot Punch</Text>
              <Text style={s.logoSub}>Mastering Momentum</Text>
            </View>
          </View>
          <TouchableOpacity style={s.streakBadge} onPress={() => router.push('/(tabs)/streak')}>
            <Ionicons name="flame" size={14} color={C.fire} />
            <Text style={s.streakNum}>{streak.streakCount}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Greeting ── */}
        <View style={s.greetRow}>
          <Text style={s.greetSub}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          <Text style={s.greetTitle}>{greeting}, {firstName}! 👋</Text>
          <Text style={s.greetDesc}>
            {streak.streakCount > 0 ? `You're on a ${streak.streakCount}-day streak — keep it alive!` : 'Start your learning streak today!'}
          </Text>
        </View>

        {/* ── Quick Stats ── */}
        <View style={s.statsRow}>
          {[
            { icon: 'flame',    label: 'Day Streak',  value: String(streak.streakCount), color: C.fire,    bg: C.fireSoft,    route: '/(tabs)/streak' },
            { icon: 'bookmark', label: 'Words Saved', value: String(savedWords.length),  color: C.blue,    bg: C.blueSoft,    route: '/(tabs)/saved'  },
            { icon: 'book',     label: 'AI Stories',  value: String(stories.length),     color: C.primary, bg: C.primarySoft, route: '/(tabs)/stories'},
          ].map(st => (
            <TouchableOpacity key={st.label} style={s.statCard} onPress={() => router.push(st.route as any)}>
              <View style={[s.statIcon, { backgroundColor: st.bg }]}>
                <Ionicons name={st.icon as any} size={18} color={st.color} />
              </View>
              <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Word of the Day ── */}
        {featuredWord ? (
          <View style={s.card}>
            <View style={s.cardGradientBar} />
            <View style={s.cardBody}>
              <View style={s.wotdTopRow}>
                <View style={s.wotdBadge}>
                  <Ionicons name="sparkles" size={10} color={C.primaryFg} />
                  <Text style={s.wotdBadgeText}>Word of the Day</Text>
                </View>
              </View>
              <View style={s.wotdWordRow}>
                <Text style={s.wotdWord}>{featuredWord.word}</Text>
                <TouchableOpacity style={[s.speakBtn, speaking && s.speakBtnActive]} onPress={handleSpeak}>
                  <Ionicons name="volume-medium" size={16} color={speaking ? '#fff' : C.blue} />
                </TouchableOpacity>
              </View>
              <View style={s.definitionBox}>
                <Text style={s.definitionText}>{featuredWord.meaning}</Text>
              </View>
              {translations.length > 0 && (
                <>
                  <Text style={s.sectionLabel}>Translations</Text>
                  <View style={s.translationsGrid}>
                    {translations.slice(0, 4).map(([lang, val]) => (
                      <View key={lang} style={s.translationCard}>
                        <Text style={s.translationLang}>{lang}</Text>
                        <Text style={s.translationVal}>{val}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              {featuredWord.examples && (
                <>
                  <Text style={s.sectionLabel}>Example Sentences</Text>
                  {(['past', 'present', 'future'] as const).map(tense => featuredWord.examples?.[tense] ? (
                    <View key={tense} style={s.exampleBox}>
                      <Text style={s.exampleTense}>{tense.toUpperCase()}</Text>
                      <Text style={s.exampleText}>{featuredWord.examples[tense]}</Text>
                    </View>
                  ) : null)}
                </>
              )}
            </View>
          </View>
        ) : (
          <View style={s.card}>
            <View style={s.emptyCard}>
              <Ionicons name="book-outline" size={28} color={C.primary} />
              <Text style={s.emptyTitle}>No Word of the Day yet</Text>
              <Text style={s.emptyDesc}>Save your first word to see it featured here.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/(tabs)/saved')}>
                <Text style={s.emptyBtnText}>Save Your First Word</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Saved Words ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardHeaderLeft}>
              <View style={[s.cardHeaderIcon, { backgroundColor: C.blueSoft }]}>
                <Ionicons name="bookmark" size={14} color={C.blue} />
              </View>
              <View>
                <Text style={s.cardHeaderTitle}>Saved Words</Text>
                <Text style={s.cardHeaderSub}>{savedWords.length} words in your vault</Text>
              </View>
            </View>
            <TouchableOpacity style={s.viewAllBtn} onPress={() => router.push('/(tabs)/saved')}>
              <Text style={s.viewAllText}>View all</Text>
              <Ionicons name="chevron-forward" size={14} color={C.primary} />
            </TouchableOpacity>
          </View>
          {savedWords.length === 0 ? (
            <View style={s.emptySmall}>
              <Text style={s.emptySmallText}>No words saved yet</Text>
              <TouchableOpacity style={s.emptySmallBtn} onPress={() => router.push('/(tabs)/saved')}>
                <Text style={s.emptySmallBtnText}>Add Words</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.wordScroll} contentContainerStyle={{ padding: 12, gap: 10 }}>
              {savedWords.map(w => {
                const telugu = w.translations?.['telugu'] || Object.values(w.translations || {})[0] || '';
                return (
                  <TouchableOpacity key={w._id} style={s.wordMiniCard} onPress={() => router.push('/(tabs)/saved')}>
                    {w.image
                      ? <Image source={{ uri: w.image }} style={s.wordMiniImg} />
                      : <View style={[s.wordMiniImg, s.wordMiniImgFallback]}><Ionicons name="book" size={18} color={C.primary} /></View>
                    }
                    <View style={s.wordMiniInfo}>
                      <Text style={s.wordMiniWord}>{w.word}</Text>
                      {!!telugu && <Text style={s.wordMiniTelugu}>{telugu}</Text>}
                      <Text style={s.wordMiniMeaning} numberOfLines={2}>{w.meaning}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ── Playlists ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardHeaderLeft}>
              <View style={[s.cardHeaderIcon, { backgroundColor: C.fireSoft }]}>
                <Ionicons name="musical-notes" size={14} color={C.fire} />
              </View>
              <View>
                <Text style={s.cardHeaderTitle}>Playlists</Text>
                <Text style={s.cardHeaderSub}>{playlists.length} playlists</Text>
              </View>
            </View>
            <TouchableOpacity style={s.viewAllBtn} onPress={() => router.push('/(tabs)/playlists')}>
              <Text style={s.viewAllText}>View all</Text>
              <Ionicons name="chevron-forward" size={14} color={C.primary} />
            </TouchableOpacity>
          </View>
          {playlists.length === 0 ? (
            <View style={s.emptySmall}>
              <Text style={s.emptySmallText}>No playlists yet</Text>
              <TouchableOpacity style={s.emptySmallBtn} onPress={() => router.push('/(tabs)/playlists')}>
                <Text style={s.emptySmallBtnText}>Create Playlist</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ padding: 12, gap: 8 }}>
              {playlists.map(pl => (
                <TouchableOpacity key={pl._id} style={s.plRow} onPress={() => router.push('/(tabs)/playlists')}>
                  {pl.image
                    ? <Image source={{ uri: pl.image }} style={s.plRowImg} />
                    : <View style={[s.plRowImg, s.plRowImgFallback]}><Ionicons name="musical-notes" size={18} color={C.fire} /></View>
                  }
                  <View style={{ flex: 1 }}>
                    <Text style={s.plRowName}>{pl.name}</Text>
                    <Text style={s.plRowSub}>{Array.isArray(pl.items) ? pl.items.length : 0} words</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={C.muted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── AI Stories ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardHeaderLeft}>
              <View style={[s.cardHeaderIcon, { backgroundColor: C.primarySoft }]}>
                <Ionicons name="book" size={14} color={C.primary} />
              </View>
              <View>
                <Text style={s.cardHeaderTitle}>AI Stories</Text>
                <Text style={s.cardHeaderSub}>{stories.length} stories generated</Text>
              </View>
            </View>
            <TouchableOpacity style={s.viewAllBtn} onPress={() => router.push('/(tabs)/stories')}>
              <Text style={s.viewAllText}>View all</Text>
              <Ionicons name="chevron-forward" size={14} color={C.primary} />
            </TouchableOpacity>
          </View>
          {stories.length === 0 ? (
            <View style={s.emptySmall}>
              <Text style={s.emptySmallText}>No stories yet</Text>
              <TouchableOpacity style={s.emptySmallBtn} onPress={() => router.push('/(tabs)/stories')}>
                <Text style={s.emptySmallBtnText}>Generate Story</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12, gap: 10 }}>
              {stories.map(st => (
                <TouchableOpacity key={st._id} style={s.storyCard} onPress={() => router.push('/(tabs)/stories')}>
                  {st.image
                    ? <Image source={{ uri: st.image }} style={s.storyImg} />
                    : <View style={[s.storyImg, s.storyImgFallback]}><Ionicons name="book" size={24} color={C.primary} /></View>
                  }
                  <View style={s.storyOverlay} />
                  <View style={s.storyBadge}><Text style={s.storyBadgeText}>AI Story</Text></View>
                  <View style={s.storyInfo}>
                    <Text style={s.storyTitle} numberOfLines={1}>{st.storyText.split('.')[0].slice(0, 40)}…</Text>
                    <Text style={s.storyExcerpt} numberOfLines={2}>{st.storyText.slice(0, 80)}…</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Daily Tip ── */}
        <View style={s.tipCard}>
          <Text style={s.tipLabel}>💡 Daily Tip</Text>
          <Text style={s.tipText}>Try using today's word in a sentence when talking to someone. Active use boosts retention by 40%.</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/streak')}>
            <Text style={s.tipLink}>View streak →</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}


