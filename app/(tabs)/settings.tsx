import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { useTheme, ThemeKey } from '../../lib/ThemeContext';
import api from '../../lib/api';

const LANGUAGES = [
  'Hindi','Telugu','Tamil','Kannada','Malayalam','Bengali',
  'Marathi','Gujarati','Punjabi','Odia','Urdu','Nepali',
  'Assamese','Sanskrit','Konkani','Manipuri','Sindhi',
  'Kashmiri','Maithili','Dogri','Bodo','Santali','English',
];

const REMINDER_TIMES = [
  { label: 'Early Bird',        time: '06:00 AM' },
  { label: 'Morning Rush',      time: '08:00 AM' },
  { label: 'Lunch Break',       time: '12:00 PM' },
  { label: 'Afternoon',         time: '03:00 PM' },
  { label: 'Evening Wind-down', time: '07:30 PM' },
  { label: 'Night Owl',         time: '10:00 PM' },
];

const THEMES: { key: ThemeKey; label: string; icon: string; preview: string }[] = [
  { key: 'dark',   label: 'Dark',   icon: 'moon',     preview: '#0d1117' },
  { key: 'light',  label: 'Light',  icon: 'sunny',    preview: '#f6f8fa' },
  { key: 'golden', label: 'Golden', icon: 'sparkles', preview: '#0d0a04' },
];

