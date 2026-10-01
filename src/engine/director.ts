import type { Action, Banner, EndingId, Overlay, PuzzleId, Recipient, ReplyChoice, ScreenId, ThreadId } from '../types';
import { G, setG, pickGameData } from '../state/store';
import { BALANCE } from './balance';
import { applyDrain, clampDt } from './battery';
import { evaluate } from './conditions';
import { boardValues, resolveEnding } from './endings';
import { saveCheckpoint, recordEnding } from './save';
import { TRIGGERS } from '../content/triggers';
import { CALLS } from '../content/calls';
import { finalSequence } from '../content/endings';
import { PASSCODES } from '../content/lock';
import { sfx } from '../audio/sfx';
import { voice } from '../audio/voice';
import { track } from '../analytics';

let logicAccum = 0;
let bannerTimer: ReturnType<typeof setTimeout> | undefined;

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

export function tick(realDtMs: number) {
  const s = G();
  if (s.phase !== 'playing') return;
  const dt = clampDt(realDtMs) * s.timeScale;
  const inCall = s.overlay?.kind === 'call' && s.overlay.answered;
  const battery = applyDrain(
    s.battery,
    {
      screen: s.screen,
      inCall,
      brightness: s.brightness,
      lowPower: s.lowPower,
      screenOff: s.screenOff,
      storyMode: s.settings.storyMode,
    },
    dt / 1000,
  );

  if (s.screenOff) {
    setG({ battery });
  } else {
    setG({ battery, gameTimeMs: s.gameTimeMs + dt });
    logicAccum += dt;
    if (logicAccum >= BALANCE.logicTickMs) {
      logicAccum = 0;
      logic();
    }
  }
  checkBattery();
}

function checkBattery() {
  const s = G();
  if (s.phase !== 'playing') return;
  sfx.setTension(s.battery);
  if (s.battery <= 0) {
    triggerEnding('too_late');
    return;
  }
  if (s.battery < BALANCE.thresholds.lowAlert && !s.flags.lowAlertShown) {
    setFlag('lowAlertShown', true);
    openOverlay({ kind: 'alert', alertId: 'lowBattery' });
  }
}

