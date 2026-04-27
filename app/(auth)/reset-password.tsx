import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { C } from '../../lib/theme';
import api from '../../lib/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [token, setToken]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);

  const handleReset = async () => {
    if (!token || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: token.trim(), password });
      setDone(true);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={s.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>

          <View style={s.logoWrap}>
            <View style={s.logoIcon}><Ionicons name="key-outline" size={28} color={C.primaryFg} /></View>
            <Text style={s.logoTitle}>Reset Password</Text>
            <Text style={s.logoSub}>Enter the code from your email</Text>
          </View>

          <View style={s.card}>
            {done ? (
              <View style={s.successBox}>
                <Ionicons name="checkmark-circle" size={32} color={C.primary} />
                <Text style={s.successTitle}>Password Reset!</Text>
                <Text style={s.successDesc}>Your password has been updated. You can now sign in.</Text>
                <TouchableOpacity style={s.btn} onPress={() => router.replace('/(auth)/login')}>
                  <Text style={s.btnText}>Go to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {!!error && (
                  <View style={s.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#ef4444" />
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                )}
                <View style={s.fieldWrap}>
                  <Text style={s.label}>RESET CODE</Text>
                  <View style={s.inputRow}>
                    <Ionicons name="key-outline" size={16} color={C.muted} style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor={C.muted}
                      value={token}
                      onChangeText={setToken}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
                <View style={s.fieldWrap}>
                  <Text style={s.label}>NEW PASSWORD</Text>
                  <View style={s.inputRow}>
                    <Ionicons name="lock-closed-outline" size={16} color={C.muted} style={s.inputIcon} />
                    <TextInput
                      style={[s.input, { flex: 1 }]}
                      placeholder="Min. 6 characters"
                      placeholderTextColor={C.muted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPass}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eyeBtn}>
                      <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.muted} />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleReset} disabled={loading}>
                  {loading ? <ActivityIndicator color={C.primaryFg} size="small" /> : <Text style={s.btnText}>Reset Password</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  scroll:       { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 },
  back:         { position: 'absolute', top: 16, left: 16, zIndex: 10, padding: 4 },
  logoWrap:     { alignItems: 'center', gap: 8, marginTop: 40 },
  logoIcon:     { width: 64, height: 64, borderRadius: 20, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  logoTitle:    { fontSize: 22, fontWeight: '900', color: C.text },
  logoSub:      { fontSize: 12, color: C.muted },
  card:         { backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.border, padding: 24, gap: 16 },
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ef444420', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#ef444440' },
  errorText:    { fontSize: 13, color: '#ef4444', flex: 1 },
  fieldWrap:    { gap: 6 },
  label:        { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.5 },
  inputRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, height: 48 },
  inputIcon:    { marginRight: 8 },
  input:        { flex: 1, fontSize: 14, color: C.text },
  eyeBtn:       { padding: 4 },
  btn:          { height: 52, backgroundColor: C.primary, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  btnDisabled:  { opacity: 0.6 },
  btnText:      { fontSize: 15, fontWeight: '800', color: C.primaryFg },
  successBox:   { alignItems: 'center', gap: 12, padding: 8 },
  successTitle: { fontSize: 18, fontWeight: '900', color: C.text },
  successDesc:  { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },
});
