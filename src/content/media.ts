export type SceneId =
  | 'dog'
  | 'lighthouse'
  | 'lighthouseNight'
  | 'cake'
  | 'bonfire'
  | 'badge'
  | 'whiteboard'
  | 'contract'
  | 'receipt'
  | 'ships';

export interface PhotoDef {
  id: string;
  scene: SceneId;
  caption: string;
  when: string;
  deleted?: boolean;
  evidence?: string;
}

export const PHOTOS: PhotoDef[] = [
  { id: 'night_point', scene: 'lighthouseNight', caption: '', when: '2 days ago · 11:52 PM' },
  { id: 'whiteboard', scene: 'whiteboard', caption: '??????', when: '4 days ago' },
  { id: 'badge', scene: 'badge', caption: 'first day at lumen!! 💼✨', when: 'June 2 · 2026' },
  { id: 'bonfire', scene: 'bonfire', caption: 'summer w/ priya 🔥', when: 'Aug 14 · 2026' },
  { id: 'dad_bday', scene: 'cake', caption: 'happy bday dad 🕯️ 11/07. miss u every day', when: 'Nov 7 · 2025' },
  { id: 'ships', scene: 'ships', caption: 'the ships still come in. just like u said', when: 'Nov 7 · 2025' },
  {
    id: 'dad_point',
    scene: 'lighthouse',
    caption: "me & dad at the point. he'd name every ship that came in 🚢",
    when: 'July 4 · 2016',
    evidence: 'ev_dad_photo',
  },
  { id: 'biscuit', scene: 'dog', caption: 'GOTCHA DAY!!! welcome home biscuit 🐶', when: 'June 14 · 2019' },
  {
    id: 'contract',
    scene: 'contract',
    caption: 'IMG_4471.jpg',
    when: 'Deleted 2 days ago',
    deleted: true,
    evidence: 'ev_contract',
  },
  { id: 'receipt', scene: 'receipt', caption: 'IMG_4475.jpg', when: 'Deleted 2 days ago', deleted: true },
];

export interface MapPin {
  id: string;
  x: number;
  y: number;
  name: string;
  detail: string;
  visits: string;
  evidence?: string;
  icon: string;
}

export const MAP_PINS: MapPin[] = [
  {
    id: 'shelter',
    x: 150,
    y: 330,
    name: 'Bus Shelter · Harbor Rd',
    detail: 'Last location. The phone stopped moving here yesterday at 9:31 PM.',
    visits: 'You are here',
    icon: '📱',
  },
  { id: 'home', x: 70, y: 180, name: 'Home · 14 Maple St', detail: 'Home.', visits: 'Most visited', icon: '🏠' },
  { id: 'priya', x: 110, y: 90, name: "Priya's", detail: 'Priya Shah · 3 Birch Ln', visits: '41 visits', icon: '💛' },
  {
    id: 'lumen',
    x: 250,
    y: 120,
    name: 'Lumen HQ · Harbor Tech Park',
    detail: 'Work. Unusually late visits this week.',
    visits: '23 visits · last: 2 days ago, 11:48 PM',
    evidence: 'ev_lumen_office',
    icon: '🏢',
  },
  { id: 'mart', x: 200, y: 250, name: 'Halden Mart', detail: 'Convenience store.', visits: 'Yesterday · 8:15 PM', icon: '🛒' },
  {
    id: 'depot',
    x: 262,
    y: 330,
    name: 'Bus Depot · Locker 14',
    detail: 'Saved place ⭐ "spare battery + backup"',
    visits: 'Yesterday · 9:02 PM',
    evidence: 'ev_locker14',
    icon: '🔐',
  },
  {
    id: 'point',
    x: 318,
    y: 468,
    name: 'Halden Point Lighthouse',
    detail: 'Decommissioned lighthouse at the end of the point.',
    visits: '6 visits this week · all between 11 PM – 2 AM',
    evidence: 'ev_halden_visits',
    icon: '🗼',
  },
];

export const TIMELINE = [
  { time: '6:40 PM', place: 'Lumen HQ', note: '12 min' },
  { time: '8:15 PM', place: 'Halden Mart', note: '6 min' },
  { time: '9:02 PM', place: 'Bus Depot', note: '9 min' },
  { time: '9:31 PM', place: 'Bus Shelter · Harbor Rd', note: 'Location stopped updating' },
];

export interface NoteDef {
  id: string;
  title: string;
  preview: string;
  body: string;
  evidence?: string;
  pinned?: boolean;
}

