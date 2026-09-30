import type { Condition } from '../types';
import type { GameData } from '../state/store';

type CondState = Pick<
  GameData,
  'chapter' | 'flags' | 'viewed' | 'screen' | 'battery' | 'gameTimeMs' | 'chapterStartMs' | 'lastProgressMs' | 'evidence' | 'fired'
>;

export function evaluate(c: Condition, s: CondState): boolean {
  if ('all' in c) return c.all.every((x) => evaluate(x, s));
  if ('any' in c) return c.any.some((x) => evaluate(x, s));
  if ('not' in c) return !evaluate(c.not, s);
  if ('chapter' in c) return s.chapter === c.chapter;
  if ('chapterAtLeast' in c) return s.chapter >= c.chapterAtLeast;
  if ('flag' in c) {
    const v = s.flags[c.flag];
    if (c.eq !== undefined) return v === c.eq;
    if (c.gte !== undefined) return typeof v === 'number' && v >= c.gte;
    return !!v;
  }
  if ('viewed' in c) return !!s.viewed[c.viewed];
  if ('screen' in c) return s.screen === c.screen;
  if ('batteryBelow' in c) return s.battery < c.batteryBelow;
  if ('elapsedInChapterSec' in c) return s.gameTimeMs - s.chapterStartMs >= c.elapsedInChapterSec * 1000;
  if ('idleSec' in c) return s.gameTimeMs - s.lastProgressMs >= c.idleSec * 1000;
  if ('evidence' in c) return s.evidence.includes(c.evidence);
  if ('fired' in c) return !!s.fired[c.fired];
  return false;
}
