# Dead Battery: Implementation Plan

## Summary

**Dead Battery** is a browser mystery thriller in the "found phone" style. The player finds the phone of **Maya Reyes (19)**, who went missing 31 hours ago. The whole game screen *is* her phone. The player digs through messages, photos, maps, voice memos, notes and deleted files to work out where she is, and it has to happen before the battery dies. The battery starts at **23%** and drains in real time. Every app, action and hint costs battery.

The concept is built around four hooks that make it stronger than a standard found-phone game:

1. **Battery is the currency.** Time, hints, recovering deleted files and screen brightness all spend the same resource, so every choice feels tense.
2. **The phone watches you back.** An unknown number texts and calls *while you're playing* and reacts to what you just looked at ("Why are you looking at her photos?").
3. **The trust inversion.** The creepy "Unknown" caller turns out to be Maya herself, testing whether you can be trusted. The friendly "coworker" asking where she is works for the people hunting her. The whole game trains players to trust the wrong person.
4. **The real world bleeds in.** The status bar shows the player's real local time, message timestamps are relative to "now", the phone vibrates on Android, and pausing is explained in-story ("screen off" slows the drain).

It deploys to Vercel as a static Vite + React + TypeScript single-page app with no backend. It's mobile-first and takes about 25–35 minutes to play, with 5 endings plus a secret one.

---

## Scope & Constraints

**User-stated constraints (hard):**
- It must be **played in a browser** and **deployed on Vercel**.
- It must be **interactive, adventurous, mysterious, thrilling and nail-biting**. Tension is a core requirement, not polish.
- It must be **unique, attractive and easy for anyone to grasp**. No tutorial wall: the phone UI is already familiar to everyone.

**In scope (v1):**
- Phone shell: lock screen, home screen, status bar, notifications, incoming call UI and glitch effects.
- Battery engine: real-time drain, per-app multipliers, brightness trade-off, Low Power Mode, a power bank pickup.
- Director engine: a data-driven trigger system for scripted and reactive events.
- 9 in-phone apps: Messages, Photos (+ Recently Deleted), Maps (location history), Notes (locked), Voice Memos, Phone (recents + voicemail), Browser (history), Settings, and Evidence (the case board).
- 3 chapters, 5 endings plus 1 secret ending, and a choice-based chat reply system.
- Audio (ambient drone, ringtone, notification sounds, distorted voice), haptics with a visual fallback.
- Chapter checkpoints saved in `localStorage`, share card, OG image, Vercel Analytics for the ending funnel.
- Accessibility: text size, reduced motion, Story Mode (slower drain), captions for all audio.

**Out of scope (v1):**
- Backend, accounts, leaderboards, multiplayer.
- AI-generated or dynamic dialogue. All content is hand-authored.
- Real map APIs such as Google Maps or Mapbox. The map is a hand-drawn SVG of the fictional town of **Port Halden**.
- Localization. Keep all strings in content files so it can be added later.
- Native app builds. A PWA "Add to Home Screen" is included because it gives a fullscreen, immersive experience.

**Content rating:** PG-13 thriller. There's suspense and implied threat, but no gore and no depiction of harm to Maya. This keeps the game shareable everywhere.

---

## Game Design (replaces "Root Cause" for a greenfield project)

### Story

**Setting:** Port Halden, a foggy coastal town. The player found the phone face-down at a bus shelter.

**The truth, revealed gradually:** Maya worked a part-time job at **Lumen**, a "wellness" app startup. She found out Lumen was secretly selling users' live location data. She recorded a meeting, copied a contract, and went into hiding at the **old Halden lighthouse**, where her late father used to take her. She dropped her phone on purpose, with clues left for someone trustworthy, because Lumen could track it. Lumen's fixer is trying to get the phone unlocked and find her.

| Character | Appears as | Truth |
|---|---|---|
| **Maya Reyes** | Missing. Phone owner. | Hiding at the lighthouse. Also secretly the **"Unknown"** number, texting from a burner phone. |
| **Unknown** | Menacing texts and distorted calls: "Put the phone back." | Maya, trying to scare off anyone untrustworthy and testing whether the player follows the clues rather than the fear. |
| **Sam Okafor ("Sam – Lumen")** | A warm, worried coworker: "We're all so scared. Did she say where she was going?" | Lumen's fixer. The real villain. |
| **Priya** | Best friend. Frantic group chat. | Ally. Holds the key to the notes passcode. |
| **Jordan** | Ex-boyfriend. Angry old messages. | Red herring. |
| **Mom** | Missed calls and voicemails. | Emotional anchor. The pull to "just call Mom" is a trap in the final chapter, because Mom is being watched. |

**The twist lands in Chapter 3:** Sam's number shows up in a Lumen contract signature block. The Unknown's final voice note drops the voice distortion, and it's Maya.