function logic() {
  const now = G().gameTimeMs;

  // 1. Scheduled action batches (typing delays, waits).
  const { scheduled } = G();
  if (scheduled.length) {
    const due = scheduled.filter((x) => x.atMs <= now);
    if (due.length) {
      setG({ scheduled: scheduled.filter((x) => x.atMs > now) });
      for (const batch of due) runActions(batch.actions);
    }
  }

  // 2. Triggers.
  for (const t of TRIGGERS) {
    const s = G();
    if (s.phase !== 'playing') return;
    if (s.fired[t.id]) continue;
    const armedAt = s.armed[t.id];
    if (armedAt === undefined) {
      if (!evaluate(t.when, s)) continue;
      if (t.delaySec) {
        setG({ armed: { ...s.armed, [t.id]: now } });
        continue;
      }
    } else if (now - armedAt < (t.delaySec ?? 0) * 1000) {
      continue;
    }
    setG({ fired: { ...G().fired, [t.id]: true } });
    runActions(t.do);
  }

  // 3. Calls: auto-miss unanswered calls, end finished calls.
  const s = G();
  if (s.overlay?.kind === 'call') {
    const call = CALLS[s.overlay.callId];
    const elapsed = (now - s.overlay.startedAt) / 1000;
    if (!s.overlay.answered && elapsed >= call.ringSec) declineCall();
    else if (s.overlay.answered && elapsed >= call.durationSec) endCall();
  }

  // 4. Power bank walk.
  const walkStart = s.flags.depotWalkStart;
  if (typeof walkStart === 'number' && !s.flags.powerBank && now - walkStart >= BALANCE.powerBank.walkSec * 1000) {
    setFlag('powerBank', true);
    setG({ battery: Math.min(100, G().battery + BALANCE.powerBank.bonus) });
    sfx.charge();
    showBanner({ app: 'Battery', title: 'Charging', body: `Power bank connected · +${BALANCE.powerBank.bonus}%` });
    progress();
    track('power_bank_found');
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function runActions(actions: Action[]) {
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    const rest = actions.slice(i + 1);
    const now = G().gameTimeMs;
    switch (a.type) {
      case 'wait':
        schedule(now + a.sec * 1000, rest);
        return;
      case 'text':
        if (a.typingMs) {
          setG((s) => ({ typing: { ...s.typing, [a.thread]: true } }));
          schedule(now + a.typingMs, [{ ...a, typingMs: 0 }, ...rest]);
          return;
        }
        deliverText(a.thread, a.body, a.photo, a.evidence);
        break;
      case 'sent':
        pushMsg(a.thread, { from: 'me', body: a.body });
        break;
      case 'replies':
        setG((s) => ({ replies: { ...s.replies, [a.thread]: a.choices } }));
        break;
      case 'call':
        openOverlay({ kind: 'call', callId: a.callId, answered: false, startedAt: now });
        break;
      case 'notify':
        showBanner({ app: a.app, title: a.title, body: a.body });
        sfx.ding();
        break;
      case 'setFlag':
        setFlag(a.key, a.value);
        break;
      case 'drain':
        spend(a.amount);
        break;
      case 'glitch':
        setG({ glitchUntil: performance.now() + a.ms });
        sfx.glitch(a.ms);
        break;
      case 'vibrate':
        buzz(a.pattern);
        break;
      case 'alert':
        openOverlay({ kind: 'alert', alertId: a.alertId });
        break;
      case 'advanceChapter':
        advanceChapter();
        break;
      case 'ending':
        triggerEnding(a.id);
        return;
    }
  }
}

function schedule(atMs: number, actions: Action[]) {
  if (!actions.length) return;
  setG((s) => ({ scheduled: [...s.scheduled, { atMs, actions }] }));
}

let msgSeq = 0;
function pushMsg(thread: ThreadId, m: { from: 'me' | 'them'; body: string; photo?: string; evidence?: string }) {
  const id = `live-${Date.now()}-${msgSeq++}`;
  setG((s) => ({
    threads: { ...s.threads, [thread]: [...s.threads[thread], { ...m, id, ts: Date.now() }] },
  }));
}

function deliverText(thread: ThreadId, body: string, photo?: string, evidence?: string) {
  setG((s) => ({ typing: { ...s.typing, [thread]: false } }));
  pushMsg(thread, { from: 'them', body, photo, evidence });
  const s = G();
  const looking = s.screen === 'messages' && s.openThread === thread && !s.screenOff;
  if (looking) {
    sfx.pop();
    return;
  }
  setG((st) => ({ unread: { ...st.unread, [thread]: (st.unread[thread] ?? 0) + 1 } }));
  showBanner({ app: 'Messages', title: threadTitle(thread), body: photo ? '📷 Photo' : body, thread });
  sfx.ding();
  buzz([60, 40, 60]);
}

export function threadTitle(thread: ThreadId): string {
  const s = G();
  switch (thread) {
    case 'priya':
      return 'Priya 💛';
    case 'jordan':
      return 'Jordan';
    case 'mom':
      return 'Mom';
    case 'sam':
      return 'Sam – Lumen';
    case 'unknown':
      return s.flags.mayaRevealed ? 'Maya (burner)' : 'Unknown';
    case 'police':
      return '911 (Text)';
  }
}

export function showBanner(b: Omit<Banner, 'id' | 'ts'>) {
  const banner: Banner = { ...b, id: `b-${Date.now()}-${msgSeq++}`, ts: Date.now() };
  const s = G();
  if (s.screen === 'lock') {
    setG({ lockNotifs: [banner, ...s.lockNotifs].slice(0, 8) });
    return;
  }
  setG({ banner });
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => {
    if (G().banner?.id === banner.id) setG({ banner: null });
  }, 4200);
}

export function dismissBanner() {
  setG({ banner: null });
}

export function buzz(pattern: number[]) {
  const s = G();
  let vibrated = false;
  try {
    vibrated = typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate(pattern);
  } catch {
    vibrated = false;
  }
  if (!vibrated && !s.settings.reducedMotion) setG({ shakeUntil: performance.now() + 180 });
  sfx.buzz();
}

