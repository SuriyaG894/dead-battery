import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** A scriptable stand-in for window.speechSynthesis that can reproduce real engine failures. */
class FakeUtterance {
  text: string;
  voice: unknown = null;
  pitch = 1;
  rate = 1;
  volume = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

class FakeSynth {
  queue: FakeUtterance[] = [];
  current: FakeUtterance | null = null;
  spoken: string[] = [];
  cancels = 0;
  resumes = 0;
  paused = false;
  voices = [
    { name: 'Google US English', lang: 'en-US', localService: false },
    { name: 'Microsoft Aria Online (Natural) - English (United States)', lang: 'en-US', localService: false },
    { name: 'Microsoft David - English (United States)', lang: 'en-US', localService: true },
    { name: 'Microsoft Zira - English (United States)', lang: 'en-US', localService: true },
  ];
  get speaking() {
    return !!this.current;
  }
  get pending() {
    return this.queue.length > 0;
  }
  getVoices() {
    return this.voices;
  }
  addEventListener() {}
  speak(u: FakeUtterance) {
    this.spoken.push(u.text);
    this.queue.push(u);
  }
  cancel() {
    this.cancels++;
    const all = [this.current, ...this.queue].filter(Boolean) as FakeUtterance[];
    this.current = null;
    this.queue = [];
    all.forEach((u) => u.onerror?.({ error: 'canceled' }));
  }
  resume() {
    this.resumes++;
    this.paused = false;
  }
  /** Engine begins the next queued utterance. */
  start() {
    this.current = this.queue.shift() ?? null;
    this.current?.onstart?.();
    return this.current;
  }
  /** Current utterance finishes. */
  finish() {
    const u = this.current;
    this.current = null;
    u?.onend?.();
  }
}

let synth: FakeSynth;
let voice: typeof import('../src/audio/voice');

beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  synth = new FakeSynth();
  vi.stubGlobal('window', { speechSynthesis: synth });
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  voice = await import('../src/audio/voice');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('voice', () => {
  it('prefers a local voice over online ones (they lag, ignore pitch and survive cancel)', () => {
    const picked = voice.pickVoice(synth.voices as unknown as SpeechSynthesisVoice[]);
    expect(picked?.name).toMatch(/Zira/);
  });

  it('kills audio from a cancelled line that starts playing late', () => {
    voice.voice.speak('Listen carefully.', true);
    const u = synth.queue[0];
    voice.voice.cancel();
    synth.queue = [u]; // engine ignored the cancel and still has it
    const before = synth.cancels;
    synth.start(); // it starts playing during the Maps walk…
    expect(synth.cancels).toBe(before + 1); // …and is silenced on the spot
  });

  it('recovers a wedged engine: cancels and retries once, then gives up', () => {
    voice.voice.speak('You found the contract.', true);
    expect(synth.spoken).toEqual(['You found the contract.']);
    vi.advanceTimersByTime(2500); // never started
    expect(synth.cancels).toBe(1);
    vi.advanceTimersByTime(60);
    expect(synth.spoken).toEqual(['You found the contract.', 'You found the contract.']);
    vi.advanceTimersByTime(2560); // still wedged
    expect(synth.cancels).toBe(2);
    vi.advanceTimersByTime(5000);
    expect(synth.spoken).toHaveLength(2); // no endless retry loop
  });

  it('does not reset the engine while a line is playing normally', () => {
    voice.voice.speak('Listen carefully.', true);
    synth.start();
    vi.advanceTimersByTime(10_000);
    expect(synth.cancels).toBe(0);
  });

  it('speaks sentences one at a time, each after the previous ends', () => {
    voice.voice.speak("Maya, it's Mom. Please call me. I love you.", false);
    expect(synth.spoken).toEqual(["Maya, it's Mom."]);
    synth.start();
    vi.advanceTimersByTime(4000); // long sentence — the next one must not be timed out
    expect(synth.cancels).toBe(0);
    synth.finish();
    expect(synth.spoken).toEqual(["Maya, it's Mom.", 'Please call me.']);
    synth.start();
    synth.finish();
    expect(synth.spoken.at(-1)).toBe('I love you.');
  });

  it('a new line interrupts the old one instead of queueing behind it', () => {
    voice.voice.speak('One. Two. Three.', false);
    synth.start(); // "One." playing
    voice.voice.speak('New line.', false);
    expect(synth.cancels).toBe(1);
    vi.advanceTimersByTime(60);
    expect(synth.spoken).toEqual(['One.', 'New line.']); // "Two." / "Three." never spoken
  });

  it('resumes a paused engine before speaking', () => {
    synth.paused = true;
    voice.voice.speak('Hello.', false);
    expect(synth.resumes).toBe(1);
  });

  it('chunks text into sentences and drops stage directions and empty pauses', () => {
    expect(voice.chunk('[breathing] Okay. If you hear this… I am fine!')).toEqual(['Okay.', 'If you hear this…', 'I am fine!']);
    expect(voice.chunk('…')).toEqual([]);
  });

  it('onDone fires once after every sentence of the line has ended', () => {
    const done = vi.fn();
    voice.voice.speak('One. Two.', false, done);
    synth.start();
    synth.finish();
    expect(done).not.toHaveBeenCalled();
    synth.start();
    synth.finish();
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('onDone does not fire for a line that gets interrupted or cancelled', () => {
    const a = vi.fn();
    const b = vi.fn();
    voice.voice.speak('First.', false, a);
    synth.start();
    voice.voice.speak('Second.', false, b); // interrupts "First."
    vi.advanceTimersByTime(60);
    voice.voice.cancel(); // player leaves the app
    vi.advanceTimersByTime(10_000);
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  it('onDone still fires when the engine gives up, so playback never stalls', () => {
    const done = vi.fn();
    voice.voice.speak('Stuck.', false, done);
    vi.advanceTimersByTime(2500 + 60 + 2500);
    expect(done).toHaveBeenCalledTimes(1);
  });
});
