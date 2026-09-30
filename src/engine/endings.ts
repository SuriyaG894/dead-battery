import type { EndingId, Recipient } from '../types';
import { EVIDENCE } from '../content/evidence';

export interface Board {
  who?: string;
  where?: string;
  why?: string;
}

export function boardValues(board: Board) {
  const v = (id?: string) => (id ? EVIDENCE[id]?.value : undefined);
  return { who: v(board.who), where: v(board.where), why: v(board.why) };
}

/** Resolves the final decision. 'too_late' is triggered by the battery, not here. */
export function resolveEnding(board: Board, sentTo: Recipient): EndingId {
  if (sentTo === 'sam') return 'betrayal';
  const { who, where, why } = boardValues(board);
  if (who === 'jordan') return 'wrong_answer';
  if (sentTo === 'mom') return 'watched';
  const correct = who === 'sam' && where === 'lighthouse' && why === 'data';
  return correct ? 'lighthouse' : 'wrong_answer';
}
