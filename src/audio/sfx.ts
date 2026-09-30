/**
 * All sound is synthesized with the Web Audio API — no audio files to ship.
 * The context is created on the first user gesture (the "Pick up the phone" tap).
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let drone: { gain: GainNode; filter: BiquadFilterNode; oscs: OscillatorNode[] } | null = null;
let ringTimer: ReturnType<typeof setInterval> | undefined;
let noiseBuf: AudioBuffer | null = null;
let lastHeartbeat = 0;

function ac(): AudioContext | null {
  return ctx && ctx.state !== 'closed' ? ctx : null;
}

function tone(
  freq: number,
  dur: number,
  opts: { type?: OscillatorType; gain?: number; delay?: number; slideTo?: number } = {},
) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + (opts.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t + dur);
  const peak = opts.gain ?? 0.15;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise(dur: number, gain = 0.08, hp = 1000) {
  const c = ac();
  if (!c || !master) return;
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
  src.stop(t + dur + 0.05);
}

export const sfx = {
  init() {
    if (ctx) {
      void ctx.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    } catch {
      ctx = null;
    }
  },
  setMuted(muted: boolean) {
    if (master) master.gain.value = muted ? 0 : 0.9;
  },
  suspend() {
    void ac()?.suspend();
  },
  resume() {
    void ac()?.resume();
  },
  tap() {
    tone(1800, 0.03, { gain: 0.03, type: 'triangle' });
  },
  ding() {
    tone(1318, 0.18, { gain: 0.12 });
    tone(1760, 0.3, { gain: 0.1, delay: 0.09 });
  },
  pop() {
    tone(900, 0.08, { gain: 0.07, slideTo: 1400 });
  },
  send() {
    tone(600, 0.12, { gain: 0.06, slideTo: 1200 });
  },
  buzz() {
    tone(95, 0.12, { type: 'square', gain: 0.05 });
    tone(95, 0.12, { type: 'square', gain: 0.05, delay: 0.18 });
  },
  error() {
    tone(180, 0.09, { type: 'square', gain: 0.06 });
    tone(140, 0.14, { type: 'square', gain: 0.06, delay: 0.1 });
  },
  unlock() {
    tone(700, 0.06, { gain: 0.08, type: 'triangle' });
    tone(1050, 0.1, { gain: 0.08, type: 'triangle', delay: 0.06 });
  },
  pin() {
    tone(520, 0.08, { gain: 0.08, type: 'triangle' });
    tone(780, 0.12, { gain: 0.08, type: 'triangle', delay: 0.07 });
  },
  charge() {
    tone(440, 0.15, { gain: 0.08 });
    tone(660, 0.15, { gain: 0.08, delay: 0.12 });
    tone(880, 0.3, { gain: 0.08, delay: 0.24 });
  },
  hangup() {
    tone(480, 0.12, { gain: 0.07 });
    tone(360, 0.2, { gain: 0.07, delay: 0.14 });
  },
  staticHiss(dur: number) {
    noise(dur, 0.025, 2500);
  },
  glitch(ms: number) {
    noise(ms / 1000, 0.12, 400);
    tone(60, ms / 1000, { type: 'sawtooth', gain: 0.06, slideTo: 30 });
  },
  shutdown() {
    this.stopDrone();
    tone(880, 1.2, { gain: 0.1, slideTo: 60, type: 'sawtooth' });
  },
  ringStart() {
    this.ringStop();
    const ring = () => {
      for (let i = 0; i < 6; i++) {
        tone(i % 2 ? 660 : 880, 0.09, { gain: 0.09, delay: i * 0.1, type: 'triangle' });
      }
    };
    ring();
    ringTimer = setInterval(ring, 1800);
  },
  ringStop() {
    clearInterval(ringTimer);
    ringTimer = undefined;
  },
  startDrone() {
    const c = ac();
    if (!c || !master || drone) return;
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;
    filter.Q.value = 4;
    const oscs = [55, 55.6, 82.4].map((f) => {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.connect(filter);
      o.start();
      return o;
    });
    filter.connect(gain).connect(master);
    gain.gain.exponentialRampToValueAtTime(0.03, c.currentTime + 3);
    drone = { gain, filter, oscs };
  },
  stopDrone() {
    const c = ac();
    if (!c || !drone) return;
    const d = drone;
    drone = null;
    d.gain.gain.cancelScheduledValues(c.currentTime);
    d.gain.gain.setValueAtTime(Math.max(d.gain.gain.value, 0.0001), c.currentTime);
    d.gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.5);
    d.oscs.forEach((o) => o.stop(c.currentTime + 1.6));
  },
  /** Drone gets louder and brighter as the battery dies; a heartbeat kicks in under 5%. */
  setTension(battery: number) {
    const c = ac();
    if (!c || !drone) return;
    const t = 1 - Math.max(0, Math.min(1, battery / 23));
    drone.gain.gain.setTargetAtTime(0.025 + t * 0.07, c.currentTime, 0.5);
    drone.filter.frequency.setTargetAtTime(180 + t * 600, c.currentTime, 0.5);
    if (battery < 5) {
      const now = performance.now();
      const interval = battery < 2 ? 550 : 850;
      if (now - lastHeartbeat > interval) {
        lastHeartbeat = now;
        tone(55, 0.12, { gain: 0.2 });
        tone(50, 0.14, { gain: 0.16, delay: 0.16 });
      }
    }
  },
};
