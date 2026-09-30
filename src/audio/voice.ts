import { sfx } from './sfx';

/**
 * Voice lines use the browser's SpeechSynthesis. "Distorted" lines are pitched down
 * and layered with static, so the Unknown caller sounds wrong. Captions are always shown,
 * so the game is fully playable when no voices are installed.
 */
function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const en = voices.filter((v) => v.lang.startsWith('en'));
  return (
    en.find((v) => /female|samantha|zira|aria|jenny|google us english/i.test(v.name)) ?? en[0] ?? voices[0]
  );
}

export const voice = {
  speak(text: string, distorted: boolean) {
    const synth = window.speechSynthesis;
    if (!synth) return;
    try {
      const u = new SpeechSynthesisUtterance(text.replace(/\[.*?\]/g, ''));
      const v = pickVoice();
      if (v) u.voice = v;
      u.pitch = distorted ? 0.05 : 1.15;
      u.rate = distorted ? 0.78 : 0.98;
      u.volume = 1;
      synth.speak(u);
      if (distorted) sfx.staticHiss(Math.max(1.5, text.length * 0.07));
    } catch {
      /* captions cover it */
    }
  },
  cancel() {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
  },
  pause() {
    try {
      window.speechSynthesis?.pause();
    } catch {
      /* ignore */
    }
  },
  resume() {
    try {
      window.speechSynthesis?.resume();
    } catch {
      /* ignore */
    }
  },
};