### Core loop

```
Explore an app → find a clue → pin it as evidence → a new app unlocks or a trigger fires
      ↑                                                              ↓
      └──────── battery drains, the stranger reacts, pressure rises ─┘
```

### Battery model (the key tension mechanic)

| Factor | Effect |
|---|---|
| Base drain | `0.0115 %/s` at brightness 1.0, which is about 33 minutes from 23% while idle |
| Brightness slider (Settings or Control Center) | Multiplier ×0.6 to ×1.4. Dim is cheaper but harder to read (applies a CSS `filter: brightness()` to the screen). |
| App multipliers | Home ×1.0, Messages ×1.0, Notes ×1.0, Photos ×1.3, Voice Memos ×1.5, Browser ×1.6, Maps ×2.2 (GPS), active call ×2.5 |
| One-off costs | Recover a deleted file −1%, play a voicemail −0.5%, **hint −2%** |
| Low Power Mode (unlocks at 10%) | ×0.5 drain, but Maps and Browser are disabled. A real dilemma. |
| Power bank (optional Ch2 side quest) | +15%. It costs about 3 minutes of Maps-heavy searching to find, so it's a gamble. |
| "Screen off" (tab hidden or pause button) | ×0.1 drain. Justified in-story and it prevents background tabs from being unfair. |
| Story Mode | Global ×0.5. Shown as an accessibility option, never labeled "easy". |

**Low-battery escalation:** at 20% a red battery icon appears. At 10% a system popup appears and Low Power Mode is offered. At 5% the UI begins stuttering (random 80ms freezes) and the screen dims. At 2% the screen flickers and Unknown texts "Hurry." At 0% there's a shutdown animation and the **"Too Late"** ending.

### Clue design rules

1. **Every critical deduction has at least 2 independent clue sources.** For example, the notes passcode is Maya's dad's birthday, and it appears in a Photos caption *and* in a Priya message. This prevents pixel-hunting dead ends.
2. **Passcodes are always discoverable in the phone.** Nothing requires outside knowledge.
3. **Hints cost 2% battery** and come in three tiers per puzzle: nudge, direction, answer. The hint is voiced in-story as "Maya's Notes > 'if I forget'", so it isn't an out-of-world help button.
4. **Pinning evidence:** long-press (mobile) or right-click (desktop) any message, photo, pin or memo, then choose "Pin to Evidence." The final accusation needs **3 correctly linked pins: WHO, WHERE and WHY.** Guessing without evidence isn't possible.

### Chapter breakdown

**Chapter 1: "Found" (23% → about 17%)**
- Lock screen notifications preview 3 messages: Mom (missed call ×14), Priya ("MAYA PLEASE"), and Unknown ("Put it back.").
- **Passcode puzzle:** the lock screen wallpaper shows her dog. A notification from the "PetVet" app says "Biscuit's checkup 06/14". The passcode is **0614**.
- Unlocked: Messages (Priya, Jordan, Mom, Sam – Lumen). Timeline of her last day.
- **First reactive event:** 20 seconds after the player opens the Jordan thread, Unknown texts "He didn't do it. Stop wasting battery."
- Sam's first friendly message arrives: "Hi, whoever has this. I work with Maya. Can you tell me where you found it?" Reply chips: *[Tell him: bus shelter] [Ask who he is] [Ignore]*. **This choice is tracked.** Telling him sets `leakedLocation = 1`.
- Chapter ends: an incoming call from Unknown. Answering plays a distorted voice ("If you're one of them, I'll know."). Declining makes Unknown send the same line as text 5 seconds later.

**Chapter 2: "Deleted" (about 17% → about 8%)**
- Photos > Recently Deleted: a photo of a document titled "LUMEN – DATA PARTNER AGREEMENT", partly blurred. Recovering it costs 1%.
- Maps > location history: repeated night visits to "Halden Point", plus a pin labelled "Locker 14 – Bus Depot". Following it is the optional power bank side quest.
- Voice Memos: "meeting_0923.m4a", a recording of a Lumen meeting discussing selling "live location streams". It's partly corrupted, and fragments unlock as the player pins related evidence.
- Notes app is locked. The passcode is dad's birthday **1107**, from a Photos caption ("Happy bday dad, 11/07 🕯️") and from Priya ("his bday was nov 7th, she always goes quiet around then").
- **Sam escalates:** "Police asked me to collect the phone. Where are you right now?" The reply chips include *[Share my location]*. Choosing it sets `leakedLocation = 2`, which unlocks the secret "Next Target" ending path.
- **Unknown reacts to what you've seen:**
  - After viewing the deleted contract: "Now you know why she ran."
  - After 60 seconds of idling: "Tick tock. 🔋"
  - After opening Maps: "Maps drains you fastest. Be smart."