export default function SettingsScreen() {
  const { user, logout }    = useAuth();
  const { theme, C, setTheme } = useTheme();
  const router              = useRouter();

  const [displayName,    setDisplayName]    = useState(user?.name || '');
  const [selectedLang,   setSelectedLang]   = useState('Telugu');
  const [reminders,      setReminders]      = useState(false);
  const [reminderTime,   setReminderTime]   = useState('08:00 AM');
  const [reminderRepeat, setReminderRepeat] = useState('daily');
  const [saving,         setSaving]         = useState(false);
  const [saveStatus,     setSaveStatus]     = useState<'idle'|'success'|'error'>('idle');
  const [logoutModal,    setLogoutModal]    = useState(false);
  const [langModal,      setLangModal]      = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || '');
      setSelectedLang((user as any).preferredLanguage || 'Telugu');
      setReminders(((user as any).reminderFrequency || 'none') !== 'none');
      setReminderTime((user as any).reminderTime || '08:00 AM');
      setReminderRepeat((user as any).reminderRepeat || 'daily');
    }
  }, [user]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      await api.put('/auth/profile', {
        name: displayName.trim(),
        preferredLanguage: selectedLang,
        reminderFrequency: reminders ? 'daily' : 'none',
        reminderTime,
        reminderRepeat,
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } finally {
      setSaving(false);
    }
  }, [displayName, selectedLang, reminders, reminderTime, reminderRepeat]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/(auth)/login');
  }, [logout, router]);

  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerSub}>Account Preferences</Text>
          <Text style={s.headerTitle}>Settings</Text>
        </View>

        {/* Profile card */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardIcon}>👤</Text>
            <Text style={s.cardTitle}>Profile</Text>
          </View>
          <View style={s.avatarRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
            </View>
            <View>
              <Text style={s.avatarName}>{user?.name}</Text>
              <Text style={s.avatarEmail}>{user?.email}</Text>
              <View style={s.activeBadge}><Text style={s.activeBadgeText}>Active Account</Text></View>
            </View>
          </View>
          <View style={s.fieldWrap}>
            <Text style={s.label}>DISPLAY NAME</Text>
            <View style={s.inputRow}>
              <Ionicons name="person-outline" size={15} color={C.muted} style={{ marginRight: 8 }} />
              <TextInput
                style={s.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholderTextColor={C.muted}
              />
            </View>
          </View>
          <View style={s.fieldWrap}>
            <Text style={s.label}>EMAIL</Text>
            <View style={[s.inputRow, { opacity: 0.5 }]}>
              <Ionicons name="mail-outline" size={15} color={C.muted} style={{ marginRight: 8 }} />
              <Text style={[s.input, { color: C.muted }]}>{user?.email}</Text>
            </View>
            <Text style={s.hint}>Email cannot be changed</Text>
          </View>
        </View>

        {/* Language */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardIcon}>🌐</Text>
            <Text style={s.cardTitle}>Target Language</Text>
          </View>
          <Text style={s.cardDesc}>Words will be translated to your selected language</Text>
          <TouchableOpacity style={s.langPicker} onPress={() => setLangModal(true)}>
            <Text style={s.langPickerText}>{selectedLang}</Text>
            <Ionicons name="chevron-down" size={16} color={C.muted} />
          </TouchableOpacity>
        </View>

        {/* Appearance */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardIcon}>🎨</Text>
            <Text style={s.cardTitle}>Appearance</Text>
          </View>
          <View style={s.themeRow}>
            {THEMES.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[s.themeBtn, theme === t.key && s.themeBtnActive]}
                onPress={() => setTheme(t.key)}
              >
                <View style={[s.themePreview, { backgroundColor: t.preview }]}>
                  <Ionicons name={t.icon as any} size={18} color={theme === t.key ? C.primary : C.muted} />
                </View>
                <Text style={[s.themeBtnText, theme === t.key && { color: C.primary }]}>{t.label}</Text>
                {theme === t.key && <View style={s.themeDot} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reminders */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Ionicons name="notifications-outline" size={18} color={C.primary} />
            <Text style={s.cardTitle}>Reminders</Text>
          </View>
          <View style={s.reminderToggleRow}>
            <Text style={s.reminderToggleLabel}>Daily Reminders</Text>
            <Switch
              value={reminders}
              onValueChange={setReminders}
              trackColor={{ false: C.border, true: C.primarySoft }}
              thumbColor={reminders ? C.primary : C.muted}
            />
          </View>
          {reminders && (
            <>
              <Text style={s.label}>PREFERRED TIME</Text>
              <View style={s.timeGrid}>
                {REMINDER_TIMES.map(t => (
                  <TouchableOpacity
                    key={t.time}
                    style={[s.timeBtn, reminderTime === t.time && s.timeBtnActive]}
                    onPress={() => setReminderTime(t.time)}
                  >
                    <Text style={[s.timeBtnLabel, reminderTime === t.time && { color: C.primary }]}>{t.label}</Text>
                    <Text style={[s.timeBtnTime, reminderTime === t.time && { color: C.primary }]}>{t.time}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[s.label, { marginTop: 12 }]}>REPEAT</Text>
              <View style={s.repeatRow}>
                {['daily', 'weekly', 'monthly'].map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[s.repeatBtn, reminderRepeat === r && s.repeatBtnActive]}
                    onPress={() => setReminderRepeat(r)}
                  >
                    <Text style={[s.repeatBtnText, reminderRepeat === r && { color: C.primary }]}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Current settings summary */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Your Settings</Text>
          {[
            { label: 'Language',  value: selectedLang },
            { label: 'Theme',     value: theme.charAt(0).toUpperCase() + theme.slice(1) },
            { label: 'Reminders', value: reminders ? `${reminderTime} (${reminderRepeat})` : 'Off' },
          ].map(({ label, value }) => (
            <View key={label} style={s.summaryRow}>
              <Text style={s.summaryLabel}>{label}</Text>
              <Text style={s.summaryValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Account / Logout */}
        <View style={[s.card, { borderColor: '#ef444430' }]}>
          <Text style={s.cardTitle}>Account Access</Text>
          <Text style={s.cardDesc}>Securely sign out of your profile</Text>
          <TouchableOpacity style={s.logoutBtn} onPress={() => setLogoutModal(true)}>
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            <Text style={s.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Save bar */}
        <View style={s.saveBar}>
          {saveStatus === 'success' && <Text style={s.saveSuccess}>✓ Saved successfully!</Text>}
          {saveStatus === 'error'   && <Text style={s.saveError}>✗ Failed to save.</Text>}
          <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color={C.primaryFg} size="small" />
              : <>
                  <Ionicons name="checkmark" size={16} color={C.primaryFg} />
                  <Text style={s.saveBtnText}>Save Preferences</Text>
                </>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Language picker modal */}
      <Modal visible={langModal} transparent animationType="slide" onRequestClose={() => setLangModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { backgroundColor: C.card }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: C.text }]}>Select Language</Text>
              <TouchableOpacity onPress={() => setLangModal(false)}>
                <Ionicons name="close" size={22} color={C.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang}
                  style={[s.langOption, { borderBottomColor: C.border }, selectedLang === lang && { backgroundColor: C.primarySoft }]}
                  onPress={() => { setSelectedLang(lang); setLangModal(false); }}
                >
                  <Text style={[s.langOptionText, { color: C.text }, selectedLang === lang && { color: C.primary, fontWeight: '700' }]}>
                    {lang}
                  </Text>
                  {selectedLang === lang && <Ionicons name="checkmark-circle" size={18} color={C.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Logout confirm modal */}
      <Modal visible={logoutModal} transparent animationType="fade" onRequestClose={() => setLogoutModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.logoutModal, { backgroundColor: C.card }]}>
            <View style={s.logoutIconWrap}>
              <Ionicons name="log-out-outline" size={28} color="#ef4444" />
            </View>
            <Text style={[s.logoutModalTitle, { color: C.text }]}>Wait, leaving so soon?</Text>
            <Text style={[s.logoutModalDesc, { color: C.muted }]}>
              Are you sure you want to log out? Your progress is saved!
            </Text>
            <TouchableOpacity style={s.keepBtn} onPress={() => setLogoutModal(false)}>
              <Ionicons name="checkmark-circle" size={16} color={C.primaryFg} />
              <Text style={s.keepBtnText}>Keep Learning</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.confirmLogoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={16} color={C.text2} />
              <Text style={[s.confirmLogoutText, { color: C.text2 }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const makeStyles = (C: any) => StyleSheet.create({
  root:               { flex: 1, backgroundColor: C.bg },
  scroll:             { padding: 16, paddingBottom: 40, gap: 16 },

  header:             { gap: 2, marginBottom: 4 },
  headerSub:          { fontSize: 9, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 2 },
  headerTitle:        { fontSize: 26, fontWeight: '900', color: C.text },

  card:               { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 16, gap: 12 },
  cardTitleRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIcon:           { fontSize: 18 },
  cardTitle:          { fontSize: 15, fontWeight: '800', color: C.text },
  cardDesc:           { fontSize: 12, color: C.muted, marginTop: -4 },

  avatarRow:          { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar:             { width: 56, height: 56, borderRadius: 16, backgroundColor: C.primarySoft, justifyContent: 'center', alignItems: 'center' },
  avatarText:         { fontSize: 22, fontWeight: '900', color: C.primary },
  avatarName:         { fontSize: 14, fontWeight: '800', color: C.text },
  avatarEmail:        { fontSize: 11, color: C.muted },
  activeBadge:        { marginTop: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, backgroundColor: C.primarySoft, borderRadius: 99 },
  activeBadgeText:    { fontSize: 9, fontWeight: '800', color: C.primary },

  fieldWrap:          { gap: 6 },
  label:              { fontSize: 9, fontWeight: '800', color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase' },
  inputRow:           { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, height: 44 },
  input:              { flex: 1, fontSize: 14, color: C.text },
  hint:               { fontSize: 10, color: C.muted },

  langPicker:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, height: 48 },
  langPickerText:     { fontSize: 14, fontWeight: '600', color: C.text },

  themeRow:           { flexDirection: 'row', gap: 10 },
  themeBtn:           { flex: 1, alignItems: 'center', gap: 8, padding: 12, borderRadius: 16, borderWidth: 2, borderColor: C.border, backgroundColor: C.card2 },
  themeBtnActive:     { borderColor: C.primary, backgroundColor: C.primarySoft },
  themePreview:       { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  themeBtnText:       { fontSize: 11, fontWeight: '700', color: C.text2 },
  themeDot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },

  reminderToggleRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reminderToggleLabel:{ fontSize: 14, fontWeight: '600', color: C.text },

  timeGrid:           { gap: 8, marginTop: 6 },
  timeBtn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.card2 },
  timeBtnActive:      { borderColor: C.primary, backgroundColor: C.primarySoft },
  timeBtnLabel:       { fontSize: 13, fontWeight: '600', color: C.text },
  timeBtnTime:        { fontSize: 12, fontWeight: '700', color: C.muted },

  repeatRow:          { flexDirection: 'row', gap: 8, marginTop: 6 },
  repeatBtn:          { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.card2, alignItems: 'center' },
  repeatBtnActive:    { borderColor: C.primary, backgroundColor: C.primarySoft },
  repeatBtnText:      { fontSize: 12, fontWeight: '700', color: C.text2 },

  summaryRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border },
  summaryLabel:       { fontSize: 12, color: C.muted },
  summaryValue:       { fontSize: 12, fontWeight: '700', color: C.text },

  logoutBtn:          { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#ef444415', borderRadius: 12, borderWidth: 1, borderColor: '#ef444430' },
  logoutBtnText:      { fontSize: 13, fontWeight: '700', color: '#ef4444' },

  saveBar:            { gap: 10 },
  saveSuccess:        { fontSize: 13, color: C.primary, fontWeight: '600', textAlign: 'center' },
  saveError:          { fontSize: 13, color: '#ef4444', fontWeight: '600', textAlign: 'center' },
  saveBtn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, backgroundColor: C.primary, borderRadius: 16 },
  saveBtnText:        { fontSize: 15, fontWeight: '800', color: C.primaryFg },

  // Modals
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:         { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: 32 },
  modalHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle:         { fontSize: 16, fontWeight: '800' },
  langOption:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  langOptionText:     { fontSize: 14 },

  logoutModal:        { margin: 24, borderRadius: 24, padding: 28, alignItems: 'center', gap: 12 },
  logoutIconWrap:     { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ef444420', justifyContent: 'center', alignItems: 'center' },
  logoutModalTitle:   { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  logoutModalDesc:    { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  keepBtn:            { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', height: 50, backgroundColor: C.primary, borderRadius: 16, justifyContent: 'center' },
  keepBtnText:        { fontSize: 14, fontWeight: '800', color: C.primaryFg },
  confirmLogoutBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', height: 50, backgroundColor: C.card2, borderRadius: 16, justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  confirmLogoutText:  { fontSize: 14, fontWeight: '600' },
});