export const NOTES: NoteDef[] = [
  {
    id: 'read_this',
    title: 'READ THIS',
    preview: "If you found this, you're one of the good ones",
    pinned: true,
    evidence: 'ev_ships_note',
    body: [
      "If you found this, you're one of the good ones. You figured out the code, which means you actually looked.",
      "They can track this phone, so I left it behind. I'm somewhere safe. I'm where Dad showed me the ships.",
      'Please don\'t tell anyone who asks where I am. Not work. Not anyone who is "just worried". They will sound so nice.',
      "The proof is in the camera roll (deleted) and the voice memos. Get it to someone who can't be bought.",
      '— M',
    ].join('\n\n'),
  },
  {
    id: 'evidence',
    title: 'evidence??',
    preview: 'contract photo → deleted after upload',
    body: [
      '- contract photo → took pic, deleted after upload',
      '- meeting memo → on phone',
      '- S.O. = "partner relations" = the one who makes problems go away',
      '- partner feed goes live FRIDAY',
      '- 2 million people. their kids. their exes. everyone.',
    ].join('\n'),
  },
  {
    id: 'burner',
    title: 'shopping',
    preview: 'prepaid phone (cash!!)',
    body: ['- prepaid phone (cash!!)', '- charger', '- granola bars', '- flashlight', "- dad's old jacket from the car"].join('\n'),
  },
  {
    id: 'priya',
    title: 'things to tell priya',
    preview: 'sorry for lying',
    body: [
      '- sorry for lying',
      '- sorry for making u lie',
      '- ur the best person i know',
      '- the bonfire thing was not my fault (it was my fault)',
    ].join('\n'),
  },
];

export interface MemoDef {
  id: string;
  title: string;
  when: string;
  duration: string;
  segments: { speaker: string; text: string; requires?: string }[];
  evidence?: string;
}

export const MEMOS: MemoDef[] = [
  {
    id: 'meeting',
    title: 'meeting_0923',
    when: '5 days ago',
    duration: '1:48',
    evidence: 'ev_memo',
    segments: [
      { speaker: 'Man', text: '…so the partner feed goes live Friday. Every Lumen user. Real-time location, five-minute intervals.' },
      { speaker: 'Woman', text: 'And the users know about this?', requires: 'recovered_contract' },
      { speaker: 'Man', text: 'They agreed to the terms. Page forty. Nobody reads page forty.', requires: 'recovered_contract' },
      {
        speaker: 'Man',
        text: "If anyone internal gets curious, Sam handles it. That's what partner relations is for.",
        requires: 'recovered_contract',
      },
    ],
  },
  {
    id: 'self',
    title: 'note to self',
    when: 'Yesterday · 8:40 PM',
    duration: '0:14',
    segments: [
      {
        speaker: 'Maya',
        text: "Okay. If you're hearing this, I'm fine. I'm just… somewhere they don't know about. The cold is the worst part.",
      },
    ],
  },
];

export interface VoicemailDef {
  id: string;
  from: string;
  when: string;
  text: string;
}

export const VOICEMAILS: VoicemailDef[] = [
  {
    id: 'priya',
    from: 'Priya 💛',
    when: '9 hours ago',
    text: "it's me. there was a man from your work at my door. sam something. he was really nice but like… too nice? he kept asking where you like to go. i didn't tell him anything. call me.",
  },
  {
    id: 'mom',
    from: 'Mom',
    when: '5 hours ago',
    text: "Maya, it's Mom. Nobody's seen you since yesterday. I'm not mad. I just need to hear your voice. Please call me. I love you.",
  },
];

export const RECENTS = [
  { name: 'Mom', detail: 'Missed (14)', when: '50 min ago', missed: true },
  { name: 'Priya 💛', detail: 'Missed (3)', when: '2 hours ago', missed: true },
  { name: 'No Caller ID', detail: 'Missed', when: '9 hours ago', missed: true },
  { name: 'Sam – Lumen', detail: 'Missed (2)', when: 'Yesterday', missed: true },
  { name: 'Priya 💛', detail: 'Outgoing', when: 'Yesterday', missed: false },
];

export const SEARCHES = [
  { q: 'how to report a data privacy violation anonymously', when: '2 days ago', evidence: 'ev_search_history' },
  { q: 'is selling location data illegal maine', when: '2 days ago' },
  { q: 'journalists who cover tech privacy', when: '2 days ago' },
  { q: 'halden point lighthouse still open at night', when: 'Yesterday' },
  { q: 'prepaid phone without id', when: 'Yesterday' },
  { q: 'how long does a phone keep location history', when: 'Yesterday' },
];