- Chapter ends: the phone glitches, the screen goes black for 1.5 seconds, and one notification appears: "Low Battery: 10% remaining."

**Chapter 3: "Signal" (about 8% → 0%)**
- Low Power Mode dilemma: save battery or keep Maps.
- Unlocked Notes reveal: "If you found this, you're one of the good ones. I'm where Dad showed me the ships. Don't tell anyone who asks where I am."
- **Twist sequence:** the recovered contract's signature block shows "S. Okafor, Partner Relations", with the same phone number as "Sam – Lumen". Unknown sends a final voice note, and midway through the distortion drops out. It's Maya: "It's me. Please. Who did you tell?"
- **Final decision:** the Evidence board opens. The player links WHO (Sam, or Jordan as the wrong answer), WHERE (lighthouse / Halden Point) and WHY (contract + meeting memo). Then they choose who to send the location to: **Police**, **Mom**, **Sam**, or **reply to Unknown (Maya)**.

### Endings

| # | Name | Condition | Feeling |
|---|---|---|---|
| 1 | **"The Lighthouse"** (true ending) | Correct WHO/WHERE/WHY, sent to Police or Unknown, `leakedLocation = 0` | Relief. A news headline epilogue says Lumen is under investigation. |
| 2 | **"Too Late"** | Battery reaches 0% at any point | Black screen. A final notification is left unread. |
| 3 | **"Betrayal"** | Location sent to Sam | Sam replies "Thank you. That's all we needed." The phone remote-wipes itself. |
| 4 | **"Wrong Answer"** | WHO = Jordan | Police chase the wrong lead. Maya's burner goes silent. |
| 5 | **"Watched"** | Location sent to Mom | The message is intercepted. Maya moves on. Bittersweet. |
| S | **"Next Target"** (secret) | `leakedLocation = 2` and the game is finished by any path | The final screen shows the player's **real local time** and "Unknown: Don't open the door." It's a chilling fourth-wall moment. |

The ending screen shows the ending name, battery left, time taken and evidence found (for example 9/12), plus a **Share** button that copies:

```
🔋 DEAD BATTERY
Ending 1/6: "The Lighthouse"
Battery left: 4%  ⏱ 27:41
Evidence: 11/12
deadbattery.vercel.app
```

### Immersion features

- **Real-time clock** in the status bar. Message timestamps are computed as `now − offset` ("Today 2:14 AM", "Yesterday"), so the disappearance always feels recent.
- **Haptics** use `navigator.vibrate` on incoming texts and calls, with a pattern that escalates as battery drops. On iOS Safari there's no Vibration API, so it falls back to a 150ms CSS screen shake.
- **Typing indicators:** Unknown's "..." appears, stops, and appears again before a message arrives.
- **Glitches:** RGB split, scanlines and a brief freeze, triggered by the director at story beats. Disabled under `prefers-reduced-motion`.
- **Audio:** a low ambient drone that gets louder as battery falls, plus a ringtone, message ding and distorted voice lines. Audio is unlocked by the title screen's "Pick up the phone" tap, which also satisfies browser autoplay policy in-story.
- **Desktop presentation:** the phone sits centered on a dark, rain-streaked bus-shelter background (a CSS/SVG parallax). On mobile the phone is fullscreen, and **the player's own phone becomes Maya's phone.**

---

## Regression Risk Analysis (design and technical risks, adversarial pass)

### Approaches considered and rejected

| Option | Rejected because |
|---|---|
| **Next.js** | There's no SSR, API route or SEO need beyond one landing page. It would add build complexity and hydration edge cases for a fully client-side game. Vite is simpler and still deploys to Vercel without configuration. |
| **Phaser or Canvas rendering** | The game is text-heavy UI. The DOM gives accessibility (screen readers, text scaling, selection), native scrolling and CSS animations for free. Canvas would mean reimplementing text layout and scroll physics. |
| **Ink or Yarn Spinner as the sole engine** | They're great for branching dialogue, but this game is driven by *app state* (battery thresholds, what was viewed, idle time). A small custom trigger DSL fits better. Ink could still be added later just for long chat trees. |
| **Timers using `setTimeout` per event** | They drift, don't pause cleanly and break save/restore. Replaced by a single game clock with accumulated game time that all triggers evaluate against. |
| **Uncapped real-time delta** | A backgrounded tab could return with a huge `dt` and instantly kill the battery. The delta is clamped to 250ms per tick, and the game auto-pauses on `visibilitychange`. |
| **Hard permadeath with no checkpoints** | 30 minutes lost at 1% would feel unfair and people wouldn't share it. Chapter checkpoints restore the battery level *at chapter start*. An optional **Hardcore** toggle for streamers turns checkpoints off. |

### Risks in the chosen approach, and mitigations

