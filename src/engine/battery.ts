import type { ScreenId } from '../types';
import { BALANCE } from './balance';

export interface DrainContext {
  screen: ScreenId;
  inCall: boolean;
  brightness: number;
  lowPower: boolean;
  screenOff: boolean;
  storyMode: boolean;
}

/** Battery drain in % per second. Pure, so it can be unit-tested. */
export function drainRate(ctx: DrainContext): number {
  let r = BALANCE.baseDrainPerSec;
  if (ctx.screenOff) {
    r *= BALANCE.screenOffMultiplier;
  } else {
    r *= ctx.inCall ? BALANCE.callMultiplier : BALANCE.screenMultiplier[ctx.screen];
    r *= ctx.brightness;
  }
  if (ctx.lowPower) r *= BALANCE.lowPower.multiplier;
  if (ctx.storyMode) r *= BALANCE.storyModeMultiplier;
  return r;
}

export function applyDrain(battery: number, ctx: DrainContext, dtSec: number): number {
  return Math.max(0, battery - drainRate(ctx) * dtSec);
}

export function clampDt(dtMs: number): number {
  return Math.max(0, Math.min(dtMs, BALANCE.maxTickDtMs));
}
