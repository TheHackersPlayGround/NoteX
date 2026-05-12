import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useNetworkStatus from '../hooks/useNetworkStatus';

/**
 * NetworkBadge
 * A small pill shown in the navigation header (top-left).
 *
 * Online  → teal dot + "Online"   (fades out after 3 s on first render / reconnect)
 * Offline → red dot + "Offline"   (stays visible until back online)
 */
export default function NetworkBadge() {
  const { offline } = useNetworkStatus();
  const opacity    = useRef(new Animated.Value(1)).current;
  const prevOffline = useRef(null);
  const hideTimer   = useRef(null);

  useEffect(() => {
    // First render
    if (prevOffline.current === null) {
      prevOffline.current = offline;
      if (!offline) {
        // Already online — show briefly then fade
        scheduleFade();
      }
      return;
    }

    // State change
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    clearTimeout(hideTimer.current);

    if (!offline && prevOffline.current === true) {
      // Just came back online — show briefly then fade
      scheduleFade();
    }
    prevOffline.current = offline;
  }, [offline]);

  function scheduleFade() {
    hideTimer.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 3000);
  }

  const isOffline  = offline;
  const dotColor   = isOffline ? '#FF4D6D' : '#22C55E';
  const label      = isOffline ? 'Offline'  : 'Online';

  return (
    <Animated.View style={{ opacity, marginRight: 14 }}>
      <View style={{
        flexDirection:  'row',
        alignItems:     'center',
        gap:            5,
        backgroundColor: isOffline ? 'rgba(255,77,109,0.12)' : 'rgba(34,197,94,0.12)',
        borderRadius:   20,
        paddingHorizontal: 9,
        paddingVertical:   4,
        borderWidth:    1,
        borderColor:    isOffline ? 'rgba(255,77,109,0.25)' : 'rgba(34,197,94,0.25)',
      }}>
        {/* Pulsing dot */}
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dotColor }} />
        <Text style={{
          fontSize:   11,
          fontWeight: '700',
          color:      dotColor,
          fontFamily: 'Nunito_700Bold',
          letterSpacing: 0.3,
        }}>
          {label}
        </Text>
      </View>
    </Animated.View>
  );
}
