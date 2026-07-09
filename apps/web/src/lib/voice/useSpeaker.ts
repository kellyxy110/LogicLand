"use client";
// React binding for the voice service. Tracks whether narration is currently
// playing so buttons can show a gentle "speaking" animation, and stops any
// narration when the component using it unmounts.
import { useCallback, useEffect, useState } from "react";
import { isSpeechSupported, speak, stopSpeaking, type SpeakOptions } from "./speak";

export function useSpeaker() {
  const [speaking, setSpeaking] = useState(false);
  const supported = isSpeechSupported();

  const say = useCallback(
    (text: string, opts?: SpeakOptions) => {
      speak(text, opts, {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
      });
    },
    [],
  );

  const stop = useCallback(() => {
    stopSpeaking();
    setSpeaking(false);
  }, []);

  // Never let a voice keep playing after the screen changes.
  useEffect(() => () => stopSpeaking(), []);

  return { say, stop, speaking, supported };
}
