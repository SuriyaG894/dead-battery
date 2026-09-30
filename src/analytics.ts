import { inject, track as vercelTrack } from '@vercel/analytics';

type Props = Record<string, string | number | boolean | null>;

let enabled = false;

export function initAnalytics() {
  if (import.meta.env.PROD) {
    inject();
    enabled = true;
  }
}

export function track(name: string, props?: Props) {
  if (!enabled) return;
  try {
    vercelTrack(name, props);
  } catch {
    /* never let analytics break the game */
  }
}
