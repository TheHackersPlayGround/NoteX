import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const scaleAnim  = useRef(new Animated.Value(0.7)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnSlide   = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Phase 1: icon bounces in
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Phase 2: text fades + slides up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 700, delay: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 700, delay: 200,
        easing: Easing.out(Easing.back(1.3)),
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 3: button fades in
    Animated.parallel([
      Animated.timing(btnOpacity, {
        toValue: 1, duration: 500, delay: 900,
        useNativeDriver: true,
      }),
      Animated.timing(btnSlide, {
        toValue: 0, duration: 500, delay: 900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      {/* ── Teal header illustration area ── */}
      <LinearGradient
        colors={['#0ABFBC', '#00D4AA']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Decorative circles */}
        <View style={[styles.blob, { top: -30, left: -30, width: 130, height: 130, opacity: 0.15 }]} />
        <View style={[styles.blob, { bottom: 20, right: -20, width: 100, height: 100, opacity: 0.12 }]} />

        {/* Central icon group */}
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
          {/* outer ring */}
          <View style={styles.iconRingOuter}>
            <View style={styles.iconRingInner}>
              <Ionicons name="document-text" size={52} color="#fff" />
            </View>
          </View>
          {/* floating badges */}
          <View style={[styles.badge, { top: 0, right: -8 }]}>
            <Ionicons name="checkmark" size={12} color="#0ABFBC" />
          </View>
          <View style={[styles.badge, { bottom: 4, left: -12, backgroundColor: '#FFD166' }]}>
            <Ionicons name="star" size={10} color="#fff" />
          </View>
        </Animated.View>

        {/* Illustration label strip */}
        <View style={styles.stripRow}>
          {['Tasks', 'Notes', 'Search'].map((label, i) => (
            <View key={i} style={styles.stripItem}>
              <Ionicons
                name={i === 0 ? 'checkmark-circle' : i === 1 ? 'pencil' : 'search'}
                size={16} color="rgba(255,255,255,0.9)"
              />
              <Text style={styles.stripLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── White bottom card ── */}
      <View style={styles.card}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
          <Text style={styles.appName}>NoteX</Text>
          <Text style={styles.tagline}>
            Organize your tasks,{'\n'}notes, and ideas — effortlessly.
          </Text>
        </Animated.View>

        {/* CTA button */}
        <Animated.View style={{ opacity: btnOpacity, transform: [{ translateY: btnSlide }], width: '100%' }}>
          <TouchableOpacity
            style={styles.ctaBtn}
            activeOpacity={0.88}
            onPress={() => navigation.replace('Login')}
          >
            <LinearGradient
              colors={['#0ABFBC', '#00D4AA']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.footNote}>
            Already have an account?{' '}
            <Text
              style={styles.footLink}
              onPress={() => navigation.replace('Login')}
            >
              Sign In
            </Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#fff' },
  // Header
  header:      {
    height: height * 0.52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
    overflow: 'hidden',
  },
  blob:        { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  iconWrap:    { alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  iconRingOuter: {
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconRingInner: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  stripRow:    { flexDirection: 'row', gap: 20 },
  stripItem:   { alignItems: 'center', gap: 4 },
  stripLabel:  { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  // Card
  card:        {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 36,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appName:     { fontSize: 34, fontWeight: '800', color: '#0D2B2A', letterSpacing: -0.5, marginBottom: 12 },
  tagline:     {
    fontSize: 15, color: '#4A7070', textAlign: 'center',
    lineHeight: 22, paddingHorizontal: 16,
  },
  ctaBtn:      { width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 20, elevation: 5,
    shadowColor: '#0ABFBC', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 54 },
  ctaText:     { fontSize: 17, fontWeight: '700', color: '#fff' },
  footNote:    { fontSize: 14, color: '#4A7070', textAlign: 'center' },
  footLink:    { color: '#0ABFBC', fontWeight: '700' },
});
