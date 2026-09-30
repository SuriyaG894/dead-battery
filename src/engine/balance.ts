import type { AppId, ScreenId } from '../types';

/** Every tunable number lives here. Target: first-time players finish with 2–8% left. */
export const BALANCE = {
  startBattery: 23,
  /** % per second at brightness 1.0 on the home screen (~33 min from 23%). */
  baseDrainPerSec: 0.0115,
  brightness: { min: 0.6, max: 1.4, default: 1.0 },
  screenMultiplier: {
    lock: 0.8,
    home: 1.0,
    messages: 1.0,
    notes: 1.0,
    settings: 0.8,
    evidence: 1.0,
    phone: 1.0,
    photos: 1.3,
    voice: 1.5,
    browser: 1.6,
    maps: 2.2,
  } satisfies Record<ScreenId, number>,
  callMultiplier: 2.5,
  cost: { recoverDeleted: 1, playVoicemail: 0.5, hint: 2 },
  lowPower: {
    unlockAt: 10,
    multiplier: 0.5,
    disabledApps: ['maps', 'browser'] as AppId[],
  },
  powerBank: { bonus: 15, walkSec: 40 },
  screenOffMultiplier: 0.1,
  storyModeMultiplier: 0.5,
  maxTickDtMs: 250,
  logicTickMs: 250,
  thresholds: { red: 20, lowAlert: 10, stutter: 5, flicker: 2 },
  idleNudgeSec: 90,
} as const;
