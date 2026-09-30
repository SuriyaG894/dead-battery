export type AppId =
  | 'messages'
  | 'photos'
  | 'maps'
  | 'notes'
  | 'voice'
  | 'phone'
  | 'browser'
  | 'settings'
  | 'evidence';

export type ScreenId = 'lock' | 'home' | AppId;

export type ThreadId = 'priya' | 'jordan' | 'mom' | 'sam' | 'unknown' | 'police';

export type Chapter = 1 | 2 | 3;

export type EndingId = 'lighthouse' | 'too_late' | 'betrayal' | 'wrong_answer' | 'watched';

export type EvidenceCategory = 'who' | 'where' | 'why';

export type Recipient = 'police' | 'mom' | 'sam' | 'unknown';

export type PuzzleId = 'lock' | 'notes' | 'where' | 'who';

export type FlagValue = number | boolean | string;

export interface Msg {
  id: string;
  /** 'me' = sent from this phone (Maya, or the player replying on her phone). */
  from: 'me' | 'them';
  body: string;
  /** Real epoch ms, used for display. */
  ts: number;
  photo?: string;
  evidence?: string;
}

export interface ReplyChoice {
  id: string;
  label: string;
  /** Text sent into the thread. */
  body: string;
  then: Action[];
}

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { chapter: Chapter }
  | { chapterAtLeast: Chapter }
  | { flag: string; eq?: FlagValue; gte?: number }
  | { viewed: string }
  | { screen: ScreenId }
  | { batteryBelow: number }
  | { elapsedInChapterSec: number }
  | { idleSec: number }
  | { evidence: string }
  | { fired: string };

export type Action =
  | { type: 'text'; thread: ThreadId; body: string; typingMs?: number; photo?: string; evidence?: string }
  | { type: 'sent'; thread: ThreadId; body: string }
  | { type: 'replies'; thread: ThreadId; choices: ReplyChoice[] }
  | { type: 'call'; callId: string }
  | { type: 'notify'; app: string; title: string; body: string }
  | { type: 'setFlag'; key: string; value: FlagValue }
  | { type: 'drain'; amount: number }
  | { type: 'glitch'; ms: number }
  | { type: 'vibrate'; pattern: number[] }
  | { type: 'alert'; alertId: string }
  | { type: 'wait'; sec: number }
  | { type: 'advanceChapter' }
  | { type: 'ending'; id: EndingId };

export interface Trigger {
  id: string;
  when: Condition;
  do: Action[];
  delaySec?: number;
}

export interface Banner {
  id: string;
  app: string;
  title: string;
  body: string;
  thread?: ThreadId;
  ts: number;
}

export type Overlay =
  | { kind: 'call'; callId: string; answered: boolean; startedAt: number }
  | { kind: 'alert'; alertId: string };

export interface Scheduled {
  atMs: number;
  actions: Action[];
}
