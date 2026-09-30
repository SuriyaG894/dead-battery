import type { Msg, ThreadId } from '../types';

/**
 * Backstory messages. `ago` is minutes before the player picked up the phone.
 * Style guide: Priya types lowercase and fast. Sam is over-polite and a little too curious.
 * Jordan is hurt and blunt. Mom is Mom. Nobody explains anything they wouldn't really text.
 */
interface Seed {
  from: 'me' | 'them';
  body: string;
  ago: number;
  photo?: string;
  evidence?: string;
}

const H = 60;
const D = 24 * H;

const SEEDS: Record<ThreadId, Seed[]> = {
  priya: [
    { from: 'them', body: 'are u coming to the bonfire saturday', ago: 4 * D },
    { from: 'me', body: "can't, work stuff. lumen is being weird", ago: 4 * D - 12 },
    { from: 'them', body: 'weird how', ago: 4 * D - 13 },
    { from: 'me', body: 'tell u in person. not over text', ago: 4 * D - 20 },
    { from: 'them', body: 'ok thats ominous but ok 👀', ago: 4 * D - 21 },
    { from: 'them', body: "hey it's almost nov 7. u ok? i know it's a hard week w ur dad's bday", ago: 2 * D },
    { from: 'me', body: "yeah. might go up to the point again. it's where i think best", ago: 2 * D - 9 },
    { from: 'them', body: 'the lighthouse?? at night?? ur insane. love u', ago: 2 * D - 10 },
    { from: 'me', body: "if anyone asks, i'm at yours tonight ok?", ago: 32 * H },
    { from: 'them', body: "??? ok but what's going on", ago: 32 * H - 2 },
    { from: 'me', body: "i'll explain. i promise. don't tell anyone from work ANYTHING", ago: 32 * H - 4 },
    { from: 'them', body: 'maya where are u', ago: 20 * H },
    { from: 'them', body: 'ur mom called me. i said u were here. i lied for u. call me', ago: 16 * H },
    { from: 'them', body: 'a guy from ur work came to my house asking about u', ago: 9 * H },
    { from: 'them', body: 'MAYA PLEASE', ago: 2 * H },
    { from: 'them', body: 'just send one emoji so i know ur alive', ago: 38 },
  ],
  jordan: [
    { from: 'them', body: "you've been so distant since you started at that app company", ago: 16 * D },
    { from: 'me', body: "i can't talk about it jordan", ago: 16 * D - 5 },
    { from: 'them', body: "you never can. i'm done then", ago: 16 * D - 6, evidence: 'ev_breakup' },
    { from: 'them', body: "you'll regret shutting me out", ago: 5 * D, evidence: 'ev_jordan_threat' },
    { from: 'them', body: 'the police called me. i did NOT do anything maya. where are you', ago: 19 * H },
    { from: 'them', body: "i'm sorry about what i said. please just be ok", ago: 7 * H },
  ],
  mom: [
    { from: 'them', body: "Dinner Sunday? Making your dad's soup 💛", ago: 3 * D },
    { from: 'me', body: 'yes!! love u', ago: 3 * D - 30 },
    { from: 'them', body: 'You home tonight sweetie?', ago: 30 * H },
    { from: 'them', body: 'Maya call me', ago: 22 * H },
    { from: 'them', body: "Priya says you're at hers but she sounds strange", ago: 15 * H },
    { from: 'them', body: "I've called everyone.", ago: 10 * H },
    { from: 'them', body: 'The police have your photo out. Please honey.', ago: 5 * H },
    { from: 'them', body: 'Please.', ago: 50 },
  ],
  sam: [
    {
      from: 'them',
      body: "Hi Maya! Sam from Partner Relations 🙂 Heard you've been asking questions about the data pipeline. Happy to walk you through it over coffee!",
      ago: 8 * D,
    },
    { from: 'me', body: 'all good, thanks!', ago: 8 * D - 40 },
    {
      from: 'them',
      body: 'Hey! IT says you opened the partner folder last night. Just checking in — everything okay? 🙂',
      ago: 3 * D,
      evidence: 'ev_sam_curious',
    },
    { from: 'them', body: 'Maya, the whole office is worried. Where are you right now?', ago: 26 * H },
  ],
  unknown: [{ from: 'them', body: 'Put it back.', ago: 2 }],
  police: [],
};

export function buildInitialThreads(now: number): Record<ThreadId, Msg[]> {
  const out = {} as Record<ThreadId, Msg[]>;
  for (const [thread, seeds] of Object.entries(SEEDS) as [ThreadId, Seed[]][]) {
    out[thread] = seeds.map((s, i) => ({
      id: `${thread}-${i}`,
      from: s.from,
      body: s.body,
      ts: now - s.ago * 60_000,
      photo: s.photo,
      evidence: s.evidence,
    }));
  }
  return out;
}

export const THREAD_ORDER: ThreadId[] = ['unknown', 'priya', 'mom', 'sam', 'jordan', 'police'];

export const CONTACT_NUMBERS: Record<ThreadId, string> = {
  priya: '(207) 555-0118',
  jordan: '(207) 555-0162',
  mom: '(207) 555-0101',
  sam: '(207) 555-0143',
  unknown: 'No Caller ID',
  police: '911',
};
