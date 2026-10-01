import { sfx } from './sfx';

/**
 * Voice lines use the browser's SpeechSynthesis. "Distorted" lines are pitched down and layered
 * with static, so the Unknown caller sounds wrong. Captions are always shown, so the game stays
 * fully playable when speech is unavailable or misbehaves.
 *
 * SpeechSynthesis is fragile across browsers, so this module defends against its known failures:
 * - Online/network voices ("Google US English", Edge "… Online (Natural)") lag, ignore pitch,
 *   and can keep playing after cancel() → we prefer local voices.
 * - Audio from a cancelled line can surface much later → every utterance carries a generation;
 *   if a stale one starts, it is killed on the spot.
 * - The engine can wedge (nothing ever starts) → a watchdog cancels and retries once.
 * - Queued lines pile up behind slow ones → a new line interrupts instead of queueing.
 * - pause()/resume() are unreliable (Chrome can replay or stay stuck) → we never use them.
 */

const START_TIMEOUT_MS = 2500;
/** Chrome drops a speak() issued in the same tick as cancel(). */
const AFTER_CANCEL_MS = 60;

let generation = 0;
let cachedVoice: SpeechSynthesisVoice | null | undefined;

function synth(): SpeechSynthesis | undefined {
  return typeof window !== 'undefined' ? window.speechSynthesis : undefined;
}

export function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const en = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
  const preferred = /female|samantha|zira|aria|jenny|karen|moira|tessa|susan|hazel/i;
  const local = en.filter((v) => v.localService);
  return (
    local.find((v) => preferred.test(v.name)) ??
    local[0] ??
    voices.find((v) => v.localService) ??
    en.find((v) => preferred.test(v.name)) ??
    en[0] ??
    voices[0]
  );
}

function currentVoice(): SpeechSynthesisVoice | undefined {
  if (cachedVoice === undefined) {
    const voices = synth()?.getVoices() ?? [];
    if (!voices.length) return undefined; // not loaded yet; voiceschanged will fill the cache
    cachedVoice = pickVoice(voices) ?? null;
  }
  return cachedVoice ?? undefined;
}

/** Long utterances get cut off after ~15s in Chrome, so speak sentence by sentence. */
export function chunk(text: string): string[] {
  const clean = text.replace(/\[.*?\]/g, '').trim();
  if (!clean) return [];
  const parts = clean.match(/[^.!?…]+[.!?…]*["”']?\s*/g) ?? [clean];
  return parts.map((p) => p.trim()).filter((p) => /[a-z0-9]/i.test(p));
}

/**
 * Speak parts[i], then the next part when it ends. Each part has its own start watchdog.
 * onDone fires once the whole line has finished (or speech gave up), never for a superseded line.
 */
function utter(parts: string[], i: number, distorted: boolean, gen: number, onDone?: () => void, retried = false) {
  const s = synth();
  if (!s || gen !== generation) return;
  if (i >= parts.length) {
    onDone?.();
    return;
  }
  let started = false;
  let done = false;
  const next = () => {
    if (done) return;
    done = true;
    utter(parts, i + 1, distorted, gen, onDone);
  };
  const u = new SpeechSynthesisUtterance(parts[i]);
  const v = currentVoice();
  if (v) u.voice = v;
  u.pitch = distorted ? 0.05 : 1.15;
  u.rate = distorted ? 0.78 : 0.98;
  u.volume = 1;
  u.onstart = () => {
    started = true;
    // Late audio from a line that was already cancelled: kill it.
    if (gen !== generation) s.cancel();
  };
  u.onend = next;
  u.onerror = () => {
    started = true;
    next();
  };
  if (s.paused) s.resume();
  s.speak(u);
  setTimeout(() => {
    if (started || gen !== generation) return;
    // The engine is wedged. Reset it and try once more; captions cover a second failure.
    done = true;
    s.cancel();
    if (!retried) setTimeout(() => utter(parts, i, distorted, gen, onDone, true), AFTER_CANCEL_MS);
    else onDone?.();
  }, START_TIMEOUT_MS);
}

export const voice = {
  /** Call once on a user gesture so voices are loaded before the first call. */
  init() {
    const s = synth();
    if (!s) return;
    currentVoice();
    s.addEventListener?.('voiceschanged', () => {
      cachedVoice = undefined;
      currentVoice();
    });
  },

  /**
   * Speak a line, interrupting anything still playing. Sentences of one line play in order.
   * onDone fires when the line finishes or speech is unavailable — not if it gets interrupted.
   */
  speak(text: string, distorted: boolean, onDone?: () => void) {
    const s = synth();
    if (!s) {
      onDone?.();
      return;
    }
    try {
      const parts = chunk(text);
      if (!parts.length) {
        onDone?.();
        return;
      }
      // A new line supersedes everything before it, including unspoken sentences of the last line.
      const gen = ++generation;
      const go = () => utter(parts, 0, distorted, gen, onDone);
      if (s.speaking || s.pending) {
        s.cancel();
        setTimeout(go, AFTER_CANCEL_MS);
      } else {
        go();
      }
      if (distorted) sfx.staticHiss(Math.max(1.5, text.length * 0.07));
    } catch {
      onDone?.(); // captions cover it
    }
  },

  /** Stop all speech. Anything from before this call that still tries to play is killed. */
  cancel() {
    generation++;
    try {
      synth()?.cancel();
    } catch {
      /* ignore */
    }
  },
};