| Risk | Mitigation |
|---|---|
| The player gets stuck and quits (the biggest risk for mystery games) | Two-source clue rule, 3-tier battery-cost hints, and Unknown nudges after 90 seconds without progress ("Look at what she deleted."). |
| Battery tuning is too harsh or too lenient | All values live in `src/engine/balance.ts`. Add a `?debug=1` overlay showing drain rate and the elapsed-time curve. Playtest target: a first-time player finishes Chapter 3 with **2–8%** left. |
| Autoplay and audio blocked | All audio waits for the first user gesture (the "Pick up the phone" tap). Captions are always available. |
| iOS Safari quirks: no vibrate, 100vh bug, rubber-band scrolling | Use `100dvh`, `overscroll-behavior: none`, and the vibrate fallback shake. Test on a real iPhone before launch. |
| `localStorage` unavailable (private mode) | Wrap all reads and writes in try/catch. The game runs fine without saves and a subtle "Progress won't be saved" notice appears. |
| Spoilers visible in the JS bundle | Accepted for v1, since it's a narrative game. Optionally base64-encode the ending text to deter casual peeking. |
| Content volume (the real cost is writing, not code) | Content is data (`src/content/**`). Chapter 1 is written and playtested *before* Chapters 2–3 so the engine's shape is proven early. |
| Photo assets | Use CC0 or Unsplash-licensed images with a consistent "phone camera" filter (grain + warm tint), or AI-generated images with clear rights. Track the source of each image in `public/photos/CREDITS.md`. Start with placeholders. |
| Players missing that long-press pins evidence | A one-time coach mark shows on the first clue-bearing item, and a pin icon pulses. Desktop right-click and a visible "📌" button on each item are both supported. |
| Horror elements are too intense for some players | Reduced motion disables glitches and shakes. Show a content note on the title screen. Nothing jumps out at the player; the tension comes from pressure and discovery. |

---

## Implementation Steps

### Tech stack

- **Vite 6 + React 19 + TypeScript** (strict)
- **Zustand**: game state store with serializable slices for saving
- **Framer Motion**: app open/close transitions, notification slide-ins, call screen
- **Howler.js**: audio sprites, volume ducking
- **Vitest**: unit tests for the battery model, director and conditions
- **Playwright**: end-to-end "golden path" run through all 3 chapters with a debug fast-forward
- **@vercel/analytics**: ending funnel events
- Plain CSS modules and CSS variables, with no UI kit, so it looks like a *phone*, not a web app

### Project structure (root: `C:\Users\suriy\Downloads\g-dev-2`)

```
g-dev-2/
├─ index.html
├─ vite.config.ts
├─ vercel.json
├─ public/
│  ├─ audio/            (ringtone.mp3, ding.mp3, drone.mp3, voice_*.mp3, sfx sprite)
│  ├─ photos/           (maya_*.webp, CREDITS.md)
│  ├─ og-image.png
│  └─ manifest.webmanifest
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx                     (screen router: Title → Game → Ending)
│  ├─ engine/
│  │  ├─ balance.ts               (every tunable number)
│  │  ├─ clock.ts                 (game clock, pause, clamped dt)
│  │  ├─ battery.ts               (pure drain function)
│  │  ├─ director.ts              (trigger evaluation loop)
│  │  ├─ conditions.ts            (condition evaluator)
│  │  ├─ actions.ts               (action executor)
│  │  ├─ endings.ts               (ending resolver)
│  │  └─ save.ts                  (checkpoint save/load, try/catch)
│  ├─ state/store.ts              (Zustand store)
│  ├─ phone/
│  │  ├─ PhoneFrame.tsx  StatusBar.tsx  LockScreen.tsx  HomeScreen.tsx
│  │  ├─ NotificationBanner.tsx  IncomingCall.tsx  SystemAlert.tsx
│  │  ├─ ControlCenter.tsx (brightness, low power)  Glitch.tsx
│  ├─ apps/
│  │  ├─ messages/  photos/  maps/  notes/  voice/  phone/  browser/  settings/  evidence/
│  ├─ content/
│  │  ├─ characters.ts   threads.ts   photos.ts   maps.ts   notes.ts   memos.ts
│  │  ├─ triggers/chapter1.ts  chapter2.ts  chapter3.ts
│  │  ├─ hints.ts   evidence.ts   endings.ts
│  ├─ audio/sfx.ts
│  ├─ screens/  Title.tsx  Ending.tsx  Credits.tsx
│  └─ styles/  tokens.css  phone.css
└─ tests/
   ├─ battery.test.ts  director.test.ts  endings.test.ts
   └─ e2e/golden-path.spec.ts
```

---

### Step 1: Scaffold and deploy an empty shell (proves the Vercel pipeline on day 1)

```bash
npm create vite@latest . -- --template react-ts
npm i zustand framer-motion howler @vercel/analytics
npm i -D vitest @playwright/test @types/howler
```

`vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    { "source": "/audio/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
  ]
}
```
Run `git init`, push to GitHub, and import it in Vercel (or use `npx vercel --prod`). **Exit criteria:** "Pick up the phone" renders at a live URL.

### Step 2: Balance constants: `src/engine/balance.ts`

```ts
export const BALANCE = {
  startBattery: 23,
  baseDrainPerSec: 0.0115,
  brightness: { min: 0.6, max: 1.4, default: 1.0 },
  appMultiplier: {
    home: 1.0, messages: 1.0, notes: 1.0, settings: 0.8, evidence: 1.0,
    photos: 1.3, voice: 1.5, browser: 1.6, maps: 2.2, call: 2.5,
  } as Record<AppId | 'call', number>,
  cost: { recoverDeleted: 1, playVoicemail: 0.5, hint: 2 },
  lowPower: { unlockAt: 10, multiplier: 0.5, disabledApps: ['maps', 'browser'] as AppId[] },
  powerBankBonus: 15,
  screenOffMultiplier: 0.1,
  storyModeMultiplier: 0.5,
  maxTickDtMs: 250,
  thresholds: { red: 20, lowAlert: 10, stutter: 5, flicker: 2 },
} as const;
```

### Step 3: Pure battery model: `src/engine/battery.ts`

This must be pure and deterministic so it can be unit-tested.

```ts
export interface DrainContext {
  activeApp: AppId; inCall: boolean; brightness: number;
  lowPower: boolean; screenOff: boolean; storyMode: boolean;
}
export function drainRate(ctx: DrainContext): number {
  if (ctx.screenOff) return BALANCE.baseDrainPerSec * BALANCE.screenOffMultiplier;
  const app = ctx.inCall ? BALANCE.appMultiplier.call : BALANCE.appMultiplier[ctx.activeApp];
  let r = BALANCE.baseDrainPerSec * app * ctx.brightness;
  if (ctx.lowPower) r *= BALANCE.lowPower.multiplier;
  if (ctx.storyMode) r *= BALANCE.storyModeMultiplier;
  return r; // % per second
}
export function applyDrain(battery: number, ctx: DrainContext, dtSec: number): number {
  return Math.max(0, battery - drainRate(ctx) * dtSec);
}
```

### Step 4: Game clock: `src/engine/clock.ts`

- Use a single `requestAnimationFrame` loop that accumulates `gameTimeMs`.
- `dt = Math.min(now - last, BALANCE.maxTickDtMs)`.
- `document.addEventListener('visibilitychange', …)`: when hidden, set `screenOff = true` and show a black "screen off" overlay when the player returns (tap to wake).
- Expose `pause()`, `resume()` and `onTick(cb)`. The director and battery run in the tick, throttled to about 4Hz for logic. Rendering stays at rAF rate.

### Step 5: Zustand store: `src/state/store.ts`

```ts
interface GameState {
  chapter: 1 | 2 | 3;
  battery: number;
  gameTimeMs: number;
  lastProgressAtMs: number;          // for idle nudges
  activeApp: AppId; locked: boolean;
  brightness: number; lowPower: boolean; screenOff: boolean;
  settings: { storyMode: boolean; hardcore: boolean; textScale: 1 | 1.15 | 1.3; reducedMotion: boolean };
  unlockedApps: Set<AppId>;
  flags: Record<string, number | boolean>;   // e.g. leakedLocation: 0|1|2, recoveredContract: true
  viewed: Set<string>;                        // 'photo:cake', 'thread:jordan', 'memo:meeting'
  threads: Record<ThreadId, Message[]>;       // messages delivered so far (director pushes here)
  pendingReplies: Record<ThreadId, ReplyChoice[] | undefined>;
  evidence: Set<EvidenceId>;
  hintsUsed: Record<PuzzleId, number>;
  firedTriggers: Set<TriggerId>;
  overlay: null | { kind: 'call'; callId: string } | { kind: 'alert'; alertId: string } | { kind: 'glitch'; ms: number };
  ending: EndingId | null;
}
```
Sets are serialized as arrays in `save.ts`. Actions include `openApp`, `markViewed`, `pinEvidence`, `chooseReply`, `spendBattery`, `setFlag`, `unlockApp` and `triggerEnding`.

### Step 6: Director engine: `src/engine/director.ts`, `conditions.ts`, `actions.ts`

This is the heart of the game. All story beats are **data**.

