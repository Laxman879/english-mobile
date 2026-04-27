import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { Image } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();
import { C } from '../../lib/theme';

export default function RegisterScreen() {
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  const handleGoogleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      setSuccess(true);
      setTimeout(() => router.replace('/(tabs)'), 800);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      await registerWithEmail(name.trim(), email.trim(), password);
      setSuccess(true);
      setTimeout(() => router.replace('/(tabs)'), 800);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={s.logoWrap}>
            <View style={s.logoIcon}>
              <Ionicons name="flash" size={28} color={C.primaryFg} />
            </View>
            <Text style={s.logoTitle}>Polyglot Punch</Text>
            <Text style={s.logoSub}>Start your learning journey</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Create account</Text>
            <Text style={s.cardSub}>Join thousands of learners today</Text>

            {/* Success */}
            {success && (
              <View style={s.successBox}>
                <Ionicons name="checkmark-circle" size={16} color={C.primary} />
                <Text style={s.successText}>Account created! Redirecting…</Text>
              </View>
            )}

            {/* Error */}
            {!!error && (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* Name */}
            <View style={s.fieldWrap}>
              <Text style={s.label}>FULL NAME</Text>
              <View style={s.inputRow}>
                <Ionicons name="person-outline" size={16} color={C.muted} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Your name"
                  placeholderTextColor={C.muted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email */}
            <View style={s.fieldWrap}>
              <Text style={s.label}>EMAIL</Text>
              <View style={s.inputRow}>
                <Ionicons name="mail-outline" size={16} color={C.muted} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="you@example.com"
                  placeholderTextColor={C.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.fieldWrap}>
              <Text style={s.label}>PASSWORD</Text>
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

            {/* Register button */}
            <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleRegister} disabled={loading}>
              {loading
                ? <ActivityIndicator color={C.primaryFg} size="small" />
                : <Text style={s.btnText}>Create Account</Text>
              }
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Google Sign Up */}
            <TouchableOpacity style={s.googleBtn} onPress={handleGoogleRegister} disabled={loading}>
              <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png' }} style={s.googleIcon} />
              <Text style={s.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Go to login */}
            <View style={s.switchRow}>
              <Text style={s.switchText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={s.switchLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  scroll:      { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 },

  logoWrap:    { alignItems: 'center', gap: 8 },
  logoIcon:    { width: 64, height: 64, borderRadius: 20, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  logoTitle:   { fontSize: 22, fontWeight: '900', color: C.text },
  logoSub:     { fontSize: 12, color: C.muted },

  card:        { backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.border, padding: 24, gap: 16 },
  cardTitle:   { fontSize: 22, fontWeight: '900', color: C.text },
  cardSub:     { fontSize: 13, color: C.muted, marginTop: -8 },

  successBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primarySoft, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: `${C.primary}44` },
  successText: { fontSize: 13, color: C.primary, fontWeight: '600' },
  errorBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ef444420', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#ef444440' },
  errorText:   { fontSize: 13, color: '#ef4444', flex: 1 },

  fieldWrap:   { gap: 6 },
  label:       { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.5 },
  inputRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, height: 48 },
  inputIcon:   { marginRight: 8 },
  input:       { flex: 1, fontSize: 14, color: C.text },
  eyeBtn:      { padding: 4 },

  btn:         { height: 52, backgroundColor: C.primary, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText:     { fontSize: 15, fontWeight: '800', color: C.primaryFg },

  divider:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { fontSize: 12, color: C.muted },

  switchRow:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText:  { fontSize: 13, color: C.muted },
  switchLink:  { fontSize: 13, fontWeight: '700', color: C.primary },

  googleBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  googleIcon:  { width: 20, height: 20 },
  googleText:  { fontSize: 14, fontWeight: '700', color: C.text },
});
