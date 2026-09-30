import type { Action } from '../types';

export interface CallLine {
  at: number;
  text: string;
  distorted: boolean;
}

export interface CallDef {
  caller: string;
  ringSec: number;
  durationSec: number;
  lines: CallLine[];
  /** Line index where the voice distortion drops (the big reveal). */
  revealAt?: number;
  onEnd: Action[];
  onMissed: Action[];
}

export const CALLS: Record<string, CallDef> = {
  c1: {
    caller: 'No Caller ID',
    ringSec: 20,
    durationSec: 13,
    lines: [
      { at: 1.2, text: 'Listen carefully.', distorted: true },
      { at: 3.8, text: "If you're one of them… I'll know.", distorted: true },
      { at: 8.2, text: 'Look at what she deleted.', distorted: true },
    ],
    onEnd: [{ type: 'wait', sec: 2 }, { type: 'advanceChapter' }],
    onMissed: [
      { type: 'text', thread: 'unknown', body: 'Pick up next time.', typingMs: 1500 },
      { type: 'text', thread: 'unknown', body: "If you're one of them, I'll know.", typingMs: 2200 },
      { type: 'text', thread: 'unknown', body: 'Look at what she deleted.', typingMs: 1800 },
      { type: 'advanceChapter' },
    ],
  },
  c3_reveal: {
    caller: 'No Caller ID',
    ringSec: 22,
    durationSec: 31,
    revealAt: 3,
    lines: [
      { at: 1.2, text: 'You found the contract.', distorted: true },
      { at: 4.6, text: 'Then you know who Sam really is.', distorted: true },
      { at: 9.0, text: '…', distorted: true },
      { at: 11.0, text: "It's me. It's Maya.", distorted: false },
      { at: 14.2, text: 'I left my phone on purpose. They can track it.', distorted: false },
      { at: 18.6, text: "Please don't tell Sam. Don't tell anyone who just \"wants to help\".", distorted: false },
      { at: 24.2, text: "Use the proof. Send help that can't be bought. Please hurry.", distorted: false },
    ],
    onEnd: [
      { type: 'setFlag', key: 'mayaRevealed', value: true },
      { type: 'wait', sec: 2 },
      { type: 'text', thread: 'unknown', body: "it's really me. i know the battery is almost gone.", typingMs: 2500 },
      { type: 'text', thread: 'unknown', body: 'open Evidence. who, where, why. then send it.', typingMs: 2500 },
      { type: 'notify', app: 'Evidence', title: 'Case board', body: 'Link WHO, WHERE and WHY — then send her location.' },
    ],
    onMissed: [
      { type: 'setFlag', key: 'mayaRevealed', value: true },
      { type: 'text', thread: 'unknown', body: "you didn't pick up. ok.", typingMs: 1500 },
      { type: 'text', thread: 'unknown', body: "it's me. maya. this is my burner.", typingMs: 2500 },
      { type: 'text', thread: 'unknown', body: 'i left my phone on purpose. they track it.', typingMs: 2500 },
      { type: 'text', thread: 'unknown', body: "sam isn't my coworker. he's the one they send.", typingMs: 2500 },
      { type: 'text', thread: 'unknown', body: 'open Evidence. who, where, why. send it to someone who cant be bought.', typingMs: 3000 },
    ],
  },
};
