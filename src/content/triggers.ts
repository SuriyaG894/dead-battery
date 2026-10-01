import type { Action, ReplyChoice, Trigger } from '../types';

// ---------------------------------------------------------------------------
// Reusable reply trees
// ---------------------------------------------------------------------------

const shareLocation = (id: string): ReplyChoice => ({
  id,
  label: 'Share my location',
  body: '📍 Shared Location',
  then: [
    { type: 'setFlag', key: 'leaked', value: 2 },
    { type: 'text', thread: 'sam', body: 'Perfect. Stay right there. 🙂', typingMs: 2000 },
    { type: 'wait', sec: 5 },
    { type: 'glitch', ms: 350 },
    { type: 'text', thread: 'unknown', body: 'WHY WOULD YOU DO THAT', typingMs: 900 },
    { type: 'text', thread: 'unknown', body: "Move. Don't stay where you are.", typingMs: 1600 },
  ],
});

const sayNothing = (id: string, then: Action[] = []): ReplyChoice => ({ id, label: 'Say nothing', body: '', then });

const tellShelter = (id: string): ReplyChoice => ({
  id,
  label: 'Tell him: bus shelter',
  body: 'found it at the bus shelter on harbor rd',
  then: [
    { type: 'setFlag', key: 'leaked', value: 1 },
    { type: 'setFlag', key: 'samReplied', value: true },
    { type: 'text', thread: 'sam', body: 'Thank you SO much. That really helps. 🙂', typingMs: 2500 },
  ],
});

// ---------------------------------------------------------------------------
// Chapter 1 — "Found"
// ---------------------------------------------------------------------------

const CH1: Trigger[] = [
  {
    id: 'c1_first',
    when: { all: [{ chapter: 1 }, { elapsedInChapterSec: 7 }] },
    do: [
      { type: 'vibrate', pattern: [80, 60, 80] },
      { type: 'text', thread: 'unknown', body: 'I know someone picked it up.', typingMs: 2500 },
    ],
  },
  {
    id: 'c1_lock_nudge',
    when: { all: [{ not: { flag: 'phoneUnlocked' } }, { idleSec: 75 }] },
    do: [
      {
        type: 'text',
        thread: 'priya',
        body: "maya i almost guessed ur passcode on ur old ipad. still biscuit's day right?? u never change it",
        typingMs: 3000,
      },
    ],
  },
  {
    id: 'c1_lock_nudge2',
    when: { all: [{ not: { flag: 'phoneUnlocked' } }, { idleSec: 170 }] },
    do: [{ type: 'text', thread: 'unknown', body: "Can't get in? Good.", typingMs: 1500 }],
  },
  {
    id: 'c1_unlocked',
    when: { flag: 'phoneUnlocked' },
    delaySec: 4,
    do: [
      { type: 'vibrate', pattern: [60, 40, 60] },
      { type: 'text', thread: 'unknown', body: 'So you got in.', typingMs: 1800 },
      { type: 'text', thread: 'unknown', body: 'I can see her messages being read.', typingMs: 2400 },
    ],
  },
  {
    id: 'c1_jordan',
    when: { viewed: 'thread:jordan' },
    delaySec: 15,
    do: [{ type: 'text', thread: 'unknown', body: "He didn't do it. Stop wasting battery.", typingMs: 2000 }],
  },
  {
    id: 'c1_sam_first',
    when: {
      all: [
        { flag: 'phoneUnlocked' },
        // Never gate story progress on idle time: an active player resets it forever.
        { any: [{ viewed: 'app:messages' }, { fired: 'c1_unlocked', agoSec: 40 }] },
      ],
    },
    delaySec: 10,
    do: [
      {
        type: 'text',
        thread: 'sam',
        body: "Hi — whoever has this phone. I'm Sam, I work with Maya at Lumen. We're all so worried. Can you tell me where you found it? 🙏",
        typingMs: 3500,
      },
      {
        type: 'replies',
        thread: 'sam',
        choices: [
          tellShelter('c1_tell'),
          {
            id: 'c1_who',
            label: 'Ask who he is',
            body: 'who is this exactly?',
            then: [
              { type: 'setFlag', key: 'samReplied', value: true },
              {
                type: 'text',
                thread: 'sam',
                body: 'Just a friend from work! Honestly I just want to help her. Where did you find it? 🙂',
                typingMs: 3000,
              },
              { type: 'replies', thread: 'sam', choices: [tellShelter('c1_tell2'), sayNothing('c1_ignore2')] },
            ],
          },
          sayNothing('c1_ignore', [{ type: 'setFlag', key: 'samReplied', value: true }]),
        ],
      },
    ],
  },
  {
    id: 'c1_call',
    when: {
      all: [{ chapter: 1 }, { any: [{ flag: 'samReplied' }, { fired: 'c1_sam_first', agoSec: 60 }] }],
    },
    delaySec: 12,
    do: [{ type: 'call', callId: 'c1' }],
  },
];

// ---------------------------------------------------------------------------
// Chapter 2 — "Deleted"
// ---------------------------------------------------------------------------

