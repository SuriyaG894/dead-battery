import type { EvidenceCategory } from '../types';

export interface EvidenceDef {
  id: string;
  label: string;
  detail: string;
  category: EvidenceCategory;
  /** What this evidence points to on the case board. */
  value: string;
  icon: string;
}

/** 12 pieces of evidence. Correct answers: WHO = sam, WHERE = lighthouse, WHY = data. */
export const EVIDENCE: Record<string, EvidenceDef> = {
  ev_sam_signature: {
    id: 'ev_sam_signature',
    label: 'Contract signature',
    detail: 'Signed "S. Okafor, Partner Relations" — (207) 555-0143. Same number as "Sam – Lumen".',
    category: 'who',
    value: 'sam',
    icon: '✍️',
  },
  ev_sam_curious: {
    id: 'ev_sam_curious',
    label: "Sam's 'check-in'",
    detail: 'Sam knew Maya opened the partner folder the night she did it.',
    category: 'who',
    value: 'sam',
    icon: '👔',
  },
  ev_jordan_threat: {
    id: 'ev_jordan_threat',
    label: "Jordan: 'you'll regret it'",
    detail: "Jordan's last angry message, five days ago.",
    category: 'who',
    value: 'jordan',
    icon: '💔',
  },
  ev_halden_visits: {
    id: 'ev_halden_visits',
    label: 'Halden Point visits',
    detail: '6 visits this week to Halden Point Lighthouse, all between 11 PM and 2 AM.',
    category: 'where',
    value: 'lighthouse',
    icon: '📍',
  },
  ev_ships_note: {
    id: 'ev_ships_note',
    label: '"Where Dad showed me the ships"',
    detail: "Maya's locked note tells a trusted finder where she is hiding.",
    category: 'where',
    value: 'lighthouse',
    icon: '📝',
  },
  ev_dad_photo: {
    id: 'ev_dad_photo',
    label: 'Photo: Maya & Dad at the point',
    detail: '"he\'d name every ship" — the old Halden Point lighthouse.',
    category: 'where',
    value: 'lighthouse',
    icon: '🖼️',
  },
  ev_locker14: {
    id: 'ev_locker14',
    label: 'Locker 14, Bus Depot',
    detail: 'A saved place: "spare battery + backup".',
    category: 'where',
    value: 'depot',
    icon: '🔐',
  },
  ev_lumen_office: {
    id: 'ev_lumen_office',
    label: 'Late nights at Lumen HQ',
    detail: 'Lumen HQ, last visit two days ago at 11:48 PM.',
    category: 'where',
    value: 'lumen',
    icon: '🏢',
  },
  ev_contract: {
    id: 'ev_contract',
    label: 'Deleted contract',
    detail: 'LUMEN – DATA PARTNER AGREEMENT: live location of every user, sold to third parties.',
    category: 'why',
    value: 'data',
    icon: '📄',
  },
  ev_memo: {
    id: 'ev_memo',
    label: 'Meeting recording',
    detail: '"Every Lumen user, real-time location, five-minute intervals… Sam handles it."',
    category: 'why',
    value: 'data',
    icon: '🎙️',
  },
  ev_search_history: {
    id: 'ev_search_history',
    label: 'Search history',
    detail: '"how to report a data privacy violation anonymously"',
    category: 'why',
    value: 'data',
    icon: '🔎',
  },
  ev_breakup: {
    id: 'ev_breakup',
    label: 'The breakup',
    detail: 'Jordan ended things two weeks ago.',
    category: 'why',
    value: 'breakup',
    icon: '🥀',
  },
};

export const EVIDENCE_TOTAL = Object.keys(EVIDENCE).length;
