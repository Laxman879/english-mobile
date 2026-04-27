import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { C } from '../../lib/theme';

interface StreakData { streakCount: number; streakDates: string[]; }

export default function StreakScreen() {
  const [data, setData]     = useState<StreakData>({ streakCount: 0, streakDates: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/streak-history').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return { dateStr, day: ['M','T','W','T','F','S','S'][d.getDay() === 0 ? 6 : d.getDay() - 1], active: data.streakDates.includes(dateStr) };
  });

  if (loading) return <SafeAreaView style={s.root} edges={['top']}><View style={s.center}><ActivityIndicator color={C.primary} size="large" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.headerSub}>Your Progress</Text>
        <Text style={s.headerTitle}>Streak</Text>

        {/* Big streak card */}
        <View style={s.streakCard}>
          <View style={s.circle1} /><View style={s.circle2} />
          <View style={s.streakInner}>
            <Text style={s.streakLabel}>CURRENT STREAK</Text>
            <View style={s.streakRow}>
              <Ionicons name="flame" size={32} color="#fb923c" />
              <Text style={s.streakNum}>{data.streakCount}</Text>
            </View>
            <Text style={s.streakDays}>days in a row</Text>
          </View>

          {/* 7-day bars */}
          <View style={s.bars}>
            {last7.map((d, i) => (
              <View key={i} style={s.barCol}>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { height: d.active ? '100%' : '10%' }]} />
                </View>
                <Text style={s.barDay}>{d.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats grid */}
        <View style={s.statsGrid}>
          {[
            { label: 'Total Days',    value: String(data.streakDates.length), icon: 'calendar',    color: C.blue    },
            { label: 'Best Streak',   value: String(data.streakCount),        icon: 'trophy',      color: C.fire    },
            { label: 'This Week',     value: String(last7.filter(d => d.active).length), icon: 'stats-chart', color: C.primary },
            { label: 'Completion',    value: `${Math.round((last7.filter(d => d.active).length / 7) * 100)}%`, icon: 'checkmark-circle', color: C.blue },
          ].map(st => (
            <View key={st.label} style={s.statCard}>
              <Ionicons name={st.icon as any} size={20} color={st.color} />
              <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Calendar dots */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Recent Activity</Text>
          <View style={s.dots}>
            {last7.map((d, i) => (
              <View key={i} style={s.dotCol}>
                <View style={[s.dot, d.active && s.dotActive]} />
                <Text style={s.dotDay}>{d.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tip */}
        <View style={s.tipCard}>
          <Text style={s.tipLabel}>🔥 Keep Going!</Text>
          <Text style={s.tipText}>Log in every day to maintain your streak. Consistency is the key to mastering a language.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:      { padding: 16, paddingBottom: 32, gap: 16 },
  headerSub:   { fontSize: 9, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 2 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: C.text, marginBottom: 4 },

  streakCard:  { backgroundColor: C.primary, borderRadius: 20, padding: 20, overflow: 'hidden', gap: 16 },
  circle1:     { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)' },
  circle2:     { position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.1)' },
  streakInner: { alignItems: 'center', gap: 4 },
  streakLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 2 },
  streakRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakNum:   { fontSize: 56, fontWeight: '900', color: '#fff' },
  streakDays:  { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  bars:        { flexDirection: 'row', gap: 6, height: 60, alignItems: 'flex-end' },
  barCol:      { flex: 1, alignItems: 'center', gap: 4 },
  barTrack:    { flex: 1, width: '100%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill:     { width: '100%', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 6 },
  barDay:      { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },

  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard:    { flex: 1, minWidth: '45%', backgroundColor: C.card, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.border },
  statVal:     { fontSize: 22, fontWeight: '900' },
  statLabel:   { fontSize: 10, color: C.muted, fontWeight: '700', textAlign: 'center' },

  card:        { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, gap: 12 },
  cardTitle:   { fontSize: 13, fontWeight: '700', color: C.text },
  dots:        { flexDirection: 'row', justifyContent: 'space-between' },
  dotCol:      { alignItems: 'center', gap: 6 },
  dot:         { width: 28, height: 28, borderRadius: 14, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border },
  dotActive:   { backgroundColor: C.primary, borderColor: C.primary },
  dotDay:      { fontSize: 10, color: C.muted, fontWeight: '700' },

  tipCard:     { backgroundColor: C.primarySoft, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: `${C.primary}33`, gap: 6 },
  tipLabel:    { fontSize: 12, fontWeight: '800', color: C.primary },
  tipText:     { fontSize: 12, color: C.text2, lineHeight: 18 },
});