```ts
type Condition =
  | { all: Condition[] } | { any: Condition[] } | { not: Condition }
  | { chapter: 1 | 2 | 3 }
  | { flag: string; eq?: number | boolean; gte?: number }
  | { viewed: string }
  | { appOpen: AppId }
  | { batteryBelow: number }
  | { elapsedInChapterSec: number }
  | { idleSec: number }                         // since lastProgressAtMs
  | { evidence: EvidenceId }
  | { fired: TriggerId; agoSec?: number };      // chain beats

type Action =
  | { type: 'text'; thread: ThreadId; from: CharacterId; body: string; typingMs?: number; attachment?: string }
  | { type: 'replies'; thread: ThreadId; choices: ReplyChoice[] }   // choice sets flags
  | { type: 'call'; callId: string }                                // incoming call overlay + audio
  | { type: 'notify'; appId: AppId; title: string; body: string }
  | { type: 'unlockApp'; appId: AppId }
  | { type: 'setFlag'; key: string; value: number | boolean }
  | { type: 'drain'; amount: number }
  | { type: 'glitch'; ms: number }
  | { type: 'vibrate'; pattern: number[] }
  | { type: 'alert'; alertId: string }
  | { type: 'advanceChapter' }
  | { type: 'ending'; id: EndingId };

interface Trigger {
  id: TriggerId;
  when: Condition;
  do: Action[];
  delaySec?: number;     // measured in game time after the condition first becomes true
  once?: boolean;        // default true
  priority?: number;     // higher runs first; used to stop overlapping calls
}
```

Evaluation loop (4Hz):
1. For each trigger not in `firedTriggers`, evaluate `when`.
2. If it's true and has a `delaySec`, record `armedAt` (game time). Fire it when `gameTimeMs - armedAt >= delaySec * 1000`.
3. **Guard:** never open a second overlay while one is active. Queue call and alert actions until `overlay === null`.
4. Text actions with `typingMs` show the typing indicator in the thread first, then deliver the message, then show a notification banner if the thread isn't open, and vibrate.

Example of a reactive beat (`content/triggers/chapter2.ts`):
```ts
{
  id: 'c2_unknown_sees_contract',
  when: { all: [{ chapter: 2 }, { viewed: 'photo:deleted_contract' }] },
  delaySec: 6,
  do: [
    { type: 'vibrate', pattern: [80, 60, 80] },
    { type: 'text', thread: 'unknown', from: 'unknown', body: 'Now you know why she ran.', typingMs: 2400 },
  ],
}
```

### Step 7: Phone shell UI (`src/phone/*`)

- **PhoneFrame:** on desktop, a 390×844 rounded frame centered over a background layer. At ≤500px width it's fullscreen at `100dvh`. Apply `filter: brightness(var(--brightness))` to the screen element.
- **StatusBar:** real local time via `Intl.DateTimeFormat`, battery icon (goes red at 20% and gets a lightning bolt when charging), signal bars that drop to 1 in Chapter 3 for mood.
- **LockScreen:** wallpaper, notification stack, swipe up to open a keypad, 4-digit passcode. A wrong code shakes, and after 5 failures it locks for 30 seconds (in-world pressure). The passcode is checked against `content`.
- **HomeScreen:** an app grid. Locked apps show a padlock, and disabled ones in Low Power Mode are greyed out.
- **NotificationBanner, IncomingCall** (answer or decline, plays audio and captions), **SystemAlert** (the 10% low battery popup), **ControlCenter** (swipe down from the top right, with a brightness slider and a Low Power toggle), **Glitch** (a CSS layer with RGB split and scanlines).

### Step 8: Apps (`src/apps/*`). Each is a component that reads the store and calls `markViewed`.

| App | Key behaviors |
|---|---|
| **Messages** | Thread list plus thread view, a typing indicator, reply chips (`pendingReplies`), long-press to pin, and relative timestamps. Messages have `sentAtOffsetMin` so a message sent 31 hours before the game is rendered relative to "now". |
| **Photos** | A grid, fullscreen viewer, captions, and a **Recently Deleted** album. Recovering an item costs 1% with a "Recover?" confirmation. Photos can carry `hotspots` (tap regions that reveal zoomed details, such as a signature block). |
| **Maps** | An SVG map of Port Halden, location history as a timeline plus pins, and tappable pins with visit counts ("Halden Point: 6 visits, all 11PM–2AM"). The ×2.2 drain makes it tense. The Locker 14 side quest unlocks the power bank. |
| **Notes** | Locked by passcode 1107 until solved. It contains the "if I forget" hint note and the final message from Maya. |
| **Voice Memos** | A waveform player. The corrupted memo reveals segments as related evidence is pinned (`segments[].requiresEvidence`). Captions are always shown. |
| **Phone** | Recents (14 missed from Mom) and Voicemail (costs 0.5% to play). The ending "send location" call options live here and in Messages. |
| **Browser** | History showing searches Maya made ("how to report data privacy violation", "halden lighthouse still open?") plus a cached Lumen "About" page with Sam's photo. |
| **Settings** | Brightness, Low Power Mode, text size, reduced motion, Story Mode (accessibility), Hardcore, and a hidden "Battery Usage" screen that shows per-app drain, which quietly teaches the mechanic. |
| **Evidence** | Pinned items as cards, plus a 3-slot board (WHO / WHERE / WHY). Slots accept only matching evidence categories. It shows "12 pieces of evidence exist" for completionists. |