function openOverlay(o: Overlay) {
  const s = G();
  if (s.overlay) {
    setG({ overlayQueue: [...s.overlayQueue, o] });
    return;
  }
  setG({ overlay: o });
  if (o.kind === 'call') {
    sfx.ringStart();
    buzz([400, 200, 400]);
  }
}

function closeOverlay() {
  const s = G();
  const [next, ...queue] = s.overlayQueue;
  setG({ overlay: null, overlayQueue: queue });
  if (next) openOverlay(next.kind === 'call' ? { ...next, startedAt: G().gameTimeMs } : next);
}

export function answerCall() {
  const s = G();
  if (s.overlay?.kind !== 'call' || s.overlay.answered) return;
  sfx.ringStop();
  setG({ overlay: { ...s.overlay, answered: true, startedAt: s.gameTimeMs } });
  progress();
}

export function declineCall() {
  const s = G();
  if (s.overlay?.kind !== 'call') return;
  const call = CALLS[s.overlay.callId];
  sfx.ringStop();
  voice.cancel();
  setFlag(`call_${s.overlay.callId}`, 'missed');
  closeOverlay();
  runActions(call.onMissed);
}

export function endCall() {
  const s = G();
  if (s.overlay?.kind !== 'call') return;
  const call = CALLS[s.overlay.callId];
  voice.cancel();
  sfx.hangup();
  setFlag(`call_${s.overlay.callId}`, 'answered');
  closeOverlay();
  runActions(call.onEnd);
}

export function dismissAlert(action?: 'lowPower') {
  if (action === 'lowPower') setLowPower(true);
  closeOverlay();
}

// ---------------------------------------------------------------------------
// Player verbs
// ---------------------------------------------------------------------------

export function progress() {
  setG({ lastProgressMs: G().gameTimeMs });
}

export function markViewed(key: string) {
  const s = G();
  if (s.viewed[key]) return;
  setG({ viewed: { ...s.viewed, [key]: true }, lastProgressMs: s.gameTimeMs });
}

export function setFlag(key: string, value: string | number | boolean) {
  setG((s) => ({ flags: { ...s.flags, [key]: value } }));
}

export function spend(amount: number) {
  setG((s) => ({ battery: Math.max(0, s.battery - amount) }));
  checkBattery();
}

export function isAppDisabled(app: ScreenId): boolean {
  return G().lowPower && (BALANCE.lowPower.disabledApps as string[]).includes(app);
}

export function openScreen(screen: ScreenId) {
  if (isAppDisabled(screen)) {
    sfx.error();
    showBanner({ app: 'Settings', title: 'Low Power Mode', body: 'This app is disabled to save battery.' });
    return;
  }
  sfx.tap();
  stopAppAudio();
  setG({ screen, openThread: screen === 'messages' ? G().openThread : null });
  markViewed(`app:${screen}`);
}

export function goHome() {
  const s = G();
  if (s.screen === 'lock') return;
  stopAppAudio();
  setG({ screen: 'home', openThread: null });
}

/** Voicemails and memos stop when you leave their app; a call in progress keeps talking. */
function stopAppAudio() {
  const o = G().overlay;
  if (!(o?.kind === 'call' && o.answered)) voice.cancel();
}

export function openThread(thread: ThreadId | null) {
  setG((s) => ({ openThread: thread, unread: thread ? { ...s.unread, [thread]: 0 } : s.unread }));
  if (thread) markViewed(`thread:${thread}`);
}

export function openFromBanner(b: Banner) {
  dismissBanner();
  const s = G();
  if (s.screen === 'lock' || s.overlay) return;
  if (b.thread) {
    setG({ screen: 'messages' });
    openThread(b.thread);
  }
}

export function chooseReply(thread: ThreadId, choice: ReplyChoice) {
  setG((s) => ({ replies: { ...s.replies, [thread]: undefined } }));
  if (choice.body) {
    pushMsg(thread, { from: 'me', body: choice.body });
    sfx.send();
  }
  progress();
  runActions(choice.then);
}

export function tryUnlockPhone(code: string): boolean {
  if (code !== PASSCODES.phone) {
    sfx.error();
    buzz([80]);
    return false;
  }
  sfx.unlock();
  setFlag('phoneUnlocked', true);
  setG({ screen: 'home', lockNotifs: [], banner: null });
  progress();
  return true;
}

