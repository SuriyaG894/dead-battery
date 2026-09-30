import { describe, expect, it } from 'vitest';
import { resolveEnding } from '../src/engine/endings';

const correct = { who: 'ev_sam_signature', where: 'ev_ships_note', why: 'ev_memo' };

describe('resolveEnding', () => {
  it('correct board sent to police or Maya is the true ending', () => {
    expect(resolveEnding(correct, 'police')).toBe('lighthouse');
    expect(resolveEnding(correct, 'unknown')).toBe('lighthouse');
  });
  it('any evidence with the right value counts', () => {
    expect(resolveEnding({ who: 'ev_sam_curious', where: 'ev_halden_visits', why: 'ev_search_history' }, 'police')).toBe(
      'lighthouse',
    );
  });
  it('sending to Sam is always betrayal', () => {
    expect(resolveEnding(correct, 'sam')).toBe('betrayal');
    expect(resolveEnding({ ...correct, who: 'ev_jordan_threat' }, 'sam')).toBe('betrayal');
  });
  it('blaming Jordan is wrong, even when sent to Mom', () => {
    expect(resolveEnding({ ...correct, who: 'ev_jordan_threat' }, 'police')).toBe('wrong_answer');
    expect(resolveEnding({ ...correct, who: 'ev_jordan_threat' }, 'mom')).toBe('wrong_answer');
  });
  it('sending to Mom is watched', () => {
    expect(resolveEnding(correct, 'mom')).toBe('watched');
  });
  it('wrong place or motive is wrong_answer', () => {
    expect(resolveEnding({ ...correct, where: 'ev_locker14' }, 'police')).toBe('wrong_answer');
    expect(resolveEnding({ ...correct, why: 'ev_breakup' }, 'unknown')).toBe('wrong_answer');
  });
});
