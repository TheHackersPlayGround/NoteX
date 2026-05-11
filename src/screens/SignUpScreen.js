import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest, makeRedirectUri, useAutoDiscovery, exchangeCodeAsync } from 'expo-auth-session';
import { register, googleLogin } from '../api';
import { useTheme } from '../ThemeContext';

// ─────────────────────────────────────────────────────────────────────────────
//  ⚠️  REPLACE with your Google OAuth Web Client ID (same as LoginScreen.js)
// ─────────────────────────────────────────────────────────────────────────────
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

WebBrowser.maybeCompleteAuthSession();

const { height } = Dimensions.get('window');

// ── Focused input field ───────────────────────────────────────────────────────
function Field({ label, icon, rightIcon, onRightPress, colors, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[fieldStyle.wrap, focused && fieldStyle.focused]}>
      <Ionicons name={icon} size={18} color={focused ? '#0ABFBC' : '#7AACAC'} style={fieldStyle.icon} />
      <TextInput
        style={[fieldStyle.input, { color: '#0D2B2A' }]}
        placeholder={label}
        placeholderTextColor="#B0C4C4"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightPress} style={{ padding: 6 }}>
          <Ionicons name={rightIcon} size={18} color="#7AACAC" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const fieldStyle = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F8F8', borderRadius: 12, paddingHorizontal: 14, marginBottom: 14, height: 52, borderWidth: 1, borderColor: '#D0E8E8' },
  focused: { borderColor: '#0ABFBC', borderWidth: 1.5, backgroundColor: '#E8F8F8' },
  icon:    { marginRight: 10 },
  input:   { flex: 1, fontSize: 15 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SignUpScreen({ navigation }) {
  const { colors } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error,    setError]    = useState('');

  // ── Google OAuth (Code + PKCE — required by Google's OAuth 2.0 policy) ──────────
  const redirectUri = makeRedirectUri({ useProxy: true });
  const discovery  = useAutoDiscovery('https://accounts.google.com');

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: GOOGLE_WEB_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
    },
    discovery,
  );

  useEffect(() => {
    if (response?.type === 'success' && discovery) {
      setGLoading(true);
      const { code } = response.params;
      exchangeCodeAsync(
        {
          clientId: GOOGLE_WEB_CLIENT_ID,
          code,
          redirectUri,
          extraParams: request?.codeVerifier ? { code_verifier: request.codeVerifier } : {},
        },
        discovery,
      )
        .then(tokenResponse => handleGoogleToken(tokenResponse.accessToken))
        .catch(e => {
          setError('Google sign-in failed: ' + (e.message || 'Unknown error'));
          setGLoading(false);
        });
    } else if (response?.type === 'error' || response?.type === 'dismiss') {
      setGLoading(false);
    }
  }, [response, discovery]);

  const handleGoogleToken = async (accessToken) => {
    setGLoading(true);
    setError('');
    try {
      const data = await googleLogin(accessToken);
      Alert.alert('🎉 Account Ready!', `Welcome to NoteX, ${data.username}!`, [
        { text: 'Get Started', onPress: () => navigation.replace('MainTabs') },
      ]);
    } catch (e) {
      setError(e.message || 'Google sign-in failed.');
    } finally {
      setGLoading(false);
    }
  };

  const onGooglePress = () => {
    setGLoading(true);
    setError('');
    promptAsync();
  };

  // ── Normal register ─────────────────────────────────────────────────────────
  const handleSignUp = async () => {
    setError('');
    if (!username.trim() || !password.trim() || !confirm.trim()) { setError('Please fill in all fields.'); return; }
    if (username.trim().length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (password.length < 6)        { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm)        { setError('Passwords do not match!'); return; }
    setLoading(true);
    try {
      await register(username.trim(), password);
      Alert.alert(
        '🎉 Account Created!',
        `Welcome to NoteX, ${username.trim()}!`,
        [{ text: 'Get Started', onPress: () => navigation.replace('MainTabs') }]
      );
    } catch (e) {
      setError(e.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Teal header ── */}
        <LinearGradient colors={['#00D4AA', '#0ABFBC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={[styles.blob, { top: -25, left: -25, width: 100, height: 100 }]} />
          <View style={[styles.blob, { bottom: 0, right: -15, width: 70, height: 70 }]} />
          <View style={styles.iconCircle}>
            <Ionicons name="person-add-outline" size={44} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Create Your Account</Text>
          <Text style={styles.headerSub}>and Simplify Your Workday</Text>
        </LinearGradient>

        {/* ── White card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign up</Text>
          <Text style={styles.cardSub}>
            Already Have An Account?{' '}
            <Text style={styles.link} onPress={() => navigation.goBack()}>Sign In</Text>
          </Text>

          <View style={{ height: 20 }} />

          <Field colors={colors} label="Choose a username" icon="person-outline"
            value={username} onChangeText={setUsername} autoCapitalize="none" />
          <Field colors={colors} label="Create password" icon="lock-closed-outline"
            value={password} onChangeText={setPassword} secureTextEntry={!showPass}
            rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
            onRightPress={() => setShowPass(p => !p)} />
          <Field colors={colors} label="Confirm password" icon="shield-checkmark-outline"
            value={confirm} onChangeText={setConfirm} secureTextEntry={!showConf}
            rightIcon={showConf ? 'eye-off-outline' : 'eye-outline'}
            onRightPress={() => setShowConf(p => !p)} />

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={14} color="#FF4D6D" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Sign Up button */}
          <TouchableOpacity style={styles.btnWrap} activeOpacity={0.88} onPress={handleSignUp} disabled={loading || gLoading}>
            <LinearGradient colors={['#0ABFBC', '#00D4AA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnText}>Create Account</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divRow}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>Or Continue With</Text>
            <View style={styles.divLine} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            {/* Facebook — coming soon */}
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => Alert.alert('📘 Coming Soon', 'Facebook Sign-In will be available in a future update.')}
            >
              <Ionicons name="logo-facebook" size={20} color="#1877F2" />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialBtn, gLoading && { opacity: 0.7 }]}
              onPress={onGooglePress}
              disabled={gLoading || loading}
            >
              {gLoading
                ? <ActivityIndicator size="small" color="#0ABFBC" />
                : <>
                    <Ionicons name="logo-google" size={20} color="#EA4335" />
                    <Text style={styles.socialText}>Google</Text>
                  </>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.footRow} onPress={() => navigation.goBack()}>
            <Text style={styles.footNote}>Already have an account? </Text>
            <Text style={styles.link}>Log In</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#fff' },
  scroll:      { flexGrow: 1 },
  header:      { height: height * 0.28, alignItems: 'center', justifyContent: 'center', paddingBottom: 16, overflow: 'hidden' },
  blob:        { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)' },
  iconCircle:  { width: 86, height: 86, borderRadius: 43, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)', marginBottom: 10 },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  card:        { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -26, paddingHorizontal: 28, paddingTop: 30, paddingBottom: 36, flex: 1 },
  cardTitle:   { fontSize: 26, fontWeight: '800', color: '#0D2B2A' },
  cardSub:     { fontSize: 13, color: '#4A7070', marginTop: 4 },
  link:        { color: '#0ABFBC', fontWeight: '700' },
  errorBox:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF0F3', borderRadius: 10, padding: 10, marginBottom: 12 },
  errorText:   { color: '#FF4D6D', fontSize: 13, flex: 1 },
  btnWrap:     { borderRadius: 14, overflow: 'hidden', marginBottom: 24, elevation: 5, shadowColor: '#0ABFBC', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  btnGrad:     { height: 52, alignItems: 'center', justifyContent: 'center' },
  btnText:     { fontSize: 16, fontWeight: '700', color: '#fff' },
  divRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  divLine:     { flex: 1, height: 1, backgroundColor: '#E8F0F0' },
  divText:     { fontSize: 12, color: '#B0C4C4', fontWeight: '600' },
  socialRow:   { flexDirection: 'row', gap: 12, marginBottom: 24 },
  socialBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: '#E8F0F0' },
  socialText:  { fontSize: 14, fontWeight: '600', color: '#0D2B2A' },
  footRow:     { flexDirection: 'row', justifyContent: 'center' },
  footNote:    { fontSize: 14, color: '#4A7070' },
});
