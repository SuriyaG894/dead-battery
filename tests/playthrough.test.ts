import { beforeEach, describe, expect, it } from 'vitest';
import { freshGame, G, setG } from '../src/state/store';
import {
  answerCall,
  chooseReply,
  decide,
  markViewed,
  openScreen,
  openThread,
  recoverPhoto,
  setBoard,
  tick,
  togglePin,
  tryUnlockNotes,
  tryUnlockPhone,
} from '../src/engine/director';

/** Advance game time in 250ms frames. */
function run(sec: number) {
  for (let t = 0; t < sec * 4; t++) tick(250);
}

function lastText(thread: keyof ReturnType<typeof G>['threads']) {
  const msgs = G().threads[thread];
  return msgs[msgs.length - 1]?.body;
}

function answerWhenRinging(maxSec: number) {
  for (let t = 0; t < maxSec * 4; t++) {
    const o = G().overlay;
    if (o?.kind === 'call' && !o.answered) {
      answerCall();
      return o.callId;
    }
    tick(250);
  }
  throw new Error('no call arrived');
}

beforeEach(() => {
  setG({ ...freshGame(), screenOff: false, timeScale: 1 });
});

describe('golden path playthrough (engine only)', () => {
  it('reaches "The Lighthouse" ending', () => {
    run(12);
    expect(lastText('unknown')).toBe('I know someone picked it up.');

    expect(tryUnlockPhone('1234')).toBe(false);
    expect(tryUnlockPhone('0614')).toBe(true);
    expect(G().screen).toBe('home');

    openScreen('messages');
    openThread('priya');
    run(20);
    const samChoices = G().replies.sam;
    expect(samChoices?.map((c) => c.id)).toEqual(['c1_tell', 'c1_who', 'c1_ignore']);
    chooseReply('sam', samChoices![2]); // say nothing

    expect(answerWhenRinging(20)).toBe('c1');
    run(18);
    expect(G().chapter).toBe(2);

    openScreen('photos');
    recoverPhoto('contract');
    markViewed('photo:contract');
    togglePin('ev_contract');
    markViewed('hotspot:signature');
    togglePin('ev_sam_signature');
    run(10);
    expect(lastText('unknown')).toBe('Now you know why she ran.');

    openScreen('notes');
    expect(tryUnlockNotes('1107')).toBe(true);
    run(6);
    expect(G().chapter).toBe(3);
    expect(G().flags.finalUnlocked).toBe(true);

    togglePin('ev_ships_note');
    setBoard('who', 'ev_sam_signature');
    setBoard('where', 'ev_ships_note');
    setBoard('why', 'ev_contract');

    expect(answerWhenRinging(30)).toBe('c3_reveal');
    run(40);
    expect(G().flags.mayaRevealed).toBe(true);
    expect(G().flags.leaked).toBe(0);

    decide('police');
    run(12);
    expect(G().phase).toBe('ending');
    expect(G().ending).toBe('lighthouse');
    expect(G().endingStats!.battery).toBeGreaterThan(15);
  });

  it('dies at 0% with "Too Late"', () => {
    setG({ battery: 0.05 });
    run(10);
    expect(G().phase).toBe('ending');
    expect(G().ending).toBe('too_late');
  });

  it('telling Sam your location sets up the secret ending', () => {
    tryUnlockPhone('0614');
    openScreen('messages');
    openThread('sam');
    run(20);
    chooseReply('sam', G().replies.sam!.find((c) => c.id === 'c1_tell')!);
    expect(G().flags.leaked).toBe(1);
    answerWhenRinging(25);
    run(18);
    recoverPhoto('contract');
    run(20);
    const share = G().replies.sam!.find((c) => c.id === 'c2_share')!;
    chooseReply('sam', share);
    expect(G().flags.leaked).toBe(2);
    run(12);
    expect(lastText('unknown')).toBe("Move. Don't stay where you are.");
  });

  it('screen off pauses game time but still drains a little', () => {
    setG({ screenOff: true });
    const t0 = G().gameTimeMs;
    const b0 = G().battery;
    run(60);
    expect(G().gameTimeMs).toBe(t0);
    expect(b0 - G().battery).toBeGreaterThan(0);
    expect(b0 - G().battery).toBeLessThan(0.1);
  });

  it('low battery shows the Low Power alert once', () => {
    setG({ battery: 9.9 });
    run(1);
    expect(G().overlay).toEqual({ kind: 'alert', alertId: 'lowBattery' });
  });

  it('an explorer who never replies to Sam or opens Messages still reaches the case board', () => {
    tryUnlockPhone('0614');
    recoverPhoto('contract');
    tryUnlockNotes('1107');
    // Keeps discovering something every few seconds, so idle time never builds up.
    for (let i = 0; i < 90 && !G().flags.finalUnlocked; i++) {
      markViewed(`explore:${i}`);
      run(5);
    }
    expect(G().chapter).toBe(3);
    expect(G().flags.finalUnlocked).toBe(true);
    expect(G().gameTimeMs).toBeLessThan(4 * 60_000); // case board within ~4 minutes, not never
    expect(G().phase).toBe('playing');
  });
});
