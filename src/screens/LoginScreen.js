import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Alert,
  Dimensions, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../api';
import { useTheme } from '../ThemeContext';

const { height } = Dimensions.get('window');

function Field({ label, icon, rightIcon, onRightPress, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[fieldStyle.wrap, focused && fieldStyle.focused]}>
      <Ionicons name={icon} size={18} color={focused ? '#0ABFBC' : '#7AACAC'} style={fieldStyle.icon} />
      <TextInput
        style={fieldStyle.input}
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
  input:   { flex: 1, fontSize: 15, color: '#0D2B2A', fontFamily: 'Nunito_400Regular' },
});

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const scaleAnim    = useRef(new Animated.Value(0.5)).current;
  const iconFloat    = useRef(new Animated.Value(0)).current;
  const blob1Scale   = useRef(new Animated.Value(1)).current;
  const blob1Opacity = useRef(new Animated.Value(0.15)).current;
  const blob2Scale   = useRef(new Animated.Value(1)).current;
  const blob2Opacity = useRef(new Animated.Value(0.12)).current;
  const ringRotate   = useRef(new Animated.Value(0)).current;
  const cardFade     = useRef(new Animated.Value(0)).current;
  const cardSlide    = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
    Animated.parallel([
      Animated.timing(cardFade,  { toValue: 1, duration: 600, delay: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 0, duration: 600, delay: 200, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(iconFloat, { toValue: -12, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(iconFloat, { toValue: 0,   duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(blob1Scale,   { toValue: 1.4,  duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(blob1Opacity, { toValue: 0.25, duration: 2200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(blob1Scale,   { toValue: 1,    duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(blob1Opacity, { toValue: 0.08, duration: 2200, useNativeDriver: true }),
      ]),
    ])).start();

    setTimeout(() => {
      Animated.loop(Animated.sequence([
        Animated.parallel([
          Animated.timing(blob2Scale,   { toValue: 1.35, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(blob2Opacity, { toValue: 0.22, duration: 2600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(blob2Scale,   { toValue: 1,    duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(blob2Opacity, { toValue: 0.07, duration: 2600, useNativeDriver: true }),
        ]),
      ])).start();
    }, 800);

    Animated.loop(
      Animated.timing(ringRotate, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  const spin = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const handleLogin = async () => {
    setError('');
    if (!username.trim() || !password.trim()) { setError('Please enter both username and password.'); return; }
    setLoading(true);
    try {
      await login(username.trim(), password);
      Alert.alert('👋 Welcome back!', `Logged in as ${username.trim()}.`, [
        { text: 'OK', onPress: () => navigation.replace('MainTabs') },
      ]);
    } catch (e) {
      setError(e.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <LinearGradient colors={['#0ABFBC', '#00D4AA']} start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Animated.View style={[styles.blob, { top: -30, right: -20, width: 110, height: 110 }, { opacity: blob1Opacity, transform: [{ scale: blob1Scale }] }]} />
          <Animated.View style={[styles.blob, { bottom: 10, left: -15, width: 80, height: 80 }, { opacity: blob2Opacity, transform: [{ scale: blob2Scale }] }]} />

          <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }, { translateY: iconFloat }] }]}>
            <Animated.View style={[styles.iconRingOuter, { transform: [{ rotate: spin }] }]}>
              <View style={styles.iconRingInner}>
                <Ionicons name="log-in-outline" size={44} color="#fff" />
              </View>
            </Animated.View>
          </Animated.View>

          <Text style={styles.headerTitle}>Log in to stay on top</Text>
          <Text style={styles.headerSub}>of your tasks and notes.</Text>
        </LinearGradient>

        <Animated.View style={[styles.card, { opacity: cardFade, transform: [{ translateY: cardSlide }] }]}>
          <Text style={styles.cardTitle}>Login</Text>
          <Text style={styles.cardSub}>
            Don't have an account?{' '}
            <Text style={styles.link} onPress={() => navigation.navigate('SignUp')}>Sign Up</Text>
          </Text>
          <View style={{ height: 20 }} />
          <Field label="Enter your username" icon="person-outline" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <Field label="Enter your password" icon="lock-closed-outline" value={password} onChangeText={setPassword} secureTextEntry={!showPass}
            rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'} onRightPress={() => setShowPass(p => !p)} />
          <View style={styles.metaRow}>
            <View />
            <Text style={[styles.link, { fontSize: 13 }]}>Forgot Password?</Text>
          </View>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={14} color="#FF4D6D" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <TouchableOpacity style={styles.btnWrap} activeOpacity={0.88} onPress={handleLogin} disabled={loading}>
            <LinearGradient colors={['#0ABFBC', '#00D4AA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Login</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#fff' },
  scroll:        { flexGrow: 1 },
  header:        { height: height * 0.32, alignItems: 'center', justifyContent: 'center', paddingBottom: 20, overflow: 'hidden' },
  blob:          { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  iconWrap:      { marginBottom: 14 },
  iconRingOuter: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  iconRingInner: { width: 74, height: 74, borderRadius: 37, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { fontSize: 19, fontWeight: '800', color: '#fff', fontFamily: 'Nunito_800ExtraBold' },
  headerSub:     { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 3, fontFamily: 'Nunito_400Regular' },
  card:          { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -26, paddingHorizontal: 28, paddingTop: 30, paddingBottom: 36, flex: 1 },
  cardTitle:     { fontSize: 26, fontWeight: '800', color: '#0D2B2A', fontFamily: 'Nunito_800ExtraBold' },
  cardSub:       { fontSize: 13, color: '#4A7070', marginTop: 4, fontFamily: 'Nunito_400Regular' },
  link:          { color: '#0ABFBC', fontWeight: '700', fontFamily: 'Nunito_700Bold' },
  metaRow:       { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
  errorBox:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF0F3', borderRadius: 10, padding: 10, marginBottom: 12 },
  errorText:     { color: '#FF4D6D', fontSize: 13, flex: 1, fontFamily: 'Nunito_400Regular' },
  btnWrap:       { borderRadius: 14, overflow: 'hidden', elevation: 5, shadowColor: '#0ABFBC', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  btnGrad:       { height: 52, alignItems: 'center', justifyContent: 'center' },
  btnText:       { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Nunito_700Bold' },
});
