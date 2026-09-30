import type { ReactNode } from 'react';
import type { SceneId } from '../content/media';

/** Hand-drawn SVG "photos". A grain overlay in CSS gives them a phone-camera look. */
export function Scene({ id, className }: { id: SceneId; className?: string }) {
  return (
    <svg className={`scene ${className ?? ''}`} viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {SCENES[id]}
    </svg>
  );
}

const Lighthouse = ({ x, y, s = 1, lit = false }: { x: number; y: number; s?: number; lit?: boolean }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {lit && <polygon points="0,-118 -220,-150 -220,-80" fill="#fff6c8" opacity="0.18" />}
    {lit && <polygon points="0,-118 220,-160 220,-90" fill="#fff6c8" opacity="0.12" />}
    <polygon points="-16,0 16,0 10,-100 -10,-100" fill="#e9e4da" />
    <rect x="-16" y="-30" width="32" height="12" fill="#b3372f" />
    <rect x="-13" y="-70" width="26" height="12" fill="#b3372f" />
    <rect x="-13" y="-112" width="26" height="12" fill="#2b2f36" />
    <rect x="-9" y="-110" width="18" height="8" fill={lit ? '#fff6c8' : '#9fb4c2'} />
    <polygon points="-15,-112 15,-112 0,-126" fill="#2b2f36" />
    <rect x="-20" y="-102" width="40" height="3" fill="#2b2f36" />
  </g>
);