const CH2: Trigger[] = [
  {
    id: 'c2_start',
    when: { chapter: 2 },
    delaySec: 3,
    do: [{ type: 'notify', app: 'Photos', title: 'Recently Deleted', body: '2 items will be permanently deleted in 1 day.' }],
  },
  {
    id: 'c2_maps',
    when: { viewed: 'app:maps' },
    delaySec: 6,
    do: [{ type: 'text', thread: 'unknown', body: 'Maps drains you fastest. Be smart.', typingMs: 1500 }],
  },
  {
    id: 'c2_contract',
    when: { viewed: 'photo:contract' },
    delaySec: 5,
    do: [{ type: 'text', thread: 'unknown', body: 'Now you know why she ran.', typingMs: 2000 }],
  },
  {
    id: 'c2_receipt',
    when: { viewed: 'photo:receipt' },
    delaySec: 4,
    do: [{ type: 'text', thread: 'unknown', body: "That's private.", typingMs: 1200 }],
  },
  {
    id: 'c2_sam_escalate',
    when: { all: [{ chapterAtLeast: 2 }, { any: [{ flag: 'recovered_contract' }, { elapsedInChapterSec: 70 }] }] },
    delaySec: 12,
    do: [
      {
        type: 'text',
        thread: 'sam',
        body: "Hey, quick thing — the police asked me to collect Maya's phone for the investigation. Where are you right now? I can come to you. 🙂",
        typingMs: 3500,
      },
      {
        type: 'replies',
        thread: 'sam',
        choices: [
          shareLocation('c2_share'),
          {
            id: 'c2_why',
            label: 'Why would police ask you?',
            body: 'why would the police ask YOU?',
            then: [
              {
                type: 'text',
                thread: 'sam',
                body: "It's complicated. Company device policy. Just tell me where you are and this is all very easy.",
                typingMs: 3500,
              },
              { type: 'replies', thread: 'sam', choices: [shareLocation('c2_share2'), sayNothing('c2_ignore2')] },
            ],
          },
          sayNothing('c2_ignore'),
        ],
      },
    ],
  },
  {
    id: 'c2_depot_unknown',
    when: { flag: 'walkedToDepot' },
    delaySec: 8,
    do: [{ type: 'text', thread: 'unknown', body: 'The locker. Smart.', typingMs: 1500 }],
  },
  {
    id: 'c2_depot_sam',
    when: { all: [{ flag: 'walkedToDepot' }, { flag: 'leaked', gte: 1 }] },
    delaySec: 18,
    do: [{ type: 'text', thread: 'sam', body: 'Was that you at the bus depot just now? 🙂', typingMs: 2500 }],
  },
  {
    id: 'c2_idle1',
    when: { all: [{ chapter: 2 }, { idleSec: 90 }] },
    do: [{ type: 'text', thread: 'unknown', body: 'She hid things. Photos. Notes. Look harder.', typingMs: 2000 }],
  },
  {
    id: 'c2_idle2',
    when: { all: [{ chapter: 2 }, { not: { flag: 'notesUnlocked' } }, { idleSec: 180 }] },
    do: [
      {
        type: 'text',
        thread: 'priya',
        body: "i keep thinking about ur dad. nov 7. u always go quiet that week. please be ok",
        typingMs: 3000,
      },
    ],
  },
  {
    id: 'c2_end',
    when: { all: [{ chapter: 2 }, { flag: 'notesUnlocked' }] },
    delaySec: 1,
    do: [
      { type: 'glitch', ms: 1400 },
      { type: 'vibrate', pattern: [200, 100, 200] },
      { type: 'advanceChapter' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Chapter 3 — "Signal"
// ---------------------------------------------------------------------------

const CH3: Trigger[] = [
  {
    id: 'c3_start',
    when: { chapter: 3 },
    delaySec: 3,
    do: [
      { type: 'setFlag', key: 'finalUnlocked', value: true },
      { type: 'text', thread: 'unknown', body: 'You opened her notes.', typingMs: 1500 },
      { type: 'text', thread: 'unknown', body: 'Then you know where. Now prove it.', typingMs: 2200 },
      { type: 'notify', app: 'Evidence', title: 'Case board unlocked', body: 'Link WHO, WHERE and WHY, then send her location.' },
    ],
  },
  {
    id: 'c3_sam_threat',
    when: { all: [{ chapter: 3 }, { elapsedInChapterSec: 40 }] },
    do: [
      {
        type: 'text',
        thread: 'sam',
        body: "Whoever you are: you're holding stolen company property. Last chance to do this the easy way.",
        typingMs: 3000,
      },
    ],
  },
  {
    id: 'c3_sam_battery',
    when: { all: [{ chapter: 3 }, { elapsedInChapterSec: 115 }] },
    do: [
      {
        type: 'text',
        thread: 'sam',
        body: "The Lumen app says this phone's battery is almost dead. I can wait. 🙂",
        typingMs: 3000,
      },
    ],
  },
  {
    id: 'c3_zoom_nudge',
    when: { all: [{ chapter: 3 }, { not: { viewed: 'hotspot:signature' } }, { elapsedInChapterSec: 55 }] },
    do: [
      {
        type: 'text',
        thread: 'unknown',
        body: 'The contract in her deleted photos. Zoom in. Bottom of the page.',
        typingMs: 2000,
      },
    ],
  },
  {
    id: 'c3_reveal',
    when: { all: [{ chapterAtLeast: 3 }, { any: [{ viewed: 'hotspot:signature' }, { elapsedInChapterSec: 150 }] }] },
    delaySec: 8,
    do: [{ type: 'call', callId: 'c3_reveal' }],
  },
  {
    id: 'c3_idle',
    when: { all: [{ chapter: 3 }, { flag: 'mayaRevealed' }, { idleSec: 60 }] },
    do: [{ type: 'text', thread: 'unknown', body: 'the case board. who. where. why. then send it.', typingMs: 1800 }],
  },
];

export const TRIGGERS: Trigger[] = [...CH1, ...CH2, ...CH3];
