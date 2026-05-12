import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Text } from 'react-native';

/**
 * WritingLoader — animated quill-pen writing animation.
 * Replaces ActivityIndicator for full-screen loading states.
 */
export default function WritingLoader({
  color = '#0ABFBC',
  bg    = 'transparent',
  label = 'Loading',
}) {
  const LINE_W   = 140;
  const WRITE_MS = 1400;

  const penX    = useRef(new Animated.Value(0)).current;
  const lineW   = useRef(new Animated.Value(0)).current;
  const alpha   = useRef(new Animated.Value(1)).current;

  // Bouncing dots
  const d0 = useRef(new Animated.Value(0)).current;
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;

  // ── Writing loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let stopped = false;

    function runLoop() {
      if (stopped) return;
      penX.setValue(0);
      lineW.setValue(0);
      alpha.setValue(1);

      Animated.sequence([
        // Step 1: pen + line grow simultaneously
        Animated.parallel([
          Animated.timing(penX, {
            toValue:  LINE_W,
            duration: WRITE_MS,
            easing:   Easing.inOut(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(lineW, {
            toValue:  LINE_W,
            duration: WRITE_MS,
            easing:   Easing.inOut(Easing.cubic),
            useNativeDriver: false,
          }),
        ]),
        // Step 2: short pause
        Animated.delay(300),
        // Step 3: fade out
        Animated.timing(alpha, {
          toValue:  0,
          duration: 350,
          easing:   Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        // Step 4: gap before next cycle
        Animated.delay(200),
      ]).start(({ finished }) => {
        if (finished && !stopped) runLoop();
      });
    }

    runLoop();
    return () => { stopped = true; };
  }, []);

  // ── Bouncing dots loop ────────────────────────────────────────────────────────
  useEffect(() => {
    function bounce(val, delay) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: -5, duration: 220, useNativeDriver: true }),
          Animated.timing(val, { toValue:  0, duration: 220, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    }

    const a0 = bounce(d0,   0);
    const a1 = bounce(d1, 150);
    const a2 = bounce(d2, 300);
    a0.start(); a1.start(); a2.start();
    return () => { a0.stop(); a1.stop(); a2.stop(); };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>

      {/* Writing canvas */}
      <Animated.View style={{ opacity: alpha, width: LINE_W + 36, height: 60, marginBottom: 18 }}>

        {/* Ink line */}
        <Animated.View style={{
          position:        'absolute',
          bottom:          14,
          left:            0,
          height:          2.5,
          width:           lineW,
          backgroundColor: color,
          borderRadius:    2,
          opacity:         0.8,
        }} />

        {/* Nib dot at pen tip */}
        <Animated.View style={{
          position:        'absolute',
          bottom:          11.5,
          left:            penX,
          width:           6,
          height:          6,
          borderRadius:    3,
          backgroundColor: color,
          opacity:         0.55,
          transform:       [{ translateX: -3 }],
        }} />

        {/* Pen emoji */}
        <Animated.Text style={{
          position:   'absolute',
          bottom:     16,
          left:       penX,
          fontSize:   26,
          transform:  [{ rotate: '-35deg' }, { translateX: -10 }],
        }}>
          🖊️
        </Animated.Text>
      </Animated.View>

      {/* Label + bouncing dots */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <Text style={{
          fontSize:   14,
          fontWeight: '600',
          color,
          fontFamily: 'Nunito_600SemiBold',
          letterSpacing: 0.3,
        }}>
          {label}
        </Text>
        {[d0, d1, d2].map((d, i) => (
          <Animated.Text
            key={i}
            style={{ fontSize: 16, color, fontWeight: '700', transform: [{ translateY: d }] }}
          >
            .
          </Animated.Text>
        ))}
      </View>

    </View>
  );
}
