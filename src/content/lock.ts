import type { Banner } from '../types';

export const PASSCODES = {
  /** Biscuit's gotcha day, 06/14 — lock screen hint + Photos memory notification. */
  phone: '0614',
  /** Dad's birthday, 11/07 — Priya's message + photo caption. */
  notes: '1107',
};

export const LOCK_HINT = 'Passcode hint: the day Biscuit came home 🐾';

export const INITIAL_LOCK_NOTIFS = (now: number): Banner[] => [
  { id: 'l1', app: 'Messages', title: 'Unknown', body: 'Put it back.', thread: 'unknown', ts: now - 2 * 60_000 },
  { id: 'l2', app: 'Messages', title: 'Priya 💛', body: 'just send one emoji so i know ur alive', thread: 'priya', ts: now - 38 * 60_000 },
  { id: 'l3', app: 'Phone', title: 'Missed Calls', body: 'Mom (14)', ts: now - 50 * 60_000 },
  { id: 'l4', app: 'Photos', title: 'Memories', body: "Biscuit's Gotcha Day 🐶 — June 14, 2019", ts: now - 3 * 60 * 60_000 },
  { id: 'l5', app: 'Lumen', title: 'Lumen ✨', body: "You haven't checked in today. Your wellness streak is at risk!", ts: now - 9 * 60 * 60_000 },
];
