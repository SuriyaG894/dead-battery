import type { Action, EndingId, Recipient } from '../types';

export interface EndingDef {
  title: string;
  number: number;
  tone: 'good' | 'bad' | 'bitter';
  headline: string;
  epilogue: string[];
}

export const ENDINGS: Record<EndingId, EndingDef> = {
  lighthouse: {
    title: 'The Lighthouse',
    number: 1,
    tone: 'good',
    headline: 'MISSING PORT HALDEN TEEN FOUND SAFE — LUMEN SERVERS SEIZED',
    epilogue: [
      'Officers found Maya Reyes, 19, inside the old Halden Point lighthouse at 3:12 AM, wrapped in her father\'s jacket.',
      "She handed them a recording and a photo of a contract. By morning, federal agents were inside Lumen HQ. Sam Okafor was detained at the county line.",
      '"Somebody found my phone," Maya told reporters. "And they trusted the right person."',
    ],
  },
  too_late: {
    title: 'Too Late',
    number: 2,
    tone: 'bad',
    headline: 'SEARCH FOR MISSING TEEN ENTERS THIRD DAY',
    epilogue: [
      'The screen went black.',
      'Somewhere on the coast, a burner phone waited for a reply that never came.',
      'On Friday, the partner feed went live.',
    ],
  },
  betrayal: {
    title: 'Betrayal',
    number: 3,
    tone: 'bad',
    headline: 'LUMEN CELEBRATES "PARTNER FEED" LAUNCH',
    epilogue: [
      'Sam replied: "Thank you. That\'s all we needed."',
      'Then the screen flashed white. "Remote wipe in progress."',
      'By the time anyone else reached Halden Point, the lighthouse was empty. There was no contract. There was no recording. There was no phone.',
    ],
  },
  wrong_answer: {
    title: 'Wrong Answer',
    number: 4,
    tone: 'bitter',
    headline: 'POLICE QUESTION LOCAL MAN IN MISSING-PERSON CASE',
    epilogue: [
      'The police spent the night chasing the wrong lead.',
      'When they finally reached the coast, the lighthouse door was open and swinging in the wind. Maya was gone. So was the proof.',
      'The case board had the pieces. They just weren\'t in the right places.',
    ],
  },
  watched: {
    title: 'Watched',
    number: 5,
    tone: 'bitter',
    headline: 'MISSING TEEN SPOTTED BOARDING NORTHBOUND BUS',
    epilogue: [
      "Mom's phone had been running the Lumen app for months. Every message she received was read by someone else first.",
      'By dawn a black car idled at Halden Point. Maya saw its headlights and slipped away down the rocks.',
      'She is alive. She is still running.',
    ],
  },
};

export const SECRET_ENDING = {
  id: 'next_target',
  title: 'Next Target',
  number: 6,
};

export const TOTAL_ENDINGS = 6;

const PLACE: Record<string, string> = {
  lighthouse: 'Halden Point Lighthouse',
  depot: 'the Bus Depot on Harbor Rd',
  lumen: 'Lumen HQ',
};

/** The scripted exchange after the player sends the location. Ends with the ending action. */
export function finalSequence(to: Recipient, ending: EndingId, where?: string): Action[] {
  const place = (where && PLACE[where]) ?? 'somewhere near the harbor';
  const end: Action[] = [{ type: 'wait', sec: 3.5 }, { type: 'ending', id: ending }];

  switch (to) {
    case 'police':
      return [
        {
          type: 'sent',
          thread: 'police',
          body: `Missing person Maya Reyes is at ${place}. She is in danger. I have evidence against Lumen.`,
        },
        {
          type: 'text',
          thread: 'police',
          body:
            ending === 'lighthouse'
              ? '911: Message received. Units are being dispatched to Halden Point now. Stay where you are.'
              : '911: Message received. Officers will look into it.',
          typingMs: 3000,
        },
        ...end,
      ];
    case 'unknown':
      return [
        { type: 'sent', thread: 'unknown', body: `i know you're at ${place}. i'm sending the proof to people who can't be bought.` },
        {
          type: 'text',
          thread: 'unknown',
          body: ending === 'lighthouse' ? 'ok. i trust you. 🤍 i can see the lights coming.' : "that's not… wait. that's wrong. they'll look in the wrong place",
          typingMs: 2500,
        },
        ...end,
      ];
    case 'mom':
      return [
        { type: 'sent', thread: 'mom', body: `Mrs. Reyes — Maya is at ${place}. She's alive. Please hurry.` },
        { type: 'text', thread: 'mom', body: "Oh my god. I'm coming. Thank you thank you thank you", typingMs: 2500 },
        { type: 'wait', sec: 1.5 },
        { type: 'glitch', ms: 600 },
        ...end,
      ];
    case 'sam':
      return [
        { type: 'sent', thread: 'sam', body: `she's at ${place}` },
        { type: 'text', thread: 'sam', body: "Thank you. That's all we needed.", typingMs: 2500 },
        { type: 'wait', sec: 1.5 },
        { type: 'glitch', ms: 1500 },
        ...end,
      ];
  }
}