### Step 9: Hints: `content/hints.ts`

Each puzzle (`passcode_lock`, `passcode_notes`, `find_location`, `identify_sam`) gets 3 tiers. They're opened from Notes > "if I forget" as a floating 💡 on the relevant app. Each costs 2%, with a confirmation that shows the battery cost. Using a hint counts as progress, so it resets `lastProgressAtMs`.

### Step 10: Endings resolver: `src/engine/endings.ts`

```ts
export function resolveEnding(s: GameState, sentTo: 'police' | 'mom' | 'sam' | 'unknown'): EndingId {
  if (sentTo === 'sam') return 'betrayal';
  const who = s.flags.boardWho, where = s.flags.boardWhere, why = s.flags.boardWhy;
  if (who === 'jordan') return 'wrong_answer';
  if (sentTo === 'mom') return 'watched';
  const correct = who === 'sam' && where === 'lighthouse' && why === 'contract_and_memo';
  if (!correct) return 'wrong_answer';
  return 'lighthouse';
}
// 'too_late' is triggered by the battery reaching 0 (in the tick), not by this resolver.
// 'next_target' overrides the epilogue for any ending if flags.leakedLocation === 2.
```

### Step 11: Content authoring (in chapter order: write Chapter 1, playtest, then write the rest)

- `characters.ts`: id, display name, avatar, number, and `threadStyle` (Unknown uses a no-avatar grey bubble).
- `threads.ts`: the initial message history per thread (about 40–60 messages across threads for the backstory).
- `triggers/chapterN.ts`: 15–30 triggers per chapter, covering scripted beats, reactive lines (one per key item viewed) and idle nudges at 90s and 180s.
- `evidence.ts`: 12 evidence items with a `category: 'who' | 'where' | 'why' | 'extra'`.
- `endings.ts`: title, epilogue text (news-headline style), and art reference.
- **Writing style guide** (put it at the top of the content folder): texts are lowercase and messy for Priya, clipped for Unknown, over-polite and slightly too curious for Sam. There's never an exposition dump; every fact should be something a real person would text.

### Step 12: Audio and haptics: `src/audio/sfx.ts`

- One Howler sprite for UI sounds (ding, tap, lock, error, shutdown) plus separate streams for the drone and voices.
- `setTension(battery)` maps battery 23→0 to drone volume 0.15→0.6 and adds a low-pass filter sweep.
- `buzz(pattern)` calls `navigator.vibrate?.(pattern)`, or if that's unavailable, adds a `.shake` class to PhoneFrame for 150ms (skipped under reduced motion).
- Voice lines are pitch-shifted and bitcrushed at production time for Unknown. The final Maya reveal is a single file where the distortion stops at a known timestamp.

### Step 13: Save and checkpoints: `src/engine/save.ts`

- Save at every `advanceChapter`: a full serialized store with the battery value at chapter start.
- Title screen: **Continue (Chapter N)** / **New Game**. Hardcore disables Continue.
- Save format version `v: 1`. On mismatch, discard the save gracefully.
- Everything is wrapped in try/catch, with a flag that shows "progress won't be saved" when storage fails.

### Step 14: Title, Ending and Share screens

- **Title:** a rainy bus shelter with the phone face-down, buzzing. The CTA is "Pick up the phone" (which unlocks audio). A small content note and headphones recommendation sit below it.
- **Ending:** ending art, epilogue, stats, "Endings found: 2/6" (persisted), a **Share** button (Web Share API on mobile, clipboard fallback on desktop), and **Try another path**, which reloads the Chapter 3 checkpoint.
- **OG and meta tags:** `og:image` is a moody phone screenshot at 1% battery, and the title is "Dead Battery: Find her before your phone dies."

### Step 15: Analytics, PWA and polish

- `@vercel/analytics` custom events: `chapter_start`, `chapter_complete`, `hint_used`, `ending` (with id and battery), `power_bank_found`, `share_clicked`. These show where players drop off.
- `manifest.webmanifest` with `display: fullscreen`, `orientation: portrait` and a dark theme color.
- Preload Chapter 1 assets only. Lazy-load Chapter 2–3 photos and audio at chapter transitions.
- Performance budget: under 300KB of JS gzipped, with the first paint of the title screen under 1.5s on 4G.

### Step 16: Debug tooling (build it early, it speeds up everything)

The `?debug=1` overlay shows battery, drain rate, game time, flags, fired triggers, a "jump to chapter N" control, a "set battery" control and a ×10 time multiplier. It's stripped in production unless the query parameter is present.

---

## Milestones

