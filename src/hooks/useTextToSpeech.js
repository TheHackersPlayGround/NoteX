import { useState, useEffect, useCallback } from 'react';
import * as Speech from 'expo-speech';

/**
 * useTextToSpeech
 *
 * Returns:
 *   speak(text)  — start speaking, stops any current speech first
 *   stop()       — stop speaking immediately
 *   isSpeaking   — true while TTS is active
 */
export default function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text) => {
    if (!text?.trim()) return;

    // If already speaking the same content, act as a toggle
    if (isSpeaking) { stop(); return; }

    // Strip HTML tags for note body
    const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean) return;

    setIsSpeaking(true);
    Speech.speak(clean, {
      language: 'en-US',
      pitch:    1.0,
      rate:     0.95,
      onDone:   () => setIsSpeaking(false),
      onError:  () => setIsSpeaking(false),
      onStopped:() => setIsSpeaking(false),
    });
  }, [isSpeaking, stop]);

  return { speak, stop, isSpeaking };
}
