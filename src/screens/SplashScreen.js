import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  // ── Entry animations ───────────────────────────────────────────────────────
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const scaleAnim  = useRef(new Animated.Value(0.5)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnSlide   = useRef(new Animated.Value(20)).current;

  // ── Looping animations ─────────────────────────────────────────────────────
  const iconFloat  = useRef(new Animated.Value(0)).current;   // icon up/down
  const blob1Scale = useRef(new Animated.Value(1)).current;   // top-left circle pulse
  const blob2Scale = useRef(new Animated.Value(1)).current;   // bottom-right circle pulse
  const blob1Opacity = useRef(new Animated.Value(0.15)).current;
  const blob2Opacity = useRef(new Animated.Value(0.12)).current;
  const badge1Float  = useRef(new Animated.Value(0)).current; // checkmark badge
  const badge2Float  = useRef(new Animated.Value(0)).current; // star badge
  const ringRotate   = useRef(new Animated.Value(0)).current; // outer ring slow spin

  useEffect(() => {
    // ── Entry: icon bounces in ──────────────────────────────────────────────
    Animated.spring(scaleAnim, {
      toValue: 1, friction: 5, tension: 40,
      useNativeDriver: true,
    }).start();

    // ── Entry: text fades + slides up ───────────────────────────────────────
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 700, delay: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 700, delay: 250,
        easing: Easing.out(Easing.back(1.3)),
        useNativeDriver: true,
      }),
    ]).start();

    // ── Entry: button fades in ──────────────────────────────────────────────
    Animated.parallel([
      Animated.timing(btnOpacity, {
        toValue: 1, duration: 500, delay: 950,
        useNativeDriver: true,
      }),
      Animated.timing(btnSlide, {
        toValue: 0, duration: 500, delay: 950,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // ── Loop: note icon gentle float ────────────────────────────────────────
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconFloat, {
          toValue: -14, duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(iconFloat, {
          toValue: 0, duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ── Loop: blob 1 (top-left) pulse ───────────────────────────────────────
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(blob1Scale, {
            toValue: 1.35, duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(blob1Opacity, {
            toValue: 0.25, duration: 2200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(blob1Scale, {
            toValue: 1, duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(blob1Opacity, {
            toValue: 0.1, duration: 2200,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // ── Loop: blob 2 (bottom-right) pulse — offset timing ───────────────────
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(blob2Scale, {
              toValue: 1.4, duration: 2600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(blob2Opacity, {
              toValue: 0.22, duration: 2600,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(blob2Scale, {
              toValue: 1, duration: 2600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(blob2Opacity, {
              toValue: 0.08, duration: 2600,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }, 900);

    // ── Loop: badge 1 (checkmark) float – upward ────────────────────────────
    Animated.loop(
      Animated.sequence([
        Animated.timing(badge1Float, {
          toValue: -10, duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(badge1Float, {
          toValue: 4, duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ── Loop: badge 2 (star) float – opposite phase ─────────────────────────
    Animated.loop(
      Animated.sequence([
        Animated.timing(badge2Float, {
          toValue: 8, duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(badge2Float, {
          toValue: -6, duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ── Loop: outer ring slow rotation ──────────────────────────────────────
    Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1, duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.root}>
      {/* ── Teal header ── */}
      <LinearGradient
        colors={['#0ABFBC', '#00D4AA']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Blob 1 — top left */}
        <Animated.View style={[
          styles.blob,
          { top: -30, left: -30, width: 130, height: 130 },
          { opacity: blob1Opacity, transform: [{ scale: blob1Scale }] },
        ]} />

        {/* Blob 2 — bottom right */}
        <Animated.View style={[
          styles.blob,
          { bottom: 20, right: -20, width: 100, height: 100 },
          { opacity: blob2Opacity, transform: [{ scale: blob2Scale }] },
        ]} />

        {/* Extra small blob — mid left for depth */}
        <Animated.View style={[
          styles.blob,
          { top: '40%', left: 20, width: 50, height: 50, opacity: 0.1 },
          { transform: [{ scale: blob2Scale }] },
        ]} />

        {/* Central icon group */}
        <Animated.View style={[
          styles.iconWrap,
          { transform: [{ scale: scaleAnim }, { translateY: iconFloat }] },
        ]}>
          {/* Outer ring — slowly rotates */}
          <Animated.View style={[styles.iconRingOuter, { transform: [{ rotate: spin }] }]}>
            <View style={styles.iconRingInner}>
              <Ionicons name="document-text" size={52} color="#fff" />
            </View>
          </Animated.View>

          {/* Badge 1 — checkmark, floats up */}
          <Animated.View style={[
            styles.badge,
            { top: 0, right: -8 },
            { transform: [{ translateY: badge1Float }] },
          ]}>
            <Ionicons name="checkmark" size={12} color="#0ABFBC" />
          </Animated.View>

          {/* Badge 2 — star, floats down */}
          <Animated.View style={[
            styles.badge,
            { bottom: 4, left: -12, backgroundColor: '#FFD166' },
            { transform: [{ translateY: badge2Float }] },
          ]}>
            <Ionicons name="star" size={10} color="#fff" />
          </Animated.View>
        </Animated.View>

        {/* Feature strip */}
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

      {/* ── White card ── */}
      <View style={styles.card}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
          <Text style={styles.appName}>NoteX</Text>
          <Text style={styles.tagline}>
            Organize your tasks,{'\n'}notes, and ideas — effortlessly.
          </Text>
        </Animated.View>

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
            <Text style={styles.footLink} onPress={() => navigation.replace('Login')}>
              Sign In
            </Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#fff' },
  header:        { height: height * 0.52, alignItems: 'center', justifyContent: 'center', paddingBottom: 24, overflow: 'hidden' },
  blob:          { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  iconWrap:      { alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  iconRingOuter: { width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  iconRingInner: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  badge:         { position: 'absolute', width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  stripRow:      { flexDirection: 'row', gap: 20 },
  stripItem:     { alignItems: 'center', gap: 4 },
  stripLabel:    { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  card:          { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -28, paddingHorizontal: 28, paddingTop: 36, paddingBottom: 36, alignItems: 'center', justifyContent: 'space-between' },
  appName:       { fontSize: 34, fontWeight: '800', color: '#0D2B2A', letterSpacing: -0.5, marginBottom: 12 },
  tagline:       { fontSize: 15, color: '#4A7070', textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
  ctaBtn:        { width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 20, elevation: 5, shadowColor: '#0ABFBC', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  ctaGradient:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 54 },
  ctaText:       { fontSize: 17, fontWeight: '700', color: '#fff' },
  footNote:      { fontSize: 14, color: '#4A7070', textAlign: 'center' },
  footLink:      { color: '#0ABFBC', fontWeight: '700' },
});
