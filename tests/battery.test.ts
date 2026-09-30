import { describe, expect, it } from 'vitest';
import { applyDrain, clampDt, drainRate, type DrainContext } from '../src/engine/battery';
import { BALANCE } from '../src/engine/balance';

const base: DrainContext = { screen: 'home', inCall: false, brightness: 1, lowPower: false, screenOff: false, storyMode: false };

describe('battery model', () => {
  it('idles at the base rate: 60s drains 0.69%', () => {
    expect(23 - applyDrain(23, base, 60)).toBeCloseTo(0.69, 5);
  });
  it('lasts ~33 minutes idle from 23%', () => {
    expect(23 / drainRate(base) / 60).toBeCloseTo(33.3, 0);
  });
  it('applies app, brightness and low power multipliers', () => {
    const r = drainRate({ ...base, screen: 'maps', brightness: 1.4, lowPower: true });
    expect(r).toBeCloseTo(BALANCE.baseDrainPerSec * 2.2 * 1.4 * 0.5, 8);
  });
  it('calls override the screen multiplier', () => {
    expect(drainRate({ ...base, screen: 'maps', inCall: true })).toBeCloseTo(BALANCE.baseDrainPerSec * 2.5, 8);
  });
  it('screen off overrides app and brightness', () => {
    expect(drainRate({ ...base, screen: 'maps', brightness: 1.4, screenOff: true })).toBeCloseTo(
      BALANCE.baseDrainPerSec * 0.1,
      8,
    );
  });
  it('story mode halves drain', () => {
    expect(drainRate({ ...base, storyMode: true })).toBeCloseTo(drainRate(base) / 2, 8);
  });
  it('never goes below zero', () => {
    expect(applyDrain(0.01, base, 1000)).toBe(0);
  });
  it('clamps huge frame deltas (background tab return)', () => {
    expect(clampDt(60_000)).toBe(BALANCE.maxTickDtMs);
    expect(clampDt(-5)).toBe(0);
  });
});
