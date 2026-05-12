import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useNetworkStatus from '../hooks/useNetworkStatus';
import { sendNetworkNotification } from '../notifications';

const SCREEN_W   = Dimensions.get('window').width;
const TOAST_MS   = 10000; // visible for 10 seconds
const SLIDE_MS   = 350;
const FADE_MS    = 400;

/**
 * OfflineBanner / Network Toast
 *
 * Slides down from the top on EVERY connectivity change:
 *   • Going offline  → red banner "No Internet Connection"  (stays until dismissed or 10 s)
 *   • Back online    → teal banner "Back Online"             (auto-dismiss after 10 s)
 *
 * Also fires a device push notification via expo-notifications.
 */
export default function OfflineBanner() {
  const { offline }      = useNetworkStatus();
  const prevOffline      = useRef(null); // null = first render not yet processed
  const [show, setShow]  = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Progress bar width (shrinks from 100 % to 0 % over TOAST_MS)
  const progress   = useRef(new Animated.Value(1)).current;
  const slideY     = useRef(new Animated.Value(-120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const hideTimer  = useRef(null);
  const progAnim   = useRef(null);

  const slideIn = () => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const slideOut = (cb) => {
    Animated.parallel([
      Animated.timing(slideY,  { toValue: -120, duration: SLIDE_MS, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,    duration: FADE_MS,  useNativeDriver: true }),
    ]).start(() => { setShow(false); cb?.(); });
  };

  const startAutoHide = () => {
    // Reset + animate progress bar
    progress.setValue(1);
    if (progAnim.current) progAnim.current.stop();
    progAnim.current = Animated.timing(progress, {
      toValue:  0,
      duration: TOAST_MS,
      useNativeDriver: false,
    });
    progAnim.current.start();

    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => slideOut(), TOAST_MS);
  };

  useEffect(() => {
    // Skip the very first render (no change has happened yet)
    if (prevOffline.current === null) {
      prevOffline.current = offline;
      return;
    }
    // Only act on actual state changes
    if (prevOffline.current === offline) return;
    prevOffline.current = offline;

    // Fire device notification
    sendNetworkNotification(!offline);

    // Cancel any in-progress hide
    clearTimeout(hideTimer.current);
    if (progAnim.current) progAnim.current.stop();

    setIsOffline(offline);
    setShow(true);
    // Reset position before sliding in
    slideY.setValue(-120);
    opacity.setValue(0);

    // Small delay so React renders the component first
    requestAnimationFrame(() => {
      slideIn();
      startAutoHide();
    });

    return () => {
      clearTimeout(hideTimer.current);
      if (progAnim.current) progAnim.current.stop();
    };
  }, [offline]);

  if (!show) return null;

  const bg        = isOffline ? '#FF4D6D' : '#0ABFBC';
  const progressBg = isOffline ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.3)';
  const icon      = isOffline ? 'cloud-offline-outline' : 'wifi';
  const title     = isOffline ? 'No Internet Connection' : 'Back Online — Sync Now';
  const subtitle  = isOffline
    ? 'Cached Tasks, Notes & Categories still available.'
    : 'Pull to refresh to sync latest data from server.';

  return (
    <Animated.View
      style={[styles.wrapper, { backgroundColor: bg, transform: [{ translateY: slideY }], opacity }]}
      pointerEvents="none"
    >
      {/* Content row */}
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{subtitle}</Text>
        </View>
        {/* Countdown hint */}
        <Text style={styles.timer}>10s</Text>
      </View>

      {/* Progress bar — shrinks left to right */}
      <View style={[styles.progBg, { backgroundColor: progressBg }]}>
        <Animated.View
          style={[
            styles.progFill,
            {
              width: progress.interpolate({
                inputRange:  [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position:      'absolute',
    top:           0,
    left:          0,
    right:         0,
    zIndex:        9999,
    elevation:     12,
    paddingTop:    48, // clear status bar
    paddingBottom: 4,
    shadowColor:   '#000',
    shadowOpacity: 0.25,
    shadowRadius:  10,
    shadowOffset:  { width: 0, height: 4 },
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 16,
    paddingBottom:  10,
    gap: 12,
  },
  iconWrap: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  title: {
    color:      '#fff',
    fontSize:   14,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
  },
  sub: {
    color:      'rgba(255,255,255,0.88)',
    fontSize:   12,
    fontFamily: 'Nunito_400Regular',
    marginTop:  2,
  },
  timer: {
    color:      'rgba(255,255,255,0.7)',
    fontSize:   11,
    fontFamily: 'Nunito_600SemiBold',
  },
  progBg: {
    height:  3,
    width:   '100%',
  },
  progFill: {
    height:          3,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
});