| Milestone | Contents | Exit criteria |
|---|---|---|
| **M1: Skeleton** (Steps 1–5, 16) | Deployed shell, clock, battery, store, debug overlay | Battery drains live on the Vercel URL and pauses when the tab is hidden |
| **M2: Phone** (Step 7 + Messages, Photos, Settings) | The phone feels real | A playtester says "it feels like a phone" within 10 seconds |
| **M3: Director + Chapter 1** (Steps 6, 9, 11 for Ch1, 12 basic) | A playable Chapter 1 with passcode, reactive texts and a call | 5 playtesters finish Ch1 with no help. Median time is 7–10 minutes. |
| **M4: Chapters 2–3 + endings** (remaining apps, Steps 10, 11, 13) | The full game | All 6 endings are reachable in the Playwright runs |
| **M5: Launch polish** (Steps 12 full, 14, 15) | Audio, share, OG, analytics, PWA | Lighthouse mobile score ≥ 90, tested on a real iPhone and Android device |

---

## Verification Plan

### Automated (Vitest)
- `battery.test.ts`
  - Idle for 60 seconds at brightness 1.0 drains 0.69%.
  - Maps ×2.2 with Low Power ×0.5 gives the expected rate.
  - `screenOff` overrides everything.
  - The battery never goes below 0.
  - A `dt` above the clamp is capped by the clock (tested in clock tests).
- `director.test.ts`, using an injected fake clock:
  - A trigger with `delaySec` fires exactly once after the delay.
  - `once` triggers don't refire.
  - A second call is queued while an overlay is active.
  - Nested `all`/`any`/`not` conditions evaluate correctly.
  - Idle nudges reset on progress.
- `endings.test.ts`: a table-driven test of every `(board, sentTo, leakedLocation)` combination against the expected ending.
- **Content lint test:** every `viewed:` or `evidence:` id referenced in triggers exists in the content files. Every puzzle has 3 hints. Every critical clue has at least 2 sources (declared in `evidence.ts` as `sources: string[]`, with a test asserting `length >= 2`).

### Automated (Playwright, `?debug=1` with the ×10 time multiplier)
- **Golden path:** unlock with 0614, read the threads, recover the contract, unlock Notes with 1107, pin the correct evidence, send to Police. Expect the "The Lighthouse" ending.
- **Timeout path:** set battery to 1%, idle, and expect "Too Late".
- **Secret path:** share location with Sam twice, finish, and expect the "Next Target" epilogue.
- Run at a 390×844 mobile viewport and at 1440×900 desktop.

### Manual playtest checklist
- [ ] A first-time player unlocks the phone without hints in under 3 minutes.
- [ ] A first-time player finishes with 2–8% battery (the tuning target). Record this for at least 5 testers.
- [ ] Switching tabs for 5 minutes and returning shows a "screen off" wake and only a tiny drain.
- [ ] iPhone Safari: no vibrate errors, shake fallback appears, no 100vh jump, audio starts after the title tap.
- [ ] Android Chrome: vibration works on texts and calls.
- [ ] Private or incognito window: the game is playable and the "won't be saved" notice appears.
- [ ] Reduced motion: no glitches or shakes, and the game is fully completable.
- [ ] Text size at 1.3: no clipped message bubbles.
- [ ] The Share text copies correctly, and the OG preview renders in WhatsApp, Discord and X.
- [ ] **The twist lands:** ask testers after playing "When did you realize who Unknown was?" Aim for Chapter 3, not Chapter 1.

**"Done" means** all 6 endings are reachable, no soft-locks are possible (you can't reach a state where the required clue is unreachable; the content lint test and the golden path cover this), and median playtime is 25–35 minutes.

---

## Rollback Plan

- Vercel keeps every deployment as immutable. If a production release breaks, open the Vercel dashboard, find the previous deployment and choose **"Promote to Production"** (instant). Or run `vercel rollback`.
- Use preview deployments for every PR branch. Share the preview URLs with playtesters so nothing reaches production untested.
- The save format is versioned (`v: 1`). If a release changes the store shape, bump the version and old saves are discarded rather than crashing.

---

## Follow-ups (Out of Scope for v1)

1. **Daily or "cold case" mode:** a new, shorter phone every week that reuses the engine with a different owner and mystery. The engine is content-driven, so each new case is just new data files.
2. **Global stats:** "Only 18% of players found the true ending" and ending percentages via a Vercel Function plus Upstash Redis. It's a strong social hook.
3. **Streamer mode:** hides the real-time clock and local-time epilogue, and enables Hardcore by default.
4. **Localization:** all strings already live in `src/content/`, so extract them to i18n JSON.
5. **Ink integration** for longer branching chat conversations if Chapter 3 conversations grow.
6. **Sequel hook:** the true ending's final notification is from a new unknown number: "You're good at this. I have another phone for you." This is where the follow-up case could start.
