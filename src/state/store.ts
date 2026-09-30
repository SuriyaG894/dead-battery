import { create } from 'zustand';
import type {
  Banner,
  Chapter,
  EndingId,
  FlagValue,
  Msg,
  Overlay,
  PuzzleId,
  ReplyChoice,
  Scheduled,
  ScreenId,
  ThreadId,
} from '../types';
import { BALANCE } from '../engine/balance';
import { buildInitialThreads } from '../content/threads';
import { INITIAL_LOCK_NOTIFS } from '../content/lock';

export interface Settings {
  storyMode: boolean;
  hardcore: boolean;
  textScale: 1 | 1.15 | 1.3;
  reducedMotion: boolean;
}

export interface EndingStats {
  battery: number;
  timeMs: number;
  evidence: number;
  leaked: number;
}

/** Everything in here is serializable and saved at chapter checkpoints. */
export interface GameData {
  v: 1;
  phase: 'title' | 'playing' | 'ending';
  chapter: Chapter;
  battery: number;
  batteryAtChapterStart: number;
  gameTimeMs: number;
  chapterStartMs: number;
  lastProgressMs: number;
  realStart: number;
  screen: ScreenId;
  openThread: ThreadId | null;
  brightness: number;
  lowPower: boolean;
  flags: Record<string, FlagValue>;
  viewed: Record<string, true>;
  threads: Record<ThreadId, Msg[]>;
  typing: Partial<Record<ThreadId, boolean>>;
  unread: Partial<Record<ThreadId, number>>;
  replies: Partial<Record<ThreadId, ReplyChoice[]>>;
  evidence: string[];
  board: { who?: string; where?: string; why?: string };
  hintsUsed: Partial<Record<PuzzleId, number>>;
  fired: Record<string, true>;
  armed: Record<string, number>;
  scheduled: Scheduled[];
  overlay: Overlay | null;
  overlayQueue: Overlay[];
  lockNotifs: Banner[];
  ending: EndingId | null;
  endingStats: EndingStats | null;
}

interface UiState {
  screenOff: boolean;
  banner: Banner | null;
  glitchUntil: number;
  shakeUntil: number;
  timeScale: number;
  settings: Settings;
  storageOk: boolean;
}

export type GameState = GameData & UiState;

const SETTINGS_KEY = 'db_settings_v1';

function loadSettings(): Settings {
  const fallback: Settings = {
    storyMode: false,
    hardcore: false,
    textScale: 1,
    reducedMotion:
      typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function freshGame(now = Date.now()): GameData {
  return {
    v: 1,
    phase: 'playing',
    chapter: 1,
    battery: BALANCE.startBattery,
    batteryAtChapterStart: BALANCE.startBattery,
    gameTimeMs: 0,
    chapterStartMs: 0,
    lastProgressMs: 0,
    realStart: now,
    screen: 'lock',
    openThread: null,
    brightness: BALANCE.brightness.default,
    lowPower: false,
    flags: { leaked: 0 },
    viewed: {},
    threads: buildInitialThreads(now),
    typing: {},
    unread: { priya: 5, mom: 6, sam: 1, jordan: 2 },
    replies: {},
    evidence: [],
    board: {},
    hintsUsed: {},
    fired: {},
    armed: {},
    scheduled: [],
    overlay: null,
    overlayQueue: [],
    lockNotifs: INITIAL_LOCK_NOTIFS(now),
    ending: null,
    endingStats: null,
  };
}

export const useGame = create<GameState>()(() => ({
  ...freshGame(),
  phase: 'title',
  screenOff: false,
  banner: null,
  glitchUntil: 0,
  shakeUntil: 0,
  timeScale: 1,
  settings: loadSettings(),
  storageOk: true,
}));

export const G = () => useGame.getState();
export const setG = (partial: Partial<GameState> | ((s: GameState) => Partial<GameState>)) =>
  useGame.setState(partial);

export function updateSettings(patch: Partial<Settings>) {
  const settings = { ...G().settings, ...patch };
  setG({ settings });
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable — settings just won't persist */
  }
}

export function pickGameData(s: GameState): GameData {
  const {
    screenOff: _a,
    banner: _b,
    glitchUntil: _c,
    shakeUntil: _d,
    timeScale: _e,
    settings: _f,
    storageOk: _g,
    ...data
  } = s;
  return data;
}