export function tryUnlockNotes(code: string): boolean {
  if (code !== PASSCODES.notes) {
    sfx.error();
    buzz([80]);
    return false;
  }
  sfx.unlock();
  setFlag('notesUnlocked', true);
  progress();
  return true;
}

export function togglePin(id: string) {
  const s = G();
  const pinned = s.evidence.includes(id);
  const board = { ...s.board };
  if (pinned) {
    for (const k of ['who', 'where', 'why'] as const) if (board[k] === id) delete board[k];
  }
  setG({ evidence: pinned ? s.evidence.filter((e) => e !== id) : [...s.evidence, id], board });
  if (!pinned) {
    sfx.pin();
    markViewed(`pin:${id}`);
    progress();
  }
}

export function setBoard(slot: 'who' | 'where' | 'why', id: string | undefined) {
  setG((s) => ({ board: { ...s.board, [slot]: id } }));
  progress();
}

export function buyHint(puzzle: PuzzleId) {
  const s = G();
  const used = s.hintsUsed[puzzle] ?? 0;
  if (used >= 3) return;
  spend(BALANCE.cost.hint);
  setG({ hintsUsed: { ...G().hintsUsed, [puzzle]: used + 1 } });
  progress();
  track('hint_used', { puzzle, tier: used + 1 });
}

export function recoverPhoto(id: string) {
  spend(BALANCE.cost.recoverDeleted);
  setFlag(`recovered_${id}`, true);
  sfx.unlock();
  progress();
}

export function playVoicemail(id: string) {
  const key = `voicemail:${id}`;
  if (!G().viewed[key]) spend(BALANCE.cost.playVoicemail);
  markViewed(key);
}

export function startDepotWalk() {
  const s = G();
  if (s.flags.walkedToDepot) return;
  setFlag('walkedToDepot', true);
  setFlag('depotWalkStart', s.gameTimeMs);
  progress();
}

export function setBrightness(v: number) {
  setG({ brightness: Math.min(BALANCE.brightness.max, Math.max(BALANCE.brightness.min, v)) });
}

export function setLowPower(on: boolean) {
  const s = G();
  setG({ lowPower: on });
  if (on && isAppDisabled(s.screen)) setG({ screen: 'home' });
}

export function sleep() {
  setG({ screenOff: true });
  // Drop speech rather than pausing it: pause/resume is unreliable and can replay audio later.
  voice.cancel();
  sfx.suspend();
}

export function wake() {
  setG({ screenOff: false });
  sfx.resume();
}

export function decide(recipient: Recipient) {
  const s = G();
  if (s.flags.decided) return;
  setFlag('decided', true);
  const ending = resolveEnding(s.board, recipient);
  setG({ screen: 'messages' });
  openThread(recipient);
  runActions(finalSequence(recipient, ending, boardValues(s.board).where));
}

// ---------------------------------------------------------------------------
// Chapters & endings
// ---------------------------------------------------------------------------

export function advanceChapter() {
  const s = G();
  if (s.chapter >= 3) return;
  const chapter = (s.chapter + 1) as 2 | 3;
  setG({
    chapter,
    chapterStartMs: s.gameTimeMs,
    lastProgressMs: s.gameTimeMs,
    batteryAtChapterStart: s.battery,
  });
  track('chapter_start', { chapter });
  if (!G().settings.hardcore) setG({ storageOk: saveCheckpoint(pickGameData(G())) });
}

export function triggerEnding(id: EndingId) {
  const s = G();
  if (s.phase !== 'playing') return;
  sfx.ringStop();
  voice.cancel();
  if (id === 'too_late') sfx.shutdown();
  else sfx.stopDrone();
  const leaked = typeof s.flags.leaked === 'number' ? s.flags.leaked : 0;
  setG({
    phase: 'ending',
    ending: id,
    overlay: null,
    overlayQueue: [],
    scheduled: [],
    banner: null,
    endingStats: {
      battery: Math.round(s.battery),
      timeMs: s.gameTimeMs,
      evidence: s.evidence.length,
      leaked,
    },
  });
  recordEnding(id);
  if (leaked >= 2 && id !== 'too_late') recordEnding('next_target');
  track('ending', { id, battery: Math.round(s.battery), leaked });
}
