// Voice service — reads text aloud for pre- and early readers (LogicLand serves
// ages 5–10). A thin, swappable wrapper over the browser Web Speech API: zero
// dependencies, no network, and easy to replace with a hosted TTS later. Every
// call is a safe no-op when speech synthesis isn't available (e.g. on the
// server or unsupported browsers), so callers never need to guard.

export interface SpeakOptions {
  /** 0.1–10. Children follow along better a little slower than default. */
  rate?: number;
  /** 0–2. A touch higher reads as friendly and warm. */
  pitch?: number;
  /** 0–1. */
  volume?: number;
}

export interface SpeakHandlers {
  onStart?: () => void;
  onEnd?: () => void;
}

const KID_DEFAULTS: Required<SpeakOptions> = {
  rate: 0.9,
  pitch: 1.15,
  volume: 1,
};

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Speak `text` aloud. The most recent request wins — we never overlap voices. */
export function speak(
  text: string,
  opts: SpeakOptions = {},
  handlers: SpeakHandlers = {},
): void {
  if (!isSpeechSupported() || !text.trim()) return;
  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const { rate, pitch, volume } = { ...KID_DEFAULTS, ...opts };
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;
  utterance.lang = "en-US";
  if (handlers.onStart) utterance.onstart = handlers.onStart;
  if (handlers.onEnd) {
    utterance.onend = handlers.onEnd;
    utterance.onerror = handlers.onEnd; // treat errors as "finished" for UI
  }

  synth.speak(utterance);
}

/** Stop any in-progress narration. */
export function stopSpeaking(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