const SCENES: Record<SceneId, ReactNode> = {
  dog: (
    <>
      <defs>
        <linearGradient id="dogbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6c98a" />
          <stop offset="1" stopColor="#d9895b" />
        </linearGradient>
      </defs>
      <rect width="300" height="300" fill="url(#dogbg)" />
      <rect y="210" width="300" height="90" fill="#8a5a3c" />
      <ellipse cx="150" cy="215" rx="80" ry="18" fill="#6b4430" opacity="0.5" />
      <ellipse cx="150" cy="175" rx="62" ry="48" fill="#c68a4f" />
      <ellipse cx="150" cy="118" rx="46" ry="42" fill="#d49a5c" />
      <ellipse cx="108" cy="110" rx="16" ry="32" fill="#8a5a33" transform="rotate(20 108 110)" />
      <ellipse cx="192" cy="110" rx="16" ry="32" fill="#8a5a33" transform="rotate(-20 192 110)" />
      <ellipse cx="150" cy="135" rx="24" ry="18" fill="#f0d2a8" />
      <circle cx="133" cy="110" r="6" fill="#1c1410" />
      <circle cx="167" cy="110" r="6" fill="#1c1410" />
      <circle cx="135" cy="108" r="2" fill="#fff" />
      <circle cx="169" cy="108" r="2" fill="#fff" />
      <ellipse cx="150" cy="128" rx="9" ry="6" fill="#1c1410" />
      <path d="M150 134 q0 10 -9 12 M150 134 q0 10 9 12" stroke="#1c1410" strokeWidth="2.5" fill="none" />
      <path d="M146 146 q4 12 8 0" fill="#e0707a" />
      <rect x="112" y="150" width="76" height="10" rx="5" fill="#3a78d8" />
      <circle cx="150" cy="163" r="6" fill="#f2c94c" />
      <text x="150" y="285" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff" opacity="0.85">
        BISCUIT 🐾
      </text>
    </>
  ),
  lighthouse: (
    <>
      <defs>
        <linearGradient id="daysky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fc3e8" />
          <stop offset="1" stopColor="#f3d9b1" />
        </linearGradient>
      </defs>
      <rect width="300" height="300" fill="url(#daysky)" />
      <rect y="190" width="300" height="110" fill="#3f78a0" />
      <path d="M0 190 H300" stroke="#fff" strokeOpacity="0.4" />
      <path d="M160 300 L200 200 Q230 185 300 192 V300 Z" fill="#5d5448" />
      <Lighthouse x={250} y={195} s={0.9} />
      <path d="M40 206 h40 l-6 8 h-28 z" fill="#2b2f36" />
      <rect x="58" y="192" width="3" height="14" fill="#2b2f36" />
      <circle cx="90" cy="250" r="16" fill="#2f2721" />
      <rect x="76" y="264" width="28" height="36" rx="10" fill="#34506b" />
      <circle cx="120" cy="262" r="11" fill="#3d2f27" />
      <rect x="111" y="272" width="18" height="28" rx="8" fill="#c0503a" />
      <path d="M98 272 L112 276" stroke="#34506b" strokeWidth="6" strokeLinecap="round" />
    </>
  ),
  lighthouseNight: (
    <>
      <rect width="300" height="300" fill="#05070c" />
      <rect y="200" width="300" height="100" fill="#070b12" />
      <Lighthouse x={170} y={215} s={1.05} lit />
      <rect width="300" height="300" fill="#000" opacity="0.35" />
      <g opacity="0.5" fill="#fff">
        <circle cx="30" cy="40" r="1" />
        <circle cx="80" cy="70" r="1" />
        <circle cx="260" cy="30" r="1.2" />
        <circle cx="220" cy="90" r="0.8" />
      </g>
    </>
  ),
  cake: (
    <>
      <rect width="300" height="300" fill="#1a1210" />
      <circle cx="150" cy="120" r="120" fill="#f5a24b" opacity="0.12" />
      <ellipse cx="150" cy="230" rx="100" ry="20" fill="#3a2a22" />
      <rect x="80" y="170" width="140" height="60" rx="8" fill="#6b3d2a" />
      <rect x="80" y="170" width="140" height="16" rx="8" fill="#f1e2d0" />
      <rect x="147" y="120" width="6" height="50" fill="#f6f1e8" />
      <path d="M150 100 q-8 12 0 20 q8 -8 0 -20" fill="#ffcf5c" />
      <circle cx="150" cy="112" r="18" fill="#ffcf5c" opacity="0.25" />
      <text x="150" y="212" textAnchor="middle" fontSize="16" fill="#f1e2d0" fontFamily="cursive">
        Dad
      </text>
    </>
  ),
  bonfire: (
    <>
      <rect width="300" height="300" fill="#0e0b16" />
      <rect y="210" width="300" height="90" fill="#2a2016" />
      <circle cx="150" cy="200" r="90" fill="#ff8a3d" opacity="0.18" />
      <path d="M150 210 q-40 -30 -10 -80 q5 30 20 30 q-5 -30 20 -60 q10 40 20 60 q20 -10 10 -40 q30 40 -10 90 z" fill="#ff9a3d" />
      <path d="M150 210 q-20 -20 -2 -50 q10 20 18 22 q6 -16 12 -24 q10 30 -8 52 z" fill="#ffd66b" />
      <circle cx="70" cy="190" r="16" fill="#1a1410" />
      <rect x="55" y="205" width="30" height="40" rx="10" fill="#1a1410" />
      <circle cx="235" cy="192" r="15" fill="#1a1410" />
      <rect x="220" y="206" width="30" height="40" rx="10" fill="#1a1410" />
    </>
  ),
  badge: (
    <>
      <rect width="300" height="300" fill="#dfe6ee" />
      <rect x="0" y="230" width="300" height="70" fill="#b9c3cf" />
      <rect x="140" y="0" width="20" height="90" fill="#6d4cf0" />
      <rect x="85" y="80" width="130" height="170" rx="12" fill="#fff" stroke="#c9d2dc" strokeWidth="2" />
      <rect x="85" y="80" width="130" height="40" rx="12" fill="#6d4cf0" />
      <text x="150" y="107" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff">
        lumen ✨
      </text>
      <circle cx="150" cy="155" r="24" fill="#c9b7a6" />
      <rect x="126" y="178" width="48" height="20" rx="10" fill="#c9b7a6" />
      <text x="150" y="220" textAnchor="middle" fontSize="13" fontWeight="700" fill="#222">
        MAYA REYES
      </text>
      <text x="150" y="236" textAnchor="middle" fontSize="9" fill="#666">
        Data Ops · Intern
      </text>
    </>
  ),
  whiteboard: (
    <>
      <rect width="300" height="300" fill="#8d949b" />
      <rect x="20" y="40" width="260" height="200" fill="#f4f5f2" stroke="#666" strokeWidth="4" />
      <g fontFamily="'Comic Sans MS', cursive" fill="#2448a8">
        <text x="40" y="80" fontSize="20" fontWeight="700">
          PARTNER FEED
        </text>
        <text x="40" y="110" fontSize="15">
          GO LIVE → FRI
        </text>
        <text x="40" y="140" fontSize="13" fill="#b3261e">
          2.1M users × 5 min pings
        </text>
        <text x="40" y="168" fontSize="13">
          $$ per stream
        </text>
        <text x="40" y="196" fontSize="13">
          "consent" = ToS p.40
        </text>
      </g>
      <path d="M200 150 l40 -40 M240 110 l-10 0 M240 110 l0 10" stroke="#b3261e" strokeWidth="3" />
      <rect x="20" y="240" width="260" height="10" fill="#555" />
    </>
  ),
  contract: (
    <>
      <rect width="300" height="300" fill="#3b3530" />
      <g transform="rotate(-2 150 150)">
        <rect x="40" y="10" width="220" height="285" fill="#f7f4ec" />
        <text x="150" y="38" textAnchor="middle" fontSize="11" fontWeight="700" fill="#222">
          LUMEN – DATA PARTNER AGREEMENT
        </text>
        <text x="150" y="52" textAnchor="middle" fontSize="7" fill="#555">
          CONFIDENTIAL · DO NOT DISTRIBUTE
        </text>
        <g fontSize="6.4" fill="#333">
          <text x="55" y="74">1. Lumen shall provide Partner a continuous stream of</text>
          <text x="55" y="84">real-time geolocation data for all active users,</text>
          <text x="55" y="94">sampled at five (5) minute intervals.</text>
          <text x="55" y="110">2. Data includes home, work and overnight locations,</text>
          <text x="55" y="120">inferred relationships and daily routines.</text>
          <text x="55" y="136">3. Users shall not be notified of this arrangement.</text>
          <text x="55" y="152">4. Fee: $0.04 per user per day.</text>
        </g>
        <g fill="#333" opacity="0.25">
          <rect x="55" y="168" width="190" height="4" />
          <rect x="55" y="178" width="170" height="4" />
          <rect x="55" y="188" width="180" height="4" />
          <rect x="55" y="198" width="120" height="4" />
        </g>
        <path d="M60 250 q15 -18 30 0 t30 -4 q10 -8 20 2" stroke="#1a2a8a" strokeWidth="1.6" fill="none" />
        <line x1="55" y1="256" x2="150" y2="256" stroke="#333" strokeWidth="0.6" />
        <text x="55" y="265" fontSize="6" fill="#333">
          S. Okafor, Partner Relations
        </text>
        <text x="55" y="274" fontSize="6" fill="#333">
          (207) 555-0143
        </text>
      </g>
    </>
  ),
  receipt: (
    <>
      <rect width="300" height="300" fill="#2a2522" />
      <rect x="90" y="20" width="120" height="260" fill="#f3f0e6" />
      <g fontFamily="monospace" fontSize="8" fill="#333">
        <text x="150" y="44" textAnchor="middle" fontWeight="700">
          HALDEN MART
        </text>
        <text x="150" y="56" textAnchor="middle">
          22 Harbor Rd
        </text>
        <text x="100" y="84">PREPAID PHONE</text>
        <text x="175" y="84">29.99</text>
        <text x="100" y="98">USB CHARGER</text>
        <text x="175" y="98">9.99</text>
        <text x="100" y="112">GRANOLA x6</text>
        <text x="175" y="112">7.49</text>
        <text x="100" y="126">FLASHLIGHT</text>
        <text x="175" y="126">12.99</text>
        <text x="100" y="150" fontWeight="700">TOTAL</text>
        <text x="172" y="150" fontWeight="700">60.46</text>
        <text x="100" y="166">PAID: CASH</text>
        <text x="150" y="200" textAnchor="middle">
          THANK YOU!
        </text>
      </g>
    </>
  ),
  ships: (
    <>
      <defs>
        <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b2d52" />
          <stop offset="0.6" stopColor="#d9786a" />
          <stop offset="1" stopColor="#f2b27a" />
        </linearGradient>
      </defs>
      <rect width="300" height="300" fill="url(#dusk)" />
      <rect y="190" width="300" height="110" fill="#1f2d45" />
      <path d="M40 186 h70 l-8 10 h-54 z" fill="#0f1420" />
      <rect x="60" y="170" width="20" height="16" fill="#0f1420" />
      <path d="M180 190 h50 l-6 7 h-38 z" fill="#0f1420" />
      <circle cx="240" cy="150" r="18" fill="#ffd28a" opacity="0.8" />
      <path d="M0 300 L0 250 Q60 230 110 260 L130 300 Z" fill="#141414" />
    </>
  ),
};
