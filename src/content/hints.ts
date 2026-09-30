import type { PuzzleId } from '../types';

export const HINTS: Record<PuzzleId, { title: string; tiers: [string, string, string] }> = {
  lock: {
    title: 'The passcode',
    tiers: [
      'The lock screen says the code is the day someone came home.',
      'Biscuit is her dog. One of the notifications has his Gotcha Day. Month, then day.',
      'The code is 0614.',
    ],
  },
  notes: {
    title: 'The locked notes',
    tiers: [
      'Priya knows which week is hard for Maya every year.',
      "It's her dad's birthday. A photo caption and a Priya text both have it. Month, then day.",
      'The code is 1107.',
    ],
  },
  where: {
    title: 'Where is she?',
    tiers: [
      'Where does Maya go when she needs to think?',
      'Maps shows her late-night visits. Her notes say "where Dad showed me the ships".',
      'Halden Point Lighthouse. Pin it from Maps, Notes or the old photo with her dad.',
    ],
  },
  who: {
    title: 'Who is after her?',
    tiers: [
      'Who keeps asking where Maya is, and sounds a little too nice?',
      'Recover the deleted contract in Photos and zoom into the bottom of the page.',
      'Sam Okafor signed the contract. His number matches "Sam – Lumen". Pin the signature.',
    ],
  },
};
